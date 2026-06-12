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
      // cinematic entrance: the universe fades up once the first frame lands
      renderer.domElement.style.opacity = "0";
      renderer.domElement.style.transition = "opacity 1.6s cubic-bezier(0.22, 1, 0.36, 1)";
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
      // sparse near layer — big soft motes drifting close to camera for
      // strong pointer parallax (the layer that sells the depth)
      const cloudC = makeCloud(isSmall ? 26 : 60, texCyan, 0.30, [13, 7, 4]);
      cloudC.points.position.z = 4.2;
      (cloudC.mat as import("three").PointsMaterial).opacity = 0.32;
      scene.add(cloudA.points);
      scene.add(cloudB.points);
      scene.add(cloudC.points);

      /* ── orbital focus-map — the instrument hanging in the nebula ── */
      const orbital = new THREE.Group();
      const ringDefs = [
        { r: 1.55, tube: 0.0052, color: 0x7c8aff, opacity: 0.62, tiltX: Math.PI / 2.25, tiltZ: 0.0 },
        { r: 1.15, tube: 0.0044, color: 0x9be8ff, opacity: 0.48, tiltX: Math.PI / 1.75, tiltZ: 0.7 },
        { r: 0.78, tube: 0.0040, color: 0x7c8aff, opacity: 0.38, tiltX: Math.PI / 2.9, tiltZ: -0.5 },
      ];
      const ringMeshes = ringDefs.map((d) => {
        const geo = new THREE.TorusGeometry(d.r, d.tube, 6, 110);
        const mat = new THREE.MeshBasicMaterial({
          color: d.color,
          transparent: true,
          opacity: d.opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = d.tiltX;
        mesh.rotation.z = d.tiltZ;
        orbital.add(mesh);
        return { mesh, geo, mat, def: d };
      });
      // orbiting signal nodes riding the outer ring plane
      const nodeCount = isSmall ? 5 : 9;
      const nodes: { sprite: import("three").Sprite; mat: import("three").SpriteMaterial; phase: number; radius: number; speed: number }[] = [];
      for (let i = 0; i < nodeCount; i++) {
        const mat = new THREE.SpriteMaterial({
          map: i % 3 === 0 ? texCyan : texIndigo,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.setScalar(0.10 + (i % 3) * 0.045);
        orbital.add(sprite);
        nodes.push({
          sprite,
          mat,
          phase: (i / nodeCount) * Math.PI * 2,
          radius: 0.78 + (i % 3) * 0.385,
          speed: 0.25 + (i % 4) * 0.09,
        });
      }
      // faint core glow at the orbital center
      const coreGlowMat = new THREE.SpriteMaterial({
        map: texIndigo,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const coreGlow = new THREE.Sprite(coreGlowMat);
      coreGlow.scale.setScalar(0.8);
      orbital.add(coreGlow);
      // desktop: instrument floats right of the headline; mobile: high and deep
      orbital.position.set(isSmall ? 0.4 : 2.6, isSmall ? 1.7 : 0.25, isSmall ? -2.4 : -0.6);
      scene.add(orbital);

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

      // signal packets — luminous motes streaming along the drawn route,
      // the literal "noise becoming signal" current
      const flowCount = isSmall ? 8 : 16;
      const flows: { sprite: import("three").Sprite; mat: import("three").SpriteMaterial; offset: number; speed: number; scale: number }[] = [];
      for (let i = 0; i < flowCount; i++) {
        const mat = new THREE.SpriteMaterial({
          map: i % 2 === 0 ? headTex : texIndigo,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const sprite = new THREE.Sprite(mat);
        scene.add(sprite);
        flows.push({
          sprite,
          mat,
          offset: i / flowCount,
          speed: 0.022 + (i % 5) * 0.007,
          scale: 0.10 + (i % 3) * 0.05,
        });
      }

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

        // signal packets ride only the drawn portion of the route
        for (const f of flows) {
          f.offset = (f.offset + f.speed * 0.016 * 60 * 0.016) % 1;
          const u = f.offset * Math.max(0.02, Math.min(0.999, drawn));
          f.sprite.position.copy(curve.getPointAt(u));
          // bright at mid-journey, fading near ends
          const edge = Math.min(u / 0.08, (Math.max(0.02, drawn) - u) / 0.08, 1);
          f.mat.opacity = Math.max(0, edge) * (0.5 + Math.sin(t * 6 + f.offset * 40) * 0.25);
          f.sprite.scale.setScalar(f.scale * (0.8 + Math.sin(t * 5 + f.offset * 30) * 0.2));
        }

        // nebula breathing + per-layer pointer parallax (deeper layer moves
        // less, near motes move most — real volumetric depth read).
        // Scroll calms and gathers the noise: rotation slows, the cloud
        // tightens — disorder organizing as the user moves.
        const p = progressRef?.current ?? 0;
        const calm = 1 - p * 0.55;
        cloudA.points.rotation.y = t * 0.16 * calm;
        cloudA.points.rotation.x = Math.sin(t * 0.4) * 0.04 * calm;
        cloudA.points.position.x = -pointerX * 0.12;
        cloudA.points.position.y = pointerY * 0.08;
        cloudA.points.scale.setScalar(1 - p * 0.12);
        cloudB.points.rotation.y = -t * 0.1 * calm;
        cloudB.points.position.y = Math.sin(t * 0.6) * 0.2 * calm + pointerY * 0.18;
        cloudB.points.position.x = -pointerX * 0.26;
        cloudB.points.scale.setScalar(1 - p * 0.10);
        cloudC.points.position.x = -pointerX * 0.85;
        cloudC.points.position.y = Math.sin(t * 0.5) * 0.12 + pointerY * 0.6;
        cloudC.points.rotation.z = t * 0.02;

        // orbital instrument: slow precession, scroll tightens the system,
        // and the whole instrument leans gently toward the pointer
        orbital.rotation.y = t * 0.3 + p * 1.6 + pointerX * 0.22;
        orbital.rotation.x = Math.sin(t * 0.22) * 0.08 + p * 0.35 + pointerY * 0.14;
        orbital.position.y = (isSmall ? 1.7 : 0.25) + Math.sin(t * 0.55) * 0.07 - p * 0.9;
        const tighten = 1 - p * 0.25;
        orbital.scale.setScalar(tighten);
        for (const r of ringMeshes) {
          r.mesh.rotation.z = r.def.tiltZ + t * 0.12;
        }
        for (const n of nodes) {
          const a = n.phase + t * n.speed;
          n.sprite.position.set(
            Math.cos(a) * n.radius,
            Math.sin(a * 0.9) * 0.16,
            Math.sin(a) * n.radius * 0.42,
          );
          n.mat.opacity = 0.55 + Math.sin(t * 2.4 + n.phase * 5) * 0.3;
        }
        coreGlowMat.opacity = 0.42 + Math.sin(t * 1.6) * 0.14;

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
      // first frame is on screen — raise the curtain
      requestAnimationFrame(() => {
        renderer.domElement.style.opacity = "1";
      });

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
        cloudC.geo.dispose();
        cloudC.mat.dispose();
        for (const r of ringMeshes) {
          r.geo.dispose();
          r.mat.dispose();
        }
        for (const n of nodes) n.mat.dispose();
        for (const f of flows) f.mat.dispose();
        coreGlowMat.dispose();
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
