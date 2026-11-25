import { z } from "zod";
import { parseIdentifier } from "./common";
import { paymentPurposes } from "@/lib/payment-constants";

export const userAdminSchema = z.object({
  pipelineStatus: z.enum(["registered", "screened", "needs-follow-up", "submitted", "placed", "inactive"]),
});

export const vacancyAdminSchema = z.object({
  status: z.enum(["pending-verification", "open", "on-hold", "filled", "closed"]),
});

export const inquiryAdminSchema = z.object({
  status: z.enum(["new", "contacted", "closed"]),
});

/** Admin may only cancel an unpaid request, or record that a paid one was refunded. */
export const paymentAdminSchema = z.object({
  status: z.enum(["cancelled", "refunded"]),
});

export const paymentRequestSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Enter the user's email or mobile number")
    .refine((v) => parseIdentifier(v) !== null, "Enter a valid email or 10-digit mobile number"),
  purpose: z.enum(paymentPurposes, { error: "Select a purpose" }),
  description: z.string().trim().min(3, "Describe what the payment is for").max(200),
  amountRupees: z
    .number({ error: "Enter an amount in rupees" })
    .min(1, "Minimum ₹1")
    .max(500000, "Maximum ₹5,00,000"),
  vacancyId: z
    .string()
    .regex(/^[a-f0-9]{24}$/, "Invalid vacancy id")
    .optional()
    .or(z.literal("")),
});
export type PaymentRequestInput = z.input<typeof paymentRequestSchema>;
