"use client";

import { useRef, useCallback } from "react";

/**
 * Magnetic — wraps any element with a pointer-attracted hover (Awwwards-style
 * magnetic CTA). The element leans up to `strength`px toward the cursor and
 * springs back on leave. Inert on touch devices and under reduced motion.
 */
export function Magnetic({
  children,
  strength = 7,
  style,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      const el = ref.current;
      if (!el || e.pointerType !== "mouse") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const rect = el.getBoundingClientRect();
      const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      el.style.transition = "transform 0.12s ease-out";
      el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
    },
    [strength],
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.45s cubic-bezier(0.16, 1.4, 0.3, 1)";
    el.style.transform = "translate(0, 0)";
  }, []);

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={className}
      style={{ display: "inline-block", willChange: "transform", ...style }}
    >
      {children}
    </div>
  );
}
