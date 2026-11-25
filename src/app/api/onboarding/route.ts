import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { onboardingSchema } from "@/lib/validations/auth";
import { buildProfile } from "@/lib/profile";
import { User } from "@/models/User";

/** Completes the profile of a user who signed in with Google/LinkedIn for the first time. */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return fail("Please log in first.", 401);

    const body = onboardingSchema.parse(await readJson(req));
    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) return fail("Account not found.", 404);
    if (user.profileComplete) return fail("Your profile is already complete.", 409);

    const phoneTaken = await User.exists({ phone: body.phone, _id: { $ne: user._id } });
    if (phoneTaken) {
      return fail("This mobile number is already linked to another account.", 409, {
        phone: ["Already registered"],
      });
    }

    user.phone = body.phone;
    user.role = body.role;
    user.profileComplete = true;
    Object.assign(user, buildProfile(body));
    await user.save();

    return ok({ role: user.role });
  } catch (err) {
    return handleError(err);
  }
}
