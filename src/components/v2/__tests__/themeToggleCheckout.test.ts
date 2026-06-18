import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/*
 * Source-level guards for the checkout theme-toggle behaviour and the
 * assessment header safe-area inset (the funnel is client-only with no DOM
 * test env, so these assert the invariants against component source).
 */
function read(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
}
const themeProvider = read("../FunnelThemeProvider.tsx");
const assessment = read("../../../app/assessment/AssessmentClient.tsx");
const quizEngine = read("../../quiz/QuizEngine.tsx");

describe("checkout theme toggle (pin-to-top mode)", () => {
  it("ThemeToggleButton supports a checkout-only pin-to-top mode", () => {
    expect(themeProvider).toContain("pinTopOnly");
  });

  it("in pin-to-top mode it stays hidden past the opening band (never over Stripe)", () => {
    // Pinned mode hides whenever scrolled past the opening band, regardless of
    // scroll direction — so it cannot reappear over purchase content.
    expect(themeProvider).toContain("setHidden(y >= 56)");
  });

  it("keeps the default scroll-aware auto-hide for non-checkout screens", () => {
    expect(themeProvider).toContain("else if (y > last + 4)");
    expect(themeProvider).toContain("else if (y < last - 4)");
  });

  it("the assessment enables pin-to-top only on the subscription checkout", () => {
    expect(assessment).toContain('pinTopOnly={step === "subscription"}');
  });
});

describe("assessment header safe area", () => {
  it("the centred wordmark respects the iPhone Dynamic Island top inset", () => {
    expect(quizEngine).toContain(
      'paddingTop: "calc(16px + env(safe-area-inset-top, 0px))"',
    );
  });
});
