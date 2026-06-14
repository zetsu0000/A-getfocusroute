import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const src = readFileSync(
  fileURLToPath(new URL("../ChartScreen.tsx", import.meta.url)),
  "utf8",
);

describe("ChartScreen trust progression", () => {
  it("keeps the locked full-plan preview on the result screen", () => {
    expect(src).toContain("Locked");
    expect(src).toContain("full focus plan");
    expect(src).toContain("lockedRows.map");
  });

  it("renders the three-proof result social proof block before the CTA", () => {
    const proof = src.indexOf("<ResultSocialProof />");
    const cta = src.indexOf("Unlock My Full Plan", proof);

    expect(proof).toBeGreaterThan(-1);
    expect(cta).toBeGreaterThan(proof);
  });

  it("keeps result social proof out of retake mode", () => {
    const proof = src.indexOf("<ResultSocialProof />");
    const guard = src.lastIndexOf("!retakeMode", proof);

    expect(guard).toBeGreaterThan(-1);
  });

  it("resets the page to the top on mount only (instant, not smooth)", () => {
    // The reset lives in its own effect: it begins at the rAF call and ends at
    // the empty-deps marker. Scoping the assertions to that slice proves it is
    // mount-only (empty deps, so it never reruns on state changes) and instant
    // (no smooth behavior that could fight testimonials or the unlock CTA).
    const effectStart = src.indexOf("window.requestAnimationFrame");
    const depsEnd = src.indexOf("}, []);", effectStart);
    expect(effectStart).toBeGreaterThan(-1);
    expect(depsEnd).toBeGreaterThan(effectStart);

    const resetEffect = src.slice(effectStart, depsEnd);
    expect(resetEffect).toContain("window.scrollTo(0, 0)");
    expect(resetEffect).toContain("window.cancelAnimationFrame(frame)");
    expect(resetEffect).not.toContain("behavior:");
    expect(resetEffect).not.toContain("setStep");
  });
});

