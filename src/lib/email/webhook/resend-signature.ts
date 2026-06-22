import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

/** Resend delivers webhooks via Svix. Replay tolerance for the signed timestamp. */
const DEFAULT_TOLERANCE_SECONDS = 5 * 60;

export type SvixHeaders = {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
};

export type SignatureVerification =
  | { ok: true; svixId: string }
  | { ok: false; safeErrorCode: string };

export function readSvixHeaders(headers: Headers): SvixHeaders {
  return {
    id: headers.get("svix-id"),
    timestamp: headers.get("svix-timestamp"),
    signature: headers.get("svix-signature"),
  };
}

function decodeSecret(secret: string): Buffer | null {
  const raw = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  try {
    const decoded = Buffer.from(raw, "base64");
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

function timestampWithinTolerance(timestamp: string, now: number, toleranceSeconds: number): boolean {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const diff = Math.abs(now - ts);
  return diff <= toleranceSeconds;
}

/**
 * Verifies a Svix-signed Resend webhook over the raw request body.
 * Constant-time comparison against every provided v1 signature; fails closed.
 */
export function verifyResendWebhookSignature(input: {
  secret: string | null | undefined;
  payload: string;
  headers: SvixHeaders;
  nowSeconds?: number;
  toleranceSeconds?: number;
}): SignatureVerification {
  const { secret, payload, headers } = input;
  if (!secret) return { ok: false, safeErrorCode: "webhook_secret_missing" };
  if (!headers.id || !headers.timestamp || !headers.signature) {
    return { ok: false, safeErrorCode: "webhook_headers_missing" };
  }

  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const tolerance = input.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  if (!timestampWithinTolerance(headers.timestamp, now, tolerance)) {
    return { ok: false, safeErrorCode: "webhook_timestamp_invalid" };
  }

  const key = decodeSecret(secret);
  if (!key) return { ok: false, safeErrorCode: "webhook_secret_invalid" };

  const signedContent = `${headers.id}.${headers.timestamp}.${payload}`;
  const expected = createHmac("sha256", key).update(signedContent).digest();

  // Header is a space-separated list of "<version>,<base64-signature>" entries.
  const provided = headers.signature.split(" ");
  for (const entry of provided) {
    const [version, value] = entry.split(",");
    if (version !== "v1" || !value) continue;
    let candidate: Buffer;
    try {
      candidate = Buffer.from(value, "base64");
    } catch {
      continue;
    }
    if (candidate.length === expected.length && timingSafeEqual(candidate, expected)) {
      return { ok: true, svixId: headers.id };
    }
  }

  return { ok: false, safeErrorCode: "webhook_signature_invalid" };
}
