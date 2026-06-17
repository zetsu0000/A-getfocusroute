import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { INFOCARD_STAGE } from "@/components/quiz/infocardStages";

/*
 * Funnel components are client-only and the project has no DOM test
 * environment, so these assert the high-conversion infocard invariants at the
 * source level (same approach as the other *Structure tests), plus the pure
 * stage map.
 */
function read(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
}
const infocards = read("../infocards.tsx");
const quizEngine = read("../QuizEngine.tsx");
const signalField = read("../../v2/SignalFieldGL.tsx");
const gsapHook = read("../../v2/useGsapReveal.ts");

// ── Stage map ─────────────────────────────────────────────────────────────────

describe("INFOCARD_STAGE", () => {
  it("maps exactly the five infocards to stages 1..5", () => {
    expect(INFOCARD_STAGE).toEqual({
      "info-seen": 1,
      "info-match": 2,
      "info-focus": 3,
      "info-system": 4,
      "adhd-profile": 5,
    });
  });

  it("is strictly increasing across the narrative arc", () => {
    const stages = [
      "info-seen",
      "info-match",
      "info-focus",
      "info-system",
      "adhd-profile",
    ].map((id) => INFOCARD_STAGE[id]);
    for (let i = 1; i < stages.length; i++) {
      expect(stages[i]).toBeGreaterThan(stages[i - 1]);
    }
  });
});

// ── Router: each id → its own card, default never masquerades ─────────────────

describe("infocard router", () => {
  it("routes each of the five ids to its dedicated card", () => {
    expect(infocards).toMatch(/case "info-seen":\s*\n\s*return <Card1Recognition/);
    expect(infocards).toMatch(/case "info-match":\s*\n\s*return <Card2Differentiation/);
    expect(infocards).toMatch(/case "info-focus":\s*\n\s*return <Card3Cost/);
    expect(infocards).toMatch(/case "info-system":\s*\n\s*return <Card4Mechanism/);
    expect(infocards).toMatch(/case "adhd-profile":\s*\n\s*return <Card5Unlock/);
  });

  it("default falls back to a neutral card, never masquerades as Card 1", () => {
    expect(infocards).toMatch(/default:\s*\n[\s\S]*?return <SafeContinueCard/);
    // Card 1 is rendered exactly once (the info-seen case) — not reused as the
    // default, so an unknown id surfaces instead of hiding behind a real card.
    expect((infocards.match(/<Card1Recognition/g) || []).length).toBe(1);
  });
});

// ── Card 5 must NOT spend the result reveal ───────────────────────────────────

describe("Card 5 withholds the result", () => {
  it("never renders the exact score or the pattern name/descriptor", () => {
    expect(infocards).not.toContain("score.toFixed");
    expect(infocards).not.toContain("PATTERN_HINT");
    expect(infocards).not.toContain("getSignatureFromAnswers");
    expect(infocards).not.toContain("scoreFromAnswers");
    // The descriptor strings that used to leak must be gone.
    expect(infocards).not.toContain("pressure-powered");
  });

  it("keeps a withholding teaser instead", () => {
    expect(infocards).toContain("We picked up your focus pattern signal");
    expect(infocards).toContain("Your strongest friction area is mapped");
  });
});

// ── Honest chart copy (no false answer-derived claim) ─────────────────────────

describe("Card 3 chart copy is honest", () => {
  it("uses an illustrative-example label, not a 'based on your answers' claim", () => {
    expect(infocards).toContain(
      "Illustrative example of how a clearer system can reduce repeated decision load.",
    );
    expect(infocards).not.toContain("based on your answers so far");
  });
});

// ── Card 1 label matches its content (no recycled benefit copy) ───────────────

describe("Card 1 label matches its content", () => {
  it("does not reuse question.infoCapability under the 'maps underneath' label", () => {
    expect(infocards).not.toContain("question.infoCapability");
    expect(infocards).toContain("Where the friction actually begins");
  });
});

// ── Coherence never regresses; WebGL scoped to infocards ──────────────────────

describe("QuizEngine field behaviour", () => {
  it("never lets field coherence regress on an infocard", () => {
    expect(quizEngine).toContain("Math.max(progressCoherence, stageCoherence)");
  });

  it("mounts the WebGL field only on infocards, canvas field on questions", () => {
    expect(quizEngine).toMatch(/isInfo \? \(\s*\n\s*<SignalFieldGL/);
    expect(quizEngine).toContain("<FocusField");
  });
});

// ── Reduced-motion + graceful fallbacks ───────────────────────────────────────

describe("motion safety + fallbacks", () => {
  it("GSAP reveal honors reduced motion (snaps to final state)", () => {
    expect(gsapHook).toContain("prefers-reduced-motion");
    expect(gsapHook).toContain("tl.progress(1)");
  });

  it("WebGL field has reduced-motion, no-WebGL fallback, and an FPS cap", () => {
    expect(signalField).toContain("prefers-reduced-motion");
    expect(signalField).toContain("setFallback(true)");
    expect(signalField).toContain("minInterval"); // mobile fps cap
  });

  it("single scroll container — CardShell does not nest its own scroller", () => {
    expect(infocards).not.toContain('overflowY: "auto"');
  });
});
