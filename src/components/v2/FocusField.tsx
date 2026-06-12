"use client";

import { useEffect, useRef } from "react";

/**
 * FocusField — the V2 signature "noise → signal" particle canvas.
 *
 * Renders a field of drifting attention-particles. At coherence 0 they wander
 * chaotically (noise); as coherence approaches 1 they fall into a luminous
 * stream along a slowly-breathing route curve (signal). The quiz drives
 * coherence with answer progress, so the user literally watches their
 * scattered state organize into a route.
 *
 * Pure 2D canvas: no deps, DPR-capped, pauses off-screen / hidden tab,
 * renders one static frame under prefers-reduced-motion.
 */

type Props = {
  /** 0 = pure noise, 1 = fully organized stream. */
  coherence?: number;
  /** Particle color as "R,G,B". Defaults to the V2 signal indigo. */
  accentRgb?: string;
  /** Secondary tint, mixed into ~30% of particles. */
  accentRgb2?: string;
  /** Overall opacity multiplier for the whole layer. */
  intensity?: number;
  /** Draw the faint route curve once coherence passes 0.45. */
  showRoute?: boolean;
  /** Particles per 10k px² baseline (auto-reduced on small screens). */
  density?: number;
  /** Particles yield around the pointer — attention parting the noise. */
  interactive?: boolean;
  style?: React.CSSProperties;
  className?: string;
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  seed: number;
  size: number;
  tint: boolean;
}

export function FocusField({
  coherence = 0,
  accentRgb = "124,138,255",
  accentRgb2 = "155,232,255",
  intensity = 1,
  showRoute = false,
  density = 1,
  interactive = false,
  style,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coherenceRef = useRef(coherence);
  coherenceRef.current = coherence;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmall = window.innerWidth < 720;
    const dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2);

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frame = 0;
    let running = false;
    let visible = true;
    let inView = true;
    let t = Math.random() * 1000;
    // Eased coherence so prop jumps (question advance) glide instead of snap.
    let eased = coherenceRef.current;
    // Pointer state in canvas space (interactive mode only).
    let px = -9999;
    let py = -9999;
    let pointerActive = false;

    // Pre-rendered tinted glow sprites — drawImage is far cheaper than
    // per-particle radial gradients.
    const SPRITE = 32;
    function makeSprite(rgb: string) {
      const s = document.createElement("canvas");
      s.width = SPRITE;
      s.height = SPRITE;
      const c2 = s.getContext("2d")!;
      const grad = c2.createRadialGradient(SPRITE / 2, SPRITE / 2, 0, SPRITE / 2, SPRITE / 2, SPRITE / 2);
      grad.addColorStop(0, `rgba(255,255,255,0.9)`);
      grad.addColorStop(0.25, `rgba(${rgb},0.55)`);
      grad.addColorStop(1, `rgba(${rgb},0)`);
      c2.fillStyle = grad;
      c2.fillRect(0, 0, SPRITE, SPRITE);
      return s;
    }
    const spriteMain = makeSprite(accentRgb);
    const spriteAlt = makeSprite(accentRgb2);

    function routeY(x: number, time: number): number {
      // The breathing route curve the particles converge onto.
      const k1 = Math.sin((x / width) * Math.PI * 1.6 + time * 0.18);
      const k2 = Math.sin((x / width) * Math.PI * 3.4 - time * 0.11);
      return height * 0.52 + k1 * height * 0.14 + k2 * height * 0.05;
    }

    function seedParticles() {
      const area = width * height;
      const base = Math.round((area / 11000) * density);
      const count = Math.max(36, Math.min(isSmall ? 90 : 170, base));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        seed: Math.random() * 100,
        size: 0.55 + Math.random() * 1.4,
        tint: Math.random() < 0.3,
      }));
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedParticles();
    }

    function step() {
      t += 0.016;
      eased += (coherenceRef.current - eased) * 0.03;
      const c = Math.max(0, Math.min(1, eased));

      ctx!.clearRect(0, 0, width, height);

      // Route curve underlay once the field is organizing.
      if (showRoute && c > 0.45) {
        const alpha = (c - 0.45) * 0.5;
        ctx!.beginPath();
        for (let x = 0; x <= width; x += 14) {
          const y = routeY(x, t);
          if (x === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        const routeGrad = ctx!.createLinearGradient(0, 0, width, 0);
        routeGrad.addColorStop(0, `rgba(${accentRgb},0)`);
        routeGrad.addColorStop(0.5, `rgba(${accentRgb},${alpha})`);
        routeGrad.addColorStop(1, `rgba(${accentRgb2},0)`);
        ctx!.strokeStyle = routeGrad;
        ctx!.lineWidth = 1.4;
        ctx!.stroke();
      }

      ctx!.globalCompositeOperation = "lighter";

      for (const p of particles) {
        // Chaos: slow Brownian wander.
        const wob = p.seed + t * 0.7;
        const chaosVx = Math.sin(wob * 1.3) * 0.42 + Math.cos(wob * 0.7) * 0.2;
        const chaosVy = Math.cos(wob * 1.1) * 0.42 + Math.sin(wob * 0.5) * 0.2;

        // Signal: flow rightward along the route, pulled to the curve.
        const targetY = routeY(p.x, t) + Math.sin(p.seed * 7) * height * 0.045;
        const flowVx = 0.85 + Math.sin(p.seed) * 0.2;
        const flowVy = (targetY - p.y) * 0.028;

        p.vx += ((chaosVx * (1 - c) + flowVx * c) - p.vx) * 0.06;
        p.vy += ((chaosVy * (1 - c) + flowVy * c) - p.vy) * 0.06;

        // Pointer repulsion — the field parts gently around attention.
        if (pointerActive) {
          const dx = p.x - px;
          const dy = p.y - py;
          const d2 = dx * dx + dy * dy;
          const R = 130;
          if (d2 < R * R && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const force = ((R - d) / R) * 0.9;
            p.vx += (dx / d) * force;
            p.vy += (dy / d) * force;
          }
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x > width + 12) p.x = -10;
        if (p.x < -12) p.x = width + 10;
        if (p.y > height + 12) p.y = -10;
        if (p.y < -12) p.y = height + 10;

        const twinkle = 0.55 + Math.sin(t * 2 + p.seed * 9) * 0.25;
        const alpha = (0.30 + c * 0.32) * twinkle * intensity;
        const s = p.size * (7 + c * 4);

        ctx!.globalAlpha = alpha;
        ctx!.drawImage(p.tint ? spriteAlt : spriteMain, p.x - s / 2, p.y - s / 2, s, s);
      }

      ctx!.globalAlpha = 1;
      ctx!.globalCompositeOperation = "source-over";
    }

    function loop() {
      if (!running) return;
      step();
      frame = requestAnimationFrame(loop);
    }

    function start() {
      if (running || reduceMotion || !visible || !inView) return;
      running = true;
      frame = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(frame);
    }

    resize();

    if (reduceMotion) {
      // Single calm frame at the requested coherence — no animation loop.
      eased = coherenceRef.current;
      step();
    } else {
      start();
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduceMotion) step();
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) start();
        else stop();
      },
      { threshold: 0.01 },
    );
    io.observe(canvas);

    const onVis = () => {
      visible = document.visibilityState === "visible";
      if (visible) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVis);

    // The canvas itself is pointer-events:none, so interactive mode tracks
    // the window and maps into canvas space.
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const rect = canvas!.getBoundingClientRect();
      px = e.clientX - rect.left;
      py = e.clientY - rect.top;
      pointerActive = px >= -60 && py >= -60 && px <= rect.width + 60 && py <= rect.height + 60;
    };
    const onPointerLeave = () => { pointerActive = false; };
    if (interactive && !reduceMotion) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("pointerleave", onPointerLeave, { passive: true });
    }

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      if (interactive && !reduceMotion) {
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("pointerleave", onPointerLeave);
      }
    };
    // Atmosphere layer: configuration props are stable per mount; coherence flows through a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}
