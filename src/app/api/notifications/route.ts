import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { Notification } from "@/models/Notification";

/**
 * The logged-in user's own notifications, newest first.
 * ?limit=1..50 (default 20) · ?before=<id> for the next page · ?unread=1 for unread only.
 * A user can only ever see rows whose `user` is their own id (the query is always scoped to it).
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return fail("Please log in first.", 401);
    if (!rateLimit(`notif-list:${session.user.id}`, 120, 60 * 1000)) return fail("Too many requests.", 429);

    const url = new URL(req.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20) || 20, 1), 50);
    const before = url.searchParams.get("before");
    const unreadOnly = url.searchParams.get("unread") === "1";

    await connectDB();
    const filter: Record<string, unknown> = { user: session.user.id };
    if (unreadOnly) filter.readAt = { $exists: false };
    if (before && /^[a-f0-9]{24}$/.test(before)) filter._id = { $lt: before };

    const [rows, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ _id: -1 }).limit(limit + 1).lean(),
      Notification.countDocuments({ user: session.user.id, readAt: { $exists: false } }),
    ]);
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit).map((n) => ({
      id: String(n._id),
      title: n.title,
      body: n.body,
      level: n.level ?? "info",
      link: n.link ?? null,
      read: Boolean(n.readAt),
      createdAt: (n.createdAt as unknown as Date).toISOString(),
    }));
    return ok({ items, unreadCount, hasMore });
  } catch (err) {
    return handleError(err);
  }
}
