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
  gateFunnelEntry,
  isGuardedEntryStep,
  isPaymentIntentId,
  isPostPurchaseStep,
  isSubscriptionId,
  oneTimeProductCanAdvanceToStep,
  planFunnelEntry,
  pollVerifyPayment,
  stripFunnelEntryParams,
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

describe("gateFunnelEntry", () => {
  it("denies direct paywall access from a fresh quiz store (a query param is not proof)", () => {
    // A query parameter must never advance the funnel by itself.
    expect(gateFunnelEntry("paywall", "quiz", false)).toBe("deny");
    expect(gateFunnelEntry("paywall", "loading", false)).toBe("deny");
  });

  it("denies direct paywall access from email or chart so earned progress is kept", () => {
    // "deny" means the client never setStep(paywall) — the store stays at the
    // legitimate email/chart position rather than being overwritten.
    expect(gateFunnelEntry("paywall", "email", false)).toBe("deny");
    expect(gateFunnelEntry("paywall", "name", false)).toBe("deny");
    expect(gateFunnelEntry("paywall", "chart", false)).toBe("deny");
  });

  it("never treats a payment_intent param as proof for the pre-purchase paywall", () => {
    // paywall is never a Stripe redirect target, so even a PI param cannot
    // unlock it — only earned store state can.
    expect(gateFunnelEntry("paywall", "quiz", true)).toBe("deny");
    expect(gateFunnelEntry("paywall", "chart", true)).toBe("deny");
  });

  it("allows paywall once the store has genuinely reached paywall", () => {
    expect(gateFunnelEntry("paywall", "paywall", false)).toBe("allow");
  });

  it("restores paywall safely from any later earned store position", () => {
    expect(gateFunnelEntry("paywall", "upsell", false)).toBe("allow");
    expect(gateFunnelEntry("paywall", "subscription", false)).toBe("allow");
    expect(gateFunnelEntry("paywall", "success", false)).toBe("allow");
  });

  it("denies direct success access with no purchase evidence", () => {
    expect(gateFunnelEntry("success", "quiz", false)).toBe("deny");
    expect(gateFunnelEntry("success", "paywall", false)).toBe("deny");
  });

  it("denies direct upsell/subscription entry without prerequisite evidence", () => {
    expect(gateFunnelEntry("upsell", "quiz", false)).toBe("deny");
    expect(gateFunnelEntry("upsell", "paywall", false)).toBe("deny");
    expect(gateFunnelEntry("subscription", "chart", false)).toBe("deny");
    expect(gateFunnelEntry("subscription", "upsell", false)).toBe("deny");
  });

  it("requires server verification for post-purchase Stripe redirect returns", () => {
    expect(gateFunnelEntry("upsell", "paywall", true)).toBe("verify");
    expect(gateFunnelEntry("subscription", "upsell", true)).toBe("verify");
    expect(gateFunnelEntry("success", "subscription", true)).toBe("verify");
  });

  it("allows entries the persisted store already earned", () => {
    expect(gateFunnelEntry("upsell", "upsell", false)).toBe("allow");
    expect(gateFunnelEntry("subscription", "subscription", false)).toBe("allow");
    expect(gateFunnelEntry("success", "success", false)).toBe("allow");
  });

  it("classifies guarded steps and never blocks unguarded steps", () => {
    expect(isGuardedEntryStep("paywall")).toBe(true);
    expect(isGuardedEntryStep("upsell")).toBe(true);
    expect(isGuardedEntryStep("success")).toBe(true);
    expect(isGuardedEntryStep("chart")).toBe(false);
    expect(isGuardedEntryStep("quiz")).toBe(false);
    expect(isPostPurchaseStep("paywall")).toBe(false);
    expect(isPostPurchaseStep("success")).toBe(true);
    // Unguarded steps are never blocked even if requested directly.
    expect(gateFunnelEntry("chart", "quiz", false)).toBe("allow");
  });
});

describe("planFunnelEntry (assessment client entry behavior)", () => {
  it("ignores a fresh ?step=paywall: the paywall never renders and no verify runs", () => {
    // "ignore" means the client never setStep(paywall) — PaywallScreen never
    // mounts (so paywall_viewed never fires) and the payment verifier is never
    // called.
    expect(planFunnelEntry("?step=paywall", "quiz")).toEqual({ kind: "ignore" });
  });

  it("ignores ?step=paywall from email/chart, preserving the earned position", () => {
    expect(planFunnelEntry("?step=paywall", "email")).toEqual({ kind: "ignore" });
    expect(planFunnelEntry("?step=paywall", "chart")).toEqual({ kind: "ignore" });
  });

  it("enters paywall when the store already earned it (in-app refresh / re-entry)", () => {
    expect(planFunnelEntry("?step=paywall", "paywall")).toEqual({
      kind: "enter",
      step: "paywall",
    });
    expect(planFunnelEntry("?step=paywall", "success")).toEqual({
      kind: "enter",
      step: "paywall",
    });
  });

  it("renders the persisted position when no guarded step is requested", () => {
    // A plain refresh of a persisted paywall has no ?step= param: the gate is a
    // no-op and the store renders the paywall directly.
    expect(planFunnelEntry("", "paywall")).toEqual({ kind: "ready" });
    expect(planFunnelEntry("?utm_source=fb", "quiz")).toEqual({ kind: "ready" });
    expect(planFunnelEntry("?step=chart", "quiz")).toEqual({ kind: "ready" });
  });

  it("verifies a valid post-purchase Stripe redirect return before advancing", () => {
    expect(
      planFunnelEntry(
        "?step=upsell&payment_intent=pi_1234567890abcdef&redirect_status=succeeded",
        "quiz",
      ),
    ).toEqual({
      kind: "verify",
      step: "upsell",
      paymentIntentId: "pi_1234567890abcdef",
      subscriptionId: null,
    });

    expect(
      planFunnelEntry(
        "?step=success&payment_intent=pi_1234567890abcdef&subscription_id=sub_1234567890abcdef",
        "quiz",
      ),
    ).toEqual({
      kind: "verify",
      step: "success",
      paymentIntentId: "pi_1234567890abcdef",
      subscriptionId: "sub_1234567890abcdef",
    });
  });

  it("ignores a post-purchase ?step= with no or malformed payment evidence", () => {
    expect(planFunnelEntry("?step=success", "quiz")).toEqual({ kind: "ignore" });
    expect(
      planFunnelEntry("?step=upsell&payment_intent=not_a_pi", "quiz"),
    ).toEqual({ kind: "ignore" });
  });
});

describe("stripFunnelEntryParams (URL cleanup)", () => {
  it("removes the step parameter on a denied entry", () => {
    expect(stripFunnelEntryParams("?step=paywall")).toBe("");
  });

  it("preserves UTMs and unrelated attribution while removing funnel params", () => {
    expect(
      stripFunnelEntryParams("?step=paywall&utm_source=fb&utm_campaign=launch"),
    ).toBe("?utm_source=fb&utm_campaign=launch");
  });

  it("strips every Stripe return parameter and keeps the rest in order", () => {
    expect(
      stripFunnelEntryParams(
        "?step=success&payment_intent=pi_1234567890abcdef&payment_intent_client_secret=pi_1234_secret_x&redirect_status=succeeded&subscription_id=sub_1234567890abcdef&utm_medium=cpc&gclid=abc",
      ),
    ).toBe("?utm_medium=cpc&gclid=abc");
  });

  it("returns an empty query string when only funnel params were present", () => {
    expect(stripFunnelEntryParams("?payment_intent=pi_1234567890abcdef")).toBe("");
    expect(stripFunnelEntryParams("")).toBe("");
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
