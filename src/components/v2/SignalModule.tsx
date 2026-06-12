"use client";

import { useRef, useCallback } from "react";

/**
 * SignalModule — the V2 premium card chassis.
 *
 * Layered module chrome (top edge-light, deep gradient body, grain, visible
 * border) with a pointer-reactive light field and border glow that track the
 * cursor. Cards stop being dark boxes and start reading as instrument
 * modules. Mouse-only interactivity; static chrome on touch.
 */
export function SignalModule({
  children,
  accentRgb = "124,138,255",
  pad = "22px 20px",
  radius = 20,
  glowSize = 320,
  className,
  style,
}: {
  children: React.ReactNode;
  accentRgb?: string;
  pad?: string;
  radius?: number;
  glowSize?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const lightRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "mouse") return;
      const root = rootRef.current;
      const light = lightRef.current;
      if (!root || !light) return;
      const rect = root.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      light.style.opacity = "1";
      light.style.background = `radial-gradient(${glowSize}px circle at ${x.toFixed(0)}px ${y.toFixed(0)}px, rgba(${accentRgb},0.13), transparent 62%)`;
      root.style.borderColor = `rgba(${accentRgb},0.42)`;
    },
    [accentRgb, glowSize],
  );

  const onLeave = useCallback(() => {
    const light = lightRef.current;
    const root = rootRef.current;
    if (light) light.style.opacity = "0";
    if (root) root.style.borderColor = "";
  }, []);

  return (
    <div
      ref={rootRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        padding: pad,
        borderRadius: radius,
        border: `1px solid rgba(${accentRgb},0.20)`,
        background: `
          radial-gradient(120% 90% at 50% -20%, rgba(${accentRgb},0.13) 0%, transparent 55%),
          linear-gradient(168deg, rgba(20,25,46,0.92) 0%, rgba(10,13,24,0.94) 55%, rgba(7,9,17,0.96) 100%)
        `,
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.09),
          inset 0 0 0 1px rgba(255,255,255,0.015),
          0 22px 56px rgba(2,3,10,0.6),
          0 0 0 1px rgba(2,3,10,0.4)
        `,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition: "border-color 0.35s, transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s",
        ...style,
      }}
    >
      {/* top edge-light */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: "8%",
          right: "8%",
          height: 1,
          background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.55), transparent)`,
          pointerEvents: "none",
        }}
      />
      {/* module grain */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "120px 120px",
          pointerEvents: "none",
        }}
      />
      {/* pointer light field */}
      <span
        ref={lightRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          transition: "opacity 0.4s",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}
