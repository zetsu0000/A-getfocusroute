import { createHmac } from "crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { processResendWebhook } from "@/app/api/result-email/webhook/resend/route";
import { InMemoryEmailWebhookLedger } from "@/lib/email/webhook/webhook-ledger";

const SECRET_BYTES = Buffer.from("super-secret-signing-key-1234567890");
const SECRET = `whsec_${SECRET_BYTES.toString("base64")}`;
const NOW = 1_782_000_000;

function sign(id: string, timestamp: string, payload: string): string {
  const signed = `${id}.${timestamp}.${payload}`;
  return `v1,${createHmac("sha256", SECRET_BYTES).update(signed).digest("base64")}`;
}

function webhookRequest(opts: {
  body: string;
  svixId?: string;
  timestamp?: string;
  signature?: string;
}): Request {
  const svixId = opts.svixId ?? "msg_1";
  const timestamp = opts.timestamp ?? String(NOW);
  const signature = opts.signature ?? sign(svixId, timestamp, opts.body);
  return new Request("http://localhost/api/result-email/webhook/resend", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "svix-id": svixId,
      "svix-timestamp": timestamp,
      "svix-signature": signature,
    },
    body: opts.body,
  });
}

const enabledDeps = (ledger: InMemoryEmailWebhookLedger) => ({
  webhookSecret: () => SECRET,
  webhookEnabled: () => true,
  ledger,
  nowSeconds: NOW,
});

describe("processResendWebhook", () => {
  it("rejects an invalid signature with 400 and no mutation", async () => {
    const ledger = new InMemoryEmailWebhookLedger();
    const recordSpy = vi.spyOn(ledger, "recordEvent");
    const body = JSON.stringify({ type: "email.delivered", data: { email_id: "m1" } });
    const response = await processResendWebhook(
      webhookRequest({ body, signature: "v1,deadbeef" }),
      enabledDeps(ledger),
    );
    expect(response.status).toBe(400);
    expect(recordSpy).not.toHaveBeenCalled();
  });

  it("acknowledges valid events with 200 but performs no mutation when disabled", async () => {
    const ledger = new InMemoryEmailWebhookLedger();
    const recordSpy = vi.spyOn(ledger, "recordEvent");
    const body = JSON.stringify({ type: "email.delivered", data: { email_id: "m1" } });
    const response = await processResendWebhook(webhookRequest({ body }), {
      webhookSecret: () => SECRET,
      webhookEnabled: () => false,
      ledger,
      nowSeconds: NOW,
    });
    expect(response.status).toBe(200);
    expect(recordSpy).not.toHaveBeenCalled();
  });

  it("records an allowed event when enabled", async () => {
    const ledger = new InMemoryEmailWebhookLedger({ knownProviderMessageIds: ["m1"] });
    const body = JSON.stringify({ type: "email.bounced", data: { email_id: "m1" } });
    const response = await processResendWebhook(webhookRequest({ body }), enabledDeps(ledger));
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.result).toBe("applied");
    expect(ledger.getEvent("msg_1")?.eventType).toBe("email.bounced");
  });

  it("deduplicates repeated svix ids", async () => {
    const ledger = new InMemoryEmailWebhookLedger({ knownProviderMessageIds: ["m1"] });
    const body = JSON.stringify({ type: "email.delivered", data: { email_id: "m1" } });
    const first = await processResendWebhook(webhookRequest({ body }), enabledDeps(ledger));
    const second = await processResendWebhook(webhookRequest({ body }), enabledDeps(ledger));
    expect((await first.json()).result).toBe("applied");
    expect((await second.json()).result).toBe("duplicate");
  });

  it("ignores forbidden/unknown events without mutation", async () => {
    const ledger = new InMemoryEmailWebhookLedger();
    const recordSpy = vi.spyOn(ledger, "recordEvent");
    const body = JSON.stringify({ type: "email.opened", data: { email_id: "m1" } });
    const response = await processResendWebhook(webhookRequest({ body }), enabledDeps(ledger));
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.ignored).toBe(true);
    expect(recordSpy).not.toHaveBeenCalled();
  });
});
