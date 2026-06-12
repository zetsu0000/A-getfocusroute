"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { Star, Check } from "lucide-react";
import { useQuizStore } from "@/store/quizStore";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import { getOrCreateActionEventId, trackEvent } from "@/lib/analytics/client";
import { getSignatureFromAnswers } from "@/lib/signature";
import { FocusField } from "@/components/v2/FocusField";
import { HudLabel } from "@/components/v2/primitives";

const PHASES = [
  { label: "Reading your answers", end: 28 },
  { label: "Finding your focus pattern", end: 58 },
  { label: "Checking what helps you most", end: 82 },
  { label: "Putting your results together", end: 100 },
];

/* Long enough to read as real computation, short enough that a user who just
   answered 20 questions never feels padded (audit: artificial-wait risk). */
const TOTAL_MS = 2200;

const REVIEWS = [
  {
    stars: 5, author: "FocusRoute member",
    title: "Finally something that feels like my brain",
    text: "It was practical and specific. I could see exactly where I lose momentum and what to try first.",
  },
];

export function LoadingScreen() {
  const setStep = useQuizStore((s) => s.setStep);
  const answers = useQuizStore((s) => s.answers);

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const signature = answers.length ? getSignatureFromAnswers(answers).signature : null;
    trackEvent(FIRST_PARTY_EVENTS.quizCompleted, {
      eventId: getOrCreateActionEventId("quiz_completed", "complete_registration"),
      metadata: signature ? { signature_key: signature } : {},
    });

    let frame: number;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / TOTAL_MS) * 100, 100);
      setProgress(pct);

      if (pct < 100) {
        frame = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          const { retakeMode } = useQuizStore.getState();
          setStep(retakeMode ? "chart" : "email");
        }, 300);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  const currentPhaseIdx = PHASES.findIndex((p) => progress < p.end);
  const activeIdx       = currentPhaseIdx === -1 ? PHASES.length - 1 : currentPhaseIdx;

  return (
    <div style={{
      position: "relative",
      minHeight: "100dvh",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "0 24px",
      overflow: "hidden",
    }}>

      {/* The field organizes in lockstep with the computation. */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <FocusField coherence={progress / 100} intensity={0.8} showRoute />
      </div>

      {/* Title + dial */}
      <div style={{ position: "relative", paddingTop: 58, paddingBottom: 30, textAlign: "center" }}>
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <HudLabel tone="signal" style={{ marginBottom: 14 }}>
            Mapping in progress
          </HudLabel>
          <h1
            className="v2-display"
            style={{ fontSize: "clamp(28px, 7vw, 36px)", fontWeight: 550, lineHeight: 1.15 }}
          >
            Tracing your{" "}
            <em className="v2-text-signal" style={{ fontStyle: "italic" }}>focus route</em>
          </h1>
        </m.div>

        {/* Computation dial */}
        <m.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "relative", width: 148, height: 148, margin: "28px auto 0", display: "grid", placeItems: "center" }}
        >
          <m.span
            aria-hidden="true"
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "1px dashed rgba(124,138,255,0.35)",
            }}
          />
          {/* radar sweep — the system actively scanning */}
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 6,
              borderRadius: "50%",
              background:
                "conic-gradient(from 0deg, rgba(155,232,255,0.20) 0deg, rgba(155,232,255,0.04) 46deg, transparent 80deg)",
              animation: "v2-radar-spin 3.2s linear infinite",
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 26,
              borderRadius: "50%",
              border: "1px solid rgba(163,178,255,0.16)",
            }}
          />
          <svg width="148" height="148" viewBox="0 0 148 148" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="74" cy="74" r="63" fill="none" stroke="rgba(163,178,255,0.14)" strokeWidth="2.5" />
            <circle
              cx="74" cy="74" r="63" fill="none"
              stroke="url(#v2-load-grad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 63}
              strokeDashoffset={2 * Math.PI * 63 * (1 - progress / 100)}
              style={{ filter: "drop-shadow(0 0 8px rgba(124,138,255,0.7))", transition: "stroke-dashoffset 0.1s linear" }}
            />
            <defs>
              <linearGradient id="v2-load-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7C8AFF" />
                <stop offset="100%" stopColor="#9BE8FF" />
              </linearGradient>
            </defs>
          </svg>
          <div>
            <p
              className="v2-display"
              style={{ fontSize: 38, fontWeight: 600, color: "#fff", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}
            >
              {Math.round(progress)}
              <span style={{ fontSize: 18, color: "var(--v2-ink-faint)" }}>%</span>
            </p>
          </div>
        </m.div>
      </div>

      {/* Phase log */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="v2-panel"
        style={{ position: "relative", width: "100%", maxWidth: 520, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 13 }}
      >
        {PHASES.map((phase, i) => {
          const done   = progress >= phase.end;
          const active = i === activeIdx && !done;
          return (
            <div key={phase.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${done ? "rgba(155,232,255,0.8)" : active ? "rgba(124,138,255,0.7)" : "var(--v2-line)"}`,
                  background: done ? "rgba(124,138,255,0.18)" : "transparent",
                  boxShadow: active ? "0 0 10px rgba(124,138,255,0.5)" : "none",
                  animation: active ? "v2-blink 1.1s ease-in-out infinite" : "none",
                }}
              >
                {done && <Check size={10} color="var(--v2-signal-2)" strokeWidth={3} />}
                {active && <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--v2-signal-2)" }} />}
              </span>
              <span
                style={{
                  fontFamily: "var(--v2-font-mono)",
                  fontSize: 12.5,
                  letterSpacing: "0.02em",
                  color: done ? "var(--v2-ink)" : active ? "var(--v2-ink-dim)" : "var(--v2-ink-ghost)",
                  transition: "color 0.3s",
                }}
              >
                {phase.label}
              </span>
              {done && (
                <span className="v2-hud" style={{ marginLeft: "auto", fontSize: 9, color: "var(--v2-signal-2)" }}>
                  OK
                </span>
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
          position: "relative",
          display: "flex", flexDirection: "column", alignItems: "center",
          paddingBottom: 48, width: "100%", maxWidth: 520, paddingTop: 26,
        }}
      >
        <p className="v2-display" style={{ fontSize: 21, fontWeight: 600, color: "var(--v2-ink)", textAlign: "center" }}>
          FocusRoute
        </p>
        <p style={{ fontSize: 13.5, color: "var(--v2-ink-faint)", marginTop: 4, marginBottom: 18, textAlign: "center" }}>
          clear, personal next steps for focus
        </p>

        <div className="v2-panel" style={{ width: "100%", padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
            <div style={{ display: "flex", gap: 3 }}>
              {Array.from({ length: REVIEWS[0].stars }).map((_, i) => (
                <Star key={i} size={13} style={{ fill: "var(--v2-gold)", color: "var(--v2-gold)" }} />
              ))}
            </div>
            <span className="v2-hud" style={{ fontSize: 9 }}>{REVIEWS[0].author}</span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--v2-ink)", marginBottom: 6 }}>{REVIEWS[0].title}</p>
          <p style={{ fontSize: 13, color: "var(--v2-ink-dim)", lineHeight: 1.65 }}>{REVIEWS[0].text}</p>
        </div>
      </m.div>
    </div>
  );
}
