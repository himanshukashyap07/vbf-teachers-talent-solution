import { connectDB } from "@/lib/db";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { consumeToken } from "@/lib/tokens";
import { verifyEmailSchema } from "@/lib/validations/account";
import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    if (!rateLimit(`verify:${clientIp(req)}`, 20, 60 * 60 * 1000)) return fail("Too many attempts.", 429);
    const { token } = verifyEmailSchema.parse(await readJson(req));
    await connectDB();
    const userId = await consumeToken(token, "verify-email");
    if (!userId) return fail("This link is invalid or has expired. Request a new one from your dashboard.", 400);
    await User.updateOne({ _id: userId }, { $set: { emailVerified: true } });
    return ok({ verified: true });
  } catch (err) {
    return handleError(err);
  }
}
