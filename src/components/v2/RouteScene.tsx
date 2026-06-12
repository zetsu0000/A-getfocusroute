"use client";

import { useEffect, useRef } from "react";

/**
 * RouteScene — the homepage hero's WebGL moment.
 *
 * A nebula of scattered attention-particles in real 3D space with a luminous
 * route ribbon winding through it. The ribbon draws itself in as the user
 * scrolls the hero (noise becomes a route), the camera drifts slowly and
 * leans toward the pointer for Z-depth parallax.
 *
 * three.js is imported lazily inside the effect so the ~150KB chunk only
 * loads when the hero actually mounts. Degrades to the CSS aurora behind it
 * if WebGL is unavailable; renders a single static frame under
 * prefers-reduced-motion.
 */

type Props = {
  /** Ref-like getter for scroll progress 0..1 used to draw the route in. */
  progressRef?: React.RefObject<number>;
  style?: React.CSSProperties;
  className?: string;
};

export function RouteScene({ progressRef, style, className }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      let THREE: typeof import("three");
      try {
        THREE = await import("three");
      } catch {
        return; // chunk failed — CSS atmosphere carries the hero
      }
      if (disposed || !mountRef.current) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isSmall = window.innerWidth < 720;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: !isSmall, alpha: true, powerPreference: "high-performance" });
      } catch {
        return; // no WebGL — silent fallback
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2));
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.inset = "0";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x06070d, 0.16);

      const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 60);
      camera.position.set(0, 0.1, 7.2);

      /* ── particle nebula ──────────────────────────────────────── */
      function makeSpriteTexture(r: number, g: number, b: number) {
        const c = document.createElement("canvas");
        c.width = 64;
        c.height = 64;
        const ctx = c.getContext("2d")!;
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, "rgba(255,255,255,0.95)");
        grad.addColorStop(0.3, `rgba(${r},${g},${b},0.55)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        const tex = new THREE.CanvasTexture(c);
        tex.needsUpdate = true;
        return tex;
      }

      function makeCloud(count: number, tex: import("three").Texture, size: number, spread: [number, number, number]) {
        const positions = new Float32Array(count * 3);
        const phases = new Float32Array(count);
        for (let i = 0; i < count; i++) {
          positions[i * 3 + 0] = (Math.random() - 0.5) * spread[0];
          positions[i * 3 + 1] = (Math.random() - 0.5) * spread[1];
          positions[i * 3 + 2] = (Math.random() - 0.5) * spread[2];
          phases[i] = Math.random() * Math.PI * 2;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
          size,
          map: tex,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          sizeAttenuation: true,
        });
        return { points: new THREE.Points(geo, mat), positions, phases, geo, mat };
      }

      const texIndigo = makeSpriteTexture(124, 138, 255);
      const texCyan = makeSpriteTexture(155, 232, 255);
      const cloudA = makeCloud(isSmall ? 420 : 900, texIndigo, 0.085, [16, 9, 12]);
      const cloudB = makeCloud(isSmall ? 180 : 380, texCyan, 0.06, [18, 10, 14]);
      scene.add(cloudA.points);
      scene.add(cloudB.points);

      /* ── the route ribbon ─────────────────────────────────────── */
      const routePoints = [
        new THREE.Vector3(-7.5, -1.6, -4.5),
        new THREE.Vector3(-4.2, 0.4, -2.0),
        new THREE.Vector3(-1.6, -0.7, 0.4),
        new THREE.Vector3(0.8, 0.9, 1.4),
        new THREE.Vector3(3.0, -0.2, 0.2),
        new THREE.Vector3(5.4, 1.2, -2.2),
        new THREE.Vector3(8.2, 0.2, -5.0),
      ];
      const curve = new THREE.CatmullRomCurve3(routePoints, false, "catmullrom", 0.6);

      const tubeSegments = 240;
      const coreGeo = new THREE.TubeGeometry(curve, tubeSegments, 0.016, 8, false);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x9be8ff,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      scene.add(core);

      const glowGeo = new THREE.TubeGeometry(curve, tubeSegments, 0.075, 8, false);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x7c8aff,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      scene.add(glow);

      const coreIndexCount = coreGeo.index ? coreGeo.index.count : 0;
      const glowIndexCount = glowGeo.index ? glowGeo.index.count : 0;

      // head beacon that rides the end of the drawn route
      const headTex = makeSpriteTexture(155, 232, 255);
      const headMat = new THREE.SpriteMaterial({
        map: headTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const head = new THREE.Sprite(headMat);
      head.scale.setScalar(0.55);
      scene.add(head);

      /* ── interaction state ────────────────────────────────────── */
      let pointerX = 0;
      let pointerY = 0;
      let targetX = 0;
      let targetY = 0;
      let drawn = reduceMotion ? 1 : 0.12;
      let t = 0;
      let raf = 0;
      let running = false;
      let visible = true;
      let inView = true;

      function resize() {
        const rect = mount!.getBoundingClientRect();
        const w = Math.max(1, rect.width);
        const h = Math.max(1, rect.height);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }

      function frame() {
        t += 0.0045;

        // route draw-in follows scroll progress (eased)
        const target = reduceMotion ? 1 : Math.min(1, 0.12 + (progressRef?.current ?? 0) * 0.95);
        drawn += (target - drawn) * 0.05;
        coreGeo.setDrawRange(0, Math.floor(coreIndexCount * drawn));
        glowGeo.setDrawRange(0, Math.floor(glowIndexCount * drawn));

        const headPos = curve.getPointAt(Math.max(0.001, Math.min(0.999, drawn)));
        head.position.copy(headPos);
        const pulse = 0.5 + Math.sin(t * 18) * 0.12;
        head.scale.setScalar(pulse);

        // nebula breathing
        cloudA.points.rotation.y = t * 0.16;
        cloudA.points.rotation.x = Math.sin(t * 0.4) * 0.04;
        cloudB.points.rotation.y = -t * 0.1;
        cloudB.points.position.y = Math.sin(t * 0.6) * 0.2;

        // camera: slow drift + pointer parallax
        pointerX += (targetX - pointerX) * 0.035;
        pointerY += (targetY - pointerY) * 0.035;
        camera.position.x = Math.sin(t * 0.5) * 0.35 + pointerX * 0.7;
        camera.position.y = 0.1 + Math.cos(t * 0.35) * 0.18 - pointerY * 0.5;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      }

      function loop() {
        if (!running) return;
        frame();
        raf = requestAnimationFrame(loop);
      }
      function start() {
        if (running || reduceMotion || !visible || !inView) return;
        running = true;
        raf = requestAnimationFrame(loop);
      }
      function stop() {
        running = false;
        cancelAnimationFrame(raf);
      }

      resize();
      if (reduceMotion) {
        frame(); // single composed frame
      } else {
        start();
      }

      const onPointer = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        targetX = (e.clientX / window.innerWidth - 0.5) * 2;
        targetY = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      const ro = new ResizeObserver(() => {
        resize();
        if (reduceMotion) frame();
      });
      ro.observe(mount);

      const io = new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting;
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

      cleanup = () => {
        stop();
        window.removeEventListener("pointermove", onPointer);
        document.removeEventListener("visibilitychange", onVis);
        ro.disconnect();
        io.disconnect();
        cloudA.geo.dispose();
        cloudA.mat.dispose();
        cloudB.geo.dispose();
        cloudB.mat.dispose();
        coreGeo.dispose();
        coreMat.dispose();
        glowGeo.dispose();
        glowMat.dispose();
        headMat.dispose();
        texIndigo.dispose();
        texCyan.dispose();
        headTex.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
    // progressRef is a stable ref container — scene mounts once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}
