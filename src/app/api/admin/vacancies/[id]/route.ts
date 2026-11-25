import { getAdmin } from "@/lib/admin";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { vacancyAdminSchema } from "@/lib/validations/admin";
import { notifyUser } from "@/lib/notifications";
import { Vacancy } from "@/models/Vacancy";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAdmin())) return fail("Not authorised.", 403);
    const { id } = await ctx.params;
    if (!/^[a-f0-9]{24}$/.test(id)) return fail("Not found.", 404);
    const body = vacancyAdminSchema.parse(await readJson(req));
    const before = await Vacancy.findOneAndUpdate({ _id: id }, { $set: { status: body.status } }, { returnDocument: "before" }).select("school title status").lean();
    if (!before) return fail("Vacancy not found.", 404);
    if (before.status !== body.status && body.status !== "pending-verification") {
      const text: Record<string, string> = {
        open: "is confirmed and open. We are now sourcing candidates for it.",
        "on-hold": "has been put on hold.",
        filled: "is marked as filled.",
        closed: "has been closed.",
      };
      await notifyUser(before.school, { title: `Requirement update: ${before.title}`, body: `Your requirement "${before.title}" ${text[body.status]}`, level: body.status === "open" ? "success" : "info", link: "/dashboard" });
    }
    return ok({ updated: true });
  } catch (err) {
    return handleError(err);
  }
}
