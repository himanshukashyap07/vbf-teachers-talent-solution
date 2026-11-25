import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Single-use tokens for email verification and password reset.
 * Only the SHA-256 hash is stored, so a database leak does not expose usable links.
 * MongoDB removes expired documents automatically (TTL index on expiresAt).
 */
const authTokenSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["verify-email", "reset-password"], required: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
});

export const AuthToken: Model<InferSchemaType<typeof authTokenSchema>> =
  (models.AuthToken as Model<InferSchemaType<typeof authTokenSchema>>) ||
  model("AuthToken", authTokenSchema);
