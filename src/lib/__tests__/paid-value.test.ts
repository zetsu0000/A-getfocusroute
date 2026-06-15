import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  PAYWALL_DELIVERABLES,
  resultLockedRows,
  signatureOutcomeFor,
} from "@/lib/paid-value";
import { paywallDeliverables } from "@/components/paywall/paywallContent";
import { deriveBrainProfile } from "@/lib/dashboard/brain-profile";
import { PRODUCT_TO_ENTITLEMENTS } from "@/lib/access/products";

/*
 * PR4 (follow-up) — translate the paid value into customer outcomes. The funnel
 * components are client-only with no DOM test environment, so these prove the
 * value copy directly and pair it with source-level guards on the components
 * that render it.
 */
const SIGNATURES = ["Sprinter", "Archivist", "Spark", "Reactor", "Drifter"] as const;

// The exact approved copy — the contract the sales surfaces must render.
const APPROVED_ROW_1 = "A 6-point map of where your focus holds — and where it breaks";
const APPROVED_ROW_2 =
  "The conditions that help you start, stay on track, and recover when focus slips";
const APPROVED_ROW_3: Record<(typeof SIGNATURES)[number], string> = {
  Sprinter: "How to build momentum that doesn’t depend on urgency",
  Archivist: "How to find the next clear move when too much is competing for attention",
  Spark: "How to keep moving after the initial excitement fades",
  Reactor: "How to regain traction when stress knocks the day off course",
  Drifter: "How to create enough structure to start and stay with what matters",
};
const APPROVED_DELIVERABLES = [
  "A 6-point map of your strongest focus patterns and biggest friction points",
  "Your personalized conditions for starting, staying on track, and recovering when focus slips",
  "A clear explanation of your pattern you can use yourself or share with someone else",
];

// Internal dashboard section names that must NOT appear in sales-facing copy.
const INTERNAL_LABELS = [
  "Executive Function Radar",
  "Cognitive Signature",
  "Best Focus Conditions",
  "Task Initiation Style",
  "Recovery Style",
  "Explain-It-To-Someone Script",
];

const chartSrc = readFileSync(
  fileURLToPath(new URL("../../components/chart/ChartScreen.tsx", import.meta.url)),
  "utf8",
);
const paywallSrc = readFileSync(
  fileURLToPath(new URL("../../components/paywall/PaywallScreen.tsx", import.meta.url)),
  "utf8",
);

describe("result locked preview — three outcome rows", () => {
  it("returns exactly three rows for every signature (and an unknown one)", () => {
    for (const sig of SIGNATURES) {
      expect(resultLockedRows(sig)).toHaveLength(3);
    }
    expect(resultLockedRows("")).toHaveLength(3);
  });

  it("renders the two approved shared rows verbatim", () => {
    const rows = resultLockedRows("Sprinter");
    expect(rows[0]).toBe(APPROVED_ROW_1);
    expect(rows[1]).toBe(APPROVED_ROW_2);
  });

  it("renders the exact approved third row for all five signatures, each unique", () => {
    for (const sig of SIGNATURES) {
      expect(resultLockedRows(sig)[2]).toBe(APPROVED_ROW_3[sig]);
      expect(signatureOutcomeFor(sig)).toBe(APPROVED_ROW_3[sig]);
    }
    const thirds = SIGNATURES.map((sig) => resultLockedRows(sig)[2]);
    expect(new Set(thirds).size).toBe(SIGNATURES.length);
  });

  it("never says 'first step' and never uses an internal section label", () => {
    for (const sig of [...SIGNATURES, ""]) {
      for (const row of resultLockedRows(sig)) {
        expect(row.toLowerCase()).not.toContain("first step");
        for (const label of INTERNAL_LABELS) {
          expect(row).not.toContain(label);
        }
      }
    }
  });
});

describe("paywall deliverables — three outcomes", () => {
  it("renders exactly the three approved deliverables", () => {
    expect(PAYWALL_DELIVERABLES).toHaveLength(3);
    expect([...PAYWALL_DELIVERABLES]).toEqual(APPROVED_DELIVERABLES);
    // The component's accessor returns the same approved copy.
    expect(paywallDeliverables()).toEqual(APPROVED_DELIVERABLES);
  });

  it("uses no internal section label as sales copy", () => {
    for (const item of PAYWALL_DELIVERABLES) {
      for (const label of INTERNAL_LABELS) {
        expect(item).not.toContain(label);
      }
    }
  });
});

describe("every sales claim is grounded in a shipped section (not just unique)", () => {
  it("the '6-point map' maps to the six-dimension Executive Function Radar", () => {
    const profile = deriveBrainProfile([], "Sprinter", null);
    expect(profile.radarDimensions).toHaveLength(6);
  });

  it("the shareable explanation ships with the Brain Profile entitlement bundle", () => {
    expect(PRODUCT_TO_ENTITLEMENTS.brain_profile).toContain("bonus_explain_script");
  });
});

describe("ChartScreen renders the centralized rows without new structure", () => {
  it("builds the locked rows from resultLockedRows in a single panel", () => {
    expect(chartSrc).toContain("resultLockedRows(signature.signature)");
    expect((chartSrc.match(/lockedRows\.map/g) || []).length).toBe(1);
    expect((chartSrc.match(/full focus plan/g) || []).length).toBe(1);
    // The pre-PR4 inline construction and the first-step helper are gone.
    expect(chartSrc).not.toContain("signature.unlockTeaser");
    expect(chartSrc).not.toContain("firstStepTeaserFor");
  });
});

describe("named / unnamed result bridge", () => {
  it("keeps the explicit named/unnamed conditional with the approved benefit copy", () => {
    expect(chartSrc).toContain("{personalName ? (");
    expect(chartSrc).toContain("{personalName},</em>");
    // Named branch (lowercase lead-in after the italic name).
    expect(chartSrc).toContain(
      "your full profile shows where momentum breaks, what helps it return, and the conditions that make focus easier to hold.",
    );
    // Unnamed branch (capitalized).
    expect(chartSrc).toContain(
      "Your full profile shows where momentum breaks, what helps it return, and the conditions that make focus easier to hold.",
    );
    // The old abstract plan-focus sentence is gone.
    expect(chartSrc).not.toContain("your full plan focuses on");
  });
});

describe("pricing, CTAs, checkout and social proof remain unchanged", () => {
  it("keeps the single price, both CTAs, deferred PaymentIntent and social-proof order", () => {
    // One price presentation, anchored once.
    expect((paywallSrc.match(/price\.paywallAnchor/g) || []).length).toBe(1);
    // Top CTA and final CTA copy intact.
    expect(paywallSrc).toContain("Continue to Secure Checkout");
    expect(paywallSrc).toContain("{payCtaLabel(BRAIN_OS.price.paywall)}");
    // Deferred PaymentIntent: created only on explicit checkout intent, once.
    expect((paywallSrc.match(/fetch\("\/api\/create-payment-intent"/g) || []).length).toBe(1);
    expect(paywallSrc).toContain("const requestCheckoutIntent = async () =>");
    // Social proof sits before the checkout panel.
    const proof = paywallSrc.indexOf("<PaywallSocialProofDisclosure");
    const checkout = paywallSrc.indexOf("id={PAYWALL_CHECKOUT_ID}");
    expect(proof).toBeGreaterThan(-1);
    expect(checkout).toBeGreaterThan(proof);
    // Deliverables rendered exactly once via the shared accessor.
    expect((paywallSrc.match(/paywallDeliverables\(/g) || []).length).toBe(1);
  });
});
