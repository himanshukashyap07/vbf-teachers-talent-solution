import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { assertSameOrigin, fail, handleError, ok } from "@/lib/api";
import { newReceiptNo } from "@/lib/payments";
import { siteConfig } from "@/config/site";
import { Payment } from "@/models/Payment";
import { User } from "@/models/User";

/**
 * Teacher self-service: start the one-time registration fee.
 * Refused outright unless CANDIDATE_FEES_ENABLED=true (the legal gate in the PRD).
 * The amount comes from server config; the request body is ignored.
 */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return fail("Please log in first.", 401);
    if (!siteConfig.candidateFeesEnabled) return fail("No fee is being charged to teachers at this time.", 403);

    await connectDB();
    const user = await User.findById(session.user.id).select("role").lean();
    if (user?.role !== "candidate") return fail("Only teacher accounts can pay the registration fee.", 403);

    if (await Payment.exists({ user: user._id, purpose: "registration", status: "paid" })) {
      return fail("Your registration fee is already paid.", 409);
    }
    const open = await Payment.findOne({ user: user._id, purpose: "registration", status: { $in: ["requested", "pending", "failed"] } });
    if (open) return ok({ id: String(open._id) });

    const payment = await Payment.create({
      user: user._id,
      purpose: "registration",
      description: "One-time registration fee",
      amountPaise: siteConfig.candidateRegistrationFeePaise,
      receiptNo: newReceiptNo(),
    });
    return ok({ id: String(payment._id) }, 201);
  } catch (err) {
    return handleError(err);
  }
}
