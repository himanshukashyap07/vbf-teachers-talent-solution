import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { BCRYPT_ROUNDS } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validations/auth";
import { buildProfile } from "@/lib/profile";
import { createToken } from "@/lib/tokens";
import { notifyUser } from "@/lib/notifications";
import { validateRealEmail } from "@/lib/email-validation";
import { sendVerificationEmail } from "@/lib/email";
import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    if (!rateLimit(`register:${clientIp(req)}`, 8, 60 * 60 * 1000)) {
      return fail("Too many attempts. Please try again in a while.", 429);
    }

    const body = signupSchema.parse(await readJson(req));

    // Block throwaway / made-up email addresses before touching the database.
    const emailCheck = await validateRealEmail(body.email);
    if (!emailCheck.ok) return fail(emailCheck.message, 422, { email: [emailCheck.message] });

    await connectDB();

    const clash = await User.findOne({ $or: [{ email: body.email }, { phone: body.phone }] })
      .select("email phone")
      .lean();
    if (clash) {
      const field = clash.email === body.email ? "email" : "phone";
      return fail(
        field === "email"
          ? "An account with this email already exists. Please log in."
          : "An account with this mobile number already exists. Please log in.",
        409,
        { [field]: ["Already registered"] },
      );
    }

    const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
    const user = await User.create({
      name: body.name,
      email: body.email,
      phone: body.phone,
      passwordHash,
      providers: ["credentials"],
      role: body.role,
      profileComplete: true,
      ...buildProfile(body),
    });

    // Best effort: a mail problem must never block account creation. The dashboard offers "resend".
    try {
      await sendVerificationEmail(body.email, body.name, await createToken(user._id, "verify-email"));
    } catch (err) {
      console.error("[register] verification email failed", err);
    }

    await notifyUser(user._id, body.role === "school"
      ? { title: "Welcome aboard", body: "Your school account is ready. Post your teaching requirement from the dashboard and our team will call to confirm it.", link: "/dashboard" }
      : { title: "Welcome aboard", body: "Your registration is complete. Our team will call you to confirm your details and arrange a short interview.", link: "/dashboard" });

    return ok({ id: String(user._id) }, 201);
  } catch (err) {
    // Unique index race (two simultaneous signups)
    if (typeof err === "object" && err && "code" in err && (err as { code: number }).code === 11000) {
      return fail("An account with these details already exists. Please log in.", 409);
    }
    return handleError(err);
  }
}
