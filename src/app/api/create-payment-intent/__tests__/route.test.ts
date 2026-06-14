import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * Regression guard for the PR #33 Preview HTTP 400.
 *
 * Root cause (verified against `vercel env ls`): NEXT_PUBLIC_PRICE_ASSESSMENT
 * (and its server-side fallback STRIPE_PRICE_BRAIN_PROFILE) were scoped to
 * Production only. In Preview the var is undefined, so the client posts a body
 * with no `priceId` (JSON.stringify drops `undefined`) and the route correctly
 * answers `400 { error: "priceId required" }` — before any PaymentIntent.
 *
 * These tests lock the request contract that the Preview env must satisfy:
 *   - a missing or unresolvable priceId is a 400 and never reaches Stripe;
 *   - a fully-formed request (the state once Preview is configured) reaches
 *     Stripe and returns a clientSecret so the Payment Element can mount.
 *
 * Validation, payment verification, and rate limits are intentionally NOT
 * weakened here — the success path still flows through enforceRateLimit and
 * stripe.paymentIntents.create.
 */

const rateLimitMocks = vi.hoisted(() => ({
  enforceRateLimit: vi.fn(),
}));

const stripeMocks = vi.hoisted(() => ({
  pricesRetrieve: vi.fn(),
  paymentIntentsCreate: vi.fn(),
}));

const analyticsMocks = vi.hoisted(() => ({
  recordAnalyticsEvent: vi.fn(),
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
    paymentIntents: { create: stripeMocks.paymentIntentsCreate },
  }),
}));

vi.mock("@/lib/analytics/server", () => ({
  recordAnalyticsEvent: analyticsMocks.recordAnalyticsEvent,
}));

import { POST as createPaymentIntent } from "@/app/api/create-payment-intent/route";

const PRICE_ID = "price_brain_profile_test";

function jsonRequest(body: Record<string, unknown>) {
  return new Request("https://focusroute.test/api/create-payment-intent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.42",
    },
    body: JSON.stringify(body),
  });
}

const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of [
    "STRIPE_PRICE_BRAIN_PROFILE",
    "NEXT_PUBLIC_PRICE_ASSESSMENT",
  ]) {
    savedEnv[key] = process.env[key];
  }
  // Mirrors a correctly-scoped Preview/Production environment.
  process.env.STRIPE_PRICE_BRAIN_PROFILE = PRICE_ID;
  process.env.NEXT_PUBLIC_PRICE_ASSESSMENT = PRICE_ID;

  rateLimitMocks.enforceRateLimit.mockResolvedValue({ ok: true });
  stripeMocks.pricesRetrieve.mockResolvedValue({
    unit_amount: 2700,
    currency: "usd",
  });
  stripeMocks.paymentIntentsCreate.mockResolvedValue({
    id: "pi_test_123",
    client_secret: "pi_test_123_secret_abc",
  });
  analyticsMocks.recordAnalyticsEvent.mockResolvedValue(undefined);
});

afterEach(() => {
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("create-payment-intent request contract (Preview 400 regression)", () => {
  it("returns 400 'priceId required' and never calls Stripe when priceId is missing", async () => {
    // Exactly the Preview symptom: NEXT_PUBLIC_PRICE_ASSESSMENT absent → the
    // client omits priceId from the JSON body.
    const response = await createPaymentIntent(
      jsonRequest({
        email: "buyer@example.com",
        funnel_step: "paywall",
        quiz_result_id: "",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "priceId required" });
    expect(rateLimitMocks.enforceRateLimit).not.toHaveBeenCalled();
    expect(stripeMocks.pricesRetrieve).not.toHaveBeenCalled();
    expect(stripeMocks.paymentIntentsCreate).not.toHaveBeenCalled();
  });

  it("returns 400 for a priceId the environment cannot resolve, before Stripe", async () => {
    const response = await createPaymentIntent(
      jsonRequest({
        priceId: "price_not_configured_in_this_env",
        email: "buyer@example.com",
        funnel_step: "paywall",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid priceId for this funnel_step",
    });
    expect(stripeMocks.paymentIntentsCreate).not.toHaveBeenCalled();
  });

  it("returns 400 'email required' for a missing or malformed email", async () => {
    const response = await createPaymentIntent(
      jsonRequest({ priceId: PRICE_ID, funnel_step: "paywall", email: "nope" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "email required" });
    expect(stripeMocks.paymentIntentsCreate).not.toHaveBeenCalled();
  });

  it("returns 400 'funnel_step required' when funnel_step is absent", async () => {
    const response = await createPaymentIntent(
      jsonRequest({ priceId: PRICE_ID, email: "buyer@example.com" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "funnel_step required",
    });
    expect(stripeMocks.paymentIntentsCreate).not.toHaveBeenCalled();
  });

  it("mounts checkout for a fully-formed request once the env is configured", async () => {
    // This is the state after the Preview env scope is corrected: a resolvable
    // priceId + email + funnel_step yields a clientSecret to mount Stripe.
    const response = await createPaymentIntent(
      jsonRequest({
        priceId: PRICE_ID,
        email: "buyer@example.com",
        funnel_step: "paywall",
        quiz_result_id: "qr_123",
        user_name: "Sam",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      clientSecret: "pi_test_123_secret_abc",
    });
    // rate limit + payment creation stay in the success path (not weakened)
    expect(rateLimitMocks.enforceRateLimit).toHaveBeenCalledTimes(1);
    expect(stripeMocks.paymentIntentsCreate).toHaveBeenCalledTimes(1);
  });
});
