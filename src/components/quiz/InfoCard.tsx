"use client";

import Image from "next/image";
import { useState } from "react";
import { m } from "framer-motion";
import { Fingerprint, Sparkles, Compass, type LucideIcon } from "lucide-react";
import { QuizQuestion } from "@/types/quiz";
import { useQuizStore } from "@/store/quizStore";
import { scoreFromAnswers, getSymptomLevel, LevelInfo } from "@/lib/symptom-level";
import { getSignatureFromAnswers } from "@/lib/signature";

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

function getLevelWithDescription(score: number): LevelInfo & { description: string } {
  const level = getSymptomLevel(score);
  return { ...level, description: LEVEL_DESCRIPTIONS[level.label] ?? "" };
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
   Sub-component: Cognitive Profile Card  — redesigned professional look
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
      <div style={{
        width: "100%", maxWidth: 480,
        borderRadius: "var(--radius-xl)",
        background: "var(--color-bg-card)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
      }}>

        {/* ── Header band ───────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
          padding: "22px 24px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{
              fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)",
              letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4,
            }}>
              Your snapshot
            </p>
            <h2 style={{
              fontSize: 20, fontWeight: 800, color: "#ffffff", lineHeight: 1.15,
            }}>
              Focus Profile
            </h2>
          </div>
          {/* Score pill */}
          <m.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1.5px solid rgba(255,255,255,0.25)",
              borderRadius: "var(--radius-md)", padding: "8px 16px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
              {score.toFixed(0)}
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, marginTop: 2 }}>
              score
            </p>
          </m.div>
        </div>

        {/* ── Spectrum section ──────────────────────────────── */}
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-body)" }}>
              Where you land
            </p>
            <m.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                fontSize: 12, fontWeight: 800,
                color: level.color,
                background: level.bg,
                padding: "4px 12px", borderRadius: "var(--radius-pill)",
                border: `1px solid ${level.color}33`,
              }}
            >
              {level.label}
            </m.span>
          </div>

          {/* Gradient track */}
          <div style={{
            position: "relative", height: 10, borderRadius: "var(--radius-pill)",
            background: "linear-gradient(to right, var(--color-primary-mid), var(--color-primary), var(--color-cognitive))",
            marginBottom: 8,
          }}>
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute",
                left: `${level.pct}%`,
                top: "50%", transform: "translate(-50%, -50%)",
                width: 20, height: 20, borderRadius: "50%",
                background: "#fff",
                border: `3px solid ${level.color}`,
                boxShadow: `0 2px 8px ${level.color}55`,
              }}
            />
          </div>

          {/* Axis labels */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            {["Low", "Mild", "Moderate", "High", "Very high"].map((l) => (
              <span key={l} style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 500 }}>{l}</span>
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
            padding: "14px 16px",
            borderRadius: 14,
            background: level.bg,
            border: `1px solid ${level.color}33`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
        >
          <p style={{ fontSize: 12, color: "var(--color-text-body)", lineHeight: 1.6 }}>
            {level.description}
          </p>
        </m.div>

        {/* ── Metrics grid ──────────────────────────────────── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 0,
          margin: "16px 24px 0",
          borderRadius: 14, overflow: "hidden",
          border: "1px solid var(--color-border)",
        }}>
          {metrics.map((metric, i) => (
            <m.div
              key={metric.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08, duration: 0.25 }}
              style={{
                padding: "12px 10px",
                borderRight: i < metrics.length - 1 ? "1px solid var(--color-border)" : "none",
                textAlign: "center",
                background: "var(--color-bg-card-2)",
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-primary)", lineHeight: 1.1, marginBottom: 3 }}>
                {metric.value}
              </p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text)", marginBottom: 2 }}>
                {metric.label}
              </p>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", lineHeight: 1.3 }}>
                {metric.sub}
              </p>
            </m.div>
          ))}
        </div>

        {/* ── CTA ───────────────────────────────────────────── */}
        <div style={{ padding: "20px 24px 24px" }}>
          <button onClick={onContinue} style={{
            width: "100%", padding: "16px 20px",
            borderRadius: "var(--radius-md)", fontSize: 15, fontWeight: 700,
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))",
            color: "#ffffff",
            border: "none", cursor: "pointer",
            boxShadow: "var(--shadow-btn-accent)",
            letterSpacing: "0.01em",
          }}>
            See my full results
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Renders infoStat with an optional highlighted (teal) portion
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
      <span style={{ color: "var(--color-primary)" }}>{highlight}</span>
      {" for you!"}
    </>
    );
  }
  return (
    <>
      {stat.slice(0, idx)}
      <span style={{ color: "var(--color-primary)" }}>{highlight}</span>
      {stat.slice(idx + highlight.length)}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Generic Info Card — LEFT-ALIGNED, Impulse-style
   illustration at top, bold title with optional % highlight, CTA
───────────────────────────────────────────────────────────────── */
/* Distinct visual per interstitial so the same illustration never repeats.
   Only one real illustration asset exists (people-group.png); it stays on the
   "you're not alone" belonging card, other cards get their own themed icon. */
const STAGE_ICON: Record<string, LucideIcon> = {
  "info-seen": Fingerprint,
  "info-focus": Sparkles,
  "info-adhd": Compass,
};

function BrandMark() {
  return (
    <div style={{
      width: 110, height: 110, borderRadius: "var(--radius-xl)",
      background: "var(--color-primary-tint)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 22, fontWeight: 900, letterSpacing: "0.08em",
      color: "var(--color-primary)",
      boxShadow: "var(--shadow-btn-primary)",
    }}>
      FR
    </div>
  );
}

function GenericInfoCard({
  question,
  onContinue,
}: {
  question: QuizQuestion;
  onContinue: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const StageIcon = STAGE_ICON[question.id];
  // Only the first interstitial uses the photo; if it ever fails to load we
  // fall back to the brand mark so a broken-image placeholder never appears.
  const showPhoto = !StageIcon && !imgFailed;

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      overflowY: "auto",
      padding: "0 24px",
    }}>

      {/* ── Illustration ─────────────────────────────────────── */}
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
        {showPhoto ? (
          /* People-group illustration — first interstitial only */
          <Image
            src="/illustrations/people-group.png"
            alt=""
            width={320}
            height={180}
            sizes="(max-width: 520px) 80vw, 320px"
            onError={() => setImgFailed(true)}
            style={{ width: "100%", maxWidth: 320, height: "auto", objectFit: "contain" }}
          />
        ) : StageIcon ? (
          /* Themed icon for later interstitials (no repeated illustration) */
          <div style={{
            width: 110, height: 110, borderRadius: "var(--radius-xl)",
            background: "var(--color-primary-tint)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--color-primary)",
            boxShadow: "var(--shadow-btn-primary)",
          }}>
            <StageIcon size={46} strokeWidth={1.8} />
          </div>
        ) : (
          /* Graceful fallback if the photo ever fails */
          <BrandMark />
        )}
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
        <m.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.26 }}
          style={{
            fontSize: 22, fontWeight: 800,
            color: "var(--color-text)",
            lineHeight: 1.3,
            marginBottom: 12,
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
            fontSize: 14, color: "var(--color-text-body)",
            lineHeight: 1.65, marginBottom: 32,
          }}
        >
          {question.infoBody}
        </m.p>

        <m.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.24 }}
          onClick={onContinue}
          style={{
            width: "100%",
            padding: "16px 24px", borderRadius: 14,
            fontSize: 15, fontWeight: 700,
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))",
            color: "#ffffff",
            border: "none", cursor: "pointer",
            boxShadow: "var(--shadow-btn-accent)",
          }}
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
