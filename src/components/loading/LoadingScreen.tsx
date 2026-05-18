"use client";

import { useEffect, useState, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Star, CheckCircle2 } from "lucide-react";
import { useQuizStore } from "@/store/quizStore";

const PHASES = [
  { label: "Reading your Cognitive Mapping Assessment™", end: 24 },
  { label: "Building your Executive Function Radar™", end: 56 },
  { label: "Mapping your Cognitive Signature™", end: 80 },
  { label: "Preparing your partial profile reveal", end: 100 },
];

const TOTAL_MS = 7000;
const MODAL_AT = 38;

const REVIEWS = [
  {
    stars: 5, author: "FocusRoute member",
    title: "Finally a profile that feels like my brain",
    text: "The language was practical and specific. I could see exactly where I lose momentum and what to try first.",
  },
];

export function LoadingScreen() {
  const setStep = useQuizStore((s) => s.setStep);

  const [progress,  setProgress]  = useState(0);
  const [showModal, setShowModal] = useState(false);

  const pausedRef    = useRef(false);
  const pauseMs      = useRef(0);
  const pauseStart   = useRef(0);
  const modalDoneRef = useRef(false);

  useEffect(() => {
    let frame: number;
    const start = Date.now();

    const tick = () => {
      if (pausedRef.current) {
        if (pauseStart.current === 0) pauseStart.current = Date.now();
        frame = requestAnimationFrame(tick);
        return;
      }
      if (pauseStart.current > 0) {
        pauseMs.current   += Date.now() - pauseStart.current;
        pauseStart.current = 0;
      }

      const elapsed = Date.now() - start - pauseMs.current;
      const pct     = Math.min((elapsed / TOTAL_MS) * 100, 100);
      setProgress(pct);

      if (pct >= MODAL_AT && !modalDoneRef.current) {
        modalDoneRef.current = true;
        pausedRef.current    = true;
        setShowModal(true);
      }

      if (pct < 100) {
        frame = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          const { retakeMode } = useQuizStore.getState();
          setStep(retakeMode ? "chart" : "email");
        }, 500);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answerModal = () => {
    setShowModal(false);
    pausedRef.current = false;
  };

  const currentPhaseIdx = PHASES.findIndex((p) => progress < p.end);
  const activeIdx       = currentPhaseIdx === -1 ? PHASES.length - 1 : currentPhaseIdx;
  const activePhase     = PHASES[activeIdx];
  const prevEnd         = activeIdx === 0 ? 0 : PHASES[activeIdx - 1].end;
  const phaseProgress   = Math.min(((progress - prevEnd) / (activePhase.end - prevEnd)) * 100, 100);

  return (
    <>
      <div style={{
        minHeight: "100dvh",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "0 24px",
      }}>

        {/* Title */}
        <div style={{ paddingTop: 68, paddingBottom: 36, textAlign: "center" }}>
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)", lineHeight: 1.2, marginBottom: 2 }}>
              Building your
            </h1>
            <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, color: "var(--color-primary)" }}>
              Brain Profile™...
            </h1>
          </m.div>
        </div>

        {/* Phases */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 18 }}
        >
          {PHASES.map((phase, i) => {
            const done   = progress >= phase.end;
            const active = i === activeIdx && !done;
            return (
              <div key={phase.label}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: active ? 8 : 0 }}>
                  <span style={{
                    fontSize: 14, fontWeight: 600,
                    color: done ? "var(--color-text)" : active ? "var(--color-text-body)" : "var(--color-text-muted)",
                    transition: "color 0.3s",
                  }}>
                    {phase.label}
                  </span>
                  {done ? (
                    <m.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
                      <CheckCircle2 size={18} color="var(--color-primary)" />
                    </m.div>
                  ) : active ? (
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)", fontVariantNumeric: "tabular-nums" }}>
                      {Math.round(phaseProgress)}%
                    </span>
                  ) : null}
                </div>
                {active && (
                  <div style={{ height: 6, borderRadius: 99, background: "var(--color-border)", overflow: "hidden" }}>
                    <m.div
                      animate={{ width: `${phaseProgress}%` }}
                      transition={{ duration: 0.12, ease: "linear" }}
                      style={{
                        height: "100%", borderRadius: 99,
                        background: "linear-gradient(90deg, var(--color-progress-start), var(--color-progress-end))",
                        boxShadow: "0 0 8px rgba(54,96,122,0.32)",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </m.div>

        <div style={{ flex: 1 }} />

        {/* Social proof */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            paddingBottom: 52, width: "100%", maxWidth: 520,
          }}
        >
          <p style={{ fontSize: 26, fontWeight: 800, color: "var(--color-primary)", textAlign: "center" }}>
            FocusRoute Brain OS™
          </p>
          <p style={{ fontSize: 15, color: "var(--color-text-body)", marginTop: 4, marginBottom: 18 }}>
            profile-first clarity for focus and execution patterns
          </p>

          <div style={{
            width: "100%", borderRadius: 20, padding: "20px 22px",
            background: "var(--color-bg-card)", boxShadow: "var(--shadow-card)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: REVIEWS[0].stars }).map((_, i) => (
                  <Star key={i} size={14} style={{ fill: "var(--color-star)", color: "var(--color-star)" }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{REVIEWS[0].author}</span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>{REVIEWS[0].title}</p>
            <p style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.65 }}>{REVIEWS[0].text}</p>
          </div>
        </m.div>
      </div>

      {/* Modal — outside page div to avoid Framer Motion transform containment */}
      <AnimatePresence>
        {showModal && (
          <>
            <m.div
              key="bd"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(28,26,46,0.42)", backdropFilter: "blur(5px)" }}
            />

            <div style={{
              position: "fixed", inset: 0, zIndex: 50,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 24px", pointerEvents: "none",
            }}>
              <m.div
                key="mc"
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88 }}
                transition={{ type: "spring", stiffness: 340, damping: 28 }}
                style={{
                  width: "100%", maxWidth: 440,
                  background: "var(--color-bg-card)",
                  borderRadius: 24, padding: "28px 28px 24px",
                  boxShadow: "0 24px 64px rgba(28,26,46,0.22)",
                  pointerEvents: "auto",
                }}
              >
                <p style={{
                  fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  textAlign: "center", marginBottom: 10,
                }}>
                  Quick check-in
                </p>
                <h2 style={{
                  fontSize: 17, fontWeight: 800, color: "var(--color-text)",
                  textAlign: "center", lineHeight: 1.4, marginBottom: 22,
                }}>
                  Quick pulse check: does profile clarity help you take action faster?
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {["No", "Yes"].map((opt) => (
                    <button
                      key={opt}
                      onClick={answerModal}
                      style={{
                        padding: "14px 20px", borderRadius: 14,
                        fontSize: 15, fontWeight: 700,
                        border: "1.5px solid var(--color-border)",
                        cursor: "pointer",
                        background: "var(--color-bg-card)",
                        color: "var(--color-text-body)",
                        transition: "background 0.15s, color 0.15s, border-color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget;
                        el.style.background  = "var(--color-primary)";
                        el.style.color       = "var(--color-bg-card)";
                        el.style.borderColor = "var(--color-primary)";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget;
                        el.style.background  = "var(--color-bg-card)";
                        el.style.color       = "var(--color-text-body)";
                        el.style.borderColor = "var(--color-border)";
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </m.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
