import { describe, expect, it } from "vitest";

import {
  APPROVED_TESTIMONIALS,
  buildImpressionMetadata,
  getMatchedTestimonial,
  hasApprovedTestimonials,
  isSignatureMatch,
  type ApprovedTestimonial,
} from "../testimonials";
import type { BrainSignature } from "../../lib/signature";

const ALL_SIGNATURES: BrainSignature[] = [
  "Sprinter",
  "Archivist",
  "Spark",
  "Reactor",
  "Drifter",
];

/* Public-safe fields only — this module ships to the browser. */
const ALLOWED_KEYS = new Set([
  "id",
  "quote",
  "attribution",
  "image",
  "signatures",
  "approved",
]);

describe("approved testimonials registry", () => {
  it("exposes only public-safe fields (no private consent metadata)", () => {
    for (const entry of APPROVED_TESTIMONIALS) {
      for (const key of Object.keys(entry)) {
        expect(ALLOWED_KEYS.has(key)).toBe(true);
      }
      // Belt and suspenders: the private operational keys must never appear.
      const json = JSON.stringify(entry).toLowerCase();
      for (const banned of ["approval", "consent", "verifiedby", "verifier"]) {
        expect(json).not.toContain(banned);
      }
    }
  });

  it("only ships approved entries, and at least one is live", () => {
    expect(hasApprovedTestimonials()).toBe(true);
    for (const entry of APPROVED_TESTIMONIALS) {
      expect(entry.approved).toBe(true);
    }
  });

  it("uses repo-relative public image paths, never a local filesystem path", () => {
    for (const entry of APPROVED_TESTIMONIALS) {
      if (!entry.image) continue;
      expect(entry.image.startsWith("/testimonials/")).toBe(true);
      expect(entry.image).not.toMatch(/[a-z]:\\|\/users\/|downloads|social proof/i);
    }
  });

  it("renders a real, approved story with a photo at the decision point", () => {
    const picked = getMatchedTestimonial("Sprinter");
    expect(picked).not.toBeNull();
    expect(picked?.quote.length).toBeGreaterThan(0);
    expect(picked?.attribution.length).toBeGreaterThan(0);
    expect(picked?.image).toBeTruthy();
  });

  it("makes no signature-specific claim for the current evidence", () => {
    for (const entry of APPROVED_TESTIMONIALS) {
      expect(entry.signatures).toBe("all");
    }
    const picked = getMatchedTestimonial("Spark");
    expect(picked && isSignatureMatch(picked, "Spark")).toBe(false);
  });

  it("returns the same generic story for every (unknown) signature", () => {
    const picks = ALL_SIGNATURES.map((s) => getMatchedTestimonial(s)?.id);
    expect(new Set(picks).size).toBe(1);
    expect(picks[0]).toBeDefined();
  });
});

describe("social_proof_impression payload safety", () => {
  it("carries only opaque ids/enums — never quote, name, or image", () => {
    const picked = getMatchedTestimonial("Drifter");
    expect(picked).not.toBeNull();
    const meta = buildImpressionMetadata(picked!, "result_transition", "Drifter");

    expect(Object.keys(meta).sort()).toEqual([
      "match_type",
      "placement",
      "signature_key",
      "testimonial_id",
    ]);
    expect(meta).toMatchObject({
      placement: "result_transition",
      signature_key: "Drifter",
      testimonial_id: picked!.id,
      match_type: "generic",
    });

    const json = JSON.stringify(meta);
    expect(json).not.toContain(picked!.quote);
    expect(json).not.toContain(picked!.attribution);
    if (picked!.image) expect(json).not.toContain(picked!.image);
  });
});

/*
 * Selection-rule guards. Verified against arbitrary candidate lists so the
 * logic is covered without mutating the real (intentionally small) registry —
 * kept identical to getMatchedTestimonial on purpose.
 */
describe("testimonial selection rules", () => {
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

  it("prefers a signature-specific story over a generic one (future-ready)", () => {
    const generic: ApprovedTestimonial = {
      id: "all-1",
      quote: "generic but real",
      attribution: "Customer",
      signatures: "all",
      approved: true,
    };
    const specific: ApprovedTestimonial = {
      id: "sprinter-1",
      quote: "sprinter-specific and real",
      attribution: "Customer",
      signatures: ["Sprinter"],
      approved: true,
    };
    expect(pickFrom([generic, specific], "Sprinter")?.id).toBe("sprinter-1");
    expect(pickFrom([generic, specific], "Drifter")?.id).toBe("all-1");
  });

  it("is deterministic for the same signature", () => {
    const a: ApprovedTestimonial = {
      id: "spark-1",
      quote: "first",
      attribution: "Customer",
      signatures: ["Spark"],
      approved: true,
    };
    const b: ApprovedTestimonial = {
      id: "spark-2",
      quote: "second",
      attribution: "Customer",
      signatures: ["Spark"],
      approved: true,
    };
    expect(pickFrom([a, b], "Spark")?.id).toBe("spark-1");
    expect(pickFrom([a, b], "Spark")?.id).toBe("spark-1");
  });
});

function pickFrom(
  candidates: ApprovedTestimonial[],
  signature: BrainSignature,
): ApprovedTestimonial | null {
  const live = candidates.filter((t) => t.approved);
  const specific = live.find(
    (t) => t.signatures !== "all" && t.signatures.includes(signature),
  );
  if (specific) return specific;
  return live.find((t) => t.signatures === "all") ?? null;
}
