import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/*
 * SigilArtifact is the funnel result reveal (used only by ChartScreen). It is a
 * client-only component with no DOM test env, so these are source-level guards
 * on the result-header copy and the pattern hero statements.
 */
const src = readFileSync(
  fileURLToPath(new URL("../SigilArtifact.tsx", import.meta.url)),
  "utf8",
);

describe("SigilArtifact result header", () => {
  it("uses a plain 'Your result' header — no technical/clinical label", () => {
    expect(src).toContain("Your result");
    expect(src).not.toContain("Cognitive Signature");
    expect(src).not.toContain("Brain Profile");
  });

  it("removes the internal pattern index entirely (no NN / NN position)", () => {
    expect(src).not.toContain("patternIndex");
    expect(src).not.toContain("patternCount");
    expect(src).not.toContain("SIGNATURE_ORDER");
    expect(src).not.toMatch(/\{patternIndex\}\s*\/\s*\{patternCount\}/);
  });

  it("keeps the 'Your focus pattern' label and renders the pattern name", () => {
    expect(src).toContain("Your focus pattern");
    expect(src).toContain("{signatureName}");
  });

  it("names FocusRoute in every pattern hero line, never the ambiguous 'your plan'", () => {
    expect(src).not.toContain("Your plan shows");
    expect(src).not.toMatch(/your plan/i);

    const block = src.slice(
      src.indexOf("const V2_STATEMENT"),
      src.indexOf("export function SigilArtifact"),
    );
    for (const key of ["Sprinter", "Archivist", "Spark", "Reactor", "Drifter"]) {
      expect(block).toContain(`${key}:`);
    }
    // FocusRoute named once per pattern statement (all five).
    expect((block.match(/FocusRoute helps/g) || []).length).toBe(5);
    // The approved Archivist line, verbatim.
    expect(block).toContain(
      "FocusRoute helps keep the load from burying your next step.",
    );
  });
});
