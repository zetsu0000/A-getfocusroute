"use client";

import type { ResultScoreData } from "@/lib/result-score-data";

/*
 * Result focus-friction score module.
 *
 * Premium, mobile-first presentation of the canonical score produced by
 * resolveResultScoreData (PR #50). This component is purely
 * presentational: it never computes or fabricates a score. ChartScreen resolves
 * the data and only renders this module when a real score is available, so an
 * unavailable score simply means the module is absent — no 0/57 placeholder.
 *
 * Framing is deliberately non-clinical: the number is an aggregate of the
 * focus-friction signals the user reported, on a 0–100 orientation (higher =
 * more reported friction). It is never a focus percentage, an intelligence or
 * productivity measure, a medical or clinical reading, or a comparison against
 * other people. The explanation is intentionally universal — the aggregate
 * score does NOT prove which situation a given value came from, so we add no
 * interpretation bands, thresholds, or inferred problem areas.
 */

export function ResultScoreModule({
  score,
  accent,
}: {
  score: ResultScoreData;
  accent: string;
}) {
  const span = Math.max(1, score.maximum - score.minimum);
  const pct = Math.max(
    0,
    Math.min(100, ((score.value - score.minimum) / span) * 100),
  );

  /* The per-pattern accent is tuned AA on white. On the dark score card it is
     mixed toward white via the theme-aware --v2-score-accent-lift token (42% in
     dark, 0% in light) so the number, track and marker stay legible without any
     hardcoded theme check or extra glow. */
  const scoreAccent = `color-mix(in srgb, ${accent}, #FFFFFF var(--v2-score-accent-lift, 0%))`;

  return (
    <div
      className="v2-panel"
      style={{ padding: "20px 20px 18px", position: "relative", overflow: "hidden" }}
    >
      <p className="v2-hud" style={{ color: "var(--v2-ink-dim)", letterSpacing: "0.18em" }}>
        Your focus-friction score
      </p>

      {/* Large, readable score with its explicit range */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <span
          className="v2-display"
          style={{
            fontSize: "clamp(48px, 16vw, 64px)",
            fontWeight: 600,
            lineHeight: 1,
            color: scoreAccent,
            letterSpacing: "-0.03em",
          }}
        >
          {score.value}
        </span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "var(--v2-ink-dim)",
            letterSpacing: "-0.01em",
          }}
        >
          / {score.maximum}
        </span>
      </div>

      {/* Restrained 0–100 track with a marker — orientation, not a clinical gauge */}
      <div style={{ marginTop: 14 }}>
        <div
          aria-hidden="true"
          style={{
            position: "relative",
            height: 7,
            borderRadius: 999,
            background: "rgba(148,163,255,0.12)",
            border: "1px solid var(--v2-line)",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${pct}%`,
              borderRadius: 999,
              background: `linear-gradient(90deg, color-mix(in srgb, ${accent} 62%, transparent), ${scoreAccent})`,
            }}
          />
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: `${pct}%`,
              width: 13,
              height: 13,
              marginTop: -6.5,
              marginLeft: -6.5,
              borderRadius: "50%",
              background: scoreAccent,
              boxShadow: `0 0 7px color-mix(in srgb, ${accent} 55%, transparent)`,
              border: "2px solid var(--v2-bg-raise)",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 7,
          }}
        >
          <span
            className="v2-hud"
            style={{ fontSize: 11, letterSpacing: "0.04em", color: "var(--v2-ink-dim)", whiteSpace: "nowrap" }}
          >
            {score.minimum} · less friction
          </span>
          <span
            className="v2-hud"
            style={{ fontSize: 11, letterSpacing: "0.04em", color: "var(--v2-ink-dim)", whiteSpace: "nowrap" }}
          >
            more friction · {score.maximum}
          </span>
        </div>
      </div>

      {/* Compact, universal explanation — no interpretation bands or inferred areas.
          Three short lines with a clear hierarchy, not one dense paragraph. */}
      <p
        style={{
          marginTop: 14,
          fontSize: 14.5,
          color: "var(--v2-ink)",
          lineHeight: 1.45,
        }}
      >
        This score summarizes the focus friction you reported in this assessment.
      </p>

      {/* Direction note — essential to reading the score, so it stays legible */}
      <p
        style={{
          marginTop: 7,
          fontSize: 13.5,
          color: "var(--v2-ink-dim)",
          lineHeight: 1.45,
        }}
      >
        Higher means more frequent or stronger friction — not less ability.
      </p>

      {/* Non-clinical disclaimer — may remain smaller */}
      <p
        style={{
          marginTop: 9,
          fontSize: 11.5,
          color: "var(--v2-ink-faint)",
          lineHeight: 1.45,
        }}
      >
        Based on your answers. Not a diagnosis.
      </p>
    </div>
  );
}
