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
    expect(infocards).toMatch(/case "info-match":\s*\n\s*return <Card2PriorityLens/);
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
    infocards.indexOf("function Card2PriorityLens"),
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

// ── Card 2 rebuilt — Finish travels from a competing chip to the next step ─────

describe("Card 2 rebuilt as a Priority Lens", () => {
  const card2 = infocards.slice(
    infocards.indexOf("function Card2PriorityLens"),
    infocards.indexOf("function Card3Cost"),
  );

  it("preserves every approved copy line verbatim", () => {
    expect(card2).toContain("WHEN EVERYTHING FEELS URGENT");
    expect(card2).toContain("Know what matters right now.");
    expect(card2).toContain("FocusRoute turns too many priorities into one clear next step.");
    expect(card2).toContain("DO THIS NEXT");
    expect(card2).toContain("A clear place to begin");
    expect(card2).toContain("If interrupted, come back here");
    expect(card2).toContain("Less time deciding. More time doing.");
    expect(card2).toContain("Show Me My Next Step");
  });

  it("removes the abstract IC2 product terminology", () => {
    const lc = card2.toLowerCase();
    for (const term of [
      "entry point",
      "recovery route",
      "connected path",
      "priority route",
      "action map",
      "system logic",
      "focus architecture",
      "cognitive load",
      "protocol",
      "calibration",
    ]) {
      expect(lc).not.toContain(term);
    }
  });

  it("drops the old comparison-table / two-path grammar entirely", () => {
    expect(card2).not.toContain("Generic plan");
    expect(card2).not.toContain("One connected route");
    expect(card2).not.toContain("Map what gets in the way");
    expect(card2).not.toContain("A to-do list tells you what");
    expect(card2).not.toContain('gridTemplateColumns: "1fr 1fr"');
    expect(card2).not.toContain("question.infoBenefit");
    expect(card2).not.toContain("CardShell");
  });

  it("has no scanner / instrumentation wording", () => {
    const lc = card2.toLowerCase();
    expect(lc).not.toContain("signal detected");
    expect(lc).not.toContain("scan complete");
    expect(lc).not.toContain("scan line");
    expect(card2).not.toContain("Scan");
  });

  it("removes the oversized circular lens / cyan wash treatment", () => {
    expect(card2).not.toContain(".ic2-lens");
    expect(card2).not.toContain('borderRadius: "50%"'); // no large circle
    expect(card2).not.toContain("radial-gradient"); // no cyan radial field
    expect(card2).not.toContain("inset 0 0 28px"); // no inset cyan glow
    expect(card2).not.toContain("#9BE8FF"); // cyan dropped from the solution palette
  });

  it("keeps the competing-priorities field (secondary chips, not a grid)", () => {
    expect(card2).toContain(".ic2-frag");
    expect(card2).toContain('className="ic2-stage"');
    for (const frag of ["Reply", "Plan", "Fix", "Remember", "Review"]) {
      expect(card2).toContain(frag);
    }
    expect(card2).not.toContain('gridTemplateColumns');
  });

  it("makes Finish the selected task — one morphing element, no off-center crossfade", () => {
    // Exactly one selected panel; it carries DO THIS NEXT / Finish / explanation.
    expect((card2.match(/className="ic2-selected"/g) || []).length).toBe(1);
    expect(card2).toContain('className="ic2-finish"');
    expect(card2).toMatch(/DO THIS NEXT[\s\S]*?ic2-finish[\s\S]*?Finish[\s\S]*?A clear place to begin/);
    // FLIP: the SAME element is measured and travels from the upper-right slot
    // into the centre (no two competing Finish boxes).
    expect(card2).toContain("getBoundingClientRect");
    expect(card2).toContain(".ic2-finish-origin");
    expect(card2).toContain("CHIP_SCALE");
    expect(card2).toContain("x: 0, y: 0, scale: 1"); // travels to the exact centre + full size
    expect(card2).toContain('ease: "power3.inOut"'); // confident, non-bouncy
    expect(card2).not.toContain("back.out"); // no back-bounce
  });

  it("centres the selected panel and gives Finish the strongest type", () => {
    expect(card2).toContain('left: "50%"');
    expect(card2).toContain('top: "50%"');
    expect(card2).toMatch(/ic2-do[\s\S]*?fontSize: 13/); // DO THIS NEXT ≥ 12px
    expect(card2).toMatch(/ic2-finish[\s\S]*?fontSize: 21/); // Finish 20–22px, strongest
  });

  it("is distinct from IC1 and IC5 (no reused route / scan / converging-dot grammar)", () => {
    expect(card2).not.toContain("fr1-route");
    expect(card2).not.toContain("fr1-vscan");
    expect(card2).not.toContain("fr1-hscan");
    expect(card2).not.toContain("ic5-dot");
    expect(card2).not.toContain("ic5-route");
    expect(card2).not.toContain("ic5-group");
  });

  it("drives one scoped, cleaned-up GSAP timeline that plays once", () => {
    expect(card2).toContain("gsap.context");
    expect(card2).toContain("ctx.revert()");
    expect(card2).toContain("paused: true");
    expect(card2).not.toContain("repeat: -1");
    expect(card2).not.toContain("ScrollTrigger");
    expect(card2).not.toContain("pin:");
    expect(card2).not.toContain("scrub");
  });

  it("paces a ~2.8–3.2s sequence with a visible recognition pause before selection", () => {
    expect(card2).toContain(", 0.62)"); // competition begins (after recognition)
    expect(card2).toContain(", 1.3)"); // selection + travel begin only later
    expect(card2).toContain(", 2.75)"); // payoff reveal
    expect(card2).toContain(", 2.85)"); // CTA settle → final reach ~3.05s
  });

  it("renders the CTA visibly from the start — only a subtle settle, never from 0", () => {
    expect(card2).toContain('".ic2-cta", { opacity: 0.94');
    expect(card2).not.toMatch(/\.ic2-cta",\s*\{\s*opacity:\s*0\s*,/);
    expect(card2).toContain("onClick={onContinue}");
  });

  it("snaps to a complete final state under reduced motion", () => {
    expect(card2).toContain("prefers-reduced-motion");
    expect(card2).toContain("tl.progress(1)");
  });

  it("frames mobile: safe-area, centred (no big void), no internal scroll, no fixed vh", () => {
    expect(card2).toContain("env(safe-area-inset-bottom");
    expect(card2).toContain('minHeight: "100%"');
    expect(card2).toContain('justifyContent: "center"'); // removes the stage→CTA void
    expect(card2).not.toContain('overflowY: "auto"');
    expect(card2).not.toContain('overflowY: "scroll"');
    expect(card2).not.toMatch(/height:\s*"100vh"/);
    expect(card2).not.toMatch(/height:\s*"100dvh"/);
  });
});

// ── Other infocards remain untouched by the IC2 rebuild ───────────────────────

describe("IC1, IC3, IC4, IC5 remain unchanged by the IC2 rebuild", () => {
  it("keeps IC1, IC3, IC4 and IC5 signature copy intact", () => {
    // IC1
    expect(infocards).toContain("It’s not just ");
    expect(infocards).toContain("procrastination.");
    // IC3
    expect(infocards).toContain(
      "The hardest part is rarely the task. It's deciding the same things, again and again.",
    );
    // IC4
    expect(infocards).toContain("Not a result screen — a connected system built around your pattern.");
    // IC5
    expect(infocards).toContain("Your answers are starting to show a clear pattern.");
    expect(infocards).toContain("See My Result");
  });

  it("keeps the five stage ids + routing stable", () => {
    expect(INFOCARD_STAGE).toEqual({
      "info-seen": 1,
      "info-match": 2,
      "info-focus": 3,
      "info-system": 4,
      "adhd-profile": 5,
    });
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
