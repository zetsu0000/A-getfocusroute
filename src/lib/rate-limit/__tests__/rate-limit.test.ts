import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clientAddressSignal,
  normalizeEmailForRateLimit,
} from "@/lib/rate-limit/identifiers";
import { RATE_LIMIT_POLICIES } from "@/lib/rate-limit/policies";
import { enforceRateLimit } from "@/lib/rate-limit/server";
import type { RateLimitStore, RateLimitStoreResult } from "@/lib/rate-limit/store";

const env = {
  NODE_ENV: "production",
  VERCEL_ENV: "preview",
  RATE_LIMIT_HMAC_SECRET: "test-hmac-secret",
} as NodeJS.ProcessEnv;

class CountingStore implements RateLimitStore {
  readonly counts = new Map<string, number>();
  readonly keys: string[] = [];
  shouldThrow = false;

  async increment(input: {
    key: string;
    windowSeconds: number;
  }): Promise<RateLimitStoreResult> {
    if (this.shouldThrow) throw new Error("redis unavailable");
    this.keys.push(input.key);
    const next = (this.counts.get(input.key) ?? 0) + 1;
    this.counts.set(input.key, next);
    return { count: next, ttlMs: input.windowSeconds * 1000 };
  }
}

function request(headers: Record<string, string> = {}) {
  return new Request("https://focusroute.test/api", { headers });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("distributed rate limiter", () => {
  it("allows a request below threshold", async () => {
    const store = new CountingStore();
    const decision = await enforceRateLimit(
      "createPaymentIntent",
      {
        request: request({ "x-forwarded-for": "203.0.113.10" }),
        email: "buyer@example.com",
        productKey: "brain_profile",
      },
      { store, env },
    );

    expect(decision).toEqual({ ok: true });
  });

  it("allows a request at the intended boundary", async () => {
    const store = new CountingStore();
    let decision = await enforceRateLimit(
      "createPaymentIntent",
      {
        request: request({ "x-forwarded-for": "203.0.113.10" }),
        email: "buyer@example.com",
        productKey: "brain_profile",
      },
      { store, env },
    );
    for (let i = 1; i < RATE_LIMIT_POLICIES.createPaymentIntent.buckets[1].limit; i++) {
      decision = await enforceRateLimit(
        "createPaymentIntent",
        {
          request: request({ "x-forwarded-for": `203.0.113.${10 + i}` }),
          email: "buyer@example.com",
          productKey: "brain_profile",
        },
        { store, env },
      );
    }

    expect(decision).toEqual({ ok: true });
  });

  it("rejects a request above threshold and returns Retry-After data", async () => {
    const store = new CountingStore();
    let decision = await enforceRateLimit(
      "createSubscription",
      {
        request: request({ "x-forwarded-for": "203.0.113.20" }),
        email: "buyer@example.com",
        productKey: "membership_monthly",
      },
      { store, env },
    );
    for (let i = 0; i < RATE_LIMIT_POLICIES.createSubscription.buckets[0].limit; i++) {
      decision = await enforceRateLimit(
        "createSubscription",
        {
          request: request({ "x-forwarded-for": "203.0.113.20" }),
          email: `buyer-${i}@example.com`,
          productKey: "membership_monthly",
        },
        { store, env },
      );
    }

    expect(decision.ok).toBe(false);
    expect(decision).toMatchObject({
      kind: "limited",
      retryAfterSeconds: 600,
      policyName: "createSubscription",
      bucketName: "network_burst",
    });
  });

  it("uses route-specific policies", async () => {
    expect(RATE_LIMIT_POLICIES.createPaymentIntent.buckets[0].limit).toBe(8);
    expect(RATE_LIMIT_POLICIES.createSubscription.buckets[0].limit).toBe(5);
    expect(RATE_LIMIT_POLICIES.analytics.buckets[0].limit).toBe(300);
  });

  it("separates identifiers by route and product", async () => {
    const store = new CountingStore();
    await enforceRateLimit(
      "createPaymentIntent",
      {
        request: request({ "x-forwarded-for": "203.0.113.30" }),
        email: "buyer@example.com",
        productKey: "brain_profile",
      },
      { store, env },
    );
    await enforceRateLimit(
      "createPaymentIntent",
      {
        request: request({ "x-forwarded-for": "203.0.113.31" }),
        email: "buyer@example.com",
        productKey: "roadmap_28_day",
      },
      { store, env },
    );

    const uniqueKeys = new Set(store.keys);
    expect(uniqueKeys.size).toBe(store.keys.length);
  });

  it("normalizes email before hashing", async () => {
    expect(normalizeEmailForRateLimit(" Buyer@Example.COM ")).toBe(
      "buyer@example.com",
    );

    const store = new CountingStore();
    await enforceRateLimit(
      "createPaymentIntent",
      {
        request: request({ "x-forwarded-for": "203.0.113.40" }),
        email: " Buyer@Example.COM ",
        productKey: "brain_profile",
      },
      { store, env },
    );
    await enforceRateLimit(
      "createPaymentIntent",
      {
        request: request({ "x-forwarded-for": "203.0.113.41" }),
        email: "buyer@example.com",
        productKey: "brain_profile",
      },
      { store, env },
    );

    const emailProductKeys = store.keys.filter((key) =>
      key.includes(":email_product:"),
    );
    expect(new Set(emailProductKeys).size).toBe(1);
  });

  it("never exposes raw email in keys", async () => {
    const store = new CountingStore();
    await enforceRateLimit(
      "createPaymentIntent",
      {
        request: request({ "x-forwarded-for": "203.0.113.50" }),
        email: "buyer@example.com",
        productKey: "brain_profile",
      },
      { store, env },
    );

    expect(store.keys.join("|")).not.toContain("buyer@example.com");
  });

  it("never exposes raw IP in logged metadata", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const store = new CountingStore();
    for (let i = 0; i <= RATE_LIMIT_POLICIES.createSubscription.buckets[0].limit; i++) {
      await enforceRateLimit(
        "createSubscription",
        {
          request: request({ "x-forwarded-for": "198.51.100.7" }),
          email: `buyer-${i}@example.com`,
          productKey: "membership_monthly",
        },
        { store, env },
      );
    }

    expect(JSON.stringify(warn.mock.calls)).not.toContain("198.51.100.7");
  });

  it("handles missing client-address evidence safely", async () => {
    const store = new CountingStore();
    expect(clientAddressSignal(request())).toBe("missing-client-address");

    const decision = await enforceRateLimit(
      "quizResult",
      { request: request(), email: "buyer@example.com" },
      { store, env },
    );

    expect(decision).toEqual({ ok: true });
    expect(store.keys.join("|")).not.toContain("missing-client-address");
  });

  it("handles backend errors according to route policy", async () => {
    const store = new CountingStore();
    store.shouldThrow = true;
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      enforceRateLimit(
        "createPaymentIntent",
        {
          request: request({ "x-forwarded-for": "203.0.113.60" }),
          email: "buyer@example.com",
          productKey: "brain_profile",
        },
        { store, env },
      ),
    ).resolves.toMatchObject({
      ok: false,
      kind: "backend_error",
      failureMode: "deny",
    });

    await expect(
      enforceRateLimit(
        "analytics",
        {
          request: request({ "x-forwarded-for": "203.0.113.60" }),
          sessionId: "sess_123",
          eventName: "question_viewed",
        },
        { store, env },
      ),
    ).resolves.toMatchObject({
      ok: false,
      kind: "backend_error",
      failureMode: "drop",
    });
    expect(JSON.stringify(error.mock.calls)).not.toContain("203.0.113.60");
  });

  it("does not depend on process-local counters for production correctness", async () => {
    const statelessStore: RateLimitStore = {
      increment: vi.fn().mockResolvedValue({ count: 1, ttlMs: 60000 }),
    };

    await enforceRateLimit(
      "createPaymentIntent",
      {
        request: request({ "x-forwarded-for": "203.0.113.70" }),
        email: "buyer@example.com",
        productKey: "brain_profile",
      },
      { store: statelessStore, env },
    );
    await enforceRateLimit(
      "createPaymentIntent",
      {
        request: request({ "x-forwarded-for": "203.0.113.70" }),
        email: "buyer@example.com",
        productKey: "brain_profile",
      },
      { store: statelessStore, env },
    );

    expect(statelessStore.increment).toHaveBeenCalledTimes(4);
  });

  it("keeps legitimate verification polling within policy", async () => {
    const store = new CountingStore();
    for (let i = 0; i < 5; i++) {
      await expect(
        enforceRateLimit(
          "verifyPayment",
          {
            request: request({ "x-forwarded-for": "203.0.113.80" }),
            paymentIntentId: "pi_1234567890abcdef",
            subscriptionId: null,
          },
          { store, env },
        ),
      ).resolves.toEqual({ ok: true });
    }
  });

  it("keeps different PaymentIntent hashes in separate object buckets", async () => {
    const store = new CountingStore();
    await enforceRateLimit(
      "verifyPayment",
      {
        request: request({ "x-forwarded-for": "203.0.113.90" }),
        paymentIntentId: "pi_aaaaaaaaaaaaaaaa",
      },
      { store, env },
    );
    await enforceRateLimit(
      "verifyPayment",
      {
        request: request({ "x-forwarded-for": "203.0.113.91" }),
        paymentIntentId: "pi_bbbbbbbbbbbbbbbb",
      },
      { store, env },
    );

    const objectKeys = store.keys.filter((key) => key.includes(":payment_object:"));
    expect(new Set(objectKeys).size).toBe(2);
  });

  it("allows normal assessment analytics volume", async () => {
    const store = new CountingStore();
    const normalEvents = [
      ...Array.from({ length: 15 }, () => "question_viewed"),
      ...Array.from({ length: 15 }, () => "question_answered"),
      ...Array.from({ length: 4 }, () => "info_card_viewed"),
      ...Array.from({ length: 3 }, () => "quiz_milestone_reached"),
      "quiz_completed",
      "result_loading_viewed",
      "result_loading_completed",
      "result_preview_viewed",
      "email_field_focused",
      "email_submitted",
      "full_result_viewed",
      "paywall_viewed",
      "checkout_section_reached",
      "checkout_cta_clicked",
    ];

    for (const eventName of normalEvents) {
      await expect(
        enforceRateLimit(
          "analytics",
          {
            request: request({ "x-forwarded-for": "203.0.113.100" }),
            sessionId: "sess_normal",
            eventName,
          },
          { store, env },
        ),
      ).resolves.toEqual({ ok: true });
    }
  });
});
