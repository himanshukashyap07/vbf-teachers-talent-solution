import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { assertSameOrigin, fail, handleError, ok } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { createToken } from "@/lib/tokens";
import { emailConfigured, sendVerificationEmail } from "@/lib/email";
import { User } from "@/models/User";

/** Re-sends the verification email to the logged-in user. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return fail("Please log in first.", 401);
    if (!rateLimit(`verify-send:${session.user.id}`, 5, 60 * 60 * 1000)) {
      return fail("Too many requests. Please try again later.", 429);
    }

    await connectDB();
    const user = await User.findById(session.user.id).select("name email emailVerified");
    if (!user?.email) return fail("Your account has no email address.", 400);
    if (user.emailVerified) return ok({ alreadyVerified: true });

    const sent = await sendVerificationEmail(user.email, user.name, await createToken(user._id, "verify-email"));
    if (!sent && emailConfigured) return fail("We could not send the email. Please try again later.", 502);
    return ok({ sent: emailConfigured });
  } catch (err) {
    return handleError(err);
  }
}
