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

const guestSource = {
  kind: "submitted_quiz_result_email" as const,
  resultId: "result-123",
  email: "user@example.com",
  explicitDeliveryRequest: true as const,
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
    expect(
      resolveResultEmailRecipient(
        { kind: "authenticated_user", userId: "user-1", email: "user@example.com" },
        sampleRow,
      ),
    ).toBe("user@example.com");
  });

  it("rejects authenticated email when user_id mismatches", () => {
    expect(
      resolveResultEmailRecipient(
        { kind: "authenticated_user", userId: "other-user", email: "user@example.com" },
        sampleRow,
      ),
    ).toBeNull();
  });

  it("requires explicit delivery request for submitted guest email", () => {
    expect(
      resolveResultEmailRecipient(
        {
          kind: "submitted_quiz_result_email",
          resultId: "result-123",
          email: "user@example.com",
          explicitDeliveryRequest: true,
        },
        sampleRow,
      ),
    ).toBe("user@example.com");

    expect(
      resolveResultEmailRecipient(
        {
          kind: "submitted_quiz_result_email",
          resultId: "result-123",
          email: "user@example.com",
          explicitDeliveryRequest: false as unknown as true,
        },
        sampleRow,
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
  beforeEach(() => {
    delete process.env.RESULT_EMAIL_SENDING_ENABLED;
  });

  it("does not claim idempotency when disabled", async () => {
    const ledger = new InMemoryEmailDeliveryLedger();
    const provider = new MockResultEmailProvider();
    const input = { quizRow: sampleRow, recipientSource: guestSource };

    const first = await sendResultEmail(input, undefined, {}, {
      ledger,
      provider,
      sendingEnabled: () => false,
      trackAnalytics: false,
    });
    const second = await sendResultEmail(input, undefined, {}, {
      ledger,
      provider,
      sendingEnabled: () => true,
      trackAnalytics: false,
    });

    expect(first.status).toBe("skipped_disabled");
    expect(second.status).toBe("previewed");
    expect(provider.calls).toHaveLength(1);
  });

  it("claims atomically so concurrent sends invoke the provider once", async () => {
    const ledger = new InMemoryEmailDeliveryLedger();
    const provider = new MockResultEmailProvider();
    const input = { quizRow: sampleRow, recipientSource: guestSource };
    const deps = {
      ledger,
      provider,
      sendingEnabled: () => true,
      trackAnalytics: false,
    };

    const [a, b] = await Promise.all([
      sendResultEmail(input, undefined, {}, deps),
      sendResultEmail(input, undefined, {}, deps),
    ]);

    expect(provider.calls).toHaveLength(1);
    expect([a.status, b.status].sort()).toEqual(["previewed", "skipped_duplicate"]);
  });

  it("returns previewed for mock sends and never real sent", async () => {
    const provider = new MockResultEmailProvider();
    const result = await sendResultEmail(
      { quizRow: sampleRow, recipientSource: guestSource },
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

  it("requires an explicit message for real providers", async () => {
    const realProvider = {
      name: "resend",
      send: vi.fn(async () => ({ ok: true, providerMessageId: "msg_1" })),
    };
    const result = await sendResultEmail(
      { quizRow: sampleRow, recipientSource: guestSource },
      undefined,
      {},
      {
        ledger: new InMemoryEmailDeliveryLedger(),
        provider: realProvider,
        sendingEnabled: () => true,
        trackAnalytics: false,
      },
    );

    expect(result.status).toBe("failed");
    expect(result.safeErrorCode).toBe("message_not_configured");
    expect(realProvider.send).not.toHaveBeenCalled();
  });

  it("sends through a real provider when message is supplied", async () => {
    const realProvider = {
      name: "resend",
      send: vi.fn(async () => ({ ok: true, providerMessageId: "msg_1" })),
    };
    const result = await sendResultEmail(
      { quizRow: sampleRow, recipientSource: guestSource },
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
      { quizRow: sampleRow, recipientSource: guestSource },
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

    const throwingProvider = {
      name: "resend",
      send: vi.fn(async () => {
        throw new Error("smtp exploded user@example.com");
      }),
    };
    const throwResult = await sendResultEmail(
      { quizRow: sampleRow, recipientSource: guestSource },
      messageFixture,
      {},
      {
        ledger: new InMemoryEmailDeliveryLedger(),
        provider: throwingProvider,
        sendingEnabled: () => true,
        trackAnalytics: false,
      },
    );
    expect(throwResult.status).toBe("failed");
    expect(throwResult.safeErrorCode).toBe("provider_exception");
  });

  it("blocks marketing sends on the transactional path", () => {
    expect(() => assertMarketingEmailAllowed("marketing")).toThrow(
      "result_email_marketing_not_allowed",
    );
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
