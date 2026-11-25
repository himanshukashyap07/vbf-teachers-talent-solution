import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { vacancySchema } from "@/lib/validations/vacancy";
import { Vacancy } from "@/models/Vacancy";
import { User } from "@/models/User";

async function requireSchool() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: fail("Please log in first.", 401) };
  if (session.user.role !== "school") return { error: fail("Only school accounts can do this.", 403) };
  return { userId: session.user.id };
}

/** List the logged-in school's own vacancies. */
export async function GET() {
  try {
    const auth = await requireSchool();
    if (auth.error) return auth.error;
    await connectDB();
    const items = await Vacancy.find({ school: auth.userId }).sort({ createdAt: -1 }).limit(100).lean();
    return ok(items);
  } catch (err) {
    return handleError(err);
  }
}

/** Submit a new vacancy. It starts as "pending-verification" until the agency confirms it. */
export async function POST(req: Request) {
  try {
    const auth = await requireSchool();
    if (auth.error) return auth.error;

    const body = vacancySchema.parse(await readJson(req));
    await connectDB();

    const school = await User.findById(auth.userId).select("schoolProfile").lean();
    if (!school?.schoolProfile?.schoolName) return fail("Complete your school profile first.", 409);

    const vacancy = await Vacancy.create({
      ...body,
      joiningDate: body.joiningDate ? new Date(body.joiningDate) : undefined,
      school: auth.userId,
      schoolName: school.schoolProfile.schoolName,
    });
    return ok({ id: String(vacancy._id) }, 201);
  } catch (err) {
    return handleError(err);
  }
}
