import { getAdmin } from "@/lib/admin";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { newReceiptNo } from "@/lib/payments";
import { notifyUser } from "@/lib/notifications";
import { paymentRequestSchema } from "@/lib/validations/admin";
import { parseIdentifier } from "@/lib/validations/common";
import { siteConfig } from "@/config/site";
import { Payment } from "@/models/Payment";
import { User } from "@/models/User";
import { Vacancy } from "@/models/Vacancy";

/** Staff raises a payment request (e.g. a school's placement fee). The user then pays it from their dashboard. */
export async function POST(req: Request) {
  try {
    const admin = await getAdmin();
    if (!admin) return fail("Not authorised.", 403);

    const body = paymentRequestSchema.parse(await readJson(req));
    const id = parseIdentifier(body.identifier)!;
    const user = await User.findOne(id.type === "email" ? { email: id.value } : { phone: id.value }).select("name role").lean();
    if (!user) return fail("No account found with that email or mobile number.", 404, { identifier: ["No such user"] });

    // Legal gate, enforced on the server so it cannot be bypassed from the UI.
    if (user.role === "candidate" && !siteConfig.candidateFeesEnabled) {
      return fail("Teacher fees are disabled (legal approval pending). Set CANDIDATE_FEES_ENABLED=true only after sign-off.", 403);
    }
    if (body.vacancyId && !(await Vacancy.exists({ _id: body.vacancyId }))) {
      return fail("Vacancy not found.", 404, { vacancyId: ["No such vacancy"] });
    }

    const payment = await Payment.create({
      user: user._id,
      purpose: body.purpose,
      description: body.description,
      amountPaise: Math.round(body.amountRupees * 100),
      receiptNo: newReceiptNo(),
      vacancy: body.vacancyId || undefined,
      createdBy: admin._id,
    });
    await notifyUser(user._id, {
      title: "Payment due",
      body: `${body.description}. Amount: ₹${body.amountRupees.toLocaleString("en-IN")}. You can pay securely by UPI, card or net banking.`,
      level: "warning",
      link: "/dashboard",
    });
    return ok({ id: String(payment._id), receiptNo: payment.receiptNo, forUser: user.name }, 201);
  } catch (err) {
    return handleError(err);
  }
}
