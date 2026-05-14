"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Star, RotateCcw, Lock, FileText, BookOpen, Zap } from "lucide-react";
import { PriceCard } from "./PriceCard";
import { useQuizStore } from "@/store/quizStore";

const CARD: React.CSSProperties = {
  background: "var(--color-bg-card)",
  boxShadow:  "var(--shadow-card)",
};

const fadeUp = (delay: number): React.ComponentProps<typeof motion.div> => ({
  initial:    { opacity: 0, y: 16 },
  animate:    { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: "easeOut" as const },
});

/* Countdown: 10 min */
function useCountdown(initial = 600) {
  const [secs, setSecs] = useState(initial);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

/* Score map — same logic as InfoCard */
const SCORE_MAP: Record<string, number> = {
  never: 18, rarely: 34, sometimes: 57, often: 74, always: 91,
};

function getAdhdScore(answers: { questionId: string; selectedOptions: string[] }[]) {
  const d  = answers.find((a) => a.questionId === "distraction");
  const id = d?.selectedOptions[0] ?? "sometimes";
  return SCORE_MAP[id] ?? 57;
}

function scoreToLabel(score: number) {
  if (score < 35) return { label: "Low",        color: "#4A7FA5", pct: 20 };
  if (score < 50) return { label: "Mild",       color: "#6AA3C8", pct: 38 };
  if (score < 70) return { label: "Moderate",   color: "#F07000", pct: 62 };
  if (score < 85) return { label: "High",       color: "#CC5C3A", pct: 80 };
  return              { label: "Very High",    color: "#A82E2E", pct: 95 };
}

/* Blurred locked score preview */
function LockedResultPreview() {
  const answers = useQuizStore((s) => s.answers);
  const score   = getAdhdScore(answers);
  const level   = scoreToLabel(score);

  return (
    <div style={{
      borderRadius: 20,
      background: "var(--color-bg-card)",
      boxShadow: "var(--shadow-card)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px",
        background: "linear-gradient(135deg, rgba(74,127,165,0.12), rgba(74,127,165,0.06))",
        borderBottom: "1px solid var(--color-border)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 22 }}>🧠</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text)" }}>Your ADHD Profile</p>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Diagnostic assessment results</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
          <Lock size={13} color="var(--color-accent)" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-accent)" }}>LOCKED</span>
        </div>
      </div>

      {/* Score bar — partially revealed */}
      <div style={{ padding: "18px 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-body)" }}>Symptom level</p>
          <span style={{
            fontSize: 11, fontWeight: 700,
            background: level.color + "22",
            color: level.color,
            padding: "3px 10px", borderRadius: 99,
          }}>
            {level.label}
          </span>
        </div>

        <div style={{
          height: 9, borderRadius: 99,
          background: "linear-gradient(to right, #EAF2F8, #FEF4E7, #F5C17A, #E87450, #A82E2E)",
          marginBottom: 5, position: "relative",
        }}>
          <motion.div
            initial={{ left: 0 }}
            animate={{ left: `${level.pct}%` }}
            transition={{ delay: 0.4, duration: 0.9, ease: "easeOut" }}
            style={{
              position: "absolute", top: "50%",
              transform: "translate(-50%, -50%)",
              width: 16, height: 16, borderRadius: "50%",
              background: "var(--color-primary)",
              border: "2.5px solid white",
              boxShadow: "0 2px 6px rgba(74,127,165,0.4)",
            }}
          />
        </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
          {["Low", "Mild", "Moderate", "High"].map((l) => (
            <span key={l} style={{ fontSize: 10, color: "var(--color-text-muted)" }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Blurred details */}
      <div style={{ padding: "0 20px 20px", position: "relative" }}>
        <div style={{ filter: "blur(5px)", userSelect: "none", pointerEvents: "none" }}>
          <div style={{
            padding: "14px 16px", borderRadius: 14,
            background: "rgba(74,127,165,0.08)",
            border: "1px solid var(--color-border)",
            marginBottom: 10,
          }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-primary)", marginBottom: 4 }}>
              Full profile analysis
            </p>
            <p style={{ fontSize: 12, color: "var(--color-text-body)", lineHeight: 1.5 }}>
              Based on your responses, we identified specific patterns of inattention, impulsivity, and executive difficulties that are impacting your daily routine.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["ADHD Type", "Procrastination level", "Focus pattern", "Recommended strategies"].map((item) => (
              <div key={item} style={{
                padding: "10px 14px", borderRadius: 12,
                background: "var(--color-bg-card-2)",
                border: "1px solid var(--color-border)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 12, color: "var(--color-text-body)" }}>{item}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary)" }}>████████</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lock overlay */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 8,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "var(--color-accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(232,116,80,0.4)",
          }}>
            <Lock size={20} color="white" />
          </div>
          <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text)", textAlign: "center" }}>
            Unlock to see everything
          </p>
        </div>
      </div>
    </div>
  );
}

export function PaywallScreen() {
  const { name, setStep } = useQuizStore();
  const [selected, setSelected] = useState<"annual" | "monthly">("annual");
  const [pressed,  setPressed]  = useState(false);
  const countdown = useCountdown(600);

  const displayName = name || "You";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>

      {/* ── Sticky top bar ─────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "var(--color-bg-page)",
        borderBottom: "1px solid var(--color-border)",
        padding: "12px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 500 }}>Offer reserved for:</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: "var(--color-primary)", fontVariantNumeric: "tabular-nums" }}>
            {countdown}
          </p>
        </div>
        <button
          onClick={() => setStep("paywall")}
          style={{
            padding: "12px 22px", borderRadius: 12,
            background: "var(--color-accent)", color: "#fff",
            fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
            boxShadow: "var(--shadow-btn-accent)",
          }}
        >
          UNLOCK
        </button>
      </div>

      {/* ── Scrollable content ──────────────────────────────────── */}
      <div style={{ padding: "28px 16px 56px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Heading ──────────────────────────────────────── */}
          <motion.div {...fadeUp(0.05)}>
            <h2 style={{ fontSize: 23, fontWeight: 800, color: "var(--color-text)", lineHeight: 1.3 }}>
              <span style={{ color: "var(--color-primary)" }}>{displayName}</span>, your results are ready —{" "}
              <span style={{ color: "var(--color-accent)" }}>but still locked</span>
            </h2>
            <p style={{ marginTop: 8, fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.6 }}>
              Unlock now to see your full ADHD profile and receive a personalized strategy guide.
            </p>
          </motion.div>

          {/* ── Locked result preview ────────────────────────── */}
          <motion.div {...fadeUp(0.10)}>
            <LockedResultPreview />
          </motion.div>

          {/* ── What you unlock ──────────────────────────────── */}
          <motion.div {...fadeUp(0.15)} style={{ ...CARD, borderRadius: 22, padding: "20px 22px" }}>
            <p style={{
              fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16,
            }}>
              What you&apos;ll unlock
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                {
                  icon: FileText,
                  title: "Complete ADHD Report",
                  desc: "Your detailed profile with ADHD type, symptom level, and personalized analysis.",
                },
                {
                  icon: BookOpen,
                  title: "28-Day Action Guide",
                  desc: "Practical, daily strategies to manage focus, procrastination, and impulsivity.",
                },
                {
                  icon: Zap,
                  title: "Techniques tailored to your profile",
                  desc: "Science-backed methods adapted specifically to your ADHD level.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: "var(--color-primary-tint)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={17} color="var(--color-primary)" />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", marginBottom: 2 }}>{title}</p>
                    <p style={{ fontSize: 12, color: "var(--color-text-body)", lineHeight: 1.5 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Social proof ─────────────────────────────────── */}
          <motion.div {...fadeUp(0.18)} style={{
            ...CARD, borderRadius: 22, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{ display: "flex" }}>
              {["🧑‍💻","👩‍🎓","👨‍🏫","👩‍⚕️"].map((e, i) => (
                <div key={i} style={{
                  width: 34, height: 34, borderRadius: "50%", fontSize: 14,
                  background: "rgba(74,127,165,0.1)",
                  border: "2px solid var(--color-bg-card)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginLeft: i > 0 ? -10 : 0,
                }}>{e}</div>
              ))}
            </div>
            <div>
              <div style={{ display: "flex", gap: 2, marginBottom: 3 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} style={{ fill: "var(--color-star)", color: "var(--color-star)" }} />
                ))}
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary)", marginLeft: 5 }}>4.9</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>+200,000 people have already discovered their profile</p>
            </div>
          </motion.div>

          {/* ── Choose your plan ─────────────────────────────── */}
          <motion.div {...fadeUp(0.22)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{
              fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)",
              textTransform: "uppercase", letterSpacing: "0.1em", paddingLeft: 4,
            }}>
              Choose your plan
            </p>
            <PriceCard plan="annual"  isSelected={selected === "annual"}  onSelect={() => setSelected("annual")} />
            <PriceCard plan="monthly" isSelected={selected === "monthly"} onSelect={() => setSelected("monthly")} />
          </motion.div>

          {/* ── CTA card ─────────────────────────────────────── */}
          <motion.div {...fadeUp(0.26)} style={{ ...CARD, borderRadius: 28, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
            <AnimatePresence>
              <motion.button
                animate={pressed
                  ? { scale: 0.97 }
                  : { scale: [1, 1.016, 1], transition: { repeat: Infinity, duration: 2.6, ease: "easeInOut" } }}
                onTapStart={() => setPressed(true)}
                onTap={() => setPressed(false)}
                onTapCancel={() => setPressed(false)}
                style={{
                  width: "100%", padding: "20px 24px", borderRadius: 16,
                  background: "var(--color-accent)", color: "#ffffff",
                  fontSize: 17, fontWeight: 800, border: "none", cursor: "pointer",
                  boxShadow: "var(--shadow-btn-accent)",
                }}
              >
                🔓 Unlock my results now
              </motion.button>
            </AnimatePresence>

            <p style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "center" }}>
              No charge now. Cancel within 7 days and pay nothing.
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28 }}>
              {[
                { icon: Shield,    label: "SSL Secure" },
                { icon: RotateCcw, label: "Cancel anytime" },
                { icon: Lock,      label: "Privacy" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <Icon size={18} color="var(--color-primary)" />
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{label}</span>
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <Star size={18} style={{ color: "var(--color-star)", fill: "var(--color-star)" }} />
                <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>4.9 / 5</span>
              </div>
            </div>
          </motion.div>

          {/* ── Testimonial ──────────────────────────────────── */}
          <motion.div {...fadeUp(0.30)} style={{ ...CARD, borderRadius: 22, padding: "22px 24px", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} style={{ color: "var(--color-star)", fill: "var(--color-star)" }} />
              ))}
            </div>
            <p style={{ fontSize: 14, fontStyle: "italic", color: "var(--color-text-body)", lineHeight: 1.7, marginBottom: 8 }}>
              &quot;The report was eye-opening — I finally understood why I get so distracted. The guide has simple strategies that changed my routine in weeks.&quot;
            </p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>— Rafael T., Systems Analyst</p>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
