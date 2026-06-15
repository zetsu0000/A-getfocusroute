import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { PROFILE_SECTIONS, resultLockedRows } from "@/lib/paid-value";
import { FIRST_STEP_TEASER, firstStepTeaserFor } from "@/lib/first-step-teaser";
import { deriveBrainProfile } from "@/lib/dashboard/brain-profile";
import { PRODUCT_TO_ENTITLEMENTS } from "@/lib/access/products";

/*
 * PR4 — make the paid value concrete. The funnel components are client-only with
 * no DOM test environment, so these prove the value-naming logic directly and
 * pair it with source-level guards against the components that render it.
 */
const SIGNATURES = ["Sprinter", "Archivist", "Spark", "Reactor", "Drifter"] as const;

const brainProfileSrc = readFileSync(
  fileURLToPath(new URL("../../components/dashboard/BrainProfileView.tsx", import.meta.url)),
  "utf8",
);
const chartSrc = readFileSync(
  fileURLToPath(new URL("../../components/chart/ChartScreen.tsx", import.meta.url)),
  "utf8",
);

describe("result locked preview is exactly three concrete rows", () => {
  it("returns exactly three rows for every signature", () => {
    for (const sig of SIGNATURES) {
      expect(resultLockedRows(sig)).toHaveLength(3);
    }
    // Unknown / missing signature still yields three rows (graceful fallback).
    expect(resultLockedRows("")).toHaveLength(3);
  });

  it("names concrete shipped outputs in the two shared rows (radar + conditions/initiation/recovery)", () => {
    const rows = resultLockedRows("Sprinter");
    expect(rows[0].toLowerCase()).toContain("six-dimension");
    expect(rows[0]).toContain(PROFILE_SECTIONS.radar);
    expect(rows[1]).toContain(PROFILE_SECTIONS.conditions);
    expect(rows[1]).toContain(PROFILE_SECTIONS.taskInitiation);
    expect(rows[1]).toContain(PROFILE_SECTIONS.recovery);
  });

  it("gives each signature one distinct pattern-specific practical starting point", () => {
    const teasers = SIGNATURES.map((sig) => resultLockedRows(sig)[2]);
    // Row 3 is the per-signature first-step teaser…
    teasers.forEach((teaser, i) => {
      expect(teaser).toBe(firstStepTeaserFor(SIGNATURES[i]));
      expect(teaser.length).toBeGreaterThan(0);
    });
    // …and all five are unique.
    expect(new Set(teasers).size).toBe(SIGNATURES.length);
  });

  it("replaces the abstract-only wording on the result screen", () => {
    for (const sig of SIGNATURES) {
      const joined = resultLockedRows(sig).join(" ").toLowerCase();
      expect(joined).not.toContain("full focus-pattern breakdown");
      expect(joined).not.toContain("full pattern breakdown");
      expect(joined).not.toContain("full focus plan");
    }
  });
});

describe("locked copy names only real shipped Brain Profile sections", () => {
  it("maps every PROFILE_SECTIONS label to a section rendered in BrainProfileView", () => {
    for (const label of Object.values(PROFILE_SECTIONS)) {
      // BrainProfileView labels the radar and script with a ™ glyph, so the
      // funnel name is a substring of the rendered section heading.
      expect(brainProfileSrc).toContain(label);
    }
  });

  it("the Executive Function Radar really has six dimensions", () => {
    const profile = deriveBrainProfile([], "Sprinter", null);
    expect(profile.radarDimensions).toHaveLength(6);
  });

  it("the Explain-It-To-Someone Script ships with the Brain Profile entitlement bundle", () => {
    // Justifies naming the script in the paywall: the brain_profile product
    // grants bonus_explain_script, which is what unlocks the script section.
    expect(PRODUCT_TO_ENTITLEMENTS.brain_profile).toContain("bonus_explain_script");
  });

  it("FIRST_STEP_TEASER covers all five signatures with distinct copy", () => {
    for (const sig of SIGNATURES) {
      expect(typeof FIRST_STEP_TEASER[sig]).toBe("string");
    }
    const values = SIGNATURES.map((sig) => FIRST_STEP_TEASER[sig]);
    expect(new Set(values).size).toBe(SIGNATURES.length);
  });
});

describe("ChartScreen renders the centralized rows without adding structure", () => {
  it("builds the locked rows from resultLockedRows and renders them in one panel", () => {
    expect(chartSrc).toContain("resultLockedRows(signature.signature)");
    expect(chartSrc).toContain("lockedRows.map");
    // Exactly one locked preview panel — no extra card/module was introduced.
    expect((chartSrc.match(/lockedRows\.map/g) || []).length).toBe(1);
    expect((chartSrc.match(/full focus plan/g) || []).length).toBe(1);
    // The pre-PR4 inline construction from signature.unlockTeaser is gone.
    expect(chartSrc).not.toContain("signature.unlockTeaser");
  });
});
