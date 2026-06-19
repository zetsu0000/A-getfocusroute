import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import { META_ALLOWED_FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import { InMemoryEmailDeliveryLedger } from "@/lib/email/delivery-ledger";
import {
  getResultEmailSiteOrigin,
  isResultEmailSendingEnabled,
} from "@/lib/email/config";
import { buildResultEmailIdempotencyKey } from "@/lib/email/result-email-idempotency";
import { buildResultEmailUrls } from "@/lib/email/result-email-urls";
import {
  assertResultEmailPayloadSafe,
  buildResultEmailPayload,
} from "@/lib/email/result-email-payload";
import { buildResultEmailAnalyticsMetadata } from "@/lib/email/result-email-analytics";
import { MockResultEmailProvider } from "@/lib/email/providers/mock-provider";
import {
  assertMarketingEmailAllowed,
  resolveTrustedRecipientEmail,
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
});

const sampleRow = {
  id: "result-123",
  email: "user@example.com",
  name: "Sam",
  answers: sampleAnswers,
  signature_key: "Spark",
  signature_name: "Novelty-driven focus bursts",
};

describe("result email config", () => {
  it("defaults sending to disabled", () => {
    delete process.env.RESULT_EMAIL_SENDING_ENABLED;
    expect(isResultEmailSendingEnabled()).toBe(false);
  });
});

describe("buildResultEmailPayload", () => {
  it("builds a canonical transactional payload from a persisted quiz row", () => {
    const payload = buildResultEmailPayload({
      quizRow: sampleRow,
      recipientEmail: "user@example.com",
    });

    expect(payload).toMatchObject({
      resultId: "result-123",
      recipientEmail: "user@example.com",
      recipientName: "Sam",
      patternKey: "Spark",
      patternName: "Novelty-driven focus bursts",
      emailType: "transactional",
      locale: "en-US",
    });
    expect(payload.focusFrictionScore).toMatchObject({
      value: expect.any(Number),
      minimum: 0,
      maximum: 100,
    });
    expect(payload.idempotencyKey).toBe(
      buildResultEmailIdempotencyKey("result-123", "1"),
    );
  });

  it("uses null focusFrictionScore when canonical score is unavailable", () => {
    const payload = buildResultEmailPayload({
      quizRow: {
        ...sampleRow,
        answers: [{ questionId: "age", selectedOptions: ["25-34"] }],
      },
      recipientEmail: "user@example.com",
    });
    expect(payload.focusFrictionScore).toBeNull();
  });

  it("prefers stored signature fields over recomputation", () => {
    const payload = buildResultEmailPayload({
      quizRow: {
        ...sampleRow,
        signature_key: "Archivist",
        signature_name: "Stored pattern title",
      },
      recipientEmail: "user@example.com",
    });
    expect(payload.patternKey).toBe("Archivist");
    expect(payload.patternName).toBe("Stored pattern title");
  });

  it("excludes raw answers from the payload", () => {
    const payload = buildResultEmailPayload({
      quizRow: sampleRow,
      recipientEmail: "user@example.com",
    });
    assertResultEmailPayloadSafe(payload);
    expect(JSON.stringify(payload)).not.toContain("selectedOptions");
    expect(JSON.stringify(payload)).not.toContain("often");
  });

  it("rejects invalid or mismatched recipient emails", () => {
    expect(() =>
      buildResultEmailPayload({
        quizRow: sampleRow,
        recipientEmail: "not-an-email",
      }),
    ).toThrow("result_email_invalid_recipient");

    expect(() =>
      buildResultEmailPayload({
        quizRow: sampleRow,
        recipientEmail: "other@example.com",
      }),
    ).toThrow("result_email_recipient_mismatch");
  });
});

describe("result email URLs", () => {
  it("uses authenticated dashboard routes without query-string PII", () => {
    const urls = buildResultEmailUrls("https://getfocusroute.com");
    expect(urls.resultUrl).toBe("https://getfocusroute.com/dashboard/profile");
    expect(urls.dashboardUrl).toBe("https://getfocusroute.com/dashboard");
    expect(urls.resultUrl).not.toContain("?");
    expect(urls.resultUrl).not.toContain("@");
  });

  it("rejects unsafe URL origins", () => {
    expect(() =>
      buildResultEmailUrls("https://getfocusroute.com/dashboard?email=x@y.com"),
    ).toThrow("result_email_unsafe_url");
  });
});

describe("idempotency", () => {
  it("builds deterministic keys from result id and template version", () => {
    expect(buildResultEmailIdempotencyKey("abc", "2")).toBe("result_email:abc:2");
    expect(buildResultEmailIdempotencyKey("abc", "2")).toBe(
      buildResultEmailIdempotencyKey("abc", "2"),
    );
  });
});

describe("trusted recipient resolution", () => {
  it("accepts authenticated and persisted quiz-result sources", () => {
    expect(
      resolveTrustedRecipientEmail(
        { kind: "authenticated_user", userId: "user-1", email: "user@example.com" },
        sampleRow,
      ),
    ).toBe("user@example.com");

    expect(
      resolveTrustedRecipientEmail(
        { kind: "persisted_quiz_result", resultId: "result-123", email: "user@example.com" },
        sampleRow,
      ),
    ).toBe("user@example.com");
  });

  it("rejects unverified or mismatched sources", () => {
    expect(
      resolveTrustedRecipientEmail(
        { kind: "persisted_quiz_result", resultId: "other-id", email: "user@example.com" },
        sampleRow,
      ),
    ).toBeNull();
    expect(normalizeRecipientEmail("bad-address")).toBeNull();
  });
});

describe("sendResultEmail", () => {
  beforeEach(() => {
    delete process.env.RESULT_EMAIL_SENDING_ENABLED;
  });

  it("never invokes a provider when the feature flag is disabled", async () => {
    const provider = new MockResultEmailProvider();
    const ledger = new InMemoryEmailDeliveryLedger();
    const result = await sendResultEmail(
      {
        quizRow: sampleRow,
        trustedRecipient: {
          kind: "persisted_quiz_result",
          resultId: "result-123",
          email: "user@example.com",
        },
      },
      undefined,
      {},
      {
        ledger,
        provider,
        sendingEnabled: () => false,
        trackAnalytics: false,
      },
    );

    expect(result.status).toBe("skipped_disabled");
    expect(provider.calls).toHaveLength(0);
  });

  it("skips duplicate sends for the same idempotency key", async () => {
    const provider = new MockResultEmailProvider();
    const ledger = new InMemoryEmailDeliveryLedger();
    const deps = {
      ledger,
      provider,
      sendingEnabled: () => true,
      trackAnalytics: false,
    };
    const input = {
      quizRow: sampleRow,
      trustedRecipient: {
        kind: "persisted_quiz_result" as const,
        resultId: "result-123",
        email: "user@example.com",
      },
    };

    const first = await sendResultEmail(input, undefined, {}, deps);
    const second = await sendResultEmail(input, undefined, {}, deps);

    expect(first.status).toBe("sent");
    expect(second.status).toBe("skipped_duplicate");
    expect(provider.calls).toHaveLength(1);
  });

  it("uses the mock provider when enabled and configured", async () => {
    const provider = new MockResultEmailProvider();
    const result = await sendResultEmail(
      {
        quizRow: sampleRow,
        trustedRecipient: {
          kind: "persisted_quiz_result",
          resultId: "result-123",
          email: "user@example.com",
        },
      },
      undefined,
      {},
      {
        ledger: new InMemoryEmailDeliveryLedger(),
        provider,
        sendingEnabled: () => true,
        trackAnalytics: false,
      },
    );

    expect(result.status).toBe("sent");
    expect(provider.calls[0]?.payload.patternKey).toBe("Spark");
    expect(provider.calls[0]?.payload.recipientEmail).toBe("user@example.com");
  });

  it("fails safely when sending is enabled without a configured provider", async () => {
    const result = await sendResultEmail(
      {
        quizRow: sampleRow,
        trustedRecipient: {
          kind: "persisted_quiz_result",
          resultId: "result-123",
          email: "user@example.com",
        },
      },
      undefined,
      {},
      {
        ledger: new InMemoryEmailDeliveryLedger(),
        provider: { name: "noop", send: async () => ({ ok: false, safeErrorCode: "provider_disabled" }) },
        sendingEnabled: () => true,
        trackAnalytics: false,
      },
    );

    expect(result.status).toBe("failed");
    expect(result.safeErrorCode).toBe("provider_not_configured");
  });

  it("blocks marketing sends on the transactional path", () => {
    expect(() => assertMarketingEmailAllowed("marketing")).toThrow(
      "result_email_marketing_not_allowed",
    );
  });
});

describe("result email analytics metadata", () => {
  it("contains only safe operational fields", () => {
    const payload = buildResultEmailPayload({
      quizRow: sampleRow,
      recipientEmail: "user@example.com",
    });
    const metadata = buildResultEmailAnalyticsMetadata(payload, {
      safeErrorCode: "provider_timeout",
      provider: "mock",
    });

    expect(metadata).toMatchObject({
      email_type: "transactional",
      pattern_key: "Spark",
      has_score: true,
      safe_error_code: "provider_timeout",
      provider: "mock",
    });
    expect(metadata).not.toHaveProperty("email");
    expect(metadata).not.toHaveProperty("recipientEmail");
    expect(JSON.stringify(metadata)).not.toContain("user@example.com");
  });

  it("registers delivery events as first-party only", () => {
    expect(META_ALLOWED_FIRST_PARTY_EVENTS.has(FIRST_PARTY_EVENTS.resultEmailSent)).toBe(false);
  });
});

describe("algorithm preservation", () => {
  it("does not change scoreFromAnswers or signature outputs", () => {
    const beforeScore = scoreFromAnswers(sampleAnswers);
    const beforeSignature = getSignatureFromAnswers(sampleAnswers);
    buildResultEmailPayload({
      quizRow: sampleRow,
      recipientEmail: "user@example.com",
    });
    expect(scoreFromAnswers(sampleAnswers)).toBe(beforeScore);
    expect(getSignatureFromAnswers(sampleAnswers)).toEqual(beforeSignature);
  });

  it("does not change brain profile radar dimensions", () => {
    const sig = getSignatureFromAnswers(sampleAnswers);
    const before = deriveBrainProfile(sampleAnswers, sig.title, sig.preview);
    buildResultEmailPayload({
      quizRow: sampleRow,
      recipientEmail: "user@example.com",
    });
    const after = deriveBrainProfile(sampleAnswers, sig.title, sig.preview);
    expect(after.radarDimensions).toEqual(before.radarDimensions);
    expect(after.overallScore).toBe(before.overallScore);
  });
});

describe("UI and checkout guards", () => {
  it("does not expose server email service to client bundles via public imports", async () => {
    const serviceSrc = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../result-email-service.ts", import.meta.url), "utf8"),
    );
    expect(serviceSrc).toContain('import "server-only"');
  });

  it("keeps checkout analytics instrumentation untouched", async () => {
    const subscriptionSrc = await import("node:fs/promises").then((fs) =>
      fs.readFile(
        new URL("../../../components/subscription/SubscriptionPlansScreen.tsx", import.meta.url),
        "utf8",
      ),
    );
    expect(subscriptionSrc).toContain("resolvePaymentFailureMetadata");
  });
});

describe("site origin default", () => {
  it("falls back to the production domain", () => {
    delete process.env.RESULT_EMAIL_SITE_ORIGIN;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(getResultEmailSiteOrigin()).toBe("https://getfocusroute.com");
  });
});
