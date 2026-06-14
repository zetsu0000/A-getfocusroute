import { describe, expect, it } from "vitest";

import {
  canStartCheckoutRequest,
  checkoutLoadErrorForStatus,
  formatRetryAfter,
  hasCheckoutClientSecret,
  retryAfterSecondsFromHeader,
} from "../paywallCheckout";

describe("paywall checkout request helpers", () => {
  it("allows checkout creation only when no request is active, no secret exists, and retry is open", () => {
    expect(canStartCheckoutRequest({
      clientSecret: null,
      loading: false,
      retryBlockedUntil: null,
      nowMs: 1_000,
    })).toBe(true);

    expect(canStartCheckoutRequest({
      clientSecret: "pi_secret",
      loading: false,
      retryBlockedUntil: null,
      nowMs: 1_000,
    })).toBe(false);

    expect(canStartCheckoutRequest({
      clientSecret: null,
      loading: true,
      retryBlockedUntil: null,
      nowMs: 1_000,
    })).toBe(false);

    expect(canStartCheckoutRequest({
      clientSecret: null,
      loading: false,
      retryBlockedUntil: 2_000,
      nowMs: 1_000,
    })).toBe(false);
  });

  it("parses Retry-After seconds and formats a friendly wait", () => {
    expect(retryAfterSecondsFromHeader("125", 0)).toBe(125);
    expect(formatRetryAfter(125)).toBe("3 minutes");
    expect(formatRetryAfter(30)).toBe("1 minute");
  });

  it("parses Retry-After dates", () => {
    expect(retryAfterSecondsFromHeader(
      "Sun, 14 Jun 2026 12:02:00 GMT",
      Date.parse("Sun, 14 Jun 2026 12:00:00 GMT"),
    )).toBe(120);
  });

  it("maps 429 into a safe rate-limit message without refresh guidance", () => {
    const error = checkoutLoadErrorForStatus(429, "125", 0);

    expect(error.kind).toBe("rate_limited");
    expect(error.retryAfterSeconds).toBe(125);
    expect(error.message).toBe("Too many checkout attempts. Please try again in 3 minutes.");
    expect(error.message.toLowerCase()).not.toContain("refresh");
    expect(error.message.toLowerCase()).not.toContain("upstash");
    expect(error.message.toLowerCase()).not.toContain("redis");
  });

  it("maps unavailable, bad request, and unexpected responses to safe copy", () => {
    expect(checkoutLoadErrorForStatus(503, null).message)
      .toBe("Secure checkout is temporarily unavailable. Please try again shortly.");
    expect(checkoutLoadErrorForStatus(400, null).message)
      .toBe("We couldn't start secure checkout for this session. Please check your details and try again.");
    expect(checkoutLoadErrorForStatus(500, null).message)
      .toBe("We couldn't load secure checkout. Please try again shortly.");
    expect(checkoutLoadErrorForStatus(200, null).message)
      .toBe("We couldn't load secure checkout. Please try again shortly.");
  });

  it("accepts only non-empty client secrets from successful responses", () => {
    expect(hasCheckoutClientSecret({ clientSecret: "pi_123_secret_abc" })).toBe(true);
    expect(hasCheckoutClientSecret({ clientSecret: "" })).toBe(false);
    expect(hasCheckoutClientSecret({})).toBe(false);
    expect(hasCheckoutClientSecret(null)).toBe(false);
  });
});
