import { createHmac } from "crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  parseResendWebhookEvent,
} from "@/lib/email/webhook/resend-events";
import {
  verifyResendWebhookSignature,
  type SvixHeaders,
} from "@/lib/email/webhook/resend-signature";

const SECRET_BYTES = Buffer.from("super-secret-signing-key-1234567890");
const SECRET = `whsec_${SECRET_BYTES.toString("base64")}`;

function sign(id: string, timestamp: string, payload: string): string {
  const signed = `${id}.${timestamp}.${payload}`;
  const sig = createHmac("sha256", SECRET_BYTES).update(signed).digest("base64");
  return `v1,${sig}`;
}

const NOW = 1_782_000_000;

function headers(overrides: Partial<SvixHeaders> = {}, payload = "{}"): SvixHeaders {
  const id = overrides.id ?? "msg_1";
  const timestamp = overrides.timestamp ?? String(NOW);
  return {
    id,
    timestamp,
    signature: overrides.signature ?? sign(id, timestamp, payload),
  };
}

describe("verifyResendWebhookSignature", () => {
  it("accepts a valid signature over the raw body", () => {
    const payload = JSON.stringify({ type: "email.delivered" });
    const result = verifyResendWebhookSignature({
      secret: SECRET,
      payload,
      headers: headers({}, payload),
      nowSeconds: NOW,
    });
    expect(result).toEqual({ ok: true, svixId: "msg_1" });
  });

  it("rejects a tampered body", () => {
    const payload = JSON.stringify({ type: "email.delivered" });
    const result = verifyResendWebhookSignature({
      secret: SECRET,
      payload: payload + "x",
      headers: headers({}, payload),
      nowSeconds: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects missing headers", () => {
    const result = verifyResendWebhookSignature({
      secret: SECRET,
      payload: "{}",
      headers: { id: null, timestamp: null, signature: null },
      nowSeconds: NOW,
    });
    expect(result).toEqual({ ok: false, safeErrorCode: "webhook_headers_missing" });
  });

  it("rejects an out-of-tolerance timestamp (replay)", () => {
    const payload = "{}";
    const result = verifyResendWebhookSignature({
      secret: SECRET,
      payload,
      headers: headers({ timestamp: String(NOW - 10_000) }, payload),
      nowSeconds: NOW,
    });
    expect(result).toEqual({ ok: false, safeErrorCode: "webhook_timestamp_invalid" });
  });

  it("fails closed when the secret is absent", () => {
    const result = verifyResendWebhookSignature({
      secret: null,
      payload: "{}",
      headers: headers(),
      nowSeconds: NOW,
    });
    expect(result).toEqual({ ok: false, safeErrorCode: "webhook_secret_missing" });
  });
});

describe("parseResendWebhookEvent", () => {
  it("extracts allowed events and the provider message id", () => {
    expect(
      parseResendWebhookEvent({ type: "email.bounced", data: { email_id: "resend_1" } }),
    ).toEqual({ type: "email.bounced", providerMessageId: "resend_1" });
  });

  it("ignores forbidden and unknown events", () => {
    expect(parseResendWebhookEvent({ type: "email.opened", data: {} })).toBeNull();
    expect(parseResendWebhookEvent({ type: "contact.created", data: {} })).toBeNull();
    expect(parseResendWebhookEvent({ type: "domain.updated" })).toBeNull();
    expect(parseResendWebhookEvent({ type: "nonsense" })).toBeNull();
    expect(parseResendWebhookEvent(null)).toBeNull();
  });
});
