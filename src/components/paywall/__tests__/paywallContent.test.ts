import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  NON_DIAGNOSIS_LINE,
  PAYWALL_CHECKOUT_ID,
  PAYWALL_TRUST_CHECKOUT_ID,
  POST_PAYMENT_EXPECTATION,
  SECURE_PAYMENT_LINE,
  TRUST_LINE,
  payCtaLabel,
  paywallDeliverables,
} from "../paywallContent";

const src = readFileSync(
  fileURLToPath(new URL("../paywallContent.ts", import.meta.url)),
  "utf8",
);

describe("paywall primary offer content", () => {
  it("exposes exactly the three approved customer-outcome deliverables", () => {
    const d = paywallDeliverables();
    expect(d).toEqual([
      "A 6-point map of your strongest focus patterns and biggest friction points",
      "Your personalized conditions for starting, staying on track, and recovering when focus slips",
      "A clear explanation of your pattern you can use yourself or share with someone else",
    ]);
  });

  it("keeps sales copy free of internal section labels and 'first step'", () => {
    const joined = paywallDeliverables().join(" ");
    for (const label of [
      "Executive Function Radar",
      "Cognitive Signature",
      "Best Focus Conditions",
      "Task Initiation Style",
      "Recovery Style",
      "Explain-It-To-Someone Script",
    ]) {
      expect(joined).not.toContain(label);
    }
    expect(joined.toLowerCase()).not.toContain("first step");
    // The earlier abstract wording is also gone.
    expect(joined.toLowerCase()).not.toContain("full pattern breakdown");
    expect(joined.toLowerCase()).not.toContain("first next step");
  });

  it("states trust as a single quiet line, not three separate chips", () => {
    expect(TRUST_LINE).toBe("One-time payment \u00B7 Instant access \u00B7 7-day refund");
    // exactly two middot separators → one line, three claims
    expect((TRUST_LINE.match(/\u00B7/g) || []).length).toBe(2);
    // the three verified claims survive the compression
    expect(TRUST_LINE).toContain("One-time payment");
    expect(TRUST_LINE).toContain("Instant access");
    expect(TRUST_LINE).toContain("7-day refund");
  });

  it("builds the final CTA as one string with an em dash around the price", () => {
    expect(payCtaLabel("$27")).toBe("Pay $27 \u2014 Unlock My Profile");
    // em dash, not the old ampersand fragment that collapsed to "$27&"
    expect(payCtaLabel("$27")).toContain("\u2014");
    expect(payCtaLabel("$27")).not.toContain("&");
    // single space on each side of the price token (spacing can't break)
    expect(payCtaLabel("$27")).toContain("Pay $27 \u2014");
    // names the purchased product as the "profile", consistent with the result CTA
    expect(payCtaLabel("$27")).toContain("Unlock My Profile");
    expect(payCtaLabel("$27")).not.toContain("Unlock My Plan");
    // stays driven by the centralized price value
    expect(payCtaLabel("$49")).toBe("Pay $49 \u2014 Unlock My Profile");
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
