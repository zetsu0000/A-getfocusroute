"use client";

import { useRef, useCallback } from "react";

/**
 * TiltCard — pointer-tracked 3D tilt with a roaming glare highlight.
 * The V2 "premium object" treatment for artifact cards. Mouse-only;
 * static (but still styled) on touch and under reduced motion.
 */
export function TiltCard({
  children,
  maxTilt = 7,
  glare = true,
  glareColor = "rgba(255,255,255,0.10)",
  style,
  className,
}: {
  children: React.ReactNode;
  maxTilt?: number;
  glare?: boolean;
  /** Roaming highlight tint. Light surfaces want a cool sheen, not white. */
  glareColor?: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner || e.pointerType !== "mouse") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const rect = outer.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rx = (0.5 - py) * maxTilt * 2;
      const ry = (px - 0.5) * maxTilt * 2;
      inner.style.transition = "transform 0.1s ease-out";
      inner.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      const g = glareRef.current;
      if (g) {
        g.style.opacity = "1";
        g.style.background = `radial-gradient(420px circle at ${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%, ${glareColor}, transparent 55%)`;
      }
    },
    [maxTilt, glareColor],
  );

  const onLeave = useCallback(() => {
    const inner = innerRef.current;
    if (inner) {
      inner.style.transition = "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
      inner.style.transform = "rotateX(0deg) rotateY(0deg)";
    }
    const g = glareRef.current;
    if (g) g.style.opacity = "0";
  }, []);

  return (
    <div
      ref={outerRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={className}
      style={{ perspective: 1100, ...style }}
    >
      <div
        ref={innerRef}
        style={{
          position: "relative",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {children}
        {glare && (
          <div
            ref={glareRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              opacity: 0,
              transition: "opacity 0.4s",
              pointerEvents: "none",
              zIndex: 5,
            }}
          />
        )}
      </div>
    </div>
  );
}
