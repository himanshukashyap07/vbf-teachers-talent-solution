import { connectDB } from "@/lib/db";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validations/auth";
import { validateRealEmail } from "@/lib/email-validation";
import { Inquiry } from "@/models/Inquiry";

export async function POST(req: Request) {
  try {
    if (!rateLimit(`contact:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
      return fail("Too many messages. Please try again later.", 429);
    }
    const body = contactSchema.parse(await readJson(req));

    const emailCheck = await validateRealEmail(body.email);
    if (!emailCheck.ok) return fail(emailCheck.message, 422, { email: [emailCheck.message] });

    await connectDB();
    await Inquiry.create({
      name: body.name,
      email: body.email,
      phone: body.phone || undefined,
      audience: body.audience,
      message: body.message,
    });
    return ok({ received: true }, 201);
  } catch (err) {
    return handleError(err);
  }
}
