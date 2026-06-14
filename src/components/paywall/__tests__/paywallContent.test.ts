import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  NON_DIAGNOSIS_LINE,
  PAYWALL_CHECKOUT_ID,
  PAYWALL_TRUST_CHECKOUT_ID,
  POST_PAYMENT_EXPECTATION,
  SECURE_PAYMENT_LINE,
  TRUST_LINE_ITEMS,
  paywallDeliverables,
} from "../paywallContent";

const src = readFileSync(
  fileURLToPath(new URL("../paywallContent.ts", import.meta.url)),
  "utf8",
);

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

  it("keeps a separate trust-to-checkout scroll target", () => {
    expect(PAYWALL_TRUST_CHECKOUT_ID).toBe("paywall-trust-checkout");
  });

  it("does not export a paywall FAQ", () => {
    expect(src).not.toContain("PAYWALL_FAQ");
    expect(src).not.toContain("What exactly do I get?");
    expect(src).not.toContain("What happens after payment?");
    expect(src).not.toContain("What if it doesn't fit me?");
  });
});
