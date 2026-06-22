import { beforeEach, describe, expect, it, vi } from "vitest";

import { RATE_LIMIT_POLICIES } from "@/lib/rate-limit/policies";
import { enforceRateLimit } from "@/lib/rate-limit/server";
import type { RateLimitStore, RateLimitStoreResult } from "@/lib/rate-limit/store";

const env = {
  NODE_ENV: "production",
  VERCEL_ENV: "preview",
  RATE_LIMIT_HMAC_SECRET: "test-hmac-secret",
} as NodeJS.ProcessEnv;

class CountingStore implements RateLimitStore {
  readonly keys: string[] = [];

  async increment(input: {
    key: string;
    windowSeconds: number;
  }): Promise<RateLimitStoreResult> {
    this.keys.push(input.key);
    return { count: 1, ttlMs: input.windowSeconds * 1000 };
  }
}

function request(headers: Record<string, string> = {}) {
  return new Request("https://focusroute.test/api/result-email/request", {
    method: "POST",
    headers,
  });
}

describe("result email request rate limits", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses separate pre-auth and authenticated policies", () => {
    expect(RATE_LIMIT_POLICIES.resultEmailRequestPreAuth.buckets.map((b) => b.identifier)).toEqual([
      "network",
      "resultRequest",
    ]);
    expect(RATE_LIMIT_POLICIES.resultEmailRequestAuthenticated.buckets.map((b) => b.identifier)).toEqual([
      "userAccount",
    ]);
  });

  it("consumes pre-auth buckets exactly once without missing-result keys", async () => {
    const store = new CountingStore();
    const decision = await enforceRateLimit(
      "resultEmailRequestPreAuth",
      {
        request: request({ "x-forwarded-for": "203.0.113.10" }),
        resultId: "11111111-1111-4111-8111-111111111111",
      },
      { store, env },
    );

    expect(decision).toEqual({ ok: true });
    expect(store.keys).toHaveLength(2);
    expect(store.keys.join(" ")).not.toContain("missing-result");
    expect(store.keys.join(" ")).not.toContain("missing-user");
  });

  it("consumes only the user bucket for authenticated requests", async () => {
    const store = new CountingStore();
    const decision = await enforceRateLimit(
      "resultEmailRequestAuthenticated",
      {
        request: request({ "x-forwarded-for": "203.0.113.10" }),
        userId: "user-1",
      },
      { store, env },
    );

    expect(decision).toEqual({ ok: true });
    expect(store.keys).toHaveLength(1);
    expect(store.keys[0]).toContain("resultEmailRequestAuthenticated");
    expect(store.keys.join(" ")).not.toContain("missing-user");
  });

  it("does not execute user buckets without a user id", async () => {
    const store = new CountingStore();
    const decision = await enforceRateLimit(
      "resultEmailRequestAuthenticated",
      {
        request: request({ "x-forwarded-for": "203.0.113.10" }),
        userId: null,
      },
      { store, env },
    );

    expect(decision).toEqual({ ok: true });
    expect(store.keys).toHaveLength(0);
  });

  it("does not execute result buckets without a result id", async () => {
    const store = new CountingStore();
    await enforceRateLimit(
      "resultEmailRequestPreAuth",
      {
        request: request({ "x-forwarded-for": "203.0.113.10" }),
        resultId: null,
      },
      { store, env },
    );

    expect(store.keys).toHaveLength(1);
    expect(store.keys.join(" ")).not.toContain("result_request");
  });

  it("uses the same authenticated rate-limit key for the same user across different IPs", async () => {
    const storeIpA = new CountingStore();
    const storeIpB = new CountingStore();

    await enforceRateLimit(
      "resultEmailRequestAuthenticated",
      {
        request: request({ "x-forwarded-for": "203.0.113.10" }),
        userId: "user-1",
      },
      { store: storeIpA, env },
    );
    await enforceRateLimit(
      "resultEmailRequestAuthenticated",
      {
        request: request({ "x-forwarded-for": "198.51.100.20" }),
        userId: "user-1",
      },
      { store: storeIpB, env },
    );

    expect(storeIpA.keys[0]).toEqual(storeIpB.keys[0]);
    expect(storeIpA.keys[0]).not.toContain("203.0.113.10");
    expect(storeIpA.keys[0]).not.toContain("198.51.100.20");
  });

  it("uses different authenticated rate-limit keys for different users on the same IP", async () => {
    const storeA = new CountingStore();
    const storeB = new CountingStore();

    await enforceRateLimit(
      "resultEmailRequestAuthenticated",
      {
        request: request({ "x-forwarded-for": "203.0.113.10" }),
        userId: "user-a",
      },
      { store: storeA, env },
    );
    await enforceRateLimit(
      "resultEmailRequestAuthenticated",
      {
        request: request({ "x-forwarded-for": "203.0.113.10" }),
        userId: "user-b",
      },
      { store: storeB, env },
    );

    expect(storeA.keys[0]).not.toEqual(storeB.keys[0]);
  });

  it("keeps authenticated user buckets distinct", async () => {
    const storeA = new CountingStore();
    const storeB = new CountingStore();

    await enforceRateLimit(
      "resultEmailRequestAuthenticated",
      {
        request: request({ "x-forwarded-for": "203.0.113.10" }),
        userId: "user-a",
      },
      { store: storeA, env },
    );
    await enforceRateLimit(
      "resultEmailRequestAuthenticated",
      {
        request: request({ "x-forwarded-for": "203.0.113.10" }),
        userId: "user-b",
      },
      { store: storeB, env },
    );

    expect(storeA.keys[0]).not.toEqual(storeB.keys[0]);
  });
});
