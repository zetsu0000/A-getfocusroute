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
  "quote",
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
      expect(entry.quote.trim().length).toBeGreaterThan(0);
      expect(entry.attribution.trim().length).toBeGreaterThan(0);
      expect(entry.eligiblePlacement.length).toBeGreaterThan(0);
    }
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
      quote: "not cleared for publication",
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
    expect(json).not.toContain(testimonial.quote);
    expect(json).not.toContain(testimonial.attribution);
    expect(json).not.toContain(testimonial.image);
  });
});

function makeTestimonial(
  overrides: Partial<ApprovedTestimonial>,
): ApprovedTestimonial {
  return {
    id: "test",
    quote: "approved quote",
    attribution: "Customer",
    image: "/testimonials/daria-mart.png",
    category: "practical_value",
    eligiblePlacement: ["result_transition", "paywall_post_checkout"],
    approved: true,
    ...overrides,
  };
}
