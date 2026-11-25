import { getAdmin } from "@/lib/admin";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { userAdminSchema } from "@/lib/validations/admin";
import { notifyUser } from "@/lib/notifications";
import { User } from "@/models/User";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAdmin())) return fail("Not authorised.", 403);
    const { id } = await ctx.params;
    if (!/^[a-f0-9]{24}$/.test(id)) return fail("Not found.", 404);
    const body = userAdminSchema.parse(await readJson(req));
    const before = await User.findOneAndUpdate({ _id: id }, { $set: { pipelineStatus: body.pipelineStatus } }, { returnDocument: "before" }).select("role pipelineStatus").lean();
    if (!before) return fail("User not found.", 404);
    const messages: Record<string, string> = {
      screened: "You have been screened. Thank you for the interview. We will now share suitable vacancies.",
      "needs-follow-up": "We need a little more information from you. Our team will contact you shortly.",
      submitted: "Your profile has been sent to a school. We will update you on their response.",
      placed: "Congratulations! Your placement is confirmed. We wish you the very best.",
    };
    if (before.role === "candidate" && before.pipelineStatus !== body.pipelineStatus && messages[body.pipelineStatus]) {
      await notifyUser(id, { title: "Registration update", body: messages[body.pipelineStatus], level: body.pipelineStatus === "placed" ? "success" : "info", link: "/dashboard" });
    }
    return ok({ updated: true });
  } catch (err) {
    return handleError(err);
  }
}
