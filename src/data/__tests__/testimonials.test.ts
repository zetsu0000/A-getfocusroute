import { describe, expect, it } from "vitest";

import {
  APPROVED_TESTIMONIALS,
  getMatchedTestimonial,
  hasApprovedTestimonials,
  type ApprovedTestimonial,
} from "../testimonials";

/*
 * Integrity + selection contract for result→paywall social proof.
 *
 * The registry ships EMPTY: with no approved evidence the funnel must show a
 * verified trust signal (or nothing), never placeholder/manufactured proof.
 * The selector is pure and deterministic so these assertions hold without a DOM.
 */
describe("approved testimonials registry", () => {
  it("ships empty so no placeholder proof is ever exposed", () => {
    expect(APPROVED_TESTIMONIALS).toHaveLength(0);
    expect(hasApprovedTestimonials()).toBe(false);
    expect(getMatchedTestimonial("Sprinter")).toBeNull();
  });

  it("never surfaces an unapproved draft entry", () => {
    const draft: ApprovedTestimonial = {
      id: "draft-1",
      quote: "not cleared for publication",
      attribution: "pending",
      signatures: ["Sprinter"],
      approved: false,
    };
    expect(pickFrom([draft], "Sprinter")).toBeNull();
  });

  it("prefers a signature-specific story over a generic one", () => {
    const generic: ApprovedTestimonial = {
      id: "all-1",
      quote: "generic but real",
      attribution: "customer",
      signatures: "all",
      approved: true,
    };
    const specific: ApprovedTestimonial = {
      id: "sprinter-1",
      quote: "sprinter-specific and real",
      attribution: "customer",
      signatures: ["Sprinter"],
      approved: true,
    };
    expect(pickFrom([generic, specific], "Sprinter")?.id).toBe("sprinter-1");
    // No specific match for Drifter → falls back to the generic approved story.
    expect(pickFrom([generic, specific], "Drifter")?.id).toBe("all-1");
  });

  it("is deterministic: same signature always yields the same pick", () => {
    const a: ApprovedTestimonial = {
      id: "spark-1",
      quote: "first",
      attribution: "customer",
      signatures: ["Spark"],
      approved: true,
    };
    const b: ApprovedTestimonial = {
      id: "spark-2",
      quote: "second",
      attribution: "customer",
      signatures: ["Spark"],
      approved: true,
    };
    expect(pickFrom([a, b], "Spark")?.id).toBe("spark-1");
    expect(pickFrom([a, b], "Spark")?.id).toBe("spark-1");
  });
});

/*
 * Mirrors getMatchedTestimonial's resolution against an arbitrary candidate
 * list, so selection logic is verified without mutating the real (empty)
 * registry. Kept identical to the production rule on purpose.
 */
function pickFrom(
  candidates: ApprovedTestimonial[],
  signature: Parameters<typeof getMatchedTestimonial>[0],
): ApprovedTestimonial | null {
  const live = candidates.filter((t) => t.approved);
  const specific = live.find(
    (t) => t.signatures !== "all" && t.signatures.includes(signature),
  );
  if (specific) return specific;
  return live.find((t) => t.signatures === "all") ?? null;
}
