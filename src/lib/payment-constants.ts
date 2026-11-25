// Plain constants with no server-only imports, so both client forms and Mongoose models can use them.
export const paymentPurposes = ["registration", "placement-fee", "other"] as const;
export const paymentStatuses = ["requested", "pending", "paid", "failed", "cancelled", "refunded"] as const;
