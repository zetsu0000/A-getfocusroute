import { beforeEach, describe, expect, it, vi } from "vitest";

const stripeMocks = vi.hoisted(() => ({
  paymentIntentsRetrieve: vi.fn(),
  subscriptionsRetrieve: vi.fn(),
}));

vi.mock("@/lib/stripe/client", () => ({
  getStripeClient: () => ({
    paymentIntents: { retrieve: stripeMocks.paymentIntentsRetrieve },
    subscriptions: { retrieve: stripeMocks.subscriptionsRetrieve },
  }),
}));

import { POST as verifyPayment } from "@/app/api/verify-payment/route";
import {
  createSharedPaymentVerifier,
  expectedFunnelStepForOneTimeProduct,
  gatePostPurchaseEntry,
  isPaymentIntentId,
  isPostPurchaseStep,
  isSubscriptionId,
  oneTimeProductCanAdvanceToStep,
  pollVerifyPayment,
  subscriptionVerificationEvidenceReady,
  verdictForPaymentIntentStatus,
} from "../payment-verification";

const P = {
  brainProfile: "price_brain_profile",
  roadmap: "price_roadmap_28_day",
  monthly: "price_membership_monthly",
  annual: "price_membership_annual",
};

function setStripePriceEnv() {
  process.env.STRIPE_PRICE_BRAIN_PROFILE = P.brainProfile;
  process.env.STRIPE_PRICE_ROADMAP_28_DAY = P.roadmap;
  process.env.STRIPE_PRICE_MEMBERSHIP_MONTHLY = P.monthly;
  process.env.STRIPE_PRICE_MEMBERSHIP_ANNUAL = P.annual;
}

async function postVerify(body: Record<string, unknown>) {
  const response = await verifyPayment(
    new Request("https://focusroute.test/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return {
    status: response.status,
    cache: response.headers.get("Cache-Control"),
    body: (await response.json()) as { verified: boolean; status: string },
  };
}

function oneTimeIntent(input: {
  id?: string;
  status?: string;
  productKey?: string;
  priceId?: string;
  funnelStep?: string;
  email?: string;
} = {}) {
  return {
    id: input.id ?? "pi_1234567890abcdef",
    status: input.status ?? "succeeded",
    metadata: {
      product_key: input.productKey ?? "brain_profile",
      email: input.email ?? "buyer@example.com",
      funnel_step: input.funnelStep ?? "paywall",
      priceId: input.priceId ?? P.brainProfile,
    },
  };
}

function subscription(input: {
  piStatus?: string;
  piId?: string;
  productKey?: string;
  priceId?: string;
  funnelStep?: string;
  email?: string;
} = {}) {
  return {
    id: "sub_1234567890abcdef",
    metadata: {
      product_key: input.productKey ?? "membership_monthly",
      email: input.email ?? "buyer@example.com",
      funnel_step: input.funnelStep ?? "subscription",
    },
    latest_invoice: {
      payment_intent: {
        id: input.piId ?? "pi_1234567890abcdef",
        status: input.piStatus ?? "succeeded",
        metadata: {},
      },
    },
    items: {
      data: [{ price: { id: input.priceId ?? P.monthly } }],
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  setStripePriceEnv();
});

describe("gatePostPurchaseEntry", () => {
  it("denies direct success access with no purchase evidence", () => {
    expect(gatePostPurchaseEntry("success", "quiz", false)).toBe("deny");
    expect(gatePostPurchaseEntry("success", "paywall", false)).toBe("deny");
  });

  it("denies direct upsell/subscription entry without prerequisite evidence", () => {
    expect(gatePostPurchaseEntry("upsell", "quiz", false)).toBe("deny");
    expect(gatePostPurchaseEntry("upsell", "paywall", false)).toBe("deny");
    expect(gatePostPurchaseEntry("subscription", "chart", false)).toBe("deny");
    expect(gatePostPurchaseEntry("subscription", "upsell", false)).toBe("deny");
  });

  it("requires server verification for Stripe redirect returns", () => {
    expect(gatePostPurchaseEntry("upsell", "paywall", true)).toBe("verify");
    expect(gatePostPurchaseEntry("subscription", "upsell", true)).toBe("verify");
    expect(gatePostPurchaseEntry("success", "subscription", true)).toBe("verify");
  });

  it("allows entries the persisted store already earned", () => {
    expect(gatePostPurchaseEntry("upsell", "upsell", false)).toBe("allow");
    expect(gatePostPurchaseEntry("subscription", "subscription", false)).toBe("allow");
    expect(gatePostPurchaseEntry("success", "success", false)).toBe("allow");
  });

  it("leaves pre-purchase steps accessible", () => {
    expect(gatePostPurchaseEntry("paywall", "quiz", false)).toBe("allow");
    expect(isPostPurchaseStep("paywall")).toBe(false);
    expect(isPostPurchaseStep("success")).toBe(true);
  });
});

describe("identifier and product rules", () => {
  it("accepts only plausible Stripe object ids", () => {
    expect(isPaymentIntentId("pi_3OqXYZAbCdEfGh12")).toBe(true);
    expect(isSubscriptionId("sub_3OqXYZAbCdEfGh12")).toBe(true);
    expect(isPaymentIntentId("pi_short")).toBe(false);
    expect(isPaymentIntentId("cs_test_123456789")).toBe(false);
    expect(isPaymentIntentId("pi_1234; DROP TABLE")).toBe(false);
    expect(isSubscriptionId("pi_3OqXYZAbCdEfGh12")).toBe(false);
  });

  it("maps one-time products to their exact redirect target", () => {
    expect(expectedFunnelStepForOneTimeProduct("brain_profile")).toBe("paywall");
    expect(expectedFunnelStepForOneTimeProduct("roadmap_28_day")).toBe("upsell");
    expect(expectedFunnelStepForOneTimeProduct("membership_monthly")).toBeNull();
    expect(oneTimeProductCanAdvanceToStep("brain_profile", "upsell")).toBe(true);
    expect(oneTimeProductCanAdvanceToStep("brain_profile", "success")).toBe(false);
    expect(oneTimeProductCanAdvanceToStep("roadmap_28_day", "subscription")).toBe(true);
  });

  it("treats missing subscription verification evidence as deterministic failure", () => {
    expect(
      subscriptionVerificationEvidenceReady({
        subscriptionId: "sub_1234567890abcdef",
        paymentIntentId: "pi_1234567890abcdef",
        clientSecret: "pi_1234567890abcdef_secret_123",
      }),
    ).toBe(true);
    expect(
      subscriptionVerificationEvidenceReady({
        subscriptionId: "sub_1234567890abcdef",
        paymentIntentId: null,
        clientSecret: "pi_1234567890abcdef_secret_123",
      }),
    ).toBe(false);
    expect(
      subscriptionVerificationEvidenceReady({
        subscriptionId: "sub_1234567890abcdef",
        paymentIntentId: "pi_1234567890abcdef",
        clientSecret: null,
      }),
    ).toBe(false);
  });
});

describe("verdictForPaymentIntentStatus", () => {
  it("only money-confirmed states succeed", () => {
    expect(verdictForPaymentIntentStatus("succeeded")).toBe("succeeded");
    expect(verdictForPaymentIntentStatus("processing")).toBe("processing");
  });

  it("every incomplete or canceled state fails closed", () => {
    for (const status of [
      "requires_payment_method",
      "requires_confirmation",
      "requires_action",
      "requires_capture",
      "canceled",
      "unknown_future_status",
      "",
    ]) {
      expect(verdictForPaymentIntentStatus(status)).toBe("failed");
    }
  });
});

describe("/api/verify-payment", () => {
  it("accepts a valid successful one-time PaymentIntent for the expected step", async () => {
    stripeMocks.paymentIntentsRetrieve.mockResolvedValueOnce(oneTimeIntent());

    const result = await postVerify({
      payment_intent: "pi_1234567890abcdef",
      target_step: "upsell",
    });

    expect(result).toEqual({
      status: 200,
      cache: "no-store",
      body: { verified: true, status: "succeeded" },
    });
  });

  it("denies one-time PaymentIntents with wrong or missing funnel metadata", async () => {
    stripeMocks.paymentIntentsRetrieve.mockResolvedValueOnce(
      oneTimeIntent({ funnelStep: "upsell" }),
    );
    await expect(
      postVerify({ payment_intent: "pi_1234567890abcdef", target_step: "upsell" }),
    ).resolves.toMatchObject({ body: { verified: false, status: "failed" } });

    stripeMocks.paymentIntentsRetrieve.mockResolvedValueOnce(
      oneTimeIntent({ priceId: P.monthly }),
    );
    await expect(
      postVerify({ payment_intent: "pi_1234567890abcdef", target_step: "upsell" }),
    ).resolves.toMatchObject({ body: { verified: false, status: "failed" } });
  });

  it("does not let a valid one-time PaymentIntent jump to success", async () => {
    stripeMocks.paymentIntentsRetrieve.mockResolvedValueOnce(oneTimeIntent());

    const result = await postVerify({
      payment_intent: "pi_1234567890abcdef",
      target_step: "success",
    });

    expect(result.body).toEqual({ verified: false, status: "failed" });
  });

  it("accepts a valid subscription payment through subscription evidence", async () => {
    stripeMocks.subscriptionsRetrieve.mockResolvedValueOnce(subscription());

    const result = await postVerify({
      payment_intent: "pi_1234567890abcdef",
      subscription_id: "sub_1234567890abcdef",
      target_step: "success",
    });

    expect(stripeMocks.paymentIntentsRetrieve).not.toHaveBeenCalled();
    expect(result.body).toEqual({ verified: true, status: "succeeded" });
  });

  it("denies subscription evidence when the invoice PaymentIntent does not match", async () => {
    stripeMocks.subscriptionsRetrieve.mockResolvedValueOnce(
      subscription({ piId: "pi_different123456" }),
    );

    const result = await postVerify({
      payment_intent: "pi_1234567890abcdef",
      subscription_id: "sub_1234567890abcdef",
      target_step: "success",
    });

    expect(result.body).toEqual({ verified: false, status: "failed" });
  });

  it("keeps processing payments pending without showing success", async () => {
    stripeMocks.paymentIntentsRetrieve.mockResolvedValueOnce(
      oneTimeIntent({ status: "processing" }),
    );

    const result = await postVerify({
      payment_intent: "pi_1234567890abcdef",
      target_step: "upsell",
    });

    expect(result.body).toEqual({ verified: false, status: "processing" });
  });

  it("denies failed, canceled, and SCA/incomplete PaymentIntents", async () => {
    for (const status of [
      "requires_payment_method",
      "canceled",
      "requires_action",
      "requires_confirmation",
    ]) {
      stripeMocks.paymentIntentsRetrieve.mockResolvedValueOnce(oneTimeIntent({ status }));
      await expect(
        postVerify({ payment_intent: "pi_1234567890abcdef", target_step: "upsell" }),
      ).resolves.toMatchObject({ body: { verified: false, status: "failed" } });
    }
  });

  it("rejects invalid PaymentIntent ids without calling Stripe", async () => {
    const result = await postVerify({
      payment_intent: "not_a_pi",
      target_step: "upsell",
    });

    expect(result.status).toBe(400);
    expect(result.body).toEqual({ verified: false, status: "failed" });
    expect(stripeMocks.paymentIntentsRetrieve).not.toHaveBeenCalled();
    expect(stripeMocks.subscriptionsRetrieve).not.toHaveBeenCalled();
  });

  it("returns a generic failure on Stripe retrieval errors", async () => {
    stripeMocks.paymentIntentsRetrieve.mockRejectedValueOnce(
      new Error("No such payment_intent: pi_1234567890abcdef"),
    );

    const result = await postVerify({
      payment_intent: "pi_1234567890abcdef",
      target_step: "upsell",
    });

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ verified: false, status: "failed" });
  });
});

describe("client polling helpers", () => {
  it("bounds verification polling and remains pending after repeated processing", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ verified: false, status: "processing" }),
    });
    const sleep = vi.fn().mockResolvedValue(undefined);

    const verdict = await pollVerifyPayment(
      { paymentIntentId: "pi_1234567890abcdef", targetStep: "upsell" },
      { fetchFn: fetchFn as unknown as typeof fetch, sleep, maxAttempts: 3, delayMs: 1 },
    );

    expect(verdict).toBe("processing");
    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("dedupes identical in-flight verification requests for Strict Mode replays", async () => {
    const verify = vi.fn().mockResolvedValue("succeeded");
    const shared = createSharedPaymentVerifier(verify);
    const request = {
      paymentIntentId: "pi_1234567890abcdef",
      targetStep: "upsell" as const,
    };

    const first = shared(request);
    const second = shared(request);

    expect(first).toBe(second);
    await expect(first).resolves.toBe("succeeded");
    expect(verify).toHaveBeenCalledTimes(1);
  });
});
