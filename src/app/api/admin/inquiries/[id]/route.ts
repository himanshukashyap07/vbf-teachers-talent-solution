import { getAdmin } from "@/lib/admin";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { inquiryAdminSchema } from "@/lib/validations/admin";
import { Inquiry } from "@/models/Inquiry";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAdmin())) return fail("Not authorised.", 403);
    const { id } = await ctx.params;
    if (!/^[a-f0-9]{24}$/.test(id)) return fail("Not found.", 404);
    const body = inquiryAdminSchema.parse(await readJson(req));
    const res = await Inquiry.updateOne({ _id: id }, { $set: { status: body.status } });
    return res.matchedCount ? ok({ updated: true }) : fail("Inquiry not found.", 404);
  } catch (err) {
    return handleError(err);
  }
}
