import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { Notification } from "@/models/Notification";

/** Cheap endpoint the bell polls. Returns just a number. */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return fail("Please log in first.", 401);
    if (!rateLimit(`notif-count:${session.user.id}`, 120, 60 * 1000)) return fail("Too many requests.", 429);
    await connectDB();
    const count = await Notification.countDocuments({ user: session.user.id, readAt: { $exists: false } });
    return ok({ count });
  } catch (err) {
    return handleError(err);
  }
}
