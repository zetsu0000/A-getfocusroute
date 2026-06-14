import { describe, expect, it } from "vitest";

import {
  NON_DIAGNOSIS_LINE,
  PAYWALL_CHECKOUT_ID,
  PAYWALL_FAQ,
  POST_PAYMENT_EXPECTATION,
  SECURE_PAYMENT_LINE,
  TRUST_LINE_ITEMS,
  paywallDeliverables,
} from "../paywallContent";

describe("paywall primary offer content", () => {
  it("exposes exactly three concrete deliverables (learn / first step / availability)", () => {
    const d = paywallDeliverables("building consistency");
    expect(d).toHaveLength(3);
    expect(d[0].toLowerCase()).toContain("pattern breakdown");
    expect(d[0]).toContain("building consistency"); // plan focus woven in, not invented
    expect(d[1].toLowerCase()).toContain("first next step");
    expect(d[2].toLowerCase()).toContain("account");
  });

  it("keeps the trust line to the three verified claims", () => {
    expect(TRUST_LINE_ITEMS).toEqual([
      "One-time payment",
      "Instant account access",
      "7-day refund",
    ]);
  });

  it("states the non-diagnosis boundary without medical claims", () => {
    expect(NON_DIAGNOSIS_LINE.toLowerCase()).toContain("not a medical diagnosis");
    for (const banned of ["cure", "treat", "adhd", "clinical"]) {
      expect(NON_DIAGNOSIS_LINE.toLowerCase()).not.toContain(banned);
    }
  });

  it("uses one concise Stripe secure-payment signal (no unverified tech claims)", () => {
    expect(SECURE_PAYMENT_LINE).toBe("Secure payment processed by Stripe");
    expect(SECURE_PAYMENT_LINE.toLowerCase()).not.toContain("256");
    expect(SECURE_PAYMENT_LINE.toLowerCase()).not.toContain("encrypt");
  });

  it("keeps the post-payment expectation truthful (no emailed copy / lifetime claims)", () => {
    const t = POST_PAYMENT_EXPECTATION.toLowerCase();
    expect(t).toContain("unlocks");
    expect(t).toContain("account");
    expect(t).toContain("email");
    for (const overclaim of [
      "lifetime",
      "forever",
      "we'll email",
      "emailed to you",
      "send you a copy",
    ]) {
      expect(t).not.toContain(overclaim);
    }
  });

  it("keeps the checkout anchor id unchanged", () => {
    expect(PAYWALL_CHECKOUT_ID).toBe("paywall-checkout");
  });
});

describe("paywall FAQ", () => {
  it("is exactly the three intended objections", () => {
    expect(PAYWALL_FAQ.map((f) => f.q)).toEqual([
      "What exactly do I get?",
      "What happens after payment?",
      "What if it doesn't fit me?",
    ]);
  });

  it("drops the previously redundant questions", () => {
    const qs = PAYWALL_FAQ.map((f) => f.q.toLowerCase()).join(" | ");
    for (const removed of [
      "another quiz",
      "is this a diagnosis",
      "too much work",
      "how long until",
    ]) {
      expect(qs).not.toContain(removed);
    }
  });

  it("makes no promise about how fast results appear", () => {
    const answers = PAYWALL_FAQ.map((f) => f.a.toLowerCase()).join(" ");
    for (const timing of ["days until", "weeks", "results in", "see results", "in just"]) {
      expect(answers).not.toContain(timing);
    }
  });

  it("gives every item a question and an answer", () => {
    for (const f of PAYWALL_FAQ) {
      expect(f.q.length).toBeGreaterThan(0);
      expect(f.a.length).toBeGreaterThan(0);
    }
  });
});
