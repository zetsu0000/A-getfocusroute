import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

import { getGuestResultTokenSecret } from "@/lib/email/config";
import { normalizeRecipientEmail } from "@/lib/email/validation";

/**
 * Guest result-email proof token.
 *
 * Minted server-side at quiz-result creation, when the server already knows the
 * (resultId, email) pair belongs together. The token is an HMAC over
 * `resultId + normalizedEmail`, so possession of a valid token proves the caller
 * received it from that creation response — not that they guessed a resultId.
 *
 * This is the guest-safe ownership model: the trigger endpoint never trusts a
 * client-supplied email and never authorizes by resultId alone. The recipient is
 * always read from the persisted row; the token only authorizes the send.
 */

const TOKEN_VERSION = "1";
const DOMAIN = "focusroute.guest-result-email";

function canonicalEmail(email: string): string | null {
  return normalizeRecipientEmail(email);
}

function computeSignature(secret: string, resultId: string, email: string): string {
  return createHmac("sha256", secret)
    .update(`${DOMAIN}\n${TOKEN_VERSION}\n${resultId}\n${email}`)
    .digest("hex");
}

/**
 * Mints a guest proof token for `(resultId, email)`. Returns null when the
 * signing secret is unavailable or the email is unusable — callers must treat a
 * null token as "no guest delivery possible" rather than an error.
 */
export function mintGuestResultEmailToken(
  resultId: string,
  email: string,
  secret: string | null = getGuestResultTokenSecret(),
): string | null {
  if (!secret) return null;
  const safeResultId = resultId.trim();
  if (!safeResultId) return null;
  const normalized = canonicalEmail(email);
  if (!normalized) return null;
  return `${TOKEN_VERSION}.${computeSignature(secret, safeResultId, normalized)}`;
}

function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verifies a guest proof token against the persisted row's `(resultId, email)`.
 * The email argument MUST come from the stored quiz_results row, never the
 * request body. Returns false on any mismatch, malformed token, or missing
 * secret (fail closed).
 */
export function verifyGuestResultEmailToken(
  token: string | null | undefined,
  resultId: string,
  rowEmail: string,
  secret: string | null = getGuestResultTokenSecret(),
): boolean {
  if (!secret || typeof token !== "string") return false;
  const safeResultId = resultId.trim();
  if (!safeResultId) return false;
  const normalized = canonicalEmail(rowEmail);
  if (!normalized) return false;

  const expected = `${TOKEN_VERSION}.${computeSignature(secret, safeResultId, normalized)}`;
  return constantTimeEquals(token.trim(), expected);
}
