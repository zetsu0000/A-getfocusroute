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

// ── Card 5 rebuilt as a visual teaser that withholds the result ───────────────

describe("Card 5 rebuilt teaser", () => {
  const card5 = infocards.slice(
    infocards.indexOf("function Card5Unlock"),
    infocards.indexOf("function SafeContinueCard"),
  );

  it("never reveals the score or the final pattern name/descriptor", () => {
    expect(card5).not.toContain("score.toFixed");
    expect(card5).not.toContain("PATTERN_HINT");
    expect(card5).not.toContain("getSignatureFromAnswers");
    expect(card5).not.toContain("scoreFromAnswers");
    expect(card5).not.toContain("resolveResultScoreData");
    expect(card5).not.toContain("pressure-powered");
    // None of the five pattern keys may surface on the teaser.
    for (const name of ["Drifter", "Sprinter", "Archivist", "Spark", "Reactor"]) {
      expect(card5).not.toContain(name);
    }
  });

  it("removes scanner / instrumentation wording (whole module)", () => {
    expect(infocards).not.toContain("Signal detected");
    expect(infocards).not.toContain("Scan complete");
    expect(infocards).not.toContain("Pattern acquired");
    // The old withholding-teaser strings are gone.
    expect(infocards).not.toContain("We picked up your focus pattern signal");
    expect(infocards).not.toContain("Your strongest friction area is mapped");
  });

  it("uses the new plain-language teaser copy + CTA", () => {
    expect(card5).toContain("Based on what you shared");
    expect(card5).toContain("Your answers are starting to show a clear pattern.");
    expect(card5).toContain("Your pattern is ready");
    expect(card5).toContain("See My Result");
  });

  it("maps three clear groups with their captions (third label shortened)", () => {
    for (const label of ["Starting", "Staying on track", "Getting back"]) {
      expect(card5).toContain(label);
    }
    // The long third label is shortened for 390px readability.
    expect(card5).not.toContain("Getting back into the task");
    for (const cap of [
      "where starting becomes harder",
      "what tends to interrupt follow-through",
      "where your next step should begin",
    ]) {
      expect(card5).toContain(cap);
    }
  });

  it("keeps meaningful group typography at or above 12px (no sub-12 captions)", () => {
    // Labels ~13.5px, captions 12px — no font reduction below 12 for content.
    expect(card5).toContain("fontSize: 13.5"); // group label
    expect(card5).not.toContain("fontSize: 10.5");
    expect(card5).not.toContain("fontSize: 11,");
    expect(card5).not.toContain("fontSize: 9,");
    expect(card5).not.toContain("fontSize: 8,");
  });

  it("uses a responsive group layout instead of shrinking fonts on narrow screens", () => {
    expect(card5).toContain(".ic5-groups");
    expect(card5).toContain("grid-template-columns: 1fr 1fr"); // narrow fallback
    expect(card5).toContain("ic5-group--wide"); // third group spans full width
    expect(card5).toContain("@media (max-width: 359px)");
  });

  it("renders the CTA visibly from the start — never animated from opacity 0", () => {
    // The CTA settles from a visible 0.88 → 1; it is never invisible.
    expect(card5).toContain('".ic5-cta", { opacity: 0.88');
    expect(card5).not.toMatch(/\.ic5-cta",\s*\{\s*opacity:\s*0\s*,/);
    // Real focusable button, no pointer-events tricks or focus removal.
    expect(card5).toContain('onClick={onContinue}');
    expect(card5).not.toContain('pointerEvents: "none"');
    expect(card5).not.toContain("tabIndex={-1}");
  });

  it("drives a scattered-fragments → groups → route grammar distinct from Card 1", () => {
    expect(card5).toContain(".ic5-dot");
    expect(card5).toContain(".ic5-route");
    expect(card5).toContain("strokeDashoffset");
    expect(card5).toContain("gsap.utils.random"); // loosely scattered fragments
    // Distinct grammar: no IC1 scan / vertical-route classes reused.
    expect(card5).not.toContain("fr1-vscan");
    expect(card5).not.toContain("fr1-route");
    expect(card5).not.toContain("fr1-hscan");
  });

  it("plays once, scoped + cleaned up, with a visible reduced-motion final state", () => {
    expect(card5).toContain("prefers-reduced-motion");
    expect(card5).toContain("tl.progress(1)");
    expect(card5).toContain("gsap.context");
    expect(card5).toContain("ctx.revert()");
    expect(card5).toContain("paused: true");
    // No infinite loop, no pinning, no scroll trap.
    expect(card5).not.toContain("repeat: -1");
    expect(card5).not.toContain("ScrollTrigger");
    expect(card5).not.toContain("pin:");
  });

  it("frames the CTA for mobile: safe-area bottom, no internal scroll, no clipping height", () => {
    expect(card5).toContain("env(safe-area-inset-bottom");
    expect(card5).toContain('minHeight: "100%"');
    expect(card5).not.toContain('overflowY: "auto"');
    expect(card5).not.toContain('overflow: "auto"');
    expect(card5).not.toContain('overflowY: "scroll"');
    // The scaffold must not pin a fixed viewport height that could crop the CTA.
    expect(card5).not.toMatch(/height:\s*"100vh"/);
    expect(card5).not.toMatch(/height:\s*"100dvh"/);
  });

  it("does not reach into checkout/subscription/stripe from the funnel teaser", () => {
    expect(infocards.toLowerCase()).not.toContain("subscription");
    expect(infocards.toLowerCase()).not.toContain("stripe");
    expect(infocards.toLowerCase()).not.toContain("checkout");
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

// ── Card 1 rebuild — fast visual mechanism explainer ──────────────────────────

describe("Card 1 rebuilt as a fast mechanism explainer", () => {
  const card1 = infocards.slice(
    infocards.indexOf("function Card1Recognition"),
    infocards.indexOf("function Card2Differentiation"),
  );

  it("renders the approved copy (label, two-beat headline, surface, mechanism)", () => {
    expect(card1).toContain("Recognition");
    expect(card1).toContain("It’s not just ");
    expect(card1).toContain("procrastination.");
    expect(card1).toContain("What it feels like");
    expect(card1).toContain("“I just can’t start.”");
    expect(card1).toContain("FocusRoute maps where the route breaks.");
    expect(card1).toContain("Where the route breaks");
  });

  it("uses exactly the four detected friction signals", () => {
    for (const s of [
      "Unclear priority",
      "Start feels too big",
      "Pressure takes over",
      "Interruption resets you",
    ]) {
      expect(card1).toContain(s);
    }
  });

  it("ends on the payoff + CTA", () => {
    expect(card1).toContain("Less self-blame.");
    expect(card1).toContain("A clearer next move.");
    expect(card1).toContain("Show me the pattern");
  });

  it("drops the old long-paragraph grammar and the banned 'momentum' word", () => {
    expect(card1.toLowerCase()).not.toContain("momentum");
    expect(card1).not.toContain("Where the friction actually begins");
    expect(card1).not.toContain("question.infoCapability");
  });

  it("drives the narrative with a GSAP route draw + scan, honoring reduced motion", () => {
    expect(card1).toContain(".fr1-route");
    expect(card1).toContain("strokeDashoffset");
    expect(card1).toContain(".fr1-vscan");
    expect(card1).toContain("prefers-reduced-motion");
    expect(card1).toContain("tl.progress(1)");
  });

  it("keeps the single scroll container (no nested scroller in Card 1)", () => {
    expect(card1).not.toContain('overflowY: "auto"');
  });

  it("never rests an ambient pulse below the final node (no orphan dot)", () => {
    expect(card1).toContain(".fr1-pulse");
    // The pulse must not travel to / rest at the very bottom of the route, and
    // the entrance travel node must not stop at 94% (below the final node).
    expect(card1).not.toContain('top: "100%"');
    expect(card1).not.toContain('top: "94%"');
    // It fades out (opacity → 0) rather than resting visible at the route end.
    expect(card1).toMatch(/\.fr1-pulse[\s\S]*?opacity: 0/);
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
