"use client";

/**
 * FocusRadar — a CSS-3D orbital instrument: tilted rotating rings, a sweep
 * beam, and orbiting signal nodes around a luminous core. Pure CSS transforms
 * (GPU-composited, no canvas), so it can float inside any section as an
 * ambient "focus map" object. Static under prefers-reduced-motion via the
 * global reduced-motion kill-switch in globals.css.
 */
export function FocusRadar({
  size = 280,
  style,
}: {
  size?: number;
  style?: React.CSSProperties;
}) {
  const ring = (inset: string, duration: string, reverse = false, opacity = 1): React.CSSProperties => ({
    position: "absolute",
    inset,
    borderRadius: "50%",
    border: "1px solid rgba(163,178,255,0.35)",
    boxShadow: "0 0 18px rgba(124,138,255,0.12), inset 0 0 18px rgba(124,138,255,0.08)",
    animation: `v2-radar-spin ${duration} linear infinite ${reverse ? "reverse" : ""}`,
    opacity,
  });

  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        width: size,
        height: size,
        perspective: 900,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          transform: "rotateX(58deg)",
        }}
      >
        {/* concentric rotating rings */}
        <div style={ring("0%", "26s", false, 0.9)}>
          {/* node riding the outer ring */}
          <span
            style={{
              position: "absolute",
              top: "50%",
              right: -3,
              width: 7,
              height: 7,
              marginTop: -3.5,
              borderRadius: 999,
              background: "var(--v2-signal-2)",
              boxShadow: "0 0 12px var(--v2-signal-2)",
            }}
          />
        </div>
        <div style={ring("14%", "19s", true, 0.75)}>
          <span
            style={{
              position: "absolute",
              top: "12%",
              left: "8%",
              width: 5,
              height: 5,
              borderRadius: 999,
              background: "var(--v2-signal)",
              boxShadow: "0 0 10px var(--v2-signal)",
            }}
          />
        </div>
        <div style={ring("30%", "13s", false, 0.6)} />
        <div
          style={{
            position: "absolute",
            inset: "44%",
            borderRadius: "50%",
            border: "1px dashed rgba(163,178,255,0.5)",
            animation: "v2-radar-spin 9s linear infinite reverse",
          }}
        />

        {/* sweep beam */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "conic-gradient(from 0deg, rgba(155,232,255,0.22) 0deg, rgba(155,232,255,0.05) 38deg, transparent 70deg)",
            animation: "v2-radar-spin 6.5s linear infinite",
            maskImage: "radial-gradient(circle, transparent 18%, #000 19%, #000 98%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(circle, transparent 18%, #000 19%, #000 98%, transparent 100%)",
          }}
        />

        {/* cross-hair reference lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "linear-gradient(rgba(163,178,255,0.14), rgba(163,178,255,0.14)) 50% 0/1px 100% no-repeat, linear-gradient(rgba(163,178,255,0.14), rgba(163,178,255,0.14)) 0 50%/100% 1px no-repeat",
          }}
        />
      </div>

      {/* luminous core, standing perpendicular to the dish */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 10,
          height: 10,
          margin: "-5px 0 0 -5px",
          borderRadius: 999,
          background: "var(--v2-signal-2)",
          boxShadow:
            "0 0 14px var(--v2-signal-2), 0 0 44px rgba(124,138,255,0.7), 0 0 90px rgba(124,138,255,0.4)",
          animation: "v2-pulse-ring 2.8s ease-out infinite",
        }}
      />
      {/* vertical signal beam rising from the core */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "50%",
          width: 1,
          height: size * 0.34,
          background: "linear-gradient(to top, rgba(155,232,255,0.55), transparent)",
        }}
      />
    </div>
  );
}
