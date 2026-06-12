"use client";

import { useEffect, useRef } from "react";

/**
 * SparkBurst — a single radial burst of luminous sparks, fired once on mount.
 * Used at the result-reveal moment: the signature locking in. Self-disposing
 * (the rAF loop ends when every spark has faded), skipped entirely under
 * prefers-reduced-motion.
 */
export function SparkBurst({
  accentRgb = "124,138,255",
  delay = 500,
  count = 42,
  style,
}: {
  accentRgb?: string;
  delay?: number;
  count?: number;
  style?: React.CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let frame = 0;
    let cancelled = false;

    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = w / 2;
    const cy = h / 2;

    const sparks = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 1.6 + Math.random() * 3.4;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.75,
        life: 1,
        decay: 0.012 + Math.random() * 0.02,
        size: 0.8 + Math.random() * 1.8,
        cyan: Math.random() < 0.35,
      };
    });

    function tick() {
      if (cancelled) return;
      ctx!.clearRect(0, 0, w, h);
      ctx!.globalCompositeOperation = "lighter";
      let alive = 0;
      for (const s of sparks) {
        if (s.life <= 0) continue;
        alive++;
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.965;
        s.vy *= 0.965;
        s.vy += 0.012; // faint gravity — embers settling
        s.life -= s.decay;
        const a = Math.max(0, s.life) * 0.9;
        const rgb = s.cyan ? "155,232,255" : accentRgb;
        ctx!.fillStyle = `rgba(${rgb},${a})`;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.size * (0.5 + s.life * 0.7), 0, Math.PI * 2);
        ctx!.fill();
      }
      if (alive > 0) frame = requestAnimationFrame(tick);
      else ctx!.clearRect(0, 0, w, h);
    }

    const timer = setTimeout(() => {
      frame = requestAnimationFrame(tick);
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
    // fire-once effect; config is stable per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: "-12%",
        width: "124%",
        height: "124%",
        pointerEvents: "none",
        zIndex: 6,
        ...style,
      }}
    />
  );
}
