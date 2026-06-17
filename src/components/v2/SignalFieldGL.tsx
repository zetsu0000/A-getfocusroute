"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * SignalFieldGL — the shared WebGL ambient that persists across the five
 * infocards and EVOLVES with the narrative: at `coherence` 0 the attention
 * particles are scattered noise; as it approaches 1 they fall onto a luminous,
 * slowly breathing route — so the same field visibly organizes from card 1
 * (recognition) to card 5 (unlock).
 *
 * One scene, one renderer, GPU points. Safe by construction:
 *  - reduced-motion → a single static frame, no RAF loop;
 *  - off-screen / hidden tab → paused (IntersectionObserver + visibility);
 *  - DPR-capped, fewer particles on small screens;
 *  - no WebGL context → graceful CSS-gradient fallback (never throws/crashes);
 *  - fully disposed on unmount (geometry, material, texture, renderer).
 *
 * Pointer-events: none and aria-hidden — it is pure atmosphere.
 */

type Props = {
  /** 0 = scattered noise, 1 = organized route. Flows through a ref (no remount). */
  coherence?: number;
  theme?: "dark" | "light";
  /** Overall opacity multiplier. */
  intensity?: number;
  className?: string;
  style?: React.CSSProperties;
};

function makeSpriteTexture(): THREE.Texture {
  const S = 64;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.65)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export function SignalFieldGL({
  coherence = 0,
  theme = "dark",
  intensity = 1,
  className,
  style,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const coherenceRef = useRef(coherence);
  coherenceRef.current = coherence;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmall = window.innerWidth < 720;
    const dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    } catch {
      // No WebGL — show the CSS fallback instead of crashing.
      setFallback(true);
      return;
    }

    let width = Math.max(1, mount.clientWidth);
    let height = Math.max(1, mount.clientHeight);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
    });

    let aspect = width / height;
    const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10);
    camera.position.z = 2;
    const scene = new THREE.Scene();

    // Particle field — noise position + route target per particle.
    const count = isSmall ? 320 : 640;
    const positions = new Float32Array(count * 3);
    const noise = new Float32Array(count * 3);
    const route = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const palette =
      theme === "light"
        ? [new THREE.Color(0.275, 0.333, 0.902), new THREE.Color(0.078, 0.529, 0.71)] // 70,85,230 / 20,135,181
        : [new THREE.Color(0.486, 0.541, 1.0), new THREE.Color(0.608, 0.91, 1.0)]; // 124,138,255 / 155,232,255

    function routeY(x: number, t: number) {
      return Math.sin(x * 1.6 + t * 0.18) * 0.42 + Math.sin(x * 3.4 - t * 0.11) * 0.14;
    }

    for (let i = 0; i < count; i++) {
      const nx = (Math.random() * 2 - 1) * aspect;
      const ny = Math.random() * 2 - 1;
      noise[i * 3] = nx;
      noise[i * 3 + 1] = ny;
      noise[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
      route[i * 3] = nx;
      route[i * 3 + 1] = routeY(nx, 0) + (Math.random() - 0.5) * 0.12;
      route[i * 3 + 2] = noise[i * 3 + 2];
      positions[i * 3] = nx;
      positions[i * 3 + 1] = ny;
      positions[i * 3 + 2] = noise[i * 3 + 2];
      seeds[i] = Math.random() * 100;
      const col = palette[Math.random() < 0.3 ? 1 : 0];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const sprite = makeSpriteTexture();
    const material = new THREE.PointsMaterial({
      size: isSmall ? 0.05 : 0.045,
      map: sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: theme === "light" ? THREE.NormalBlending : THREE.AdditiveBlending,
      opacity: (theme === "light" ? 0.5 : 0.85) * intensity,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geom, material);
    scene.add(points);

    const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;

    let t = Math.random() * 100;
    let eased = coherenceRef.current;
    let raf = 0;
    let running = false;
    let inView = true;
    let visible = true;

    function frame() {
      t += 0.016;
      eased += (coherenceRef.current - eased) * 0.03;
      const c = Math.max(0, Math.min(1, eased));
      for (let i = 0; i < count; i++) {
        const s = seeds[i];
        const drift = 0.05 * (1 - c);
        const wob = s + t * 0.6;
        const nx = noise[i * 3] + Math.sin(wob) * drift;
        const ny = noise[i * 3 + 1] + Math.cos(wob * 1.1) * drift;
        const rx = route[i * 3];
        const ry = routeY(route[i * 3], t) + (route[i * 3 + 1] - routeY(route[i * 3], 0));
        posAttr.array[i * 3] = nx * (1 - c) + rx * c;
        posAttr.array[i * 3 + 1] = ny * (1 - c) + ry * c;
      }
      posAttr.needsUpdate = true;
      renderer.render(scene, camera);
    }

    function loop() {
      if (!running) return;
      frame();
      raf = requestAnimationFrame(loop);
    }
    function start() {
      if (running || reduceMotion || !inView || !visible) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    if (reduceMotion) {
      eased = coherenceRef.current;
      frame();
    } else {
      start();
    }

    const ro = new ResizeObserver(() => {
      width = Math.max(1, mount.clientWidth);
      height = Math.max(1, mount.clientHeight);
      aspect = width / height;
      camera.left = -aspect;
      camera.right = aspect;
      camera.top = 1;
      camera.bottom = -1;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      if (reduceMotion) frame();
    });
    ro.observe(mount);

    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        if (inView) start();
        else stop();
      },
      { threshold: 0.01 },
    );
    io.observe(mount);

    const onVis = () => {
      visible = document.visibilityState === "visible";
      if (visible) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      geom.dispose();
      material.dispose();
      sprite.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
    // Configuration is stable per mount; coherence/theme flow through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (fallback) {
    // No-WebGL: a calm tinted gradient so the surface is never flat/empty.
    return (
      <div
        aria-hidden="true"
        className={className}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            theme === "light"
              ? "radial-gradient(120% 80% at 50% 0%, rgba(70,85,230,0.10), transparent 60%)"
              : "radial-gradient(120% 80% at 50% 0%, rgba(124,138,255,0.14), transparent 60%)",
          ...style,
        }}
      />
    );
  }

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className={className}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", ...style }}
    />
  );
}
