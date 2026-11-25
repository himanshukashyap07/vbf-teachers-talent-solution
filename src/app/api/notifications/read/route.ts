import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { markReadSchema } from "@/lib/validations/notification";
import { Notification } from "@/models/Notification";

/** Mark some (`{ids:[…]}`) or all (`{all:true}`) of MY notifications as read. Others' ids are silently ignored. */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return fail("Please log in first.", 401);
    const body = markReadSchema.parse(await readJson(req));
    await connectDB();

    const filter: Record<string, unknown> = { user: session.user.id, readAt: { $exists: false } };
    if ("ids" in body) filter._id = { $in: body.ids };
    const res = await Notification.updateMany(filter, { $set: { readAt: new Date() } });
    const unreadCount = await Notification.countDocuments({ user: session.user.id, readAt: { $exists: false } });
    return ok({ updated: res.modifiedCount, unreadCount });
  } catch (err) {
    return handleError(err);
  }
}
