import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

import { paymentPurposes, paymentStatuses } from "@/lib/payment-constants";

/**
 * One row per amount a user owes (or paid) to the agency.
 * Amounts are ALWAYS decided on the server (config or admin) and stored in paise;
 * the browser never supplies an amount.
 *
 * requested -> pending (Razorpay order created) -> paid | failed
 * requested/pending/failed -> cancelled (admin);  paid -> refunded (admin records it; money is refunded in the Razorpay dashboard)
 */
const paymentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    purpose: { type: String, enum: paymentPurposes, required: true },
    description: { type: String, required: true, trim: true },
    amountPaise: { type: Number, required: true, min: 100 },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: paymentStatuses, default: "requested", index: true },
    receiptNo: { type: String, required: true, unique: true },
    vacancy: { type: Schema.Types.ObjectId, ref: "Vacancy" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" }, // admin who raised it; unset for self-service registration fee
    razorpayOrderId: { type: String, index: true, sparse: true },
    razorpayPaymentId: String,
    paidAt: Date,
    failureReason: String,
  },
  { timestamps: true },
);

export type PaymentDoc = InferSchemaType<typeof paymentSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
};

export const Payment: Model<InferSchemaType<typeof paymentSchema>> =
  (models.Payment as Model<InferSchemaType<typeof paymentSchema>>) || model("Payment", paymentSchema);
