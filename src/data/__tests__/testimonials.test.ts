import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";

import {
  APPROVED_TESTIMONIALS,
  buildImpressionMetadata,
  hasApprovedTestimonials,
  selectSocialProofJourney,
  type ApprovedTestimonial,
} from "../testimonials";

const ALLOWED_KEYS = new Set([
  "id",
  "shortQuote",
  "fullQuote",
  "attribution",
  "image",
  "category",
  "eligiblePlacement",
  "approved",
]);

function ids(journey: ReturnType<typeof selectSocialProofJourney>): string[] {
  return [...journey.result, ...journey.paywall].map((entry) => entry.id);
}
describe("approved testimonial pool", () => {
  it("ships all 12 public approved entries and no drafts", () => {
    expect(APPROVED_TESTIMONIALS).toHaveLength(12);
    expect(hasApprovedTestimonials()).toBe(true);
    for (const entry of APPROVED_TESTIMONIALS) {
      expect(entry.approved).toBe(true);
      expect(entry.shortQuote.trim().length).toBeGreaterThan(0);
      expect(entry.fullQuote.trim().length).toBeGreaterThan(0);
      expect(entry.attribution.trim().length).toBeGreaterThan(0);
    }
  });

  it("gives every paywall story a complete fullQuote that is the real, untruncated text", () => {
    const paywall = APPROVED_TESTIMONIALS.filter((entry) =>
      entry.eligiblePlacement.includes("paywall_post_checkout"),
    );
    expect(paywall.length).toBeGreaterThanOrEqual(3);

    for (const entry of paywall) {
      // fullQuote is at least as long as the short excerpt (never a shorter
      // "expanded" version) and ends cleanly — no clamp ellipsis, no fragment.
      expect(entry.fullQuote.length).toBeGreaterThanOrEqual(entry.shortQuote.length);
      expect(entry.fullQuote).not.toContain("\u2026"); // no ellipsis char
      expect(entry.fullQuote.trimEnd()).toMatch(/[.!?]$/);
    }

    // The richer multi-sentence stories must actually carry their full body,
    // not the compressed registry excerpt that shipped before.
    const byId = (id: string) =>
      APPROVED_TESTIMONIALS.find((entry) => entry.id === id)!;
    expect(byId("proof-009").fullQuote).toContain("nightmare situation");
    expect(byId("proof-009").fullQuote.length).toBeGreaterThan(400);
    expect(byId("proof-006").fullQuote).toContain("ultra persistent");
    expect(byId("proof-006").fullQuote).toContain("spirit of excellence");
    expect(byId("proof-003").fullQuote).toContain("fixed the problem myself");
  });

  it("exposes only public-safe fields", () => {
    for (const entry of APPROVED_TESTIMONIALS) {
      expect(Object.keys(entry).sort()).toEqual([...ALLOWED_KEYS].sort());
      const json = JSON.stringify(entry).toLowerCase();
      for (const banned of [
        "approval",
        "consent",
        "verifiedby",
        "verifier",
        "downloads",
        "social proof",
        "c:\\",
        "/users/",
        "signature",
        "sarah",
        "verified customer",
        "star",
      ]) {
        expect(json).not.toContain(banned);
      }
    }
  });

  it("uses repo-relative public image paths that exist", () => {
    for (const entry of APPROVED_TESTIMONIALS) {
      expect(entry.image.startsWith("/testimonials/")).toBe(true);
      expect(entry.image).not.toMatch(/[a-z]:\\|\/users\/|downloads/i);
      expect(
        existsSync(join(process.cwd(), "public", entry.image.slice(1))),
      ).toBe(true);
    }
  });

  it("keeps weaker approved entries out of the active funnel", () => {
    const mark = APPROVED_TESTIMONIALS.find((entry) => entry.id === "proof-001");
    const gregory = APPROVED_TESTIMONIALS.find((entry) => entry.id === "proof-007");
    const jean = APPROVED_TESTIMONIALS.find((entry) => entry.id === "proof-012");

    expect(mark?.approved).toBe(true);
    expect(mark?.eligiblePlacement).toEqual(["paywall_post_checkout"]);
    expect(gregory?.approved).toBe(true);
    expect(gregory?.eligiblePlacement).toEqual([]);
    expect(jean?.approved).toBe(true);
    expect(jean?.eligiblePlacement).toEqual([]);
  });
});

describe("social proof journey selector", () => {
  it("returns three result proofs and three paywall proofs", () => {
    const journey = selectSocialProofJourney(APPROVED_TESTIMONIALS, "seed-a");
    expect(journey.result).toHaveLength(3);
    expect(journey.paywall).toHaveLength(3);
  });

  it("keeps all six selected testimonials unique", () => {
    const picked = ids(
      selectSocialProofJourney(APPROVED_TESTIMONIALS, "seed-unique"),
    );
    expect(new Set(picked).size).toBe(6);
  });

  it("is deterministic for the same seed", () => {
    expect(ids(selectSocialProofJourney(APPROVED_TESTIMONIALS, "same"))).toEqual(
      ids(selectSocialProofJourney(APPROVED_TESTIMONIALS, "same")),
    );
  });

  it("allows different valid seeds to produce different sets", () => {
    const outputs = new Set(
      ["a", "b", "c", "d", "e", "f"].map((seed) =>
        ids(selectSocialProofJourney(APPROVED_TESTIMONIALS, seed)).join("|"),
      ),
    );
    expect(outputs.size).toBeGreaterThan(1);
  });

  it("respects placement and category preferences for the real pool", () => {
    const journey = selectSocialProofJourney(APPROVED_TESTIMONIALS, "category");

    expect(journey.result.every((entry) =>
      entry.eligiblePlacement.includes("result_transition"),
    )).toBe(true);
    expect(journey.paywall.every((entry) =>
      entry.eligiblePlacement.includes("paywall_post_checkout"),
    )).toBe(true);
    expect(journey.result[0].category).toBe("clarity");
    expect(journey.result[1].category).toBe("usability");
    expect(["practical_value", "product_trust"]).toContain(
      journey.result[2].category,
    );
    expect(["customer_support", "product_trust"]).toContain(
      journey.paywall[0].category,
    );
    expect(["customer_support", "product_trust"]).toContain(
      journey.paywall[1].category,
    );
    expect(["post_purchase_reassurance", "practical_value"]).toContain(
      journey.paywall[2].category,
    );
  });

  it("never shows Mark before the paywall price is introduced", () => {
    for (const seed of ["a", "b", "c", "d", "e", "f", "g"]) {
      const journey = selectSocialProofJourney(APPROVED_TESTIMONIALS, seed);
      expect(journey.result.map((entry) => entry.id)).not.toContain("proof-001");
    }
  });

  it("does not select inactive generic testimonials", () => {
    const picked = new Set<string>();

    for (const seed of ["a", "b", "c", "d", "e", "f", "g"]) {
      for (const id of ids(selectSocialProofJourney(APPROVED_TESTIMONIALS, seed))) {
        picked.add(id);
      }
    }

    expect(picked).not.toContain("proof-007");
    expect(picked).not.toContain("proof-012");
  });

  it("falls back gracefully when preferred categories are scarce", () => {
    const fallbackPool = Array.from({ length: 6 }, (_, index) =>
      makeTestimonial({
        id: `fallback-${index}`,
        category: "practical_value",
        eligiblePlacement: ["result_transition", "paywall_post_checkout"],
      }),
    );
    const journey = selectSocialProofJourney(fallbackPool, "fallback");

    expect(journey.result).toHaveLength(3);
    expect(journey.paywall).toHaveLength(3);
    expect(new Set(ids(journey)).size).toBe(6);
  });

  it("never selects unapproved entries", () => {
    const draft = makeTestimonial({
      id: "draft",
      shortQuote: "not cleared for publication",
      fullQuote: "not cleared for publication",
      approved: false,
      category: "clarity",
    });
    const approved = Array.from({ length: 6 }, (_, index) =>
      makeTestimonial({
        id: `approved-${index}`,
        category: "practical_value",
        eligiblePlacement: ["result_transition", "paywall_post_checkout"],
      }),
    );
    const picked = ids(selectSocialProofJourney([draft, ...approved], "draft"));

    expect(picked).not.toContain("draft");
  });

  it("returns no active proof when the kill switch is on", () => {
    const previous = process.env.NEXT_PUBLIC_SOCIAL_PROOF_OFF;
    process.env.NEXT_PUBLIC_SOCIAL_PROOF_OFF = "1";
    try {
      expect(hasApprovedTestimonials()).toBe(false);
      const journey = selectSocialProofJourney(APPROVED_TESTIMONIALS, "off");
      expect(journey.result).toHaveLength(0);
      expect(journey.paywall).toHaveLength(0);
    } finally {
      if (previous === undefined) {
        delete process.env.NEXT_PUBLIC_SOCIAL_PROOF_OFF;
      } else {
        process.env.NEXT_PUBLIC_SOCIAL_PROOF_OFF = previous;
      }
    }
  });
});

describe("checkout product-experience proof", () => {
  it("leads the paywall with proof-010, an approved product-experience review", () => {
    const benjamin = APPROVED_TESTIMONIALS.find((entry) => entry.id === "proof-010")!;

    // Sourced fields are the approved ones — never invented or rewritten.
    expect(benjamin.approved).toBe(true);
    expect(benjamin.attribution).toBe("Benjamin L.");
    expect(benjamin.image).toBe("/testimonials/benjamin-lee.png");
    expect(benjamin.shortQuote).toBe("It really is helping me re-define myself.");
    expect(benjamin.fullQuote).toBe("It really is helping me re-define myself.");

    // It speaks to product experience and still serves both placements.
    expect(benjamin.category).toBe("product_trust");
    expect(benjamin.eligiblePlacement).toEqual([
      "result_transition",
      "paywall_post_checkout",
    ]);

    for (const seed of ["a", "b", "c", "d", "e", "f", "g"]) {
      const journey = selectSocialProofJourney(APPROVED_TESTIMONIALS, seed);
      // Always-visible (collapsed) checkout proof is the product-experience story.
      expect(journey.paywall[0].id).toBe("proof-010");
      // Only one support-focused slot was replaced — support proof still shows.
      expect(journey.paywall.slice(1).map((entry) => entry.category)).toContain(
        "customer_support",
      );
    }
  });

  it("keeps the previous result-screen journey intact (proof-008 still featured)", () => {
    for (const seed of ["a", "b", "c", "d", "e", "f", "g"]) {
      const journey = selectSocialProofJourney(APPROVED_TESTIMONIALS, seed);
      const resultIds = journey.result.map((entry) => entry.id);
      // The result transition keeps Daria / Billy / Amy, as before.
      expect(resultIds).toEqual(["proof-002", "proof-011", "proof-008"]);
      // proof-010 serves the checkout, never the result screen here.
      expect(resultIds).not.toContain("proof-010");
    }
  });
});

describe("social proof analytics metadata", () => {
  it("contains only safe opaque fields", () => {
    const testimonial = APPROVED_TESTIMONIALS[0];
    const meta = buildImpressionMetadata(
      testimonial,
      "result_transition",
      "result_trust",
      3,
    );

    expect(Object.keys(meta).sort()).toEqual([
      "group_id",
      "placement",
      "testimonial_id",
      "visible_count",
    ]);
    expect(meta).toEqual({
      placement: "result_transition",
      group_id: "result_trust",
      testimonial_id: testimonial.id,
      visible_count: 3,
    });

    const json = JSON.stringify(meta);
    expect(json).not.toContain(testimonial.shortQuote);
    expect(json).not.toContain(testimonial.fullQuote);
    expect(json).not.toContain(testimonial.attribution);
    expect(json).not.toContain(testimonial.image);
  });
});

function makeTestimonial(
  overrides: Partial<ApprovedTestimonial>,
): ApprovedTestimonial {
  return {
    id: "test",
    shortQuote: "approved quote",
    fullQuote: "approved quote, in full.",
    attribution: "Customer",
    image: "/testimonials/daria-mart.png",
    category: "practical_value",
    eligiblePlacement: ["result_transition", "paywall_post_checkout"],
    approved: true,
    ...overrides,
  };
}
