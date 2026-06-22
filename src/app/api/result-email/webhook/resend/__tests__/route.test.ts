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
  omitSignature?: boolean;
}): Request {
  const svixId = opts.svixId ?? "msg_1";
  const timestamp = opts.timestamp ?? String(NOW);
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "svix-id": svixId,
    "svix-timestamp": timestamp,
  };
  if (!opts.omitSignature) {
    headers["svix-signature"] = opts.signature ?? sign(svixId, timestamp, opts.body);
  }
  return new Request("http://localhost/api/result-email/webhook/resend", {
    method: "POST",
    headers,
    body: opts.body,
  });
}

const enabledDeps = (ledger: InMemoryEmailWebhookLedger) => ({
  webhookSecret: () => SECRET,
  webhookEnabled: () => true,
  ledger,
  nowSeconds: NOW,
});

function eventBody(type: string, emailId = "m1", createdAt?: string): string {
  return JSON.stringify({
    type,
    created_at: createdAt ?? "2026-06-22T13:00:00.000Z",
    data: { email_id: emailId },
  });
}

describe("processResendWebhook", () => {
  it("rejects an invalid signature with 400 and no mutation", async () => {
    const ledger = new InMemoryEmailWebhookLedger();
    const recordSpy = vi.spyOn(ledger, "recordEvent");
    const response = await processResendWebhook(
      webhookRequest({ body: eventBody("email.delivered"), signature: "v1,deadbeef" }),
      enabledDeps(ledger),
    );
    expect(response.status).toBe(400);
    expect(recordSpy).not.toHaveBeenCalled();
  });

  it("rejects a missing signature with 400", async () => {
    const ledger = new InMemoryEmailWebhookLedger();
    const recordSpy = vi.spyOn(ledger, "recordEvent");
    const response = await processResendWebhook(
      webhookRequest({ body: eventBody("email.delivered"), omitSignature: true }),
      enabledDeps(ledger),
    );
    expect(response.status).toBe(400);
    expect(recordSpy).not.toHaveBeenCalled();
  });

  it("acknowledges valid events with 200 but performs no mutation when disabled", async () => {
    const ledger = new InMemoryEmailWebhookLedger();
    const recordSpy = vi.spyOn(ledger, "recordEvent");
    const response = await processResendWebhook(webhookRequest({ body: eventBody("email.delivered") }), {
      webhookSecret: () => SECRET,
      webhookEnabled: () => false,
      ledger,
      nowSeconds: NOW,
    });
    expect(response.status).toBe(200);
    expect((await response.json()).disabled).toBe(true);
    expect(recordSpy).not.toHaveBeenCalled();
  });

  it("records a delivered event against the matched delivery when enabled", async () => {
    const ledger = new InMemoryEmailWebhookLedger({ knownProviderMessageIds: ["m1"] });
    const response = await processResendWebhook(
      webhookRequest({ body: eventBody("email.delivered") }),
      enabledDeps(ledger),
    );
    expect((await response.json()).result).toBe("applied");
    const state = ledger.getDeliveryState("m1");
    expect(state?.providerStatus).toBe("email.delivered");
    expect(state?.suppressed).toBe(false);
  });

  it("suppresses on bounced, complained and suppressed events", async () => {
    for (const [i, type] of ["email.bounced", "email.complained", "email.suppressed"].entries()) {
      const ledger = new InMemoryEmailWebhookLedger({ knownProviderMessageIds: ["m1"] });
      await processResendWebhook(
        webhookRequest({ body: eventBody(type), svixId: `bounce_${i}` }),
        enabledDeps(ledger),
      );
      const state = ledger.getDeliveryState("m1");
      expect(state?.suppressed).toBe(true);
      expect(state?.providerStatus).toBe(type);
    }
  });

  it("keeps suppression after an out-of-order delivered event", async () => {
    const ledger = new InMemoryEmailWebhookLedger({ knownProviderMessageIds: ["m1"] });
    await processResendWebhook(
      webhookRequest({ body: eventBody("email.bounced", "m1", "2026-06-22T13:05:00.000Z"), svixId: "a" }),
      enabledDeps(ledger),
    );
    // An older "delivered" arriving late must not clear suppression or regress status.
    await processResendWebhook(
      webhookRequest({ body: eventBody("email.delivered", "m1", "2026-06-22T13:00:00.000Z"), svixId: "b" }),
      enabledDeps(ledger),
    );
    const state = ledger.getDeliveryState("m1");
    expect(state?.suppressed).toBe(true);
    expect(state?.providerStatus).toBe("email.bounced");
  });

  it("deduplicates repeated svix ids", async () => {
    const ledger = new InMemoryEmailWebhookLedger({ knownProviderMessageIds: ["m1"] });
    const body = eventBody("email.delivered");
    const first = await processResendWebhook(webhookRequest({ body }), enabledDeps(ledger));
    const second = await processResendWebhook(webhookRequest({ body }), enabledDeps(ledger));
    expect((await first.json()).result).toBe("applied");
    expect((await second.json()).result).toBe("duplicate");
  });

  it("acknowledges an unmatched provider message id without error", async () => {
    const ledger = new InMemoryEmailWebhookLedger();
    const response = await processResendWebhook(
      webhookRequest({ body: eventBody("email.delivered", "unknown") }),
      enabledDeps(ledger),
    );
    expect((await response.json()).result).toBe("applied_unmatched");
  });

  it("ignores forbidden/unknown events without mutation", async () => {
    for (const type of ["email.opened", "email.clicked", "contact.created", "domain.updated", "nope"]) {
      const ledger = new InMemoryEmailWebhookLedger();
      const recordSpy = vi.spyOn(ledger, "recordEvent");
      const response = await processResendWebhook(
        webhookRequest({ body: eventBody(type) }),
        enabledDeps(ledger),
      );
      expect(response.status).toBe(200);
      expect((await response.json()).ignored).toBe(true);
      expect(recordSpy).not.toHaveBeenCalled();
    }
  });
});
