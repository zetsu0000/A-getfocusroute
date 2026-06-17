"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { QuizQuestion } from "@/types/quiz";
import { useFunnelTheme } from "@/components/v2/FunnelThemeProvider";
import { useGsapReveal } from "@/components/v2/useGsapReveal";

/* ════════════════════════════════════════════════════════════════════
   High-conversion infocard system — 5 deliberately distinct grammars.
   The shared SignalFieldGL ambient lives in QuizEngine and evolves by
   stage; each card owns its content format, color role, and GSAP move.
   No fabricated stats / testimonials / guaranteed outcomes anywhere.
   ════════════════════════════════════════════════════════════════════ */

type CardProps = { question: QuizQuestion; onContinue: () => void };

/* Per-card emotional color role (dark / light). Color = meaning, not decor. */
type Role = { accent: string; accent2: string; eyebrow: string };
function useRole(dark: boolean): Record<string, Role> {
  return dark
    ? {
        recognition: { accent: "#B39BFF", accent2: "#7C8AFF", eyebrow: "Recognition" },
        friction:    { accent: "#FFB28B", accent2: "#9BE8FF", eyebrow: "Why generic stalls" },
        cost:        { accent: "#7FE0B2", accent2: "#9BE8FF", eyebrow: "The real cost" },
        system:      { accent: "#9BE8FF", accent2: "#D9BC7F", eyebrow: "Your system" },
        unlock:      { accent: "#F0DCAE", accent2: "#9BE8FF", eyebrow: "Personalized unlock" },
      }
    : {
        recognition: { accent: "#7A4FD0", accent2: "#4655E6", eyebrow: "Recognition" },
        friction:    { accent: "#C2691E", accent2: "#1487B5", eyebrow: "Why generic stalls" },
        cost:        { accent: "#1C8A5A", accent2: "#1487B5", eyebrow: "The real cost" },
        system:      { accent: "#1487B5", accent2: "#9A7A2E", eyebrow: "Your system" },
        unlock:      { accent: "#9A7A2E", accent2: "#1487B5", eyebrow: "Personalized unlock" },
      };
}

/* ── Shared chrome — eyebrow + headline + scroll body + contextual CTA ─── */
function CardShell({
  rootRef,
  eyebrow,
  eyebrowColor,
  title,
  cta,
  onContinue,
  children,
}: {
  rootRef: React.Ref<HTMLDivElement>;
  eyebrow: string;
  eyebrowColor: string;
  title: ReactNode;
  cta: string;
  onContinue: () => void;
  children: ReactNode;
}) {
  return (
    // No own scroll container — the quiz slide stage is the single scroller.
    // minHeight:100% keeps the CTA near the bottom on tall screens while letting
    // long cards grow and the one outer container scroll. Safe-area bottom pad
    // keeps the CTA clear of the iOS/Safari bottom bar.
    <div
      ref={rootRef}
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 18px calc(26px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", flex: 1 }}>
        <p
          className="fr-rv v2-hud"
          style={{ color: eyebrowColor, marginBottom: 10, letterSpacing: "0.16em" }}
        >
          {eyebrow}
        </p>
        <h2
          className="fr-rv v2-display"
          style={{
            fontSize: "clamp(22px, 6vw, 27px)",
            fontWeight: 560,
            lineHeight: 1.16,
            letterSpacing: "-0.01em",
            marginBottom: 18,
            color: "var(--v2-ink)",
          }}
        >
          {title}
        </h2>

        <div style={{ flex: 1 }}>{children}</div>

        <button
          onClick={onContinue}
          className="fr-rv v2-cta"
          style={{ width: "100%", minHeight: 54, fontSize: 15, marginTop: 18 }}
        >
          {cta}
        </button>
      </div>
    </div>
  );
}

function Pill({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span
      className="v2-hud"
      style={{
        fontSize: 9,
        letterSpacing: "0.1em",
        color,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 32%, transparent)`,
        padding: "3px 9px",
        borderRadius: 999,
      }}
    >
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CARD 1 — Recognition. Rebuilt as a fast, visual mechanism explainer:
   surface feeling → FocusRoute scan → where the route breaks (four signals)
   → payoff → CTA. One GSAP timeline (~2.6s) drives the narrative; SVG + CSS
   draw the route, scan, nodes and glow. The shared SignalFieldGL ambient
   (mounted by QuizEngine) is untouched, every word stays in the DOM and
   readable if WebGL or JS fails, and reduced motion snaps to the final
   state. No "momentum" wording here.
───────────────────────────────────────────────────────────────────── */
function Card1Recognition({ onContinue }: CardProps) {
  const { theme } = useFunnelTheme();
  const dark = theme === "dark";
  const role = useRole(dark).recognition;

  // Detected friction signals — the text carries the meaning; color is a
  // secondary cue only (never the sole differentiator).
  const signals = [
    { text: "Unclear priority", color: dark ? "#B39BFF" : "#7A4FD0" },
    { text: "Start feels too big", color: dark ? "#7C8AFF" : "#4655E6" },
    { text: "Pressure takes over", color: dark ? "#FFB28B" : "#C2691E" },
    { text: "Interruption resets you", color: dark ? "#6FE0C2" : "#1487B5" },
  ];

  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 480px)").matches;
    const blur = (px: number) => `blur(${mobile ? Math.min(px, 4) : px}px)`;

    const ctx = gsap.context(() => {
      // Length-accurate dash so the route is fully hidden, then draws clean.
      const path = root.querySelector<SVGPathElement>(".fr1-route");
      const len = path?.getTotalLength?.() ?? 240;
      gsap.set(".fr1-route", { strokeDasharray: len, strokeDashoffset: len });

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });

      // 1 · Label — a system state appearing
      tl.fromTo(
        ".fr1-label",
        { opacity: 0, y: 8, letterSpacing: "0.42em" },
        { opacity: 1, y: 0, letterSpacing: "0.2em", duration: 0.35 },
        0,
      );

      // 2 · Headline — two beats + a luminous underline scan
      tl.fromTo(
        ".fr1-h1",
        { opacity: 0, y: 14, filter: blur(8) },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.45 },
        0.15,
      );
      tl.fromTo(
        ".fr1-h2",
        { opacity: 0, scale: 0.97, filter: blur(10) },
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.5 },
        0.35,
      );
      tl.fromTo(
        ".fr1-hscan",
        { scaleX: 0, opacity: 0.9, transformOrigin: "left center" },
        { scaleX: 1, duration: 0.4 },
        0.42,
      ).to(".fr1-hscan", { opacity: 0, duration: 0.3 }, 0.84);

      // 3 · Surface-problem block — a thought becoming visible + one pulse
      tl.fromTo(
        ".fr1-surface",
        { opacity: 0, y: 18, scale: 0.985, filter: blur(6) },
        { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.45 },
        0.7,
      );
      tl.fromTo(".fr1-quote", { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35 }, 0.85);
      tl.fromTo(".fr1-surface-pulse", { opacity: 0 }, { opacity: 1, duration: 0.2, yoyo: true, repeat: 1 }, 0.98);

      // 4 · FocusRoute scan — luminous line maps the surface; mechanism appears
      tl.fromTo(".fr1-vscan", { top: "-14%", opacity: 0 }, { opacity: 1, duration: 0.12 }, 1.0)
        .to(".fr1-vscan", { top: "104%", duration: 0.7, ease: "power1.inOut" }, 1.0)
        .to(".fr1-vscan", { opacity: 0, duration: 0.2 }, 1.62);
      tl.to(".fr1-surface", { opacity: 0.85, duration: 0.4 }, 1.12);
      tl.to(".fr1-noise", { opacity: 0, y: "-=10", x: "random(-12, 12)", duration: 0.5, stagger: 0.03 }, 1.12);
      tl.fromTo(
        ".fr1-mech",
        { opacity: 0, y: 8, filter: blur(5) },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.4 },
        1.2,
      );

      // 5 · Route draws toward the signals; a node travels it
      tl.to(".fr1-route", { strokeDashoffset: 0, duration: 0.65, ease: "power2.inOut" }, 1.3);
      tl.fromTo(".fr1-travel", { opacity: 0, top: "2%" }, { opacity: 1, duration: 0.12 }, 1.3)
        .to(".fr1-travel", { top: "94%", duration: 0.65, ease: "power2.inOut" }, 1.3)
        .to(".fr1-travel", { opacity: 0, duration: 0.2 }, 1.95);

      // 6 · Friction signals — each ignites from its route node
      tl.fromTo(".fr1-signal-node", { scale: 0 }, { scale: 1, duration: 0.28, stagger: 0.12, ease: "back.out(2)" }, 1.55);
      tl.fromTo(
        ".fr1-signal-label",
        { opacity: 0, x: -8, scale: 0.96 },
        { opacity: 1, x: 0, scale: 1, duration: 0.28, stagger: 0.12 },
        1.6,
      );
      tl.fromTo(".fr1-signal-glow", { opacity: 0 }, { opacity: 0.9, duration: 0.18, yoyo: true, repeat: 1, stagger: 0.12 }, 1.64);

      // 7 · Transformation + payoff (the practical line lands harder)
      tl.to(".fr1-route", { opacity: 1, duration: 0.4 }, 2.1);
      tl.fromTo(".fr1-payoff1", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35 }, 2.1);
      tl.fromTo(
        ".fr1-payoff2",
        { opacity: 0, y: 10, filter: blur(5) },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.4 },
        2.25,
      );

      // 8 · CTA arrives
      tl.fromTo(".fr1-cta", { opacity: 0, y: 14, scale: 0.985 }, { opacity: 1, y: 0, scale: 1, duration: 0.45 }, 2.35);
      tl.fromTo(".fr1-cta-glow", { opacity: 0 }, { opacity: 0.85, duration: 0.3, yoyo: true, repeat: 1 }, 2.5);
      tl.to(".fr1-arrow", { x: 4, duration: 0.2, yoyo: true, repeat: 1 }, 2.62);

      if (reduce) {
        tl.progress(1).pause(); // final state, no motion, nothing hidden
        return;
      }
      tl.play();

      // Ambient (post-reveal) — restrained, and tracked by ctx for clean revert.
      const AMBIENT = 3.0;
      gsap.to(".fr1-route", { opacity: 0.78, duration: 2.6, yoyo: true, repeat: -1, ease: "sine.inOut", delay: AMBIENT });
      gsap.fromTo(
        ".fr1-pulse",
        { opacity: 0, top: "0%" },
        { opacity: 0.75, top: "100%", duration: 1.5, ease: "sine.inOut", repeat: -1, repeatDelay: 3.4, delay: AMBIENT },
      );
      gsap.to(".fr1-cta-glow", { opacity: 0.16, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut", delay: AMBIENT });
    }, root);

    return () => ctx.revert();
    // The reveal runs once on mount; reduced motion + ctx.revert keep it safe.
  }, []);

  // Desktop-only magnetic glow; press-depth on every pointer (mobile tap too).
  const press = (to: number) => (e: React.PointerEvent<HTMLButtonElement>) =>
    gsap.to(e.currentTarget, { scale: to, duration: to < 1 ? 0.12 : 0.22, overwrite: "auto" });
  const magnet = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    gsap.to(e.currentTarget, { x: dx * 4, duration: 0.3, ease: "power2.out", overwrite: "auto" });
  };
  const demagnet = (e: React.PointerEvent<HTMLButtonElement>) =>
    gsap.to(e.currentTarget, { x: 0, scale: 1, duration: 0.4, ease: "power2.out", overwrite: "auto" });

  return (
    // Single scroller (the quiz stage) — no own overflow. Safe-area bottom pad.
    <div
      ref={ref}
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 18px calc(26px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", flex: 1 }}>
        {/* 1 · Recognition label */}
        <p className="fr1-label v2-hud" style={{ color: role.accent, marginBottom: 10, letterSpacing: "0.2em" }}>
          Recognition
        </p>

        {/* 2 · Two-beat headline + scan underline */}
        <h2
          className="v2-display"
          style={{
            position: "relative",
            fontSize: "clamp(23px, 6.4vw, 29px)",
            fontWeight: 580,
            lineHeight: 1.14,
            letterSpacing: "-0.01em",
            marginBottom: 16,
            color: "var(--v2-ink)",
          }}
        >
          <span className="fr1-h1">It’s not just </span>
          <span className="fr1-h2" style={{ display: "inline-block", color: role.accent, fontWeight: 680 }}>
            procrastination.
          </span>
          <span
            className="fr1-hscan"
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              bottom: -4,
              height: 2,
              width: "100%",
              borderRadius: 2,
              transformOrigin: "left center",
              background: `linear-gradient(90deg, ${role.accent2}, ${role.accent})`,
              boxShadow: `0 0 10px ${role.accent2}`,
              opacity: 0,
            }}
          />
        </h2>

        {/* 3 · Surface problem — what it feels like */}
        <div
          className="fr1-surface"
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "14px 16px",
            borderRadius: 16,
            border: `1px solid color-mix(in srgb, ${role.accent} 24%, transparent)`,
            background: "rgba(148,163,255,0.05)",
          }}
        >
          <span
            className="fr1-surface-pulse"
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 16,
              border: `1px solid ${role.accent2}`,
              boxShadow: `inset 0 0 16px color-mix(in srgb, ${role.accent2} 55%, transparent)`,
              opacity: 0,
              pointerEvents: "none",
            }}
          />
          <span
            className="fr1-vscan"
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "-14%",
              height: 34,
              opacity: 0,
              pointerEvents: "none",
              background: `linear-gradient(180deg, transparent, ${role.accent2}, ${role.accent}, transparent)`,
              filter: "blur(3px)",
              boxShadow: `0 0 18px ${role.accent2}`,
            }}
          />
          <Pill color={role.accent}>What it feels like</Pill>
          <p className="fr1-quote" style={{ marginTop: 9, fontSize: 15, fontWeight: 600, color: "var(--v2-ink)", lineHeight: 1.45 }}>
            “I just can’t start.”
          </p>
          {[0, 1, 2, 3].map((n) => (
            <span
              key={n}
              className="fr1-noise"
              aria-hidden="true"
              style={{
                position: "absolute",
                right: 14 + n * 13,
                top: 14 + (n % 2) * 12,
                width: 3,
                height: 3,
                borderRadius: "50%",
                background: role.accent2,
                opacity: 0.55,
              }}
            />
          ))}
        </div>

        {/* 4 · Mechanism line — revealed as the scan passes */}
        <p className="fr1-mech" style={{ margin: "12px 0", textAlign: "center", fontSize: 13.5, fontWeight: 600, color: role.accent2, lineHeight: 1.45 }}>
          FocusRoute maps where the route breaks.
        </p>

        {/* 5 + 6 · Route draws toward the four detected signals */}
        <div
          style={{
            position: "relative",
            padding: "14px 16px",
            borderRadius: 16,
            border: `1px solid color-mix(in srgb, ${role.accent2} 30%, transparent)`,
            background: `linear-gradient(160deg, color-mix(in srgb, ${role.accent2} 12%, transparent), transparent)`,
          }}
        >
          <Pill color={role.accent2}>Where the route breaks</Pill>
          <div style={{ position: "relative", marginTop: 12 }}>
            <svg width="28" height="192" viewBox="0 0 28 192" fill="none" aria-hidden="true" style={{ position: "absolute", left: 0, top: 0 }}>
              <path
                className="fr1-route"
                d="M14 6 C 20 30, 8 50, 14 72 C 20 96, 8 144, 14 168"
                stroke={role.accent2}
                strokeWidth="2"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 4px ${role.accent2})` }}
              />
            </svg>
            <span
              className="fr1-travel"
              aria-hidden="true"
              style={{ position: "absolute", left: 7, top: "2%", width: 14, height: 14, borderRadius: "50%", background: "var(--v2-grad-signal)", boxShadow: `0 0 12px ${role.accent2}`, opacity: 0 }}
            />
            <span
              className="fr1-pulse"
              aria-hidden="true"
              style={{ position: "absolute", left: 9, top: "0%", width: 10, height: 10, borderRadius: "50%", background: role.accent2, boxShadow: `0 0 10px ${role.accent2}`, opacity: 0, pointerEvents: "none" }}
            />
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {signals.map((s) => (
                <li key={s.text} style={{ position: "relative", height: 48, display: "flex", alignItems: "center", paddingLeft: 40 }}>
                  <span
                    className="fr1-signal-glow"
                    aria-hidden="true"
                    style={{ position: "absolute", left: 1, top: 11, width: 26, height: 26, borderRadius: "50%", background: s.color, filter: "blur(6px)", opacity: 0, pointerEvents: "none" }}
                  />
                  <span
                    className="fr1-signal-node"
                    aria-hidden="true"
                    style={{ position: "absolute", left: 7, top: 17, width: 14, height: 14, borderRadius: "50%", background: s.color, boxShadow: `0 0 8px ${s.color}` }}
                  />
                  <span className="fr1-signal-label" style={{ fontSize: 13.5, fontWeight: 640, color: "var(--v2-ink)" }}>
                    {s.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 7 · Payoff — the practical second line gets more weight */}
        <div style={{ marginTop: 16 }}>
          <p className="fr1-payoff1" style={{ fontSize: 14, color: "var(--v2-ink-dim)", lineHeight: 1.4 }}>
            Less self-blame.
          </p>
          <p className="fr1-payoff2" style={{ marginTop: 3, fontSize: 17, fontWeight: 700, color: "var(--v2-ink)", lineHeight: 1.3 }}>
            A clearer next move.
          </p>
        </div>

        <div style={{ flex: 1, minHeight: 12 }} />

        {/* 8 · CTA — clickable immediately; glow sits outside the clipped pill */}
        <div style={{ position: "relative", marginTop: 18 }}>
          <span
            className="fr1-cta-glow"
            aria-hidden="true"
            style={{ position: "absolute", inset: -2, borderRadius: 999, boxShadow: `0 0 24px color-mix(in srgb, ${role.accent2} 70%, transparent)`, opacity: 0, pointerEvents: "none", zIndex: 0 }}
          />
          <button
            onClick={onContinue}
            onPointerEnter={press(1)}
            onPointerMove={magnet}
            onPointerDown={press(0.97)}
            onPointerUp={press(1)}
            onPointerLeave={demagnet}
            className="fr1-cta v2-cta"
            style={{ position: "relative", zIndex: 1, width: "100%", minHeight: 54, fontSize: 15 }}
          >
            Show me the pattern
            <span className="fr1-arrow" aria-hidden="true" style={{ display: "inline-block", marginLeft: 2 }}>
              →
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CARD 2 — Differentiation: generic path (breaks) vs FocusRoute (connects)
───────────────────────────────────────────────────────────────────── */
function Card2Differentiation({ question, onContinue }: CardProps) {
  const { theme } = useFunnelTheme();
  const dark = theme === "dark";
  const role = useRole(dark).friction;

  const ref = useGsapReveal((tl) => {
    tl.from(".fr-rv", { y: 14, opacity: 0, stagger: 0.07 })
      .from(".fr-generic-step", { opacity: 0, x: -10, stagger: 0.06 }, "-=0.1")
      .from(".fr-route-step", { opacity: 0, x: 10, stagger: 0.08 }, "-=0.2");
  });

  const generic = ["Task list", "Overwhelm", "Delay", "Restart"];
  const route = ["Priority", "Entry point", "Daily action", "Recovery route", "Progress"];

  return (
    <CardShell
      rootRef={ref}
      eyebrow={role.eyebrow}
      eyebrowColor={role.accent}
      title="A to-do list tells you what. Not how to begin, or how to recover."
      cta="Map what gets in the way"
      onContinue={onContinue}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Generic path — breaks */}
        <div
          className="fr-rv"
          style={{
            padding: "13px 12px",
            borderRadius: 16,
            border: `1px solid color-mix(in srgb, ${role.accent} 30%, transparent)`,
            background: `color-mix(in srgb, ${role.accent} 7%, transparent)`,
          }}
        >
          <Pill color={role.accent}>Generic plan</Pill>
          <div style={{ marginTop: 11, display: "flex", flexDirection: "column", gap: 7 }}>
            {generic.map((s, i) => (
              <div
                key={s}
                className="fr-generic-step"
                style={{
                  fontSize: 12.5,
                  color: i === generic.length - 1 ? role.accent : "var(--v2-ink-dim)",
                  fontWeight: i === generic.length - 1 ? 700 : 500,
                  opacity: 1 - i * 0.08,
                }}
              >
                {s}
                {i < generic.length - 1 && (
                  <span style={{ color: "var(--v2-ink-ghost)", marginLeft: 6 }}>↓</span>
                )}
              </div>
            ))}
          </div>
          <p style={{ marginTop: 10, fontSize: 11, color: role.accent }}>Loops back to the start.</p>
        </div>

        {/* FocusRoute path — connects */}
        <div
          className="fr-rv"
          style={{
            padding: "13px 12px",
            borderRadius: 16,
            border: `1px solid color-mix(in srgb, ${role.accent2} 34%, transparent)`,
            background: `linear-gradient(160deg, color-mix(in srgb, ${role.accent2} 15%, transparent), transparent)`,
          }}
        >
          <Pill color={role.accent2}>FocusRoute</Pill>
          <div style={{ marginTop: 11, display: "flex", flexDirection: "column", gap: 7 }}>
            {route.map((s, i) => (
              <div
                key={s}
                className="fr-route-step"
                style={{
                  fontSize: 12.5,
                  fontWeight: i === route.length - 1 ? 760 : 600,
                  color: i === route.length - 1 ? "var(--v2-ink)" : "var(--v2-ink-dim)",
                }}
              >
                <span style={{ color: role.accent2, marginRight: 6 }}>›</span>
                {s}
              </div>
            ))}
          </div>
          <p style={{ marginTop: 10, fontSize: 11, color: role.accent2 }}>One connected route.</p>
        </div>
      </div>

      <p className="fr-rv" style={{ marginTop: 14, fontSize: 13, color: "var(--v2-ink-dim)", lineHeight: 1.5 }}>
        {question.infoBenefit ??
          "FocusRoute connects priorities, starting points, daily actions, recovery and progress — so you begin from a concrete next move, not a planning reset."}
      </p>
    </CardShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CARD 3 — Cost: honest progression chart (re-deciding vs acting)
───────────────────────────────────────────────────────────────────── */
function Card3Cost({ onContinue }: CardProps) {
  const { theme } = useFunnelTheme();
  const dark = theme === "dark";
  const role = useRole(dark).cost;
  const cool = dark ? "#FFB28B" : "#C2691E";

  const ref = useGsapReveal((tl) => {
    tl.from(".fr-rv", { y: 14, opacity: 0, stagger: 0.07 })
      .fromTo(".fr-area-decide", { opacity: 0 }, { opacity: 1, duration: 0.5 }, "-=0.1")
      .fromTo(".fr-line-decide", { strokeDashoffset: 320 }, { strokeDashoffset: 0, duration: 0.9 }, "<")
      .fromTo(".fr-line-act", { strokeDashoffset: 320 }, { strokeDashoffset: 0, duration: 1.0 }, "-=0.7");
  });

  return (
    <CardShell
      rootRef={ref}
      eyebrow={role.eyebrow}
      eyebrowColor={role.accent}
      title="The hardest part is rarely the task. It's deciding the same things, again and again."
      cta="See how my route forms"
      onContinue={onContinue}
    >
      <div
        className="fr-rv"
        style={{
          padding: "14px 14px 10px",
          borderRadius: 16,
          border: "1px solid rgba(var(--v2-line-rgb),0.18)",
          background: "rgba(148,163,255,0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <Pill color={cool}>Energy spent re-deciding</Pill>
          <Pill color={role.accent}>Energy for action</Pill>
        </div>

        <svg width="100%" height="130" viewBox="0 0 300 130" preserveAspectRatio="none" aria-hidden="true">
          {/* re-deciding: high, draining area */}
          <path
            className="fr-area-decide"
            d="M0 30 C70 36, 150 70, 300 96 L300 130 L0 130 Z"
            fill={`color-mix(in srgb, ${cool} 16%, transparent)`}
          />
          <path
            className="fr-line-decide"
            d="M0 30 C70 36, 150 70, 300 96"
            stroke={cool}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="320"
          />
          {/* action: rising with a clearer system */}
          <path
            className="fr-line-act"
            d="M0 110 C90 104, 170 60, 300 24"
            stroke={role.accent}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="320"
            style={{ filter: `drop-shadow(0 0 5px ${role.accent})` }}
          />
        </svg>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span className="v2-hud" style={{ fontSize: 8.5 }}>Now</span>
          <span className="v2-hud" style={{ fontSize: 8.5 }}>With a clearer system</span>
        </div>
      </div>

      <p className="fr-rv" style={{ marginTop: 8, fontSize: 11, color: "var(--v2-ink-faint)", fontStyle: "italic" }}>
        Illustrative example of how a clearer system can reduce repeated decision load.
      </p>
      <p className="fr-rv" style={{ marginTop: 8, fontSize: 13, color: "var(--v2-ink-dim)", lineHeight: 1.5 }}>
        FocusRoute lowers the repeated decision load: a clearer next action, and a route back when focus breaks — so less of your day goes to rebuilding the plan.
      </p>
    </CardShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CARD 4 — Mechanism: connected system architecture (nodes ignite + link)
───────────────────────────────────────────────────────────────────── */
function Card4Mechanism({ onContinue }: CardProps) {
  const { theme } = useFunnelTheme();
  const dark = theme === "dark";
  const role = useRole(dark).system;

  const ref = useGsapReveal((tl) => {
    tl.from(".fr-rv", { y: 14, opacity: 0, stagger: 0.07 })
      .fromTo(".fr-link", { strokeDashoffset: 40 }, { strokeDashoffset: 0, stagger: 0.12, duration: 0.4 }, "-=0.1")
      .from(".fr-node", { opacity: 0, scale: 0.7, stagger: 0.12, duration: 0.4 }, "<");
  });

  const nodes = [
    { label: "Your pattern", sub: "from your answers" },
    { label: "Where friction starts", sub: "the real blocker" },
    { label: "Starting route", sub: "a concrete first move" },
    { label: "Daily actions", sub: "small, doable" },
    { label: "Recovery route", sub: "back on track" },
    { label: "Progress", sub: "what’s moving" },
  ];

  return (
    <CardShell
      rootRef={ref}
      eyebrow={role.eyebrow}
      eyebrowColor={role.accent}
      title="Not a result screen — a connected system built around your pattern."
      cta="Build the next step"
      onContinue={onContinue}
    >
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 0 }}>
        {nodes.map((n, i) => {
          const last = i === nodes.length - 1;
          return (
            <div key={n.label} style={{ position: "relative", paddingLeft: 30, paddingBottom: last ? 0 : 12 }}>
              {!last && (
                <svg
                  width="2"
                  height="100%"
                  viewBox="0 0 2 40"
                  preserveAspectRatio="none"
                  style={{ position: "absolute", left: 9, top: 18, height: "calc(100% - 6px)" }}
                  aria-hidden="true"
                >
                  <line
                    className="fr-link"
                    x1="1"
                    y1="0"
                    x2="1"
                    y2="40"
                    stroke={role.accent}
                    strokeWidth="2"
                    strokeDasharray="40"
                  />
                </svg>
              )}
              <span
                className="fr-node"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 2,
                  top: 4,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: last ? role.accent2 : "var(--v2-grad-signal)",
                  boxShadow: `0 0 12px color-mix(in srgb, ${last ? role.accent2 : role.accent} 60%, transparent)`,
                }}
              />
              <div className="fr-node">
                <p style={{ fontSize: 13.5, fontWeight: last ? 780 : 680, color: "var(--v2-ink)", lineHeight: 1.2 }}>
                  {n.label}
                </p>
                <p style={{ fontSize: 11.5, color: "var(--v2-ink-faint)", marginTop: 1 }}>{n.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CARD 5 — Unlock: a confident teaser, then the locked layers. The exact
   score and the pattern's name/descriptor are intentionally WITHHELD here so
   they land for the first time on the result reveal — this card builds the
   curiosity, it does not spend it.
───────────────────────────────────────────────────────────────────── */
function Card5Unlock({ onContinue }: CardProps) {
  const { theme } = useFunnelTheme();
  const dark = theme === "dark";
  const role = useRole(dark).unlock;

  const ref = useGsapReveal((tl) => {
    tl.from(".fr-rv", { y: 14, opacity: 0, stagger: 0.07 })
      .from(".fr-free", { opacity: 0, y: 10 }, "-=0.1")
      .from(".fr-locked", { opacity: 0, y: 12, stagger: 0.09 }, "-=0.1");
  });

  const locked = [
    "Full focus pattern + what it means",
    "Where your friction is strongest",
    "Your personalized starting route",
    "Daily focus actions that fit you",
    "Recovery guidance when focus breaks",
  ];

  return (
    <CardShell
      rootRef={ref}
      eyebrow={role.eyebrow}
      eyebrowColor={role.accent}
      title="Your FocusRoute is taking shape."
      cta="Reveal my FocusRoute"
      onContinue={onContinue}
    >
      {/* Signal teaser — what we found, without spending the reveal. No score,
          no pattern name; those appear for the first time on the result. */}
      <div
        className="fr-free"
        style={{
          padding: "15px 16px",
          borderRadius: 16,
          border: `1px solid color-mix(in srgb, ${role.accent2} 30%, transparent)`,
          background: "var(--v2-bg-raise)",
        }}
      >
        <Pill color={role.accent2}>Signal detected · from your answers</Pill>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "We picked up your focus pattern signal",
            "Your strongest friction area is mapped",
            "Your personalized route is ready to draw",
          ].map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: role.accent2,
                  boxShadow: `0 0 8px ${role.accent2}`,
                }}
              />
              <span style={{ fontSize: 13.5, fontWeight: 620, color: "var(--v2-ink)" }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Locked layers — taking shape, gold */}
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {locked.map((l) => (
          <div
            key={l}
            className="fr-locked"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "11px 14px",
              borderRadius: 13,
              border: `1px solid color-mix(in srgb, ${role.accent} 28%, transparent)`,
              background: `color-mix(in srgb, ${role.accent} 7%, transparent)`,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                color: role.accent,
                border: `1px solid color-mix(in srgb, ${role.accent} 40%, transparent)`,
                fontSize: 12,
              }}
            >
              ◗
            </span>
            <span style={{ fontSize: 13, fontWeight: 640, color: "var(--v2-ink)" }}>{l}</span>
          </div>
        ))}
      </div>

      <p className="fr-rv" style={{ marginTop: 12, fontSize: 12.5, color: "var(--v2-ink-dim)", lineHeight: 1.5 }}>
        The preview is yours free. The full personalized system — profile, route, daily actions, recovery and ongoing plan — unlocks with your subscription.
      </p>
    </CardShell>
  );
}

/* Neutral fallback for an unexpected infocard id. It deliberately does NOT
   reuse Card 1, so a routing/data bug surfaces as a plain card instead of
   silently masquerading as a real one — while never trapping the user. */
function SafeContinueCard({ onContinue }: CardProps) {
  const { theme } = useFunnelTheme();
  const role = useRole(theme === "dark").system;
  const ref = useGsapReveal((tl) => {
    tl.from(".fr-rv", { y: 12, opacity: 0, stagger: 0.08 });
  });
  return (
    <CardShell
      rootRef={ref}
      eyebrow="One moment"
      eyebrowColor={role.accent}
      title="Your FocusRoute is still coming together."
      cta="Continue"
      onContinue={onContinue}
    >
      <p className="fr-rv" style={{ fontSize: 14, color: "var(--v2-ink-dim)", lineHeight: 1.6 }}>
        Your answers are taking shape into a personalized focus route.
      </p>
    </CardShell>
  );
}

/* ── Router ───────────────────────────────────────────────────────────── */
export function InfocardV2({ question, onContinue }: CardProps) {
  switch (question.id) {
    case "info-seen":
      return <Card1Recognition question={question} onContinue={onContinue} />;
    case "info-match":
      return <Card2Differentiation question={question} onContinue={onContinue} />;
    case "info-focus":
      return <Card3Cost question={question} onContinue={onContinue} />;
    case "info-system":
      return <Card4Mechanism question={question} onContinue={onContinue} />;
    case "adhd-profile":
      return <Card5Unlock question={question} onContinue={onContinue} />;
    default:
      return <SafeContinueCard question={question} onContinue={onContinue} />;
  }
}

export { INFOCARD_STAGE } from "@/components/quiz/infocardStages";
