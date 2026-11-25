import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { BCRYPT_ROUNDS } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { consumeToken } from "@/lib/tokens";
import { resetPasswordSchema } from "@/lib/validations/account";
import { AuthToken } from "@/models/AuthToken";
import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    if (!rateLimit(`reset:${clientIp(req)}`, 10, 60 * 60 * 1000)) return fail("Too many attempts.", 429);
    const body = resetPasswordSchema.parse(await readJson(req));
    await connectDB();

    const userId = await consumeToken(body.token, "reset-password");
    if (!userId) return fail("This reset link is invalid or has expired. Please request a new one.", 400);

    const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
    await User.updateOne(
      { _id: userId },
      {
        // Receiving the reset email proves control of the address, so it counts as verification too.
        $set: { passwordHash, emailVerified: true },
        $addToSet: { providers: "credentials" },
        $inc: { sessionVersion: 1 }, // logs out every existing session, on every device
      },
    );
    await AuthToken.deleteMany({ user: userId }); // invalidate any other outstanding links
    return ok({ reset: true });
  } catch (err) {
    return handleError(err);
  }
}
