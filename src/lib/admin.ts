import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { connectDB } from "./db";
import { isAdminUser } from "./roles";
import { User } from "@/models/User";

/**
 * Returns the current staff user, or null. Authoritative: re-reads the user from the database
 * on every call instead of trusting the (up to 14-day old) JWT, so removing an address from
 * ADMIN_EMAILS takes effect immediately.
 */
export async function getAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  await connectDB();
  const user = await User.findById(session.user.id).select("name email role emailVerified").lean();
  return user && isAdminUser(user) ? user : null;
}
