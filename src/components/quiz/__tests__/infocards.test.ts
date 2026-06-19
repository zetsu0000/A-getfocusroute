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

  // ── White-square artifact guard ─────────────────────────────────────────────
  // Root cause: the `.fr1-surface` reveal animated `filter: blur(6px) → blur(0px)`.
  // GSAP leaves the end value applied, so this rounded, overflow:hidden,
  // translucent-background box permanently carried a `filter`. On WebKit/Safari a
  // filtered + rounded + overflow:hidden box is promoted to a compositing layer
  // whose rounded clip fails and paints an opaque WHITE rectangle — before,
  // during and after the reveal and in reduced motion. The fix reveals the box
  // with opacity/transform ONLY, so it can never carry a filter again. These
  // guards target that exact property, not the literal word "white".
  describe("IC1 white-square artifact cannot recur", () => {
    // The single `.fr1-surface` entrance tween (fromTo), isolated.
    const surfaceReveal = (card1.match(/tl\.fromTo\(\s*"\.fr1-surface",[\s\S]*?\);/) ?? [""])[0];

    it("reveals the surface box with NO filter / blur (no composited white layer)", () => {
      expect(surfaceReveal).not.toBe("");
      expect(surfaceReveal).not.toMatch(/filter/);
      expect(surfaceReveal).not.toMatch(/blur/);
    });

    it("preserves the exact opacity + transform entrance and its timing", () => {
      // Same from/to transform + opacity and the same 0.45s duration at t=0.7 —
      // only the blur was dropped, the motion is unchanged.
      expect(surfaceReveal).toContain("{ opacity: 0, y: 18, scale: 0.985 }");
      expect(surfaceReveal).toContain("{ opacity: 1, y: 0, scale: 1, duration: 0.45 }");
      expect(card1).toMatch(/tl\.fromTo\(\s*"\.fr1-surface",[\s\S]*?,\s*0\.7,/);
    });

    it("keeps the surface box layout (rounded, clipped) intact — only the filter went", () => {
      // The visual box is unchanged: still a rounded, overflow:hidden panel.
      expect(card1).toMatch(/className="fr1-surface"[\s\S]*?overflow: "hidden"/);
      expect(card1).toMatch(/className="fr1-surface"[\s\S]*?borderRadius: 16/);
      // The surface element itself never declares an inline filter.
      expect(card1).not.toMatch(/className="fr1-surface"[^>]*filter:/);
    });
  });
});

// ── Card 2 — Finish is selected, travels to centre, resolves to one message ────

describe("Card 2 rebuilt as a Priority Lens", () => {
  const card2 = infocards.slice(
    infocards.indexOf("function Card2PriorityLens"),
    infocards.indexOf("function Card3Cost"),
  );

  it("preserves the approved surrounding copy verbatim", () => {
    expect(card2).toContain("WHEN EVERYTHING FEELS URGENT");
    expect(card2).toContain("Know what matters right now.");
    expect(card2).toContain("FocusRoute turns too many priorities into one clear next step.");
    expect(card2).toContain("Less time deciding. More time doing.");
    expect(card2).toContain("Show Me My Next Step");
  });

  it("uses the single sentence-case final message as two explicit nowrap lines", () => {
    // The final panel says only Start here. / Not everywhere. — two explicit
    // block lines, each pinned to a single line (whiteSpace: nowrap), never a
    // browser-wrap dependency and never a third line.
    expect(card2).toContain("Start here.");
    expect(card2).toContain("Not everywhere.");
    expect(card2).toMatch(/display: "block", whiteSpace: "nowrap"[\s\S]*?Start here\./);
    expect(card2).toMatch(/whiteSpace: "nowrap",\s*marginTop: 4,[\s\S]*?Not everywhere\./);
    expect(card2).toMatch(/Start here\.[\s\S]*?Not everywhere\./);
    // The loud uppercase final copy is gone.
    expect(card2).not.toContain("START HERE");
    expect(card2).not.toContain("NOT EVERYWHERE");
    // The old final-state copy is gone.
    expect(card2).not.toContain("DO THIS NEXT");
    expect(card2).not.toContain("A clear place to begin");
  });

  it("removes the return-anchor section completely (copy, icon, class, tween)", () => {
    expect(card2).not.toContain("If interrupted, come back here");
    expect(card2).not.toContain("ic2-anchor"); // class, ref, selector and tween all gone
    expect(card2).not.toContain("M6 3h12"); // the bookmark icon path
    // No softened replacement of the interruption idea.
    const lc = card2.toLowerCase();
    for (const s of ["resume here", "return here", "pick up", "recovery", "come back", "interrupt"]) {
      expect(lc).not.toContain(s);
    }
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

  it("uses ONE morphing element: Finish travels in, the message resolves in place", () => {
    // Exactly one selected panel — no separate replacement card.
    expect((card2.match(/className="ic2-selected"/g) || []).length).toBe(1);
    // The tracked Finish overlay + the in-flow final message both live inside it,
    // in DOM order (message first, then the Finish overlay).
    expect(card2).toMatch(/className="ic2-final"[\s\S]*?Start here\.[\s\S]*?Not everywhere\.[\s\S]*?className="ic2-finish"[\s\S]*?Finish/);
    // Finish is the decorative tracked label (aria-hidden); the message carries
    // the meaning.
    expect(card2).toMatch(/className="ic2-finish"[\s\S]*?aria-hidden="true"/);
    // FLIP: the SAME element is measured and travels from the upper-right slot.
    expect(card2).toContain("getBoundingClientRect");
    expect(card2).toContain(".ic2-finish-origin");
    expect(card2).toContain("CHIP_SCALE");
    expect(card2).toContain("x: 0, y: 0, scale: 1"); // travels to the exact centre + full size
    expect(card2).toContain('ease: "power3.inOut"'); // confident, non-bouncy
    expect(card2).not.toContain("back.out"); // no back-bounce
    // Near landing: Finish softens out and the message resolves (no panel vanish).
    expect(card2).toContain('".ic2-finish", { opacity: 0');
    expect(card2).toMatch(/".ic2-final", \{ opacity: 0[\s\S]*?opacity: 1/);
  });

  it("sizes the restrained two-line panel and centres it exactly", () => {
    expect(card2).toContain('left: "50%"');
    expect(card2).toContain('top: "50%"');
    expect(card2).toContain('width: "clamp(210px, 62%, 224px)"'); // 210–224px
    expect(card2).toContain('padding: "17px 22px"'); // 17px vertical / 22px horizontal
    expect(card2).toMatch(/className="ic2-final"[\s\S]*?fontSize: 20/); // 19–20px
    expect(card2).toMatch(/className="ic2-final"[\s\S]*?fontWeight: 700/); // ≤ 720
    expect(card2).toMatch(/className="ic2-final"[\s\S]*?lineHeight: 1\.1/); // 1.08–1.12
    expect(card2).toMatch(/className="ic2-final"[\s\S]*?letterSpacing: "-0\.02em"/); // -0.015 to -0.025em
    // One thin selected-colour border + a restrained shadow — the strong
    // double-border glow ring is gone.
    expect(card2).not.toContain("1.5px solid"); // no thick double border
    expect(card2).not.toContain("0 0 0 4px"); // no strong colour glow ring
    expect(card2).toContain('boxShadow: "var(--v2-shadow-sm)"'); // subtle restrained shadow
    // No third line inside the final panel.
    expect(card2).not.toContain("ic2-do");
    expect(card2).not.toContain("ic2-place");
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

  it("preserves the phased timing and resolves the message near landing (~3.1s)", () => {
    // Phase 1 — the field enters (and settles ~0.72s) BEFORE competition.
    expect(card2).toContain("stagger: 0.035 }, 0.28)"); // secondary tasks begin entering
    expect(card2).toContain("{ opacity: 1, duration: 0.3 }, 0.36)"); // Finish enters
    // Phase 2 — competition starts only at 0.8s.
    expect(card2).toContain('ease: "sine.inOut" }, 0.8)');
    // Phase 3 — selection ring at 1.4s, BEFORE any travel.
    expect(card2).toContain('".ic2-sel-ring", { opacity: 1, duration: 0.3 }, 1.4)');
    // Phase 4 — travel begins only at 1.7s (≥0.25s after selection).
    expect(card2).toContain('"power3.inOut" }, 1.7)');
    // Phase 5 — message resolves near the END of the travel (Finish out 2.25s,
    // the sentence-case message in 2.32s) — not before.
    expect(card2).toContain('".ic2-finish", { opacity: 0, duration: 0.22 }, 2.25)');
    expect(card2).toContain("}, 2.32)");
    // Phase 6 — payoff 2.6s, CTA settle 2.78s → total ≈ 3.08s.
    expect(card2).toContain("}, 2.6)");
    expect(card2).toContain('".ic2-cta", { opacity: 0.94, scale: 0.99 }, { opacity: 1, scale: 1, duration: 0.3 }, 2.78)');
    // The removed anchor phase and old copy timings are gone; phases not compressed.
    expect(card2).not.toContain("}, 2.45)"); // anchor phase removed
    expect(card2).not.toContain('}, 0.62)'); // not the old compressed competition
  });

  it("renders the CTA visibly from the start — only a subtle settle, never from 0", () => {
    expect(card2).toContain('".ic2-cta", { opacity: 0.94');
    expect(card2).not.toMatch(/\.ic2-cta",\s*\{\s*opacity:\s*0\s*,/);
    expect(card2).toContain("onClick={onContinue}");
  });

  it("snaps to a complete final state (with the final message) under reduced motion", () => {
    expect(card2).toContain("prefers-reduced-motion");
    expect(card2).toContain("tl.progress(1)");
    // The final message is plain markup (always in the DOM), so progress(1) shows
    // it complete with no hidden/partial-opacity content.
    expect(card2).toContain("Start here.");
    expect(card2).toContain("Not everywhere.");
  });

  it("frames mobile: safe-area, centred (no big void / anchor slot), no scroll, no fixed vh", () => {
    expect(card2).toContain("env(safe-area-inset-bottom");
    expect(card2).toContain('minHeight: "100%"');
    expect(card2).toContain('justifyContent: "center"'); // removes the stage→CTA void
    // Restrained hierarchy: stage→payoff 22 (20–24), payoff→CTA 14 (14–16).
    expect(card2).toMatch(/ic2-payoff[\s\S]*?marginTop: 22/);
    expect(card2).toMatch(/ic2-cta v2-cta[\s\S]*?marginTop: 14/);
    // Payoff reads clearly secondary to the panel + CTA: 14px, light weight,
    // dimmed ink, comfortable line-height.
    expect(card2).toMatch(/ic2-payoff[\s\S]*?fontSize: 14,/);
    expect(card2).toMatch(/ic2-payoff[\s\S]*?fontWeight: 550/);
    expect(card2).toMatch(/ic2-payoff[\s\S]*?color: "var\(--v2-ink-dim\)"/);
    expect(card2).toMatch(/ic2-payoff[\s\S]*?lineHeight: 1\.35/);
    // No leftover flex spacer pushing the CTA to the bottom.
    expect(card2).not.toContain("flex: 1, minHeight");
    expect(card2).not.toContain('overflowY: "auto"');
    expect(card2).not.toContain('overflowY: "scroll"');
    expect(card2).not.toMatch(/height:\s*"100vh"/);
    expect(card2).not.toMatch(/height:\s*"100dvh"/);
  });
});

// ── Card 4 — clarified "from result to action" copy + light gold ──────────────

describe("Card 4 clarified copy (from result to action)", () => {
  // End the slice before Card 5's comment block (which mentions "Your pattern
  // is ready") so the absence checks below only inspect Card 4's own source.
  const card4 = infocards.slice(
    infocards.indexOf("function Card4Mechanism"),
    infocards.indexOf("CARD 5 — Teaser"),
  );

  it("uses the exact approved eyebrow, headline and CTA", () => {
    expect(card4).toContain('eyebrow="FROM RESULT TO ACTION"');
    expect(card4).toContain('title="Know what to do next — and adjust without starting over."');
    expect(card4).toContain('cta="Show Me What Comes Next"');
  });

  it("renders the exact six node labels and subtitles in order", () => {
    const nodes: [string, string][] = [
      ["See what gets in the way", "based on your answers"],
      ["Choose what to do first", "one clear next step"],
      ["Try one small action", "clear and doable"],
      ["Notice what helps", "keep what works"],
      ["Adjust when needed", "without rebuilding everything"],
      ["Keep moving forward", "one step at a time"],
    ];
    for (const [label, sub] of nodes) {
      expect(card4).toContain(`{ label: "${label}", sub: "${sub}" }`);
    }
    // Order is preserved (label N's subtitle precedes label N+1).
    for (let i = 1; i < nodes.length; i++) {
      expect(card4.indexOf(nodes[i][0])).toBeGreaterThan(card4.indexOf(nodes[i - 1][0]));
    }
  });

  it("drops the old generic IC4 wording and the banned terminology", () => {
    // The previous nodes / headline / eyebrow / CTA are gone from the slice.
    for (const old of [
      "Not a result screen",
      "Your pattern",
      "Where friction starts",
      "Starting route",
      "Daily actions",
      "Recovery route",
      "Build the next step",
      "Your system",
    ]) {
      expect(card4).not.toContain(old);
    }
    // "Progress" only appeared as the old final node label — it must be gone.
    expect(card4).not.toContain("Progress");
    const lc = card4.toLowerCase();
    for (const term of [
      "connected system",
      "architecture",
      "protocol",
      "calibration",
      "entry point",
      "recovery route",
      "cognitive load",
      "personalized system",
      "route built around your pattern",
    ]) {
      expect(lc).not.toContain(term);
    }
  });

  it("keeps the six-node vertical structure (connectors, circles, GSAP reveal)", () => {
    expect(card4).toContain("fr-link"); // connector lines
    expect(card4).toContain("fr-node"); // circles + labels
    expect(card4).toContain("useGsapReveal");
    expect(card4).toContain("CardShell");
    expect((card4.match(/label:/g) || []).length).toBe(6);
  });
});

describe("Card 4 light gold accent (scoped to system.accent2)", () => {
  it("uses the clearer gold #B98716 only for the light system accent2", () => {
    // Light role: system.accent2 is the new, more saturated gold.
    expect(infocards).toMatch(
      /system:\s*\{ accent: "#1487B5", accent2: "#B98716", eyebrow: "Your system" \}/,
    );
    // The brown it replaced is no longer the system accent.
    expect(infocards).not.toContain('accent2: "#9A7A2E"');
    // The new value is introduced in exactly one place (not globally replaced).
    expect((infocards.match(/#B98716/g) || []).length).toBe(1);
  });

  it("leaves the dark IC4 gold unchanged", () => {
    expect(infocards).toMatch(
      /system:\s*\{ accent: "#9BE8FF", accent2: "#D9BC7F", eyebrow: "Your system" \}/,
    );
  });

  it("does not alter IC5 colors even though IC5 also uses #9A7A2E", () => {
    // IC5's light "getting back" group color is untouched…
    expect(infocards).toContain('color: dark ? "#F0DCAE" : "#9A7A2E"');
    // …and the old value still exists in the module (IC5 + the unlock role),
    // proving the change was scoped, not a global find-and-replace.
    expect(infocards).toContain("#9A7A2E");
    // IC5 route + eyebrow colors are unchanged.
    expect(infocards).toContain('const routeColor = dark ? "#9BE8FF" : "#1487B5";');
    expect(infocards).toContain('const eyebrowColor = dark ? "#B39BFF" : "#7A4FD0";');
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
    // IC4 (clarified copy — see the dedicated IC4 block below)
    expect(infocards).toContain("Know what to do next — and adjust without starting over.");
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
