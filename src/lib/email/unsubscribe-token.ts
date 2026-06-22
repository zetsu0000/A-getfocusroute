import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

import { getEmailUnsubscribeTokenSecret } from "@/lib/email/config";

export type UnsubscribeTokenPayload = {
  version: 1;
  emailHash: string;
};

function signPayload(encoded: string, secret: string): string {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

/** Versioned signed PII-safe unsubscribe token — no raw email, no expiration. */
export function createUnsubscribeToken(input: { emailHash: string }): string | null {
  const secret = getEmailUnsubscribeTokenSecret();
  if (!secret) return null;

  const payload: UnsubscribeTokenPayload = {
    version: 1,
    emailHash: input.emailHash,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signPayload(encoded, secret)}`;
}

export function verifyUnsubscribeToken(token: string): UnsubscribeTokenPayload | null {
  const secret = getEmailUnsubscribeTokenSecret();
  if (!secret) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = signPayload(encoded, secret);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as UnsubscribeTokenPayload;
    if (payload?.version !== 1 || !payload.emailHash) return null;
    return payload;
  } catch {
    return null;
  }
}

export function buildUnsubscribeUrl(token: string): string {
  return `/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
}
