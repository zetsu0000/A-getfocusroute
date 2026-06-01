"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { QuizQuestion } from "@/types/quiz";
import { useQuizStore } from "@/store/quizStore";
import { EmailIcon } from "@/components/icons/EmailIcon";
import { scoreFromAnswers, getSymptomLevel, LevelInfo } from "@/lib/symptom-level";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import { getOrCreateActionEventId, trackEvent } from "@/lib/analytics/client";

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

/* ─────────────────────────────────────────────────────────────────
   Sub-component: Cognitive Profile Card  — redesigned professional look
───────────────────────────────────────────────────────────────── */
function AdhdProfileCard({ onContinue }: { onContinue: () => void }) {
  const answers = useQuizStore((s) => s.answers);
  const score   = scoreFromAnswers(answers);
  const level   = getLevelWithDescription(score);

  const metrics = [
    {
      label: "Focus pattern",
      value: "Mixed",
      sub: "Start, sustain, reset",
    },
    {
      label: "Friction load",
      value: score >= 60 ? "High" : score >= 40 ? "Moderate" : "Low",
      sub: score >= 60 ? "Often shows up" : score >= 40 ? "Shows under demand" : "Usually lighter",
    },
    {
      label: "Response index",
      value: score.toFixed(0),
      sub: "pattern strength",
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
              Pattern Preview
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
              index
            </p>
          </m.div>
        </div>

        {/* ── Spectrum section ──────────────────────────────── */}
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-body)" }}>
              Pattern intensity
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
   Sub-component: Brain Before / After Card  (Tela 2)
───────────────────────────────────────────────────────────────── */
function BrainComparisonCard({ onContinue }: { onContinue: () => void }) {
  const DIMENSIONS = [
    { label: "Task start", now: 34, projected: 72 },
    { label: "Focus stability", now: 29, projected: 67 },
    { label: "Emotional regulation", now: 38, projected: 74 },
    { label: "Execution consistency", now: 31, projected: 69 },
  ];

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px 20px 32px",
      overflowY: "auto",
    }}>
      <div style={{ width: "100%", maxWidth: 500, display: "flex", flexDirection: "column", gap: 14 }}>
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-card)",
            borderRadius: "var(--radius-lg)",
            padding: "18px 18px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, color: "var(--color-text-muted)" }}>
              Cognitive trajectory
            </p>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", background: "var(--color-primary-tint)", borderRadius: "var(--radius-pill)", padding: "4px 10px" }}>
              4-week projection
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DIMENSIONS.map((row, idx) => (
              <div key={row.label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: "var(--color-text-body)", fontWeight: 600 }}>{row.label}</span>
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 700 }}>
                    {row.now}% to {row.projected}%
                  </span>
                </div>
                <div style={{ position: "relative", height: 9, borderRadius: "var(--radius-pill)", background: "var(--color-bg-card-2)", overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${row.now}%`, background: "linear-gradient(90deg,var(--color-primary-mid),var(--color-primary))" }} />
                  <m.div
                    initial={{ width: `${row.now}%` }}
                    animate={{ width: `${row.projected}%` }}
                    transition={{ delay: 0.15 + idx * 0.08, duration: 0.45, ease: "easeOut" }}
                    style={{ position: "absolute", left: 0, top: 0, bottom: 0, background: "linear-gradient(90deg,var(--color-primary),var(--color-cognitive))" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.28 }}
          style={{
            borderRadius: "var(--radius-lg)",
            padding: "20px 22px",
            background: "var(--color-bg-card)",
            boxShadow: "var(--shadow-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <h2 style={{ fontSize: 19, fontWeight: 800, color: "var(--color-text)", lineHeight: 1.35, marginBottom: 10 }}>
            Your Brain Profile is almost ready:{" "}
            <span style={{ color: "var(--color-accent)" }}>this is where things start to click</span>
          </h2>
          <p style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.65 }}>
            We&apos;ve mapped the friction points that are slowing you down and prepared a personalized protocol to improve consistency, focus stability, and execution over the next 28 days.
          </p>
        </m.div>

        <button onClick={onContinue} style={{
          width: "100%",
          padding: "15px 20px",
          borderRadius: "var(--radius-md)",
          fontSize: 15,
          fontWeight: 700,
          background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))",
          color: "#ffffff",
          border: "none",
          cursor: "pointer",
          boxShadow: "var(--shadow-btn-accent)",
        }}>
          See My Brain Profile Preview
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Sub-component: Email Input Card
───────────────────────────────────────────────────────────────── */
function EmailInputCard({ onContinue }: { onContinue: (email: string) => void }) {
  const email = useQuizStore((s) => s.email);
  const [local, setLocal] = useState(email);

  return (
    <div style={{
      height: "100%",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "20px 20px 32px",
      overflowY: "auto",
    }}>
    <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Icon */}
      <div style={{ textAlign: "center" }}>
        <m.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{
            width: 80, height: 80, borderRadius: "var(--radius-lg)", margin: "0 auto 16px",
        background: "linear-gradient(135deg, var(--color-primary-tint) 0%, var(--color-cognitive-tint) 100%)",
          boxShadow: "var(--shadow-btn-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36,
          }}
        >
          <EmailIcon />
        </m.div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-primary)", lineHeight: 1.35 }}>
          Your Brain Profile is almost ready!
        </h2>
      </div>

      {/* Input */}
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)",
          color: "var(--color-text-muted)", pointerEvents: "none",
        }}>
          <EmailIcon />
        </span>
        <input
          type="email"
          placeholder="your@email.com"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          style={{
            width: "100%", padding: "17px 18px 17px 48px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-bg-card)",
            border: "1.5px solid var(--color-border)",
            color: "var(--color-primary)",
            fontSize: 15, outline: "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
            boxShadow: "0 1px 3px rgba(142,154,175,0.06)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--color-primary-mid)";
            e.currentTarget.style.boxShadow   = "0 0 0 3px var(--color-primary-ring)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.boxShadow   = "0 1px 3px rgba(28,26,46,0.06)";
          }}
        />
      </div>

      {/* Privacy */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "14px 16px",
        background: "var(--color-primary-tint)",
        border: "1px solid var(--color-border)",
        borderRadius: 14,
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          background: "var(--color-primary)", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1,
        }}>
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.55 }}>
          We respect your privacy and are committed to protecting your personal data.
        </p>
      </div>

      <p style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
        By continuing, you agree to our{" "}
        <a href="/terms" style={{ color: "var(--color-primary)", textDecoration: "underline" }}>Terms of Use</a>,{" "}
        <a href="/privacy" style={{ color: "var(--color-primary)", textDecoration: "underline" }}>Privacy Policy</a>, and{" "}
        <a href="/refund-policy" style={{ color: "var(--color-primary)", textDecoration: "underline" }}>Subscription Policy</a>.
      </p>

      <button
        onClick={() => local.trim() && onContinue(local)}
        disabled={!local.trim()}
        style={{
          width: "100%", padding: "18px 24px",
          borderRadius: 18, fontSize: 16, fontWeight: 700,
          border: "none",
          transition: "all 0.2s",
          ...(local.trim()
            ? { background: "var(--color-accent)", color: "#ffffff", boxShadow: "var(--shadow-btn-accent)", cursor: "pointer" }
            : { background: "var(--color-border)", color: "var(--color-text-muted)", cursor: "not-allowed" }),
        }}
      >
        Save My Profile Preview
      </button>
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
function GenericInfoCard({
  question,
  onContinue,
}: {
  question: QuizQuestion;
  onContinue: () => void;
}) {
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
        {!question.infoEmoji ? (
          /* People-group illustration when no compact mark is set */
          // eslint-disable-next-line @next/next/no-img-element -- static marketing asset; next/image adds little value here
          <img
            src="/illustrations/people-group.png"
            alt=""
            loading="eager"
            fetchPriority="high"
            style={{ width: "100%", maxWidth: 320, height: "auto", objectFit: "contain" }}
          />
        ) : (
          /* Compact mark for regular info cards */
          <div style={{
            width: 110, height: 110, borderRadius: "var(--radius-xl)",
            background: "var(--color-primary-tint)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: "0.08em",
            color: "var(--color-primary)",
            boxShadow: "var(--shadow-btn-primary)",
          }}>
            FR
          </div>
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
  const { submitInfo, setEmail } = useQuizStore();
  const variant = question.infoBody;

  const handleContinue = () => submitInfo();
  const handleEmail = (email: string) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) return;

    setEmail(normalized);
    trackEvent(FIRST_PARTY_EVENTS.emailSubmitted, {
      eventId: getOrCreateActionEventId("lead_email_submitted", "lead"),
      metadata: {
        content_name: "FocusRoute assessment email capture",
        content_type: "lead",
        value: 0,
        currency: "BRL",
      },
    });
    submitInfo();
  };

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
      ) : variant === "brain-comparison" ? (
        <BrainComparisonCard onContinue={handleContinue} />
      ) : variant === "email-input" ? (
        <EmailInputCard onContinue={handleEmail} />
      ) : (
        <GenericInfoCard question={question} onContinue={handleContinue} />
      )}
    </div>
  );
}
