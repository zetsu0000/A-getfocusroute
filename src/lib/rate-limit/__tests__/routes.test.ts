import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const rateLimitMocks = vi.hoisted(() => ({
  enforceRateLimit: vi.fn(),
}));

const stripeMocks = vi.hoisted(() => ({
  pricesRetrieve: vi.fn(),
  paymentIntentsCreate: vi.fn(),
  paymentIntentsRetrieve: vi.fn(),
  customersList: vi.fn(),
  customersCreate: vi.fn(),
  customersUpdate: vi.fn(),
  paymentMethodsAttach: vi.fn(),
  subscriptionsCreate: vi.fn(),
  subscriptionsRetrieve: vi.fn(),
  webhooksConstructEvent: vi.fn(),
}));

const analyticsMocks = vi.hoisted(() => ({
  recordAnalyticsEvent: vi.fn(),
  cleanString: vi.fn((value: unknown, max = 500) =>
    typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null,
  ),
  metadataSizeOk: vi.fn(() => true),
}));

const supabaseMocks = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  adminFrom: vi.fn(),
}));

const webhookMocks = vi.hoisted(() => ({
  beginStripeEventProcessing: vi.fn(),
  processStripeWebhookEvent: vi.fn(),
  abortStripeEventProcessing: vi.fn(),
}));

vi.mock("@/lib/rate-limit/server", () => ({
  enforceRateLimit: rateLimitMocks.enforceRateLimit,
  rateLimitResponse: (decision: { retryAfterSeconds: number }) =>
    Response.json(
      { error: "rate_limited", code: "rate_limited" },
      {
        status: 429,
        headers: {
          "Retry-After": String(decision.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    ),
  temporaryUnavailableResponse: () =>
    Response.json(
      { error: "temporarily_unavailable", code: "temporarily_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    ),
}));

vi.mock("@/lib/stripe/client", () => ({
  getStripeClient: () => ({
    prices: { retrieve: stripeMocks.pricesRetrieve },
    paymentIntents: {
      create: stripeMocks.paymentIntentsCreate,
      retrieve: stripeMocks.paymentIntentsRetrieve,
    },
    customers: {
      list: stripeMocks.customersList,
      create: stripeMocks.customersCreate,
      update: stripeMocks.customersUpdate,
    },
    paymentMethods: { attach: stripeMocks.paymentMethodsAttach },
    subscriptions: {
      create: stripeMocks.subscriptionsCreate,
      retrieve: stripeMocks.subscriptionsRetrieve,
    },
    webhooks: { constructEvent: stripeMocks.webhooksConstructEvent },
  }),
}));

vi.mock("@/lib/analytics/server", () => ({
  recordAnalyticsEvent: analyticsMocks.recordAnalyticsEvent,
  cleanString: analyticsMocks.cleanString,
  metadataSizeOk: analyticsMocks.metadataSizeOk,
}));

vi.mock("@/lib/meta/conversions", () => ({
  sendMetaEvent: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: supabaseMocks.authGetUser },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: supabaseMocks.adminFrom }),
}));

vi.mock("@/lib/stripe/processWebhook", () => ({
  beginStripeEventProcessing: webhookMocks.beginStripeEventProcessing,
  processStripeWebhookEvent: webhookMocks.processStripeWebhookEvent,
  abortStripeEventProcessing: webhookMocks.abortStripeEventProcessing,
}));

import { POST as createPaymentIntent } from "@/app/api/create-payment-intent/route";
import { POST as createSubscription } from "@/app/api/create-subscription/route";
import { POST as verifyPayment } from "@/app/api/verify-payment/route";
import { POST as quizResult } from "@/app/api/quiz-result/route";
import { POST as analytics } from "@/app/api/analytics/route";
import { POST as stripeWebhook } from "@/app/api/stripe/webhook/route";

function jsonRequest(path: string, body: Record<string, unknown>) {
  return new Request(`https://focusroute.test${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.10",
    },
    body: JSON.stringify(body),
  });
}

function blockedDecision(policyName = "createPaymentIntent") {
  return {
    ok: false as const,
    kind: "limited" as const,
    retryAfterSeconds: 60,
    policyName,
    bucketName: "network",
    identifierHash: "abc123",
  };
}

const P = {
  brainProfile: "price_brain_profile",
  roadmap: "price_roadmap_28_day",
  monthly: "price_membership_monthly",
  annual: "price_membership_annual",
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_PRICE_BRAIN_PROFILE = P.brainProfile;
  process.env.STRIPE_PRICE_ROADMAP_28_DAY = P.roadmap;
  process.env.STRIPE_PRICE_MEMBERSHIP_MONTHLY = P.monthly;
  process.env.STRIPE_PRICE_MEMBERSHIP_ANNUAL = P.annual;
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  rateLimitMocks.enforceRateLimit.mockResolvedValue({ ok: true });
  stripeMocks.pricesRetrieve.mockResolvedValue({ unit_amount: 1900, currency: "usd" });
  stripeMocks.paymentIntentsCreate.mockResolvedValue({
    id: "pi_1234567890abcdef",
    client_secret: "pi_1234567890abcdef_secret_123",
  });
  stripeMocks.paymentIntentsRetrieve.mockResolvedValue({
    id: "pi_1234567890abcdef",
    status: "succeeded",
    metadata: {
      product_key: "brain_profile",
      email: "buyer@example.com",
      funnel_step: "paywall",
      priceId: P.brainProfile,
    },
  });
  stripeMocks.customersList.mockResolvedValue({ data: [] });
  stripeMocks.customersCreate.mockResolvedValue({ id: "cus_123" });
  stripeMocks.customersUpdate.mockResolvedValue({ id: "cus_123" });
  stripeMocks.paymentMethodsAttach.mockResolvedValue({ id: "pm_123" });
  stripeMocks.subscriptionsCreate.mockResolvedValue({
    id: "sub_1234567890abcdef",
    status: "incomplete",
    latest_invoice: {
      payment_intent: {
        id: "pi_1234567890abcdef",
        client_secret: "pi_1234567890abcdef_secret_123",
      },
    },
  });
  supabaseMocks.authGetUser.mockResolvedValue({ data: { user: null } });
  supabaseMocks.adminFrom.mockReturnValue({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: { id: "qr_123" }, error: null }),
      })),
    })),
  });
  webhookMocks.beginStripeEventProcessing.mockResolvedValue(true);
  webhookMocks.processStripeWebhookEvent.mockResolvedValue(undefined);
  stripeMocks.webhooksConstructEvent.mockReturnValue({
    id: "evt_123",
    type: "payment_intent.succeeded",
    data: { object: {} },
  });
});

describe("rate-limited route handlers", () => {
  it("allows create-payment-intent requests below threshold", async () => {
    const response = await createPaymentIntent(
      jsonRequest("/api/create-payment-intent", {
        priceId: P.brainProfile,
        email: "buyer@example.com",
        funnel_step: "paywall",
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      clientSecret: "pi_1234567890abcdef_secret_123",
    });
    expect(stripeMocks.paymentIntentsCreate).toHaveBeenCalledTimes(1);
  });

  it("blocks create-payment-intent before Stripe is called", async () => {
    rateLimitMocks.enforceRateLimit.mockResolvedValueOnce(
      blockedDecision("createPaymentIntent"),
    );

    const response = await createPaymentIntent(
      jsonRequest("/api/create-payment-intent", {
        priceId: P.brainProfile,
        email: "buyer@example.com",
        funnel_step: "paywall",
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(await response.json()).toEqual({
      error: "rate_limited",
      code: "rate_limited",
    });
    expect(stripeMocks.pricesRetrieve).not.toHaveBeenCalled();
    expect(stripeMocks.paymentIntentsCreate).not.toHaveBeenCalled();
  });

  it("blocks create-subscription before customer or subscription creation", async () => {
    rateLimitMocks.enforceRateLimit.mockResolvedValueOnce(
      blockedDecision("createSubscription"),
    );

    const response = await createSubscription(
      jsonRequest("/api/create-subscription", {
        priceId: P.monthly,
        email: "buyer@example.com",
        paymentMethodId: "pm_123",
      }),
    );

    expect(response.status).toBe(429);
    expect(stripeMocks.customersList).not.toHaveBeenCalled();
    expect(stripeMocks.subscriptionsCreate).not.toHaveBeenCalled();
  });

  it("rejects malformed verify-payment IDs before Stripe retrieval", async () => {
    const response = await verifyPayment(
      jsonRequest("/api/verify-payment", {
        payment_intent: "not_a_pi",
        target_step: "upsell",
      }),
    );

    expect(response.status).toBe(400);
    expect(stripeMocks.paymentIntentsRetrieve).not.toHaveBeenCalled();
    expect(stripeMocks.subscriptionsRetrieve).not.toHaveBeenCalled();
  });

  it("blocks verify-payment before retrieving Stripe objects", async () => {
    rateLimitMocks.enforceRateLimit.mockResolvedValueOnce(
      blockedDecision("verifyPayment"),
    );

    const response = await verifyPayment(
      jsonRequest("/api/verify-payment", {
        payment_intent: "pi_1234567890abcdef",
        target_step: "upsell",
      }),
    );

    expect(response.status).toBe(429);
    expect(stripeMocks.paymentIntentsRetrieve).not.toHaveBeenCalled();
  });

  it("blocks quiz-result before Supabase writes", async () => {
    rateLimitMocks.enforceRateLimit.mockResolvedValueOnce(
      blockedDecision("quizResult"),
    );

    const response = await quizResult(
      jsonRequest("/api/quiz-result", {
        email: "buyer@example.com",
        answers: [{ questionId: "focus", selectedOptions: ["Often"] }],
      }),
    );

    expect(response.status).toBe(429);
    expect(supabaseMocks.adminFrom).not.toHaveBeenCalled();
  });

  it("returns a generic 429 for blocked analytics without throwing", async () => {
    rateLimitMocks.enforceRateLimit.mockResolvedValueOnce(
      blockedDecision("analytics"),
    );

    const response = await analytics(
      jsonRequest("/api/analytics", {
        event_name: "question_viewed",
        session_id: "sess_123",
        metadata: { question_id: "q1" },
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(await response.json()).toEqual({
      error: "rate_limited",
      code: "rate_limited",
    });
    expect(analyticsMocks.recordAnalyticsEvent).not.toHaveBeenCalled();
  });

  it("leaves Stripe webhook handling outside the generic limiter", async () => {
    const response = await stripeWebhook(
      new Request("https://focusroute.test/api/stripe/webhook", {
        method: "POST",
        headers: {
          "stripe-signature": "sig",
          "content-length": "2",
        },
        body: "{}",
      }),
    );

    expect(response.status).toBe(200);
    expect(rateLimitMocks.enforceRateLimit).not.toHaveBeenCalled();
    expect(webhookMocks.beginStripeEventProcessing).toHaveBeenCalledTimes(1);
    expect(webhookMocks.processStripeWebhookEvent).toHaveBeenCalledTimes(1);
  });
});
