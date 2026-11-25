import { createHash, randomBytes } from "node:crypto";
import type { Types } from "mongoose";
import { AuthToken } from "@/models/AuthToken";

export type TokenType = "verify-email" | "reset-password";

export const TOKEN_TTL_MS: Record<TokenType, number> = {
  "verify-email": 24 * 60 * 60 * 1000,
  "reset-password": 60 * 60 * 1000,
};

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

/** Creates a fresh token (replacing any older one of the same type) and returns the raw value to email. */
export async function createToken(userId: Types.ObjectId | string, type: TokenType): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  await AuthToken.deleteMany({ user: userId, type });
  await AuthToken.create({
    user: userId,
    type,
    tokenHash: sha256(raw),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS[type]),
  });
  return raw;
}

/**
 * Atomically consumes a token: it can be used exactly once, even under concurrent requests.
 * Returns the user id, or null if the token is unknown, used or expired.
 */
export async function consumeToken(raw: string, type: TokenType): Promise<string | null> {
  if (!/^[a-f0-9]{64}$/.test(raw)) return null;
  const doc = await AuthToken.findOneAndDelete({
    tokenHash: sha256(raw),
    type,
    expiresAt: { $gt: new Date() },
  }).lean();
  return doc ? String(doc.user) : null;
}
