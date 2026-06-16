/**
 * V2 shared primitives — the small vocabulary of the Focus Observatory.
 * Server-safe (no client APIs); interactive pieces live in their own files.
 */

import type { CSSProperties, ReactNode } from "react";

/** Mono telemetry eyebrow, e.g. "SIGNAL 07 — CALIBRATION". */
export function HudLabel({
  children,
  tone = "faint",
  style,
}: {
  children: ReactNode;
  tone?: "faint" | "signal" | "gold" | "dim";
  style?: CSSProperties;
}) {
  const color =
    tone === "signal" ? "var(--v2-signal-2)" :
    tone === "gold"   ? "var(--v2-gold)" :
    tone === "dim"    ? "var(--v2-ink-dim)" :
    "var(--v2-ink-faint)";
  return (
    <p className="v2-hud" style={{ color, ...style }}>
      {children}
    </p>
  );
}

/** Hairline rule with a luminous core — section separator. */
export function SignalRule({ style }: { style?: CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height: 1,
        width: "100%",
        background:
          "linear-gradient(90deg, transparent, rgba(var(--v2-signal-rgb),0.4) 50%, transparent)",
        ...style,
      }}
    />
  );
}

/** Glass panel wrapper. */
export function GlassPanel({
  children,
  pad = "22px 22px",
  radius = "var(--v2-r-md)",
  style,
  className,
}: {
  children: ReactNode;
  pad?: string;
  radius?: string;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`v2-panel ${className ?? ""}`}
      style={{ padding: pad, borderRadius: radius, ...style }}
    >
      {children}
    </div>
  );
}

/** Tiny status dot + mono caption row (trust chips, telemetry rows). */
export function TelemetryChip({
  children,
  color = "var(--v2-signal-2)",
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontFamily: "var(--v2-font-mono)",
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--v2-ink-faint)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 5,
          height: 5,
          borderRadius: 999,
          background: color,
          boxShadow: `0 0 8px ${color}`,
          flexShrink: 0,
        }}
      />
      {children}
    </span>
  );
}

/** Orbital ring loader — replaces the light-theme spinner inside V2. */
export function OrbitLoader({ size = 52 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "inline-block",
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "1px solid var(--v2-line)",
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "2px solid transparent",
          borderTopColor: "var(--v2-signal)",
          borderRightColor: "var(--v2-signal-2)",
          animation: "v2-orbit-spin 0.9s linear infinite",
        }}
      />
      <span
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 5,
          height: 5,
          marginLeft: -2.5,
          marginTop: -2.5,
          borderRadius: 999,
          background: "var(--v2-signal-2)",
          boxShadow: "0 0 10px var(--v2-signal-2)",
        }}
      />
    </span>
  );
}
