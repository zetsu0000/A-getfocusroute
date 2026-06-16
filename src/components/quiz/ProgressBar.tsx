"use client";

import { m } from "framer-motion";
import { questions, progressQuestions } from "@/data/questions";
import { useFunnelTheme } from "@/components/v2/FunnelThemeProvider";

interface ProgressBarProps { currentIndex: number }

/**
 * V2 route-line progress: a dashed route track that fills with the luminous
 * signal gradient, led by a glowing head node — progress as a path being
 * traced, not a loading bar. Info-card interstitials appear as station
 * diamonds along the route and light up as the head passes them.
 */

/* Station positions (percent along the route) — one per info interstitial. */
const STATIONS: number[] = (() => {
  const total = progressQuestions.length;
  const out: number[] = [];
  let answered = 0;
  for (const q of questions) {
    if (q.inputType === "info") {
      out.push(Math.round((answered / total) * 100));
    } else {
      answered++;
    }
  }
  // de-dup + drop ends so markers never collide with start/head cap
  return [...new Set(out)].filter((p) => p > 4 && p < 96);
})();

export function ProgressBar({ currentIndex }: ProgressBarProps) {
  const { theme } = useFunnelTheme();
  const dark = theme === "dark";
  const answered = questions
    .slice(0, currentIndex + 1)
    .filter((q) => q.inputType !== "info").length;

  const total    = progressQuestions.length;
  const progress = Math.round((answered / total) * 100);

  return (
    <div
      className="flex-1"
      style={{ position: "relative", height: 14, display: "flex", alignItems: "center" }}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Assessment progress"
    >
      {/* dashed route track */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "6px 0",
          borderRadius: 999,
          background: dark
            ? "repeating-linear-gradient(90deg, rgba(var(--v2-line-rgb),0.28) 0 7px, transparent 7px 14px)"
            : "repeating-linear-gradient(90deg, rgba(70,85,230,0.30) 0 7px, transparent 7px 14px)",
          opacity: dark ? 0.5 : 0.6,
          height: 2,
          top: "50%",
          marginTop: -1,
        }}
      />
      {/* station diamonds — interstitial waypoints on the route */}
      {STATIONS.map((pos) => {
        const passed = progress >= pos;
        return (
          <span
            key={pos}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: `${pos}%`,
              top: "50%",
              transform: "translate(-50%, -50%) rotate(45deg)",
              width: 6,
              height: 6,
              borderRadius: 1.5,
              background: passed ? "var(--v2-signal-2)" : (dark ? "rgba(163,178,255,0.25)" : "rgba(70,85,230,0.22)"),
              border: `1px solid ${passed ? "var(--v2-signal-2)" : (dark ? "rgba(163,178,255,0.4)" : "rgba(70,85,230,0.45)")}`,
              boxShadow: passed ? (dark ? "0 0 10px rgba(155,232,255,0.8)" : "0 0 10px rgba(20,135,181,0.55)") : "none",
              transition: "background 0.4s, box-shadow 0.4s, border-color 0.4s",
              zIndex: 1,
            }}
          />
        );
      })}

      {/* traced signal */}
      <m.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          height: 3,
          borderRadius: 999,
          background: "var(--v2-grad-signal)",
          boxShadow: "0 0 12px rgba(var(--v2-signal-rgb),0.55)",
          zIndex: 2,
        }}
      >
        {/* head node */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: -5,
            top: "50%",
            transform: "translateY(-50%)",
            width: 9,
            height: 9,
            borderRadius: 999,
            background: "var(--v2-signal-2)",
            boxShadow: "0 0 10px var(--v2-signal-2), 0 0 22px rgba(var(--v2-cyan-rgb),0.5)",
            animation: "v2-pulse-ring 2.2s ease-out infinite",
          }}
        />
      </m.div>
    </div>
  );
}
