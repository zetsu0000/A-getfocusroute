import { beforeEach, describe, expect, it, vi } from "vitest";

const webhookMocks = vi.hoisted(() => ({
  adminFrom: vi.fn(),
  grantProductByEmail: vi.fn(),
  recordAnalyticsEvent: vi.fn(),
  sendMetaEvent: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: webhookMocks.adminFrom }),
}));

vi.mock("@/lib/access/entitlements", () => ({
  grantProductByEmail: webhookMocks.grantProductByEmail,
}));

vi.mock("@/lib/analytics/server", () => ({
  recordAnalyticsEvent: webhookMocks.recordAnalyticsEvent,
}));

vi.mock("@/lib/meta/conversions", () => ({
  sendMetaEvent: webhookMocks.sendMetaEvent,
}));

vi.mock("@/lib/stripe/client", () => ({
  getStripeClient: () => ({
    subscriptions: { retrieve: vi.fn() },
    customers: { retrieve: vi.fn() },
  }),
}));

import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import { processStripeWebhookEvent } from "@/lib/stripe/processWebhook";
import {
  buildStripeFunnelMetadata,
  parseFunnelMetadata,
  parseProductKeyFromMetadata,
} from "../metadata";

const P = {
  brainProfile: "price_brain_profile",
  monthly: "price_membership_monthly",
};

function installAdminMock() {
  const inserts: Array<{ table: string; payload: unknown }> = [];

  webhookMocks.adminFrom.mockImplementation((table: string) => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      limit: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
      insert: vi.fn(async (payload: unknown) => {
        inserts.push({ table, payload });
        return { error: null };
      }),
    };
    return query;
  });

  return inserts;
}

function paymentIntent(metadata: Record<string, string>) {
  return {
    id: "pi_1234567890abcdef",
    customer: "cus_123",
    amount: 1900,
    amount_received: 1900,
    currency: "usd",
    metadata,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_PRICE_BRAIN_PROFILE = P.brainProfile;
  process.env.STRIPE_PRICE_MEMBERSHIP_MONTHLY = P.monthly;
});

describe("Stripe funnel metadata helpers", () => {
  it("builds normalized metadata for Stripe objects", () => {
    expect(
      buildStripeFunnelMetadata({
        product_key: "brain_profile",
        email: " Buyer@Example.COM ",
        funnel_step: "paywall",
        quiz_result_id: " qr_123 ",
        user_name: " Ada ",
      }),
    ).toEqual({
      product_key: "brain_profile",
      email: "buyer@example.com",
      funnel_step: "paywall",
      quiz_result_id: "qr_123",
      user_name: "Ada",
    });
  });

  it("parses valid product metadata and rejects invalid product keys", () => {
    expect(parseProductKeyFromMetadata({ product_key: "brain_profile" })).toBe(
      "brain_profile",
    );
    expect(parseProductKeyFromMetadata({ product_key: "not_real" })).toBeNull();
    expect(parseProductKeyFromMetadata({})).toBeNull();
  });

  it("does not confuse subscription verification markers with product_key", () => {
    expect(
      parseProductKeyFromMetadata({
        funnel_verify: "membership_monthly",
        email: "buyer@example.com",
      }),
    ).toBeNull();
  });

  it("keeps subscription metadata parseable on the subscription object itself", () => {
    expect(
      parseFunnelMetadata({
        product_key: "membership_monthly",
        email: "buyer@example.com",
        funnel_step: "subscription",
      }),
    ).toMatchObject({
      product_key: "membership_monthly",
      email: "buyer@example.com",
      funnel_step: "subscription",
    });
  });
});

describe("processWebhook payment_intent.succeeded behavior", () => {
  it("continues to process one-time purchases from product_key metadata", async () => {
    const inserts = installAdminMock();

    await processStripeWebhookEvent({
      id: "evt_one_time",
      type: "payment_intent.succeeded",
      data: {
        object: paymentIntent({
          product_key: "brain_profile",
          email: "buyer@example.com",
          funnel_step: "paywall",
          priceId: P.brainProfile,
        }),
      },
    } as never);

    expect(webhookMocks.grantProductByEmail).toHaveBeenCalledWith(
      "buyer@example.com",
      "brain_profile",
      expect.objectContaining({
        stripe_payment_intent_id: "pi_1234567890abcdef",
        stripe_event_id: "evt_one_time",
      }),
    );
    expect(inserts).toEqual([
      expect.objectContaining({
        table: "purchases",
        payload: expect.objectContaining({
          stripe_payment_intent_id: "pi_1234567890abcdef",
          product_key: "brain_profile",
          status: "succeeded",
        }),
      }),
    ]);
    expect(webhookMocks.recordAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: FIRST_PARTY_EVENTS.purchaseSucceeded,
      }),
    );
  });

  it("does not process subscription invoice PaymentIntents as one-time purchases", async () => {
    const inserts = installAdminMock();

    await processStripeWebhookEvent({
      id: "evt_subscription_pi",
      type: "payment_intent.succeeded",
      data: {
        object: paymentIntent({
          email: "buyer@example.com",
          funnel_step: "subscription",
          funnel_verify: "membership_monthly",
        }),
      },
    } as never);

    expect(webhookMocks.grantProductByEmail).not.toHaveBeenCalled();
    expect(inserts).toEqual([]);
    expect(webhookMocks.recordAnalyticsEvent).not.toHaveBeenCalled();
  });
});
