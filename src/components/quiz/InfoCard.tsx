"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { QuizQuestion } from "@/types/quiz";
import { useQuizStore } from "@/store/quizStore";

interface InfoCardProps {
  question: QuizQuestion;
}

/* ─────────────────────────────────────────────────────────────────
   Score map: distraction answer → ADHD symptom score (0-100)
───────────────────────────────────────────────────────────────── */
const SCORE_MAP: Record<string, number> = {
  never:     18,
  rarely:    34,
  sometimes: 57,
  often:     74,
  always:    91,
};

function getAdhdScore(answers: { questionId: string; selectedOptions: string[] }[]) {
  const d = answers.find((a) => a.questionId === "distraction");
  const id = d?.selectedOptions[0] ?? "sometimes";
  return SCORE_MAP[id] ?? 57;
}

type AdhdLevel = { label: string; color: string; bg: string; pct: number; description: string };

function scoreToLevel(score: number): AdhdLevel {
  if (score < 35)
    return {
      label: "Low Level",   color: "#4A7FA5",
      bg: "rgba(234,242,248,0.7)", pct: 20,
      description: "You show few inattention symptoms. Light maintenance training will keep your brain sharp for years.",
    };
  if (score < 50)
    return {
      label: "Mild Level",   color: "#6AA3C8",
      bg: "rgba(234,242,248,0.5)", pct: 40,
      description: "Mild symptoms emerge in high-demand situations. A 28-day program will close those attention gaps.",
    };
  if (score < 70)
    return {
      label: "Moderate Level", color: "#F07000",
      bg: "rgba(253,241,236,0.8)", pct: 62,
      description: "Noticeable symptoms (forgetfulness, frequent distractions) are impacting your activities. 10 minutes of daily training is recommended to reverse this.",
    };
  if (score < 85)
    return {
      label: "High Level",   color: "#CC5C3A",
      bg: "rgba(253,241,236,0.9)", pct: 80,
      description: "Constant focus and organization difficulties affect your daily life. Our intensive 28-day program was built exactly for you.",
    };
  return {
    label: "Very High Level", color: "#A82E2E",
    bg: "rgba(252,224,218,0.88)", pct: 95,
    description: "Intense symptoms that require attention. With the right plan and consistency, you can transform your focus in just a few weeks.",
  };
}

/* ─────────────────────────────────────────────────────────────────
   Sub-component: ADHD Profile Card  — redesigned professional look
───────────────────────────────────────────────────────────────── */
function AdhdProfileCard({ onContinue }: { onContinue: () => void }) {
  const answers = useQuizStore((s) => s.answers);
  const score   = getAdhdScore(answers);
  const level   = scoreToLevel(score);

  const metrics = [
    {
      label: "ADHD Type",
      value: "Combined",
      sub: "Inattention + impulsivity",
    },
    {
      label: "Procrastination",
      value: score >= 60 ? "High" : score >= 40 ? "Moderate" : "Low",
      sub: score >= 60 ? "Frequent in daily life" : score >= 40 ? "Present in high-demand situations" : "Rarely present",
    },
    {
      label: "Score",
      value: score.toFixed(0),
      sub: "out of 100 possible points",
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
        borderRadius: 28,
        background: "var(--color-bg-card)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
      }}>

        {/* ── Header band ───────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #4A7FA5 0%, #3A6385 100%)",
          padding: "22px 24px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{
              fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)",
              letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4,
            }}>
              Assessment Results
            </p>
            <h2 style={{
              fontSize: 20, fontWeight: 800, color: "#ffffff", lineHeight: 1.15,
            }}>
              ADHD Profile
            </h2>
          </div>
          {/* Score pill */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1.5px solid rgba(255,255,255,0.25)",
              borderRadius: 16, padding: "8px 16px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
              {score.toFixed(0)}
            </p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 600, marginTop: 2 }}>
              / 100
            </p>
          </motion.div>
        </div>

        {/* ── Spectrum section ──────────────────────────────── */}
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-body)" }}>
              Symptom level
            </p>
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                fontSize: 12, fontWeight: 800,
                color: level.color,
                background: level.bg,
                padding: "4px 12px", borderRadius: 99,
                border: `1px solid ${level.color}33`,
              }}
            >
              {level.label}
            </motion.span>
          </div>

          {/* Gradient track */}
          <div style={{
            position: "relative", height: 10, borderRadius: 99,
            background: "linear-gradient(to right, #6AA3C8, #4A7FA5, #F5C17A, #E87450, #A82E2E)",
            marginBottom: 8,
          }}>
            <motion.div
              initial={{ left: "0%" }}
              animate={{ left: `${level.pct}%` }}
              transition={{ delay: 0.35, duration: 1.0, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                position: "absolute",
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
              <span key={l} style={{ fontSize: 9, color: "var(--color-text-muted)", fontWeight: 500 }}>{l}</span>
            ))}
          </div>
        </div>

        {/* ── Description callout ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          style={{
            margin: "0 24px",
            padding: "14px 16px",
            borderRadius: 14,
            background: level.bg,
            borderLeft: `3px solid ${level.color}`,
          }}
        >
          <p style={{ fontSize: 12, color: "var(--color-text-body)", lineHeight: 1.6 }}>
            {level.description}
          </p>
        </motion.div>

        {/* ── Metrics grid ──────────────────────────────────── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 0,
          margin: "16px 24px 0",
          borderRadius: 14, overflow: "hidden",
          border: "1px solid var(--color-border)",
        }}>
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
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
                {m.value}
              </p>
              <p style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text)", marginBottom: 2 }}>
                {m.label}
              </p>
              <p style={{ fontSize: 9, color: "var(--color-text-muted)", lineHeight: 1.3 }}>
                {m.sub}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── CTA ───────────────────────────────────────────── */}
        <div style={{ padding: "20px 24px 24px" }}>
          <button onClick={onContinue} style={{
            width: "100%", padding: "16px 20px",
            borderRadius: 16, fontSize: 15, fontWeight: 700,
            background: "var(--color-primary)", color: "#ffffff",
            border: "none", cursor: "pointer",
            boxShadow: "var(--shadow-btn-primary)",
            letterSpacing: "0.01em",
          }}>
            See my full results →
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
  const BRAIN_SIZE = 130;

  return (
    /* Full-height centered wrapper */
    <div style={{
      height: "100%",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "20px 20px 32px",
      overflowY: "auto",
    }}>
    <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Comparison card ──────────────────────────────── */}
      <div style={{
        borderRadius: 22, overflow: "hidden",
        background: "var(--color-bg-card)",
        boxShadow: "var(--shadow-card)",
      }}>
        {/* Header tabs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          {["Now", "After 4 weeks"].map((label, i) => (
            <div key={label} style={{
              padding: "10px 8px", textAlign: "center",
              fontSize: 13, fontWeight: 700,
              color: i === 0 ? "var(--color-text-muted)" : "var(--color-primary)",
              background: i === 0 ? "var(--color-bg-card-2)" : "rgba(74,127,165,0.1)",
              borderBottom: `2px solid ${i === 0 ? "var(--color-border)" : "#6AA3C8"}`,
            }}>
              {label}
            </div>
          ))}
        </div>

        {/* Brain row — fixed sizes, no aspect-ratio stretch */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 16, padding: "20px 16px",
        }}>
          {/* Left — stressed */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            style={{
              width: BRAIN_SIZE, height: BRAIN_SIZE, borderRadius: "50%", flexShrink: 0,
              background: "radial-gradient(circle at 35% 35%, #FEF4E7, #F5C17A, #E87450)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              boxShadow: "0 6px 20px rgba(232,116,80,0.3)",
            }}
          >
            <span style={{ fontSize: 34 }}>🧠</span>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#CC5C3A", marginTop: 4 }}>With ADHD</p>
          </motion.div>

          {/* Arrow */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.25 }}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path d="M4 16h18M22 16l-6-6M22 16l-6 6" stroke="#C4BDB5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M26 16h2" stroke="#9B9BB5" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </motion.div>

          {/* Right — calm */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.22, duration: 0.4 }}
            style={{
              width: BRAIN_SIZE, height: BRAIN_SIZE, borderRadius: "50%", flexShrink: 0,
              background: "radial-gradient(circle at 35% 35%, #EAF2F8, #6AA3C8, #4A7FA5)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              boxShadow: "0 6px 20px rgba(74,127,165,0.28)",
            }}
          >
            <span style={{ fontSize: 34, filter: "hue-rotate(190deg) saturate(1.1)" }}>🧠</span>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#4A7FA5", marginTop: 4 }}>Normal brain</p>
          </motion.div>
        </div>
      </div>

      {/* ── Text card ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.25 }}
        style={{
          borderRadius: 22, padding: "20px 22px",
          background: "var(--color-bg-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <h2 style={{
          fontSize: 18, fontWeight: 800,
          color: "var(--color-primary)", lineHeight: 1.35, marginBottom: 8,
        }}>
          Your results are almost ready —{" "}
          <span style={{ color: "var(--color-accent)" }}>and they can change everything</span>
        </h2>
        <p style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.65 }}>
          Based on your responses, we've generated a complete report with your ADHD profile and a personalized guide of strategies for your daily life.
        </p>
      </motion.div>

      {/* ── CTA ──────────────────────────────────────────── */}
      <button onClick={onContinue} style={{
        width: "100%", padding: "15px 20px",
        borderRadius: 16, fontSize: 15, fontWeight: 700,
        background: "var(--color-primary)", color: "#ffffff",
        border: "none", cursor: "pointer",
        boxShadow: "var(--shadow-btn)",
      }}>
        Continue
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
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{
            width: 80, height: 80, borderRadius: 22, margin: "0 auto 16px",
        background: "linear-gradient(135deg, #EAF2F8 0%, #D4E8F5 100%)",
          boxShadow: "0 8px 32px rgba(74,127,165,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36,
          }}
        >
          ✉️
        </motion.div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-primary)", lineHeight: 1.35 }}>
          Your ADHD results are almost ready!
        </h2>
      </div>

      {/* Input */}
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)",
          color: "var(--color-text-muted)", pointerEvents: "none",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </span>
        <input
          type="email"
          placeholder="your@email.com"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          style={{
            width: "100%", padding: "17px 18px 17px 48px",
            borderRadius: 16,
            background: "var(--color-bg-card)",
            border: "1.5px solid var(--color-border)",
            color: "var(--color-primary)",
            fontSize: 15, outline: "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
            boxShadow: "0 1px 3px rgba(142,154,175,0.06)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#6AA3C8";
            e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(74,127,165,0.2)";
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
        background: "rgba(74,127,165,0.08)",
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
        <span style={{ color: "var(--color-primary)", textDecoration: "underline", cursor: "pointer" }}>Terms of Use</span>,{" "}
        <span style={{ color: "var(--color-primary)", textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>, and{" "}
        <span style={{ color: "var(--color-primary)", textDecoration: "underline", cursor: "pointer" }}>Subscription Policy</span>.
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
            ? { background: "var(--color-primary)", color: "#ffffff", boxShadow: "var(--shadow-btn)", cursor: "pointer" }
            : { background: "var(--color-border)", color: "var(--color-text-muted)", cursor: "not-allowed" }),
        }}
      >
        Continue
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
      <motion.div
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
          /* People-group illustration when no emoji is set */
          <img
            src="/illustrations/people-group.png"
            alt=""
            style={{ width: "100%", maxWidth: 320, height: "auto", objectFit: "contain" }}
          />
        ) : (
          /* Emoji bubble for regular info cards */
          <div style={{
            width: 110, height: 110, borderRadius: 28,
            background: "var(--color-primary-tint)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 56,
            boxShadow: "0 6px 24px rgba(74,127,165,0.14)",
          }}>
            {question.infoEmoji}
          </div>
        )}
      </motion.div>

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
        <motion.h2
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
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.26 }}
          style={{
            fontSize: 14, color: "var(--color-text-body)",
            lineHeight: 1.65, marginBottom: 32,
          }}
        >
          {question.infoBody}
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.24 }}
          onClick={onContinue}
          style={{
            width: "100%",
            padding: "16px 24px", borderRadius: 14,
            fontSize: 15, fontWeight: 700,
            background: "var(--color-primary)", color: "#ffffff",
            border: "none", cursor: "pointer",
            boxShadow: "var(--shadow-btn)",
          }}
        >
          Continue
        </motion.button>
      </div>
    </div>
  );
}

/* ── App illustration SVG (person interacting with app UI) ─────── */
function AppIllustration() {
  return (
    <svg viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", maxWidth: 280, height: "auto", display: "block" }}>
      {/* Gear left */}
      <circle cx="58" cy="94" r="22" fill="none" stroke="#D4E8F5" strokeWidth="8" />
      <circle cx="58" cy="94" r="10" fill="#D4E8F5" />
      {[0,60,120,180,240,300].map((a, i) => (
        <rect key={i} x="54" y="68" width="8" height="12" rx="3" fill="#D4E8F5"
          transform={`rotate(${a} 58 94)`} />
      ))}

      {/* Gear right */}
      <circle cx="220" cy="136" r="16" fill="none" stroke="#EAF2F8" strokeWidth="6" />
      <circle cx="220" cy="136" r="7" fill="#EAF2F8" />
      {[0,72,144,216,288].map((a, i) => (
        <rect key={i} x="217" y="116" width="6" height="10" rx="2.5" fill="#EAF2F8"
          transform={`rotate(${a} 220 136)`} />
      ))}

      {/* Phone frame */}
      <rect x="118" y="20" width="100" height="160" rx="14" fill="white"
        stroke="#EAF2F8" strokeWidth="2" />

      {/* Phone screen content */}
      <rect x="127" y="35" width="82" height="10" rx="4" fill="#EAF2F8" />
      <rect x="127" y="52" width="60" height="8" rx="3" fill="#D4E8F5" />

      {/* Colored blocks on phone */}
      <rect x="127" y="70" width="36" height="36" rx="8" fill="#4A7FA5" opacity="0.8" />
      <polygon points="139,80 151,88 139,96" fill="white" />
      <rect x="169" y="70" width="36" height="36" rx="8" fill="#E87450" opacity="0.8" />
      <rect x="178" y="83" width="18" height="4" rx="2" fill="white" />
      <rect x="178" y="91" width="12" height="4" rx="2" fill="white" />

      <rect x="127" y="114" width="78" height="8" rx="3" fill="#EAF2F8" />
      <rect x="127" y="128" width="52" height="8" rx="3" fill="#EAF2F8" />

      {/* Floating shapes */}
      <rect x="90" y="30" width="20" height="20" rx="5" fill="#6AA3C8" opacity="0.5"
        transform="rotate(15 100 40)" />
      <circle cx="240" cy="52" r="10" fill="#E87450" opacity="0.3" />
      <polygon points="230,160 245,140 260,160" fill="#4A7FA5" opacity="0.25" />

      {/* Person — back view */}
      <ellipse cx="100" cy="52" rx="18" ry="20" fill="#F0B88A" />
      {/* Hair */}
      <path d="M82 52 Q84 30 100 28 Q116 30 118 52 Q108 38 100 37 Q92 38 82 52Z" fill="#D44070" />
      {/* Body/shirt */}
      <path d="M72 80 Q70 66 82 60 L100 68 L118 60 Q130 66 128 80 L130 170 H70Z" fill="#D44070" />
      {/* Arm pointing to phone */}
      <path d="M128 72 Q150 80 160 90" stroke="#D44070" strokeWidth="14" strokeLinecap="round" fill="none" />
      <ellipse cx="163" cy="92" rx="10" ry="9" fill="#F0B88A" />
      {/* Other arm */}
      <path d="M72 72 Q58 84 56 110" stroke="#D44070" strokeWidth="14" strokeLinecap="round" fill="none" />
      <ellipse cx="54" cy="113" rx="10" ry="9" fill="#F0B88A" />

      {/* Question mark bubble */}
      <rect x="80" y="120" width="32" height="24" rx="8" fill="#4A7FA5" opacity="0.15"
        stroke="#4A7FA5" strokeWidth="1.5" />
      <text x="96" y="137" textAnchor="middle" fontSize="14" fontWeight="800"
        fill="#4A7FA5" opacity="0.8">?</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main InfoCard — routes to correct variant
───────────────────────────────────────────────────────────────── */
export function InfoCard({ question }: InfoCardProps) {
  const { submitInfo, setEmail } = useQuizStore();
  const variant = question.infoBody;

  const handleContinue = () => submitInfo();
  const handleEmail    = (email: string) => { setEmail(email); submitInfo(); };

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
