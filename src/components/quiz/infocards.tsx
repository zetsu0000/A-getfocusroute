"use client";

import type { ReactNode } from "react";
import { QuizQuestion } from "@/types/quiz";
import { useQuizStore } from "@/store/quizStore";
import { scoreFromAnswers } from "@/lib/symptom-level";
import { getSignatureFromAnswers } from "@/lib/signature";
import { useFunnelTheme } from "@/components/v2/FunnelThemeProvider";
import { useGsapReveal } from "@/components/v2/useGsapReveal";

/* ════════════════════════════════════════════════════════════════════
   High-conversion infocard system — 5 deliberately distinct grammars.
   The shared SignalFieldGL ambient lives in QuizEngine and evolves by
   stage; each card owns its content format, color role, and GSAP move.
   No fabricated stats / testimonials / guaranteed outcomes anywhere.
   ════════════════════════════════════════════════════════════════════ */

type CardProps = { question: QuizQuestion; onContinue: () => void };

/* Per-card emotional color role (dark / light). Color = meaning, not decor. */
type Role = { accent: string; accent2: string; eyebrow: string };
function useRole(dark: boolean): Record<string, Role> {
  return dark
    ? {
        recognition: { accent: "#B39BFF", accent2: "#7C8AFF", eyebrow: "Recognition" },
        friction:    { accent: "#FFB28B", accent2: "#9BE8FF", eyebrow: "Why generic stalls" },
        cost:        { accent: "#7FE0B2", accent2: "#9BE8FF", eyebrow: "The real cost" },
        system:      { accent: "#9BE8FF", accent2: "#D9BC7F", eyebrow: "Your system" },
        unlock:      { accent: "#F0DCAE", accent2: "#9BE8FF", eyebrow: "Personalized unlock" },
      }
    : {
        recognition: { accent: "#7A4FD0", accent2: "#4655E6", eyebrow: "Recognition" },
        friction:    { accent: "#C2691E", accent2: "#1487B5", eyebrow: "Why generic stalls" },
        cost:        { accent: "#1C8A5A", accent2: "#1487B5", eyebrow: "The real cost" },
        system:      { accent: "#1487B5", accent2: "#9A7A2E", eyebrow: "Your system" },
        unlock:      { accent: "#9A7A2E", accent2: "#1487B5", eyebrow: "Personalized unlock" },
      };
}

/* ── Shared chrome — eyebrow + headline + scroll body + contextual CTA ─── */
function CardShell({
  rootRef,
  eyebrow,
  eyebrowColor,
  title,
  cta,
  onContinue,
  children,
}: {
  rootRef: React.Ref<HTMLDivElement>;
  eyebrow: string;
  eyebrowColor: string;
  title: ReactNode;
  cta: string;
  onContinue: () => void;
  children: ReactNode;
}) {
  return (
    <div
      ref={rootRef}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflowY: "auto",
        padding: "20px 18px 24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", flex: 1 }}>
        <p
          className="fr-rv v2-hud"
          style={{ color: eyebrowColor, marginBottom: 10, letterSpacing: "0.16em" }}
        >
          {eyebrow}
        </p>
        <h2
          className="fr-rv v2-display"
          style={{
            fontSize: "clamp(22px, 6vw, 27px)",
            fontWeight: 560,
            lineHeight: 1.16,
            letterSpacing: "-0.01em",
            marginBottom: 18,
            color: "var(--v2-ink)",
          }}
        >
          {title}
        </h2>

        <div style={{ flex: 1 }}>{children}</div>

        <button
          onClick={onContinue}
          className="fr-rv v2-cta"
          style={{ width: "100%", minHeight: 54, fontSize: 15, marginTop: 18 }}
        >
          {cta}
        </button>
      </div>
    </div>
  );
}

function Pill({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span
      className="v2-hud"
      style={{
        fontSize: 9,
        letterSpacing: "0.1em",
        color,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 32%, transparent)`,
        padding: "3px 9px",
        borderRadius: 999,
      }}
    >
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CARD 1 — Recognition: surface (what you feel) → depth (what we map)
───────────────────────────────────────────────────────────────────── */
function Card1Recognition({ question, onContinue }: CardProps) {
  const { theme } = useFunnelTheme();
  const dark = theme === "dark";
  const role = useRole(dark).recognition;

  const ref = useGsapReveal((tl) => {
    tl.from(".fr-rv", { y: 14, opacity: 0, stagger: 0.08 })
      .fromTo(".fr-route-line", { strokeDashoffset: 240 }, { strokeDashoffset: 0, duration: 0.9 }, "-=0.2")
      .from(".fr-depth", { opacity: 0, y: 10 }, "-=0.5");
  });

  return (
    <CardShell
      rootRef={ref}
      eyebrow={role.eyebrow}
      eyebrowColor={role.accent}
      title="The part you see isn't the whole pattern."
      cta="Show me the pattern"
      onContinue={onContinue}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 0 }}>
        {/* Surface */}
        <div
          className="fr-rv"
          style={{
            padding: "14px 16px",
            borderRadius: 16,
            border: "1px solid rgba(var(--v2-line-rgb),0.18)",
            background: "rgba(148,163,255,0.05)",
          }}
        >
          <Pill color={role.accent}>What it feels like</Pill>
          <p style={{ marginTop: 9, fontSize: 14, color: "var(--v2-ink-dim)", lineHeight: 1.5 }}>
            “It looks like procrastination — like I just can’t make myself start.”
          </p>
        </div>

        {/* Animated route connecting surface → depth */}
        <div style={{ display: "flex", justifyContent: "center", padding: "2px 0" }}>
          <svg width="40" height="54" viewBox="0 0 40 54" fill="none" aria-hidden="true">
            <path
              className="fr-route-line"
              d="M20 2 C20 18, 8 26, 20 34 S20 50, 20 52"
              stroke={role.accent2}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="240"
              style={{ filter: `drop-shadow(0 0 4px ${role.accent2})` }}
            />
          </svg>
        </div>

        {/* Depth — what FocusRoute maps underneath */}
        <div
          className="fr-depth"
          style={{
            padding: "15px 16px",
            borderRadius: 16,
            border: `1px solid color-mix(in srgb, ${role.accent2} 32%, transparent)`,
            background: `linear-gradient(160deg, color-mix(in srgb, ${role.accent2} 14%, transparent), transparent)`,
          }}
        >
          <Pill color={role.accent2}>What FocusRoute maps underneath</Pill>
          <p style={{ marginTop: 9, fontSize: 14, fontWeight: 600, color: "var(--v2-ink)", lineHeight: 1.5 }}>
            {question.infoCapability ??
              "Whether the friction starts with unclear priorities, an entry point that feels too big, pressure, interruption, or lost momentum."}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {["Priority", "Entry point", "Pressure", "Interruption", "Momentum"].map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 11,
                  color: "var(--v2-ink-dim)",
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(var(--v2-line-rgb),0.2)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <p className="fr-rv" style={{ marginTop: 12, fontSize: 12.5, color: "var(--v2-ink-faint)", lineHeight: 1.5 }}>
          It maps where the friction begins — instead of treating every stalled task as one more personal failure.
        </p>
      </div>
    </CardShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CARD 2 — Differentiation: generic path (breaks) vs FocusRoute (connects)
───────────────────────────────────────────────────────────────────── */
function Card2Differentiation({ question, onContinue }: CardProps) {
  const { theme } = useFunnelTheme();
  const dark = theme === "dark";
  const role = useRole(dark).friction;

  const ref = useGsapReveal((tl) => {
    tl.from(".fr-rv", { y: 14, opacity: 0, stagger: 0.07 })
      .from(".fr-generic-step", { opacity: 0, x: -10, stagger: 0.06 }, "-=0.1")
      .from(".fr-route-step", { opacity: 0, x: 10, stagger: 0.08 }, "-=0.2");
  });

  const generic = ["Task list", "Overwhelm", "Delay", "Restart"];
  const route = ["Priority", "Entry point", "Daily action", "Recovery route", "Progress"];

  return (
    <CardShell
      rootRef={ref}
      eyebrow={role.eyebrow}
      eyebrowColor={role.accent}
      title="A to-do list tells you what. Not how to begin, or how to recover."
      cta="Map what gets in the way"
      onContinue={onContinue}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Generic path — breaks */}
        <div
          className="fr-rv"
          style={{
            padding: "13px 12px",
            borderRadius: 16,
            border: `1px solid color-mix(in srgb, ${role.accent} 30%, transparent)`,
            background: `color-mix(in srgb, ${role.accent} 7%, transparent)`,
          }}
        >
          <Pill color={role.accent}>Generic plan</Pill>
          <div style={{ marginTop: 11, display: "flex", flexDirection: "column", gap: 7 }}>
            {generic.map((s, i) => (
              <div
                key={s}
                className="fr-generic-step"
                style={{
                  fontSize: 12.5,
                  color: i === generic.length - 1 ? role.accent : "var(--v2-ink-dim)",
                  fontWeight: i === generic.length - 1 ? 700 : 500,
                  opacity: 1 - i * 0.08,
                }}
              >
                {s}
                {i < generic.length - 1 && (
                  <span style={{ color: "var(--v2-ink-ghost)", marginLeft: 6 }}>↓</span>
                )}
              </div>
            ))}
          </div>
          <p style={{ marginTop: 10, fontSize: 11, color: role.accent }}>Loops back to the start.</p>
        </div>

        {/* FocusRoute path — connects */}
        <div
          className="fr-rv"
          style={{
            padding: "13px 12px",
            borderRadius: 16,
            border: `1px solid color-mix(in srgb, ${role.accent2} 34%, transparent)`,
            background: `linear-gradient(160deg, color-mix(in srgb, ${role.accent2} 15%, transparent), transparent)`,
          }}
        >
          <Pill color={role.accent2}>FocusRoute</Pill>
          <div style={{ marginTop: 11, display: "flex", flexDirection: "column", gap: 7 }}>
            {route.map((s, i) => (
              <div
                key={s}
                className="fr-route-step"
                style={{
                  fontSize: 12.5,
                  fontWeight: i === route.length - 1 ? 760 : 600,
                  color: i === route.length - 1 ? "var(--v2-ink)" : "var(--v2-ink-dim)",
                }}
              >
                <span style={{ color: role.accent2, marginRight: 6 }}>›</span>
                {s}
              </div>
            ))}
          </div>
          <p style={{ marginTop: 10, fontSize: 11, color: role.accent2 }}>One connected route.</p>
        </div>
      </div>

      <p className="fr-rv" style={{ marginTop: 14, fontSize: 13, color: "var(--v2-ink-dim)", lineHeight: 1.5 }}>
        {question.infoBenefit ??
          "FocusRoute connects priorities, starting points, daily actions, recovery and progress — so you begin from a concrete next move, not a planning reset."}
      </p>
    </CardShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CARD 3 — Cost: honest progression chart (re-deciding vs acting)
───────────────────────────────────────────────────────────────────── */
function Card3Cost({ onContinue }: CardProps) {
  const { theme } = useFunnelTheme();
  const dark = theme === "dark";
  const role = useRole(dark).cost;
  const cool = dark ? "#FFB28B" : "#C2691E";

  const ref = useGsapReveal((tl) => {
    tl.from(".fr-rv", { y: 14, opacity: 0, stagger: 0.07 })
      .fromTo(".fr-area-decide", { opacity: 0 }, { opacity: 1, duration: 0.5 }, "-=0.1")
      .fromTo(".fr-line-decide", { strokeDashoffset: 320 }, { strokeDashoffset: 0, duration: 0.9 }, "<")
      .fromTo(".fr-line-act", { strokeDashoffset: 320 }, { strokeDashoffset: 0, duration: 1.0 }, "-=0.7");
  });

  return (
    <CardShell
      rootRef={ref}
      eyebrow={role.eyebrow}
      eyebrowColor={role.accent}
      title="The cost isn't one task. It's re-deciding the same things, over and over."
      cta="See how my route forms"
      onContinue={onContinue}
    >
      <div
        className="fr-rv"
        style={{
          padding: "14px 14px 10px",
          borderRadius: 16,
          border: "1px solid rgba(var(--v2-line-rgb),0.18)",
          background: "rgba(148,163,255,0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <Pill color={cool}>Energy spent re-deciding</Pill>
          <Pill color={role.accent}>Energy for action</Pill>
        </div>

        <svg width="100%" height="130" viewBox="0 0 300 130" preserveAspectRatio="none" aria-hidden="true">
          {/* re-deciding: high, draining area */}
          <path
            className="fr-area-decide"
            d="M0 30 C70 36, 150 70, 300 96 L300 130 L0 130 Z"
            fill={`color-mix(in srgb, ${cool} 16%, transparent)`}
          />
          <path
            className="fr-line-decide"
            d="M0 30 C70 36, 150 70, 300 96"
            stroke={cool}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="320"
          />
          {/* action: rising with a clearer system */}
          <path
            className="fr-line-act"
            d="M0 110 C90 104, 170 60, 300 24"
            stroke={role.accent}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="320"
            style={{ filter: `drop-shadow(0 0 5px ${role.accent})` }}
          />
        </svg>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span className="v2-hud" style={{ fontSize: 8.5 }}>Now</span>
          <span className="v2-hud" style={{ fontSize: 8.5 }}>With a clearer system</span>
        </div>
      </div>

      <p className="fr-rv" style={{ marginTop: 8, fontSize: 11, color: "var(--v2-ink-faint)", fontStyle: "italic" }}>
        Illustrative — based on your answers so far, not a measured outcome.
      </p>
      <p className="fr-rv" style={{ marginTop: 8, fontSize: 13, color: "var(--v2-ink-dim)", lineHeight: 1.5 }}>
        FocusRoute lowers the repeated decision load: a clearer next action, and a route back when focus breaks — so less of your day goes to rebuilding the plan.
      </p>
    </CardShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CARD 4 — Mechanism: connected system architecture (nodes ignite + link)
───────────────────────────────────────────────────────────────────── */
function Card4Mechanism({ onContinue }: CardProps) {
  const { theme } = useFunnelTheme();
  const dark = theme === "dark";
  const role = useRole(dark).system;

  const ref = useGsapReveal((tl) => {
    tl.from(".fr-rv", { y: 14, opacity: 0, stagger: 0.07 })
      .fromTo(".fr-link", { strokeDashoffset: 40 }, { strokeDashoffset: 0, stagger: 0.12, duration: 0.4 }, "-=0.1")
      .from(".fr-node", { opacity: 0, scale: 0.7, stagger: 0.12, duration: 0.4 }, "<");
  });

  const nodes = [
    { label: "Your pattern", sub: "from your answers" },
    { label: "Where friction starts", sub: "the real blocker" },
    { label: "Starting route", sub: "a concrete first move" },
    { label: "Daily actions", sub: "small, doable" },
    { label: "Recovery route", sub: "back on track" },
    { label: "Progress", sub: "what’s moving" },
  ];

  return (
    <CardShell
      rootRef={ref}
      eyebrow={role.eyebrow}
      eyebrowColor={role.accent}
      title="Not a result screen — a connected system built around your pattern."
      cta="Build the next step"
      onContinue={onContinue}
    >
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 0 }}>
        {nodes.map((n, i) => {
          const last = i === nodes.length - 1;
          return (
            <div key={n.label} style={{ position: "relative", paddingLeft: 30, paddingBottom: last ? 0 : 12 }}>
              {!last && (
                <svg
                  width="2"
                  height="100%"
                  viewBox="0 0 2 40"
                  preserveAspectRatio="none"
                  style={{ position: "absolute", left: 9, top: 18, height: "calc(100% - 6px)" }}
                  aria-hidden="true"
                >
                  <line
                    className="fr-link"
                    x1="1"
                    y1="0"
                    x2="1"
                    y2="40"
                    stroke={role.accent}
                    strokeWidth="2"
                    strokeDasharray="40"
                  />
                </svg>
              )}
              <span
                className="fr-node"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 2,
                  top: 4,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: last ? role.accent2 : "var(--v2-grad-signal)",
                  boxShadow: `0 0 12px color-mix(in srgb, ${last ? role.accent2 : role.accent} 60%, transparent)`,
                }}
              />
              <div className="fr-node">
                <p style={{ fontSize: 13.5, fontWeight: last ? 780 : 680, color: "var(--v2-ink)", lineHeight: 1.2 }}>
                  {n.label}
                </p>
                <p style={{ fontSize: 11.5, color: "var(--v2-ink-faint)", marginTop: 1 }}>{n.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CARD 5 — Unlock: free snapshot + answer-derived locked layers
───────────────────────────────────────────────────────────────────── */
const PATTERN_HINT: Record<string, string> = {
  Sprinter: "Fast-cycle, pressure-powered",
  Archivist: "Detail-led, load-sensitive",
  Spark: "Novelty-led, interest-powered",
  Reactor: "Adaptive, mood-sensitive",
  Drifter: "Anchor-seeking, flexible attention",
};

function Card5Unlock({ onContinue }: CardProps) {
  const { theme } = useFunnelTheme();
  const dark = theme === "dark";
  const role = useRole(dark).unlock;
  const answers = useQuizStore((s) => s.answers);
  const score = scoreFromAnswers(answers);
  const hint = PATTERN_HINT[getSignatureFromAnswers(answers).signature] ?? "Personal focus pattern";

  const ref = useGsapReveal((tl) => {
    tl.from(".fr-rv", { y: 14, opacity: 0, stagger: 0.07 })
      .from(".fr-free", { opacity: 0, y: 10 }, "-=0.1")
      .from(".fr-locked", { opacity: 0, y: 12, stagger: 0.09 }, "-=0.1");
  });

  const locked = [
    "Full focus pattern + what it means",
    "Where your friction is strongest",
    "Your personalized starting route",
    "Daily focus actions that fit you",
    "Recovery guidance when focus breaks",
  ];

  return (
    <CardShell
      rootRef={ref}
      eyebrow={role.eyebrow}
      eyebrowColor={role.accent}
      title="Your FocusRoute is taking shape."
      cta="Reveal my FocusRoute"
      onContinue={onContinue}
    >
      {/* Free preview — answer-derived snapshot */}
      <div
        className="fr-free"
        style={{
          padding: "14px 16px",
          borderRadius: 16,
          border: `1px solid color-mix(in srgb, ${role.accent2} 30%, transparent)`,
          background: "var(--v2-bg-raise)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <Pill color={role.accent2}>Preview · from your answers</Pill>
          <p style={{ marginTop: 8, fontSize: 14, fontWeight: 740, color: "var(--v2-ink)" }}>{hint}</p>
          <p style={{ fontSize: 11.5, color: "var(--v2-ink-faint)", marginTop: 2 }}>Focus snapshot ready</p>
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <p className="v2-display" style={{ fontSize: 26, fontWeight: 600, color: role.accent2, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {score.toFixed(0)}
          </p>
          <p className="v2-hud" style={{ fontSize: 8, marginTop: 2 }}>score</p>
        </div>
      </div>

      {/* Locked layers — taking shape, gold */}
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {locked.map((l) => (
          <div
            key={l}
            className="fr-locked"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "11px 14px",
              borderRadius: 13,
              border: `1px solid color-mix(in srgb, ${role.accent} 28%, transparent)`,
              background: `color-mix(in srgb, ${role.accent} 7%, transparent)`,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                color: role.accent,
                border: `1px solid color-mix(in srgb, ${role.accent} 40%, transparent)`,
                fontSize: 12,
              }}
            >
              ◗
            </span>
            <span style={{ fontSize: 13, fontWeight: 640, color: "var(--v2-ink)" }}>{l}</span>
          </div>
        ))}
      </div>

      <p className="fr-rv" style={{ marginTop: 12, fontSize: 12.5, color: "var(--v2-ink-dim)", lineHeight: 1.5 }}>
        The preview is yours free. The full personalized system — profile, route, daily actions, recovery and ongoing plan — unlocks with your subscription.
      </p>
    </CardShell>
  );
}

/* ── Router ───────────────────────────────────────────────────────────── */
export function InfocardV2({ question, onContinue }: CardProps) {
  switch (question.id) {
    case "info-seen":
      return <Card1Recognition question={question} onContinue={onContinue} />;
    case "info-match":
      return <Card2Differentiation question={question} onContinue={onContinue} />;
    case "info-focus":
      return <Card3Cost question={question} onContinue={onContinue} />;
    case "info-system":
      return <Card4Mechanism question={question} onContinue={onContinue} />;
    case "adhd-profile":
      return <Card5Unlock question={question} onContinue={onContinue} />;
    default:
      return <Card1Recognition question={question} onContinue={onContinue} />;
  }
}

export { INFOCARD_STAGE } from "@/components/quiz/infocardStages";
