import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

import { getEmailUnsubscribeSecret } from "@/lib/email/config";

export type UnsubscribeTokenPayload = {
  emailHash: string;
  userId?: string | null;
  resultId?: string | null;
  exp: number;
};

function signPayload(encoded: string, secret: string): string {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

export function hashEmailForPreferences(email: string, secret: string): string {
  return createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("hex");
}

export function createUnsubscribeToken(input: {
  emailHash: string;
  userId?: string | null;
  resultId?: string | null;
  expiresAtMs?: number;
}): string | null {
  const secret = getEmailUnsubscribeSecret();
  if (!secret) return null;

  const payload: UnsubscribeTokenPayload = {
    emailHash: input.emailHash,
    userId: input.userId ?? null,
    resultId: input.resultId ?? null,
    exp: input.expiresAtMs ?? Date.now() + 1000 * 60 * 60 * 24 * 365,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signPayload(encoded, secret)}`;
}

export function verifyUnsubscribeToken(token: string): UnsubscribeTokenPayload | null {
  const secret = getEmailUnsubscribeSecret();
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
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as UnsubscribeTokenPayload;
    if (!payload?.emailHash || typeof payload.exp !== "number" || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function buildUnsubscribeUrl(token: string): string {
  return `/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
}
