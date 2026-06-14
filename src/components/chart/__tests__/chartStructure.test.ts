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
});

