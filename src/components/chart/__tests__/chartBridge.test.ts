import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { safeName } from "@/lib/personalization";

/*
 * Result bridge copy fix. The funnel components are client-only with no DOM test
 * environment, so this pairs a behavioral check of the name resolver that drives
 * the bridge with source-level guards on the explicit named/unnamed conditional.
 */
const src = readFileSync(
  fileURLToPath(new URL("../ChartScreen.tsx", import.meta.url)),
  "utf8",
);

describe("result bridge name handling", () => {
  it("resolves a real name or an empty string — never the literal 'you' fallback", () => {
    expect(safeName("Sam", "")).toBe("Sam");
    expect(safeName("  Maria  ", "")).toBe("Maria");
    expect(safeName("", "")).toBe("");
    expect(safeName(null, "")).toBe("");
    expect(safeName(undefined, "")).toBe("");
  });

  it("keys the bridge off safeName with an empty fallback (no 'you,' fallback name)", () => {
    expect(src).toContain('safeName(name, "")');
    expect(src).not.toContain('safeName(name, "you")');
    expect(src).not.toContain("{displayName},");
  });

  it("renders an explicit named/unnamed conditional, not another generic fallback", () => {
    expect(src).toContain("{personalName ? (");
    // named branch keeps the personalized, italicized lead-in
    expect(src).toContain("{personalName},</em>");
    // named branch: lowercase benefit lead-in after the italic name
    expect(src).toContain(
      "your full profile shows where momentum breaks, what helps it return, and the conditions that make focus easier to hold.",
    );
    // unnamed branch: the same sentence, capitalized
    expect(src).toContain(
      "Your full profile shows where momentum breaks, what helps it return, and the conditions that make focus easier to hold.",
    );
    // the old abstract plan-focus sentence is gone
    expect(src).not.toContain("your full plan focuses on");
  });

  it("never emits the 'you, your full' string", () => {
    expect(src.toLowerCase()).not.toContain("you, your full");
  });
});
