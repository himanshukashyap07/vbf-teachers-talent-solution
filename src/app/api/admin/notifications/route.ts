import { getAdmin } from "@/lib/admin";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { MAX_RECIPIENTS, resolveAudience, sendNotification } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";
import { sendNotificationSchema } from "@/lib/validations/notification";

/**
 * Staff sends a notification to one person, several people, or a group.
 *  - audience { mode:"users", identifiers:[email|mobile,…] }  -> 1, 2 or many specific people
 *  - audience { mode:"group", role, district?, pipelineStatus? } -> everyone matching
 *  - dryRun:true -> only reports who WOULD receive it (count, sample names, identifiers that matched nobody)
 */
export async function POST(req: Request) {
  try {
    const admin = await getAdmin();
    if (!admin) return fail("Not authorised.", 403);

    const body = sendNotificationSchema.parse(await readJson(req, 128 * 1024));
    const resolved = await resolveAudience(body.audience);

    if (body.dryRun) {
      return ok({
        dryRun: true,
        recipients: resolved.userIds.length,
        description: resolved.description,
        sample: resolved.sample,
        unresolved: resolved.unresolved,
        truncated: resolved.truncated,
        limit: MAX_RECIPIENTS,
      });
    }

    if (resolved.userIds.length === 0) {
      return fail("No matching users, so nothing was sent.", 404, { audience: ["Nobody matches this audience"] });
    }
    if (!rateLimit(`admin-send:${String(admin._id)}`, 30, 60 * 60 * 1000)) {
      return fail("You have sent many messages in the last hour. Please wait a bit.", 429);
    }

    const batch = await sendNotification(body, resolved, admin._id);
    return ok(
      { batchId: String(batch._id), recipients: resolved.userIds.length, description: resolved.description, unresolved: resolved.unresolved },
      201,
    );
  } catch (err) {
    return handleError(err);
  }
}
