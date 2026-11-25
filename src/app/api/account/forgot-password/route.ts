import { connectDB } from "@/lib/db";
import { handleError, ok, fail, readJson } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { forgotPasswordSchema } from "@/lib/validations/account";
import { parseIdentifier } from "@/lib/validations/common";
import { User } from "@/models/User";

/**
 * Always answers with the same success message, whether or not the account exists,
 * so this endpoint cannot be used to find out who is registered.
 * The reset link goes to the account's EMAIL even if the user typed their mobile number.
 */
export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    if (!rateLimit(`forgot-ip:${ip}`, 10, 60 * 60 * 1000)) return fail("Too many requests. Try again later.", 429);

    const { identifier } = forgotPasswordSchema.parse(await readJson(req));
    const id = parseIdentifier(identifier)!;
    // Per-account limit stops someone flooding one person's inbox.
    if (!rateLimit(`forgot-id:${id.value}`, 3, 60 * 60 * 1000)) return ok({ requested: true });

    await connectDB();
    const user = await User.findOne(id.type === "email" ? { email: id.value } : { phone: id.value }).select("name email");
    if (user?.email) {
      await sendPasswordResetEmail(user.email, user.name, await createToken(user._id, "reset-password"));
    }
    return ok({ requested: true });
  } catch (err) {
    return handleError(err);
  }
}
