import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

import { FIRST_PARTY_EVENTS, META_ALLOWED_FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import {
  getResultEmailSiteOrigin,
  isMockProviderAllowed,
  isResultEmailSendingEnabled,
  validateProductionEmailConfiguration,
} from "@/lib/email/config";
import { InMemoryEmailDeliveryLedger } from "@/lib/email/delivery-ledger";
import { buildResultEmailIdempotencyKey } from "@/lib/email/result-email-idempotency";
import { buildResultEmailUrls } from "@/lib/email/result-email-urls";
import {
  assertResultEmailPayloadSafe,
  buildResultEmailPayload,
} from "@/lib/email/result-email-payload";
import { buildResultEmailAnalyticsMetadata } from "@/lib/email/result-email-analytics";
import { MockResultEmailProvider } from "@/lib/email/providers/mock-provider";
import type { ResultEmailMessage } from "@/lib/email/providers/types";
import {
  assertMarketingEmailAllowed,
  resolveResultEmailRecipient,
  sendResultEmail,
} from "@/lib/email/result-email-service";
import { normalizeRecipientEmail } from "@/lib/email/validation";
import { deriveBrainProfile } from "@/lib/dashboard/brain-profile";
import { getSignatureFromAnswers } from "@/lib/signature";
import { scoreFromAnswers } from "@/lib/symptom-level";
import type { QuizAnswer } from "@/types/quiz";

function build(map: Record<string, string | string[]>): QuizAnswer[] {
  return Object.entries(map).map(([questionId, v]) => ({
    questionId,
    selectedOptions: Array.isArray(v) ? v : [v],
  }));
}

const sampleAnswers = build({
  distraction: "often",
  mood: "sometimes",
  "scale-focus": "4",
  "focus-feeling": "stall",
});

const sampleRow = {
  id: "result-123",
  user_id: "user-1",
  email: "user@example.com",
  name: "Sam",
  answers: sampleAnswers,
  signature_key: "Archivist",
  signature_name: "Tampered stored title",
};

const guestSampleRow = {
  ...sampleRow,
  user_id: null,
};

const guestSource = {
  kind: "submitted_quiz_result_email" as const,
  resultId: "result-123",
  email: "user@example.com",
  explicitDeliveryRequest: true as const,
};

const authSource = {
  kind: "authenticated_user" as const,
  userId: "user-1",
  email: "user@example.com",
};

const messageFixture: ResultEmailMessage = {
  subject: "Your result",
  previewText: "Preview",
  textBody: "Body",
  htmlBody: "<p>Body</p>",
};

describe("result email config", () => {
  it("defaults sending to disabled", () => {
    delete process.env.RESULT_EMAIL_SENDING_ENABLED;
    expect(isResultEmailSendingEnabled()).toBe(false);
  });

  it("forbids mock provider in production", () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    process.env.RESULT_EMAIL_PROVIDER = "mock";
    expect(isMockProviderAllowed()).toBe(false);
    expect(validateProductionEmailConfiguration()).toEqual({
      ok: false,
      safeErrorCode: "mock_provider_forbidden_in_production",
    });
    process.env.NODE_ENV = previous;
  });
});

describe("email validation", () => {
  it("accepts normal addresses", () => {
    expect(normalizeRecipientEmail("User@Example.com")).toBe("user@example.com");
  });

  it.each([
    "user@@example.com",
    "user @example.com",
    "user@example .com",
    "user@example.com\r\nBcc:x@example.com",
    "user@example",
    "@example.com",
    "user@",
  ])("rejects unsafe address %s", (value) => {
    expect(normalizeRecipientEmail(value)).toBeNull();
  });
});

describe("buildResultEmailPayload", () => {
  it("builds a canonical transactional payload from a persisted quiz row", () => {
    const { payload } = buildResultEmailPayload({
      quizRow: sampleRow,
      recipientEmail: "user@example.com",
    });

    const canonical = getSignatureFromAnswers(sampleAnswers);
    expect(payload).toMatchObject({
      resultId: "result-123",
      recipientEmail: "user@example.com",
      recipientName: "Sam",
      patternKey: canonical.signature,
      patternName: canonical.title,
      emailType: "transactional",
    });
    expect(payload.idempotencyKey).toBe(
      buildResultEmailIdempotencyKey("result-123", "1"),
    );
  });

  it("ignores tampered stored signature fields", () => {
    const { payload, patternMismatch } = buildResultEmailPayload({
      quizRow: sampleRow,
      recipientEmail: "user@example.com",
    });
    expect(payload.patternKey).not.toBe("Archivist");
    expect(patternMismatch).toBe(true);
  });

  it("uses null focusFrictionScore when canonical score is unavailable", () => {
    const { payload } = buildResultEmailPayload({
      quizRow: {
        ...sampleRow,
        answers: build({ "focus-feeling": "stall", obstacles: ["motivation"] }),
      },
      recipientEmail: "user@example.com",
    });
    expect(payload.focusFrictionScore).toBeNull();
  });

  it("fails safely when only demographic answers exist", () => {
    expect(() =>
      buildResultEmailPayload({
        quizRow: { ...sampleRow, answers: [{ questionId: "age", selectedOptions: ["25-34"] }] },
        recipientEmail: "user@example.com",
      }),
    ).toThrow("result_email_insufficient_answers");
  });

  it("rejects unknown question IDs without a canonical signature signal", () => {
    expect(() =>
      buildResultEmailPayload({
        quizRow: {
          ...sampleRow,
          answers: [{ questionId: "anything-invalid", selectedOptions: ["anything"] }],
        },
        recipientEmail: "user@example.com",
      }),
    ).toThrow("result_email_insufficient_answers");
  });

  it("rejects malformed canonical values when they are the only pattern answer", () => {
    expect(() =>
      buildResultEmailPayload({
        quizRow: {
          ...sampleRow,
          answers: [{ questionId: "focus-feeling", selectedOptions: ["invalid-value"] }],
        },
        recipientEmail: "user@example.com",
      }),
    ).toThrow("result_email_insufficient_answers");
  });

  it("builds from a valid canonical signature signal", () => {
    const answers = build({ "focus-feeling": "stall" });
    const { payload } = buildResultEmailPayload({
      quizRow: { ...sampleRow, answers },
      recipientEmail: "user@example.com",
    });
    const canonical = getSignatureFromAnswers(answers);
    expect(payload.patternKey).toBe(canonical.signature);
    expect(payload.patternName).toBe(canonical.title);
  });

  it("ignores invalid rows when a valid canonical signal is also present", () => {
    const answers = [
      { questionId: "anything-invalid", selectedOptions: ["anything"] },
      { questionId: "focus-feeling", selectedOptions: ["invalid-value"] },
      ...build({ "focus-feeling": "stall", obstacles: ["motivation"] }),
    ];
    const { payload } = buildResultEmailPayload({
      quizRow: { ...sampleRow, answers },
      recipientEmail: "user@example.com",
    });
    const canonical = getSignatureFromAnswers(
      build({ "focus-feeling": "stall", obstacles: ["motivation"] }),
    );
    expect(payload.patternKey).toBe(canonical.signature);
    expect(payload.patternName).toBe(canonical.title);
  });

  it("excludes raw answers from the payload", () => {
    const { payload } = buildResultEmailPayload({
      quizRow: sampleRow,
      recipientEmail: "user@example.com",
    });
    assertResultEmailPayloadSafe(payload);
    expect(JSON.stringify(payload)).not.toContain("selectedOptions");
  });
});

describe("result email URLs", () => {
  const envSnapshot = { ...process.env };

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it("uses configured FocusRoute origin without query-string PII", () => {
    process.env.RESULT_EMAIL_SITE_ORIGIN = "https://getfocusroute.com";
    const urls = buildResultEmailUrls();
    expect(urls.resultUrl).toBe("https://getfocusroute.com/dashboard/profile");
    expect(urls.dashboardUrl).toBe("https://getfocusroute.com/dashboard");
  });

  it("rejects malicious configured origins in production", () => {
    process.env.NODE_ENV = "production";
    process.env.RESULT_EMAIL_SITE_ORIGIN = "https://evil.example.com";
    expect(getResultEmailSiteOrigin()).toBe("https://getfocusroute.com");
  });
});

describe("recipient source resolution", () => {
  it("accepts authenticated users only with matching user_id", () => {
    expect(resolveResultEmailRecipient(authSource, sampleRow)).toBe("user@example.com");
  });

  it("rejects authenticated email when user_id mismatches", () => {
    expect(
      resolveResultEmailRecipient(
        { kind: "authenticated_user", userId: "other-user", email: "user@example.com" },
        sampleRow,
      ),
    ).toBeNull();
  });

  it("accepts guest source only for rows without user_id", () => {
    expect(resolveResultEmailRecipient(guestSource, guestSampleRow)).toBe("user@example.com");
    expect(resolveResultEmailRecipient(guestSource, sampleRow)).toBeNull();
  });

  it("requires explicit delivery request for submitted guest email", () => {
    expect(resolveResultEmailRecipient(guestSource, guestSampleRow)).toBe("user@example.com");

    expect(
      resolveResultEmailRecipient(
        {
          kind: "submitted_quiz_result_email",
          resultId: "result-123",
          email: "user@example.com",
          explicitDeliveryRequest: false as unknown as true,
        },
        guestSampleRow,
      ),
    ).toBeNull();
  });

  it("rejects mismatched result IDs and emails", () => {
    expect(
      resolveResultEmailRecipient(
        { ...guestSource, resultId: "other-id" },
        sampleRow,
      ),
    ).toBeNull();
    expect(
      resolveResultEmailRecipient(
        { ...guestSource, email: "other@example.com" },
        sampleRow,
      ),
    ).toBeNull();
  });
});

describe("sendResultEmail orchestration", () => {
  const guestInput = { quizRow: guestSampleRow, recipientSource: guestSource };

  beforeEach(() => {
    delete process.env.RESULT_EMAIL_SENDING_ENABLED;
  });

  it("does not claim idempotency when disabled", async () => {
    const ledger = new InMemoryEmailDeliveryLedger();
    const provider = new MockResultEmailProvider();

    const first = await sendResultEmail(guestInput, undefined, {}, {
      ledger,
      provider,
      sendingEnabled: () => false,
      trackAnalytics: false,
    });
    const second = await sendResultEmail(guestInput, undefined, {}, {
      ledger,
      provider,
      sendingEnabled: () => true,
      trackAnalytics: false,
    });

    expect(first.status).toBe("skipped_disabled");
    expect(second.status).toBe("previewed");
    expect(provider.calls).toHaveLength(1);
    expect(ledger.getRecord(second.idempotencyKey)?.attemptCount).toBe(1);
  });

  it("claims atomically so concurrent sends invoke the provider once", async () => {
    const ledger = new InMemoryEmailDeliveryLedger();
    const provider = {
      name: "mock",
      send: vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 25));
        return { ok: true as const, providerMessageId: "mock-delayed" };
      }),
    };
    const deps = {
      ledger,
      provider,
      sendingEnabled: () => true,
      trackAnalytics: false,
    };

    const [a, b] = await Promise.all([
      sendResultEmail(guestInput, undefined, {}, deps),
      sendResultEmail(guestInput, undefined, {}, deps),
    ]);

    expect(provider.send).toHaveBeenCalledTimes(1);
    expect([a.status, b.status].sort()).toEqual(["previewed", "skipped_in_progress"]);
  });

  it("reclaims failed deliveries and increments attemptCount on retry", async () => {
    const ledger = new InMemoryEmailDeliveryLedger();
    const provider = {
      name: "resend",
      send: vi
        .fn()
        .mockResolvedValueOnce({ ok: false, safeErrorCode: "provider_rejected" })
        .mockResolvedValueOnce({ ok: true, providerMessageId: "msg_2" }),
    };

    const first = await sendResultEmail(guestInput, messageFixture, {}, {
      ledger,
      provider,
      sendingEnabled: () => true,
      trackAnalytics: false,
    });
    expect(first.status).toBe("failed");
    expect(provider.send).toHaveBeenCalledTimes(1);
    expect(ledger.getRecord(first.idempotencyKey)?.attemptCount).toBe(1);
    expect(ledger.getRecord(first.idempotencyKey)?.status).toBe("failed");

    const second = await sendResultEmail(guestInput, messageFixture, {}, {
      ledger,
      provider,
      sendingEnabled: () => true,
      trackAnalytics: false,
    });
    expect(second.status).toBe("sent");
    expect(provider.send).toHaveBeenCalledTimes(2);
    expect(ledger.getRecord(second.idempotencyKey)?.attemptCount).toBe(2);
    expect(ledger.getRecord(second.idempotencyKey)?.status).toBe("sent");
  });

  it("reclaims after provider_exception and provider_not_configured failures", async () => {
    const ledger = new InMemoryEmailDeliveryLedger();
    const throwingProvider = {
      name: "resend",
      send: vi.fn(async () => {
        throw new Error("smtp exploded user@example.com");
      }),
    };

    const throwResult = await sendResultEmail(guestInput, messageFixture, {}, {
      ledger,
      provider: throwingProvider,
      sendingEnabled: () => true,
      trackAnalytics: false,
    });
    expect(throwResult.status).toBe("failed");
    expect(throwResult.safeErrorCode).toBe("provider_exception");

    const retryProvider = {
      name: "resend",
      send: vi.fn(async () => ({ ok: true, providerMessageId: "msg_retry" })),
    };
    const retryResult = await sendResultEmail(guestInput, messageFixture, {}, {
      ledger,
      provider: retryProvider,
      sendingEnabled: () => true,
      trackAnalytics: false,
    });
    expect(retryResult.status).toBe("sent");
    expect(retryProvider.send).toHaveBeenCalledTimes(1);
    expect(ledger.getRecord(retryResult.idempotencyKey)?.attemptCount).toBe(2);

    const noopLedger = new InMemoryEmailDeliveryLedger();
    const noopProvider = { name: "noop", send: vi.fn() };
    const missingProvider = await sendResultEmail(guestInput, messageFixture, {}, {
      ledger: noopLedger,
      provider: noopProvider,
      sendingEnabled: () => true,
      trackAnalytics: false,
    });
    expect(missingProvider.safeErrorCode).toBe("provider_not_configured");
    expect(noopProvider.send).not.toHaveBeenCalled();

    const realProvider = {
      name: "resend",
      send: vi.fn(async () => ({ ok: true, providerMessageId: "msg_1" })),
    };
    const withProvider = await sendResultEmail(guestInput, undefined, {}, {
      ledger: noopLedger,
      provider: realProvider,
      sendingEnabled: () => true,
      trackAnalytics: false,
    });
    expect(withProvider.status).toBe("sent");
    expect(realProvider.send).toHaveBeenCalledTimes(1);
    expect(noopLedger.getRecord(withProvider.idempotencyKey)?.attemptCount).toBe(2);
  });

  it("reclaims after provider_not_configured without blocking later attempts", async () => {
    const ledger = new InMemoryEmailDeliveryLedger();
    const noopProvider = { name: "noop", send: vi.fn() };

    const first = await sendResultEmail(guestInput, messageFixture, {}, {
      ledger,
      provider: noopProvider,
      sendingEnabled: () => true,
      trackAnalytics: false,
    });
    expect(first.safeErrorCode).toBe("provider_not_configured");
    expect(noopProvider.send).not.toHaveBeenCalled();

    const realProvider = {
      name: "resend",
      send: vi.fn(async () => ({ ok: true, providerMessageId: "msg_1" })),
    };
    const second = await sendResultEmail(guestInput, messageFixture, {}, {
      ledger,
      provider: realProvider,
      sendingEnabled: () => true,
      trackAnalytics: false,
    });
    expect(second.status).toBe("sent");
    expect(realProvider.send).toHaveBeenCalledTimes(1);
    expect(ledger.getRecord(second.idempotencyKey)?.attemptCount).toBe(2);
  });

  it("returns previewed for mock sends and never real sent", async () => {
    const provider = new MockResultEmailProvider();
    const result = await sendResultEmail(
      guestInput,
      undefined,
      {},
      {
        ledger: new InMemoryEmailDeliveryLedger(),
        provider,
        sendingEnabled: () => true,
        trackAnalytics: false,
      },
    );

    expect(result.status).toBe("previewed");
    expect(result.status).not.toBe("sent");
  });

  it("treats sent and previewed records as terminal duplicates", async () => {
    const ledger = new InMemoryEmailDeliveryLedger();
    const provider = new MockResultEmailProvider();
    const deps = {
      ledger,
      provider,
      sendingEnabled: () => true,
      trackAnalytics: false,
    };

    const first = await sendResultEmail(guestInput, undefined, {}, deps);
    expect(first.status).toBe("previewed");

    const duplicate = await sendResultEmail(guestInput, undefined, {}, deps);
    expect(duplicate.status).toBe("skipped_duplicate");
    expect(provider.calls).toHaveLength(1);
  });

  it("uses the production template when message is omitted for real providers", async () => {
    const realProvider = {
      name: "resend",
      send: vi.fn(async () => ({ ok: true, providerMessageId: "msg_1" })),
    };
    const result = await sendResultEmail(
      guestInput,
      undefined,
      {},
      {
        ledger: new InMemoryEmailDeliveryLedger(),
        provider: realProvider,
        sendingEnabled: () => true,
        trackAnalytics: false,
      },
    );

    expect(result.status).toBe("sent");
    expect(realProvider.send).toHaveBeenCalledTimes(1);
    expect(realProvider.send.mock.calls[0]?.[1]?.subject).toBe(
      "Your FocusRoute result is ready",
    );
  });

  it("sends through a real provider when message is supplied", async () => {
    const realProvider = {
      name: "resend",
      send: vi.fn(async () => ({ ok: true, providerMessageId: "msg_1" })),
    };
    const result = await sendResultEmail(
      guestInput,
      messageFixture,
      {},
      {
        ledger: new InMemoryEmailDeliveryLedger(),
        provider: realProvider,
        sendingEnabled: () => true,
        trackAnalytics: false,
      },
    );

    expect(result.status).toBe("sent");
    expect(realProvider.send).toHaveBeenCalledTimes(1);
  });

  it("handles provider failures and exceptions safely", async () => {
    const failingProvider = {
      name: "resend",
      send: vi.fn(async () => ({ ok: false, safeErrorCode: "provider_rejected" })),
    };
    const failResult = await sendResultEmail(
      guestInput,
      messageFixture,
      {},
      {
        ledger: new InMemoryEmailDeliveryLedger(),
        provider: failingProvider,
        sendingEnabled: () => true,
        trackAnalytics: false,
      },
    );
    expect(failResult.status).toBe("failed");
    expect(failResult.safeErrorCode).toBe("provider_rejected");
  });

  it("blocks marketing sends on the transactional path", () => {
    expect(() => assertMarketingEmailAllowed("marketing")).toThrow(
      "result_email_marketing_not_allowed",
    );
  });
});

describe("delivery ledger claim semantics", () => {
  it("blocks reclaim while pending lease is active and allows reclaim after expiry", async () => {
    let nowMs = Date.parse("2026-01-01T00:00:00.000Z");
    const clock = { now: () => new Date(nowMs) };
    const ledger = new InMemoryEmailDeliveryLedger({ clock, leaseMs: 60_000 });
    const input = {
      idempotencyKey: "key-1",
      emailType: "transactional" as const,
      resultId: "result-123",
      provider: "mock",
    };

    const first = await ledger.claim(input);
    expect(first.status).toBe("claimed");
    expect(first.record.attemptCount).toBe(1);

    const inProgress = await ledger.claim(input);
    expect(inProgress.status).toBe("in_progress");

    nowMs += 61_000;
    const reclaimed = await ledger.claim(input);
    expect(reclaimed.status).toBe("reclaimed");
    expect(reclaimed.record.attemptCount).toBe(2);
  });

  it("does not increment attemptCount on status updates", async () => {
    const ledger = new InMemoryEmailDeliveryLedger();
    const input = {
      idempotencyKey: "key-2",
      emailType: "transactional" as const,
      resultId: "result-123",
      provider: "mock",
    };

    const claim = await ledger.claim(input);
    await ledger.markFailed({
      idempotencyKey: input.idempotencyKey,
      claimToken: claim.record.claimToken,
      provider: "mock",
      lastErrorCode: "provider_rejected",
    });
    expect(ledger.getRecord(input.idempotencyKey)?.attemptCount).toBe(1);
  });

  it("rejects stale claim token finalization after reclaim", async () => {
    let nowMs = Date.parse("2026-01-01T00:00:00.000Z");
    const clock = { now: () => new Date(nowMs) };
    const ledger = new InMemoryEmailDeliveryLedger({ clock, leaseMs: 1_000 });
    const input = {
      idempotencyKey: "key-3",
      emailType: "transactional" as const,
      resultId: "result-123",
      provider: "mock",
    };

    const first = await ledger.claim(input);
    nowMs += 2_000;
    const second = await ledger.claim(input);
    expect(second.status).toBe("reclaimed");

    await expect(
      ledger.markSent({
        idempotencyKey: input.idempotencyKey,
        claimToken: first.record.claimToken,
        provider: "mock",
        providerMessageId: "stale",
      }),
    ).rejects.toThrow("delivery_ledger_claim_token_mismatch");

    await ledger.markSent({
      idempotencyKey: input.idempotencyKey,
      claimToken: second.record.claimToken,
      provider: "mock",
      providerMessageId: "current",
    });
    expect(ledger.getRecord(input.idempotencyKey)?.status).toBe("sent");
  });
});

describe("result email analytics metadata", () => {
  it("contains only safe operational fields", () => {
    const { payload, patternMismatch } = buildResultEmailPayload({
      quizRow: sampleRow,
      recipientEmail: "user@example.com",
    });
    const metadata = buildResultEmailAnalyticsMetadata(payload, {
      safeErrorCode: "provider_timeout",
      provider: "mock",
      patternMismatch,
    });

    expect(metadata.pattern_mismatch).toBe(true);
    expect(metadata).not.toHaveProperty("email");
    expect(JSON.stringify(metadata)).not.toContain("user@example.com");
  });

  it("registers delivery events as first-party only", () => {
    expect(META_ALLOWED_FIRST_PARTY_EVENTS.has(FIRST_PARTY_EVENTS.resultEmailSent)).toBe(false);
  });
});

describe("algorithm preservation", () => {
  it("does not change scoreFromAnswers, signature, or radar outputs", () => {
    const beforeScore = scoreFromAnswers(sampleAnswers);
    const beforeSignature = getSignatureFromAnswers(sampleAnswers);
    const beforeRadar = deriveBrainProfile(
      sampleAnswers,
      beforeSignature.title,
      beforeSignature.preview,
    ).radarDimensions;

    buildResultEmailPayload({
      quizRow: sampleRow,
      recipientEmail: "user@example.com",
    });

    expect(scoreFromAnswers(sampleAnswers)).toBe(beforeScore);
    expect(getSignatureFromAnswers(sampleAnswers)).toEqual(beforeSignature);
    expect(
      deriveBrainProfile(sampleAnswers, beforeSignature.title, beforeSignature.preview)
        .radarDimensions,
    ).toEqual(beforeRadar);
  });
});

describe("service source guard", () => {
  it("does not use find-then-upsert orchestration", async () => {
    const serviceSrc = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../result-email-service.ts", import.meta.url), "utf8"),
    );
    expect(serviceSrc).toContain("ledger.claim");
    expect(serviceSrc).not.toContain("findByIdempotencyKey");
    expect(serviceSrc).not.toContain("ledger.upsert");
  });
});
