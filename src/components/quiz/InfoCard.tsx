"use client";

import { m } from "framer-motion";
import { Fingerprint, Sparkles, Compass, Users, type LucideIcon } from "lucide-react";
import { QuizQuestion } from "@/types/quiz";
import { useQuizStore } from "@/store/quizStore";
import { scoreFromAnswers, getSymptomLevel, LevelInfo } from "@/lib/symptom-level";
import { getSignatureFromAnswers } from "@/lib/signature";
import { HudLabel } from "@/components/v2/primitives";

interface InfoCardProps {
  question: QuizQuestion;
}

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  "Low":       "Your answers show a lighter focus-friction pattern. A simple maintenance rhythm may be enough to keep your system clear.",
  "Mild":      "Your pattern tends to show up in high-demand moments. The right starting cues can reduce drag before it builds.",
  "Moderate":  "Your focus friction is noticeable across tasks and transitions. A practical protocol can help you create cleaner entry points.",
  "High":      "Your pattern carries a heavier daily load. You may benefit from a more structured plan for starting, sustaining, and resetting.",
  "Very High": "Your responses point to strong focus friction. The full profile turns that intensity into a clearer map of what to try next.",
};

/* Dark-world accent per level — the lib palette is light-theme only. */
const LEVEL_DARK: Record<string, string> = {
  "Low":       "#9BE8FF",
  "Mild":      "#7C8AFF",
  "Moderate":  "#B39BFF",
  "High":      "#FFB28B",
  "Very High": "#FF8B8B",
};

function getLevelWithDescription(score: number): LevelInfo & { description: string; darkColor: string } {
  const level = getSymptomLevel(score);
  return {
    ...level,
    description: LEVEL_DESCRIPTIONS[level.label] ?? "",
    darkColor: LEVEL_DARK[level.label] ?? "#7C8AFF",
  };
}

/* Short answer-derived pattern descriptor — same vocabulary as the paywall's
   profile band, so the snapshot hints at the result without naming it. */
const PATTERN_HINT: Record<string, { value: string; sub: string }> = {
  Sprinter:  { value: "Fast-cycle",     sub: "Pressure-powered" },
  Archivist: { value: "Detail-led",     sub: "Load-sensitive" },
  Spark:     { value: "Novelty-led",    sub: "Interest-powered" },
  Reactor:   { value: "Adaptive",       sub: "Mood-sensitive" },
  Drifter:   { value: "Anchor-seeking", sub: "Flexible attention" },
};

/* ─────────────────────────────────────────────────────────────────
   Sub-component: Focus Snapshot — V2 instrument panel
───────────────────────────────────────────────────────────────── */
function AdhdProfileCard({ onContinue }: { onContinue: () => void }) {
  const answers = useQuizStore((s) => s.answers);
  const score   = scoreFromAnswers(answers);
  const level   = getLevelWithDescription(score);
  const hint    = PATTERN_HINT[getSignatureFromAnswers(answers).signature];

  const metrics = [
    {
      label: "Focus pattern",
      value: hint.value,
      sub: hint.sub,
    },
    {
      label: "Daily drag",
      value: score >= 60 ? "High" : score >= 40 ? "Moderate" : "Low",
      sub: score >= 60 ? "Often shows up" : score >= 40 ? "Shows under demand" : "Usually lighter",
    },
    {
      label: "Focus score",
      value: score.toFixed(0),
      sub: "overall",
    },
  ];

  return (
    <div style={{
      height: "100%",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "16px 20px 28px",
      overflowY: "auto",
    }}>
      <div
        className="v2-panel"
        style={{
          width: "100%", maxWidth: 500,
          borderRadius: "var(--v2-r-lg)",
          overflow: "hidden",
          padding: 0,
          background: "linear-gradient(170deg, rgba(14,18,32,0.92), rgba(7,8,17,0.95))",
        }}
      >

        {/* ── Header band ───────────────────────────────────── */}
        <div style={{
          position: "relative",
          padding: "24px 24px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid var(--v2-line)",
          background:
            "radial-gradient(110% 160% at 0% 0%, rgba(124,138,255,0.18) 0%, transparent 55%)",
        }}>
          <div>
            <HudLabel tone="signal" style={{ marginBottom: 6 }}>
              Live reading
            </HudLabel>
            <h2 className="v2-display" style={{ fontSize: 24, fontWeight: 550, color: "#fff", lineHeight: 1.1 }}>
              Focus Snapshot
            </h2>
          </div>
          {/* Score dial */}
          <m.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
            style={{ position: "relative", width: 76, height: 76, display: "grid", placeItems: "center" }}
          >
            <svg width="76" height="76" viewBox="0 0 76 76" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <circle cx="38" cy="38" r="33" fill="none" stroke="rgba(163,178,255,0.15)" strokeWidth="3" />
              <m.circle
                cx="38" cy="38" r="33" fill="none"
                stroke={level.darkColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 33}
                initial={{ strokeDashoffset: 2 * Math.PI * 33 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 33 * (1 - score / 100) }}
                transition={{ delay: 0.4, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                style={{ filter: `drop-shadow(0 0 6px ${level.darkColor})` }}
              />
            </svg>
            <div style={{ textAlign: "center" }}>
              <p className="v2-display" style={{ fontSize: 24, fontWeight: 600, color: "#fff", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {score.toFixed(0)}
              </p>
              <p className="v2-hud" style={{ fontSize: 8, marginTop: 3 }}>score</p>
            </div>
          </m.div>
        </div>

        {/* ── Spectrum section ──────────────────────────────── */}
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <HudLabel style={{ fontSize: 10 }}>Where you land</HudLabel>
            <m.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                fontSize: 12, fontWeight: 800,
                color: level.darkColor,
                background: `color-mix(in srgb, ${level.darkColor} 14%, transparent)`,
                padding: "4px 13px", borderRadius: 999,
                border: `1px solid color-mix(in srgb, ${level.darkColor} 40%, transparent)`,
              }}
            >
              {level.label}
            </m.span>
          </div>

          {/* Gradient track — marker rides the true score; the five level
              bands are even 20% segments, so labels center under each band. */}
          <div style={{
            position: "relative", height: 8, borderRadius: 999,
            background: "linear-gradient(to right, #9BE8FF, #7C8AFF, #B39BFF, #FFB28B, #FF8B8B)",
            opacity: 0.85,
            marginBottom: 10,
          }}>
            <m.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute",
                left: `${Math.max(3, Math.min(97, score))}%`,
                top: "50%",
                x: "-50%",
                y: "-50%",
                width: 20, height: 20, borderRadius: "50%",
                background: "#0B0E1A",
                border: `3px solid ${level.darkColor}`,
                boxShadow: `0 0 14px ${level.darkColor}`,
              }}
            />
          </div>

          {/* Axis labels — one per 20% band, centered under its segment */}
          <div style={{ display: "flex", marginBottom: 18 }}>
            {["Low", "Mild", "Moderate", "High", "Very high"].map((l) => (
              <span key={l} className="v2-hud" style={{ fontSize: 8.5, flex: 1, textAlign: "center" }}>{l}</span>
            ))}
          </div>
        </div>

        {/* ── Description callout ───────────────────────────── */}
        <m.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          style={{
            margin: "0 24px",
            padding: "15px 17px",
            borderRadius: 14,
            background: `color-mix(in srgb, ${level.darkColor} 8%, transparent)`,
            border: `1px solid color-mix(in srgb, ${level.darkColor} 28%, transparent)`,
          }}
        >
          <p style={{ fontSize: 12.5, color: "var(--v2-ink-dim)", lineHeight: 1.6 }}>
            {level.description}
          </p>
        </m.div>

        {/* ── Metrics grid ──────────────────────────────────── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 0,
          margin: "16px 24px 0",
          borderRadius: 14, overflow: "hidden",
          border: "1px solid var(--v2-line)",
        }}>
          {metrics.map((metric, i) => (
            <m.div
              key={metric.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08, duration: 0.25 }}
              style={{
                padding: "13px 10px",
                borderRight: i < metrics.length - 1 ? "1px solid var(--v2-line)" : "none",
                textAlign: "center",
                background: "rgba(148,163,255,0.04)",
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 800, color: "var(--v2-signal-2)", lineHeight: 1.1, marginBottom: 4 }}>
                {metric.value}
              </p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--v2-ink)", marginBottom: 2 }}>
                {metric.label}
              </p>
              <p style={{ fontSize: 10.5, color: "var(--v2-ink-faint)", lineHeight: 1.3 }}>
                {metric.sub}
              </p>
            </m.div>
          ))}
        </div>

        {/* ── CTA ───────────────────────────────────────────── */}
        <div style={{ padding: "20px 24px 24px" }}>
          <button onClick={onContinue} className="v2-cta" style={{ width: "100%", minHeight: 56, fontSize: 15 }}>
            See my full results
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Renders infoStat with an optional highlighted (signal) portion
───────────────────────────────────────────────────────────────── */
function HighlightedStat({ stat, highlight }: { stat: string; highlight?: string }) {
  if (!highlight) {
    return <>{stat}</>;
  }
  const idx = stat.indexOf(highlight);
  if (idx === -1) {
    /* Highlight appended at end */
    return (
    <>
      {stat}
      <span className="v2-text-signal">{highlight}</span>
      {" for you!"}
    </>
    );
  }
  return (
    <>
      {stat.slice(0, idx)}
      <span className="v2-text-signal">{highlight}</span>
      {stat.slice(idx + highlight.length)}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Generic Info Card — system transmission between question blocks
───────────────────────────────────────────────────────────────── */
/* Distinct icon per interstitial so the same emblem never repeats. */
const STAGE_ICON: Record<string, LucideIcon> = {
  "info-seen": Fingerprint,
  "info-match": Users,
  "info-focus": Sparkles,
  "info-adhd": Compass,
};

function GenericInfoCard({
  question,
  onContinue,
}: {
  question: QuizQuestion;
  onContinue: () => void;
}) {
  const StageIcon = STAGE_ICON[question.id] ?? Sparkles;

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      overflowY: "auto",
      padding: "0 24px",
    }}>

      {/* ── Emblem orb ───────────────────────────────────────── */}
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: "easeOut" }}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: 420,
          paddingTop: 40,
          paddingBottom: 16,
        }}
      >
        <div style={{ position: "relative", width: 132, height: 132, display: "grid", placeItems: "center" }}>
          {/* orbital rings */}
          <m.span
            aria-hidden="true"
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "1px dashed rgba(124,138,255,0.4)",
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 13,
              borderRadius: "50%",
              border: "1px solid rgba(163,178,255,0.22)",
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: -18,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124,138,255,0.22) 0%, transparent 65%)",
              filter: "blur(8px)",
            }}
          />
          <div style={{
            width: 86, height: 86, borderRadius: "50%",
            background: "linear-gradient(150deg, rgba(124,138,255,0.20), rgba(155,232,255,0.06))",
            border: "1px solid rgba(163,178,255,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--v2-signal-2)",
            boxShadow: "0 14px 44px rgba(124,138,255,0.3), inset 0 1px 0 rgba(255,255,255,0.16)",
          }}>
            <StageIcon size={36} strokeWidth={1.6} />
          </div>
        </div>
      </m.div>

      {/* ── Text + CTA — centered ────────────────────────────── */}
      <div style={{
        paddingBottom: 48,
        maxWidth: 480,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 0,
      }}>
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="v2-hud"
          style={{ color: "var(--v2-signal-2)", marginBottom: 14 }}
        >
          System note
        </m.p>
        <m.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.26 }}
          className="v2-display"
          style={{
            fontSize: "clamp(24px, 6.4vw, 30px)",
            fontWeight: 550,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            marginBottom: 14,
          }}
        >
          <HighlightedStat
            stat={question.infoStat ?? ""}
            highlight={question.infoHighlight}
          />
        </m.h2>

        <m.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.26 }}
          style={{
            fontSize: 14.5, color: "var(--v2-ink-dim)",
            lineHeight: 1.7, marginBottom: 34,
          }}
        >
          {question.infoBody}
        </m.p>

        <m.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.24 }}
          onClick={onContinue}
          className="v2-cta"
          style={{ width: "100%", minHeight: 56, fontSize: 15 }}
        >
          Keep Going
        </m.button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main InfoCard — routes to correct variant
───────────────────────────────────────────────────────────────── */
export function InfoCard({ question }: InfoCardProps) {
  const { submitInfo } = useQuizStore();
  const variant = question.infoBody;

  const handleContinue = () => submitInfo();

  return (
    <div
      style={{
        width: "100%", maxWidth: 520,
        height: "100%",
        margin: "0 auto",
        padding: 0,
        display: "flex", flexDirection: "column",
      }}
    >
      {variant === "adhd-profile" ? (
        <AdhdProfileCard onContinue={handleContinue} />
      ) : (
        <GenericInfoCard question={question} onContinue={handleContinue} />
      )}
    </div>
  );
}
