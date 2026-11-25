import { getAdmin } from "@/lib/admin";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { paymentAdminSchema } from "@/lib/validations/admin";
import { Payment } from "@/models/Payment";

/** Cancel an unpaid request, or record that a paid one was refunded (refund the money itself in Razorpay). */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAdmin())) return fail("Not authorised.", 403);
    const { id } = await ctx.params;
    if (!/^[a-f0-9]{24}$/.test(id)) return fail("Not found.", 404);
    const { status } = paymentAdminSchema.parse(await readJson(req));

    const allowedFrom = status === "cancelled" ? ["requested", "pending", "failed"] : ["paid"];
    const filter: Record<string, unknown> = { _id: id, status: { $in: allowedFrom } };
    const res = await Payment.updateOne(filter, { $set: { status } });
    return res.matchedCount ? ok({ updated: true }) : fail(`A payment in its current state cannot be marked ${status}.`, 409);
  } catch (err) {
    return handleError(err);
  }
}
