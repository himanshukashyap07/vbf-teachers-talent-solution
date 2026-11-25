import type { Types } from "mongoose";
import { Notification, NotificationBatch } from "@/models/Notification";
import { User } from "@/models/User";
import { parseIdentifier } from "./validations/common";
import type { SendNotificationInput } from "./validations/notification";

export const MAX_RECIPIENTS = 5000;

type Level = "info" | "success" | "warning";

/**
 * Fire-and-forget notification for a single user, used by system events (payment due, payment received,
 * vacancy verified, status changes). NEVER throws: a failed notification must not fail the real action.
 */
export async function notifyUser(
  userId: Types.ObjectId | string,
  n: { title: string; body: string; level?: Level; link?: string },
): Promise<void> {
  try {
    await Notification.create({ user: userId, title: n.title, body: n.body, level: n.level ?? "info", link: n.link });
  } catch (err) {
    console.error("[notifications] could not create notification:", (err as Error).message);
  }
}

export interface ResolvedAudience {
  userIds: Types.ObjectId[];
  /** identifiers that matched no account (only for mode "users") */
  unresolved: string[];
  /** a few names so the admin can sanity-check the preview */
  sample: string[];
  description: string;
  truncated: boolean;
}

/** Turns "who to send to" into concrete user ids. Used for both the preview and the real send. */
export async function resolveAudience(audience: SendNotificationInput["audience"]): Promise<ResolvedAudience> {
  if (audience.mode === "users") {
    const emails: string[] = [];
    const phones: string[] = [];
    const unresolved: string[] = [];
    for (const raw of audience.identifiers) {
      const id = parseIdentifier(raw);
      if (!id) unresolved.push(raw);
      else (id.type === "email" ? emails : phones).push(id.value);
    }
    const users = await User.find({ $or: [{ email: { $in: emails } }, { phone: { $in: phones } }] })
      .select("name email phone")
      .lean();

    // Report identifiers that matched nobody, so a typo is visible instead of silently skipped.
    const foundEmails = new Set(users.map((u) => u.email).filter(Boolean));
    const foundPhones = new Set(users.map((u) => u.phone).filter(Boolean));
    for (const e of emails) if (!foundEmails.has(e)) unresolved.push(e);
    for (const p of phones) if (!foundPhones.has(p)) unresolved.push(p);

    return {
      userIds: users.map((u) => u._id),
      unresolved,
      sample: users.slice(0, 5).map((u) => u.name),
      description: users.length === 1 ? "1 person" : `${users.length} people`,
      truncated: false,
    };
  }

  const filter: Record<string, unknown> = {
    role: audience.role === "all" ? { $in: ["candidate", "school"] } : audience.role,
    profileComplete: true,
  };
  if (audience.district) {
    filter.$or = [{ "candidateProfile.district": audience.district }, { "schoolProfile.district": audience.district }];
  }
  if (audience.pipelineStatus) filter.pipelineStatus = audience.pipelineStatus;

  const total = await User.countDocuments(filter);
  const users = await User.find(filter).select("name").sort({ createdAt: -1 }).limit(MAX_RECIPIENTS).lean();
  const who = audience.role === "all" ? "All users" : audience.role === "candidate" ? "All teachers" : "All schools";
  const where = [audience.district && `in ${audience.district}`, audience.pipelineStatus && `with status ${audience.pipelineStatus}`]
    .filter(Boolean)
    .join(" ");
  return {
    userIds: users.map((u) => u._id),
    unresolved: [],
    sample: users.slice(0, 5).map((u) => u.name),
    description: `${who}${where ? " " + where : ""}`,
    truncated: total > MAX_RECIPIENTS,
  };
}

/** Writes one notification per recipient (in chunks) and one batch record for staff history. */
export async function sendNotification(
  input: Pick<SendNotificationInput, "title" | "body" | "level" | "link">,
  resolved: ResolvedAudience,
  createdBy: Types.ObjectId | string,
) {
  const batch = await NotificationBatch.create({
    title: input.title,
    body: input.body,
    level: input.level ?? "info",
    link: input.link || undefined,
    audience: resolved.description,
    recipientCount: resolved.userIds.length,
    createdBy,
  });

  const CHUNK = 1000;
  for (let i = 0; i < resolved.userIds.length; i += CHUNK) {
    await Notification.insertMany(
      resolved.userIds.slice(i, i + CHUNK).map((user) => ({
        user,
        title: input.title,
        body: input.body,
        level: input.level ?? "info",
        link: input.link || undefined,
        batch: batch._id,
      })),
      { ordered: false },
    );
  }
  return batch;
}
