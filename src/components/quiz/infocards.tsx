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
        system:      { accent: "#1487B5", accent2: "#B98716", eyebrow: "Your system" },
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

      // 3 · Surface-problem block — a thought becoming visible + one pulse.
      // Revealed with opacity / transform only — deliberately NO filter. A
      // persistent filter (GSAP leaves the end `blur(0px)` applied) on this
      // rounded, overflow:hidden, translucent-background box promotes it to a
      // WebKit/Safari compositing layer whose rounded clip fails and paints an
      // opaque white rectangle — visible before, during and after the reveal and
      // in reduced motion. Dropping the blur removes that layer; the opacity + y
      // + scale entrance (and every timing) is unchanged.
      tl.fromTo(
        ".fr1-surface",
        { opacity: 0, y: 18, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45 },
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
      // Travel arrives exactly at the final (green) node, then fades — it must
      // never rest below the last signal.
      tl.fromTo(".fr1-travel", { opacity: 0, top: "4%" }, { opacity: 1, duration: 0.12 }, 1.3)
        .to(".fr1-travel", { top: "86%", duration: 0.65, ease: "power2.inOut" }, 1.3)
        .to(".fr1-travel", { opacity: 0, duration: 0.2 }, 1.9);

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
      // Slow pulse travels the route between nodes and FADES OUT at the final
      // node, then rests fully invisible during the gap — so the final state
      // never shows an orphan dot below "Interruption resets you".
      gsap
        .timeline({ repeat: -1, repeatDelay: 3.2, delay: AMBIENT })
        .set(".fr1-pulse", { top: "10%", opacity: 0 })
        .to(".fr1-pulse", { opacity: 0.7, duration: 0.3, ease: "sine.out" })
        .to(".fr1-pulse", { top: "86%", duration: 1.1, ease: "sine.inOut" }, "<")
        .to(".fr1-pulse", { opacity: 0, duration: 0.35, ease: "sine.in" }, ">-0.1");
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

        {/* 3 · Surface problem — what it feels like.
            In light mode this large container is kept un-filled: a translucent
            fill + border read as a solid white card on iOS Safari (the visible
            "white rectangle"). Light uses a transparent background and a quieter
            accent-tinted border; dark keeps its existing milky-glass treatment.
            (The earlier `.fr1-surface` blur removal is retained, but the milky
            fill — not the blur — was the visible artifact.) */}
        <div
          className="fr1-surface"
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "14px 16px",
            borderRadius: 16,
            border: `1px solid color-mix(in srgb, ${role.accent} ${dark ? 24 : 20}%, transparent)`,
            background: dark ? "rgba(148,163,255,0.05)" : "transparent",
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
              // No CSS filter — the gradient + box-shadow already soften the sweep,
              // and `filter: blur()` paints an opaque white box on iOS Safari GPU
              // compositing (same artifact as the node halos above).
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

        {/* 5 + 6 · Route draws toward the four detected signals.
            Same fix as the surface above: in light mode the filled gradient +
            border read as a solid white card on iOS Safari, so light uses a
            transparent background and a quieter accent-tinted border. Dark keeps
            its existing tinted-gradient treatment. */}
        <div
          style={{
            position: "relative",
            padding: "14px 16px",
            borderRadius: 16,
            border: `1px solid color-mix(in srgb, ${role.accent2} ${dark ? 30 : 20}%, transparent)`,
            background: dark
              ? `linear-gradient(160deg, color-mix(in srgb, ${role.accent2} 12%, transparent), transparent)`
              : "transparent",
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
                  {/* Soft node halo via a radial-gradient background, NOT a CSS
                      filter. On iOS Safari a `filter: blur()` promotes the span to
                      a GPU layer whose backing paints an opaque WHITE square that
                      shows even at opacity 0 — these were the pale squares behind
                      each node. A gradient gives the same soft glow with no filter. */}
                  <span
                    className="fr1-signal-glow"
                    aria-hidden="true"
                    style={{ position: "absolute", left: 1, top: 11, width: 26, height: 26, borderRadius: "50%", background: `radial-gradient(circle, ${s.color} 0%, transparent 70%)`, opacity: 0, pointerEvents: "none" }}
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
   CARD 2 — Priority Lens. Many competing priorities → ONE ("Finish") is
   selected → that SAME element travels to the centre and resolves into one
   clear message: Start here. Not everywhere. The selected element is a single
   morphing DOM node (FLIP-measured travel + grow), so the user tracks Finish
   the whole way — never a crossfade between two boxes.
───────────────────────────────────────────────────────────────────── */
function Card2PriorityLens({ onContinue }: CardProps) {
  const { theme } = useFunnelTheme();
  const dark = theme === "dark";

  // Simple, legible hierarchy — warm = urgency/problem, indigo = clarity/the
  // chosen solution, neutral slate = secondary priorities. No cyan, no wash.
  const c = dark
    ? {
        stage: "#10141E",
        stageBorder: "rgba(163, 178, 255, 0.12)",
        stageShadow: "none",
        taskBg: "rgba(148, 163, 255, 0.06)",
        taskBorder: "rgba(163, 178, 255, 0.16)",
        taskText: "rgba(228, 233, 255, 0.62)",
        panelBg: "#171C29",
        selBorderOff: "rgba(163, 178, 255, 0.20)",
        selBorderOn: "#7C8AFF",
        selText: "#AEB7FF",
        warm: "#FFB28B",
      }
    : {
        stage: "#FFFFFF",
        stageBorder: "rgba(40, 52, 90, 0.14)",
        stageShadow: "var(--v2-shadow-sm)",
        taskBg: "#EEF1F7",
        taskBorder: "rgba(40, 52, 90, 0.12)",
        taskText: "#5A6473",
        panelBg: "#FFFFFF",
        selBorderOff: "rgba(40, 52, 90, 0.18)",
        selBorderOn: "#4655E6",
        selText: "#3B45C9",
        warm: "#C2691E",
      };

  // Five secondary priorities scattered (not gridded) around the edges, clear
  // of the central panel footprint. Finish is NOT here — it is the morphing
  // panel below. cx/cy = small Phase-2 pull toward centre; ox/oy = the slight
  // Phase-3 drift outward as Finish is chosen. Decorative (aria-hidden).
  const secondary = [
    { label: "Reply",    tag: "urgent", left: "19%", top: "17%", cx: 10, cy: 8,  ox: -6, oy: -5, cs: 1.03 },
    { label: "Plan",     tag: null,     left: "11%", top: "49%", cx: 9,  cy: 0,  ox: -7, oy: 0,  cs: 1.0  },
    { label: "Fix",      tag: null,     left: "89%", top: "49%", cx: -12, cy: 0, ox: 7,  oy: 0,  cs: 1.03 },
    { label: "Remember", tag: "today",  left: "21%", top: "83%", cx: 7,  cy: -8, ox: -6, oy: 5,  cs: 1.0  },
    { label: "Review",   tag: null,     left: "79%", top: "83%", cx: -8, cy: -7, ox: 6,  oy: 5,  cs: 1.0  },
  ];

  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      // Per-chip animation targets read off data-* so one scoped tween can pull
      // / push every secondary chip in its own direction.
      const ds = (k: string) => (_i: number, el: Element) =>
        Number((el as HTMLElement).dataset[k]);

      // FLIP-style geometry: measure where Finish starts (the upper-right slot)
      // vs the centred panel, so the SAME element travels + grows from chip to
      // selected panel — the user tracks one continuous object, never a swap.
      const panel = root.querySelector<HTMLElement>(".ic2-selected");
      const origin = root.querySelector<HTMLElement>(".ic2-finish-origin");
      let dx = 0;
      let dy = 0;
      if (panel && origin) {
        const p = panel.getBoundingClientRect();
        const o = origin.getBoundingClientRect();
        dx = o.left + o.width / 2 - (p.left + p.width / 2);
        dy = o.top + o.height / 2 - (p.top + p.height / 2);
      }
      const CHIP_SCALE = 0.58; // Finish reads as a compact chip before selection

      gsap.set(".ic2-frag", { xPercent: -50, yPercent: -50 });
      gsap.set(panel, { xPercent: -50, yPercent: -50, x: dx, y: dy, scale: CHIP_SCALE, transformOrigin: "50% 50%" });

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });

      // ── Phase 1 (0.0–~0.7s) · Recognition — the WHOLE field enters and settles
      //    before anything competes, so the user sees the complete initial set.
      tl.fromTo(".ic2-eyebrow", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 }, 0);
      tl.fromTo(".ic2-headline", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 }, 0.08);
      tl.fromTo(".ic2-support", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 }, 0.18);
      tl.fromTo(".ic2-frag", { opacity: 0, scale: 0.9, y: 8 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, stagger: 0.035 }, 0.28);
      // Finish enters as one more normal task (still small + quiet). All chips
      // are fully settled by ~0.72s — before competition starts at 0.8s.
      tl.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.36);

      // ── Phase 2 (0.80–1.30s) · Competing priorities — Reply / Fix / Finish
      //    drift toward the centre. Controlled (≤12–18px). A brief hold (1.30–
      //    1.40s) keeps the competing state readable before anything is chosen.
      tl.to(".ic2-frag", { x: ds("cx"), y: ds("cy"), scale: ds("cs"), duration: 0.5, ease: "sine.inOut" }, 0.8);
      tl.to(panel, { x: dx * 0.84, y: dy * 0.84, scale: CHIP_SCALE + 0.04, duration: 0.5, ease: "sine.inOut" }, 0.8);

      // ── Phase 3 (1.40–1.70s) · Selection — Finish is VISIBLY chosen while it
      //    stays near its original position: the selected-blue ring fades in,
      //    Finish firms up a touch, and the secondary tasks lose contrast + ease
      //    outward. This state holds ~0.3s BEFORE any travel, so the selection
      //    reads on its own. Only the ring's OPACITY animates (GSAP-owned), so a
      //    theme switch can recolour it without replaying or resetting selection.
      tl.to(".ic2-sel-ring", { opacity: 1, duration: 0.3 }, 1.4);
      tl.to(panel, { scale: CHIP_SCALE + 0.1, duration: 0.3, ease: "power2.out" }, 1.4);
      tl.to(".ic2-frag", { x: ds("ox"), y: ds("oy"), scale: 0.9, opacity: 0.5, duration: 0.4, ease: "power2.out" }, 1.4);

      // ── Phase 4 (1.70–2.35s) · Transform the SAME task — only AFTER the
      //    selection pause does Finish travel from its slot to the exact centre,
      //    growing to full size. One confident move, no bounce, no crossfade.
      tl.to(panel, { x: 0, y: 0, scale: 1, duration: 0.65, ease: "power3.inOut" }, 1.7);

      // ── Phase 5 (~2.25–2.62s) · Resolve — as Finish lands, the tracked "Finish"
      //    label softens out and the final message resolves IN PLACE inside the
      //    SAME panel (no new card, no geometry change). Finish stays readable
      //    through most of the travel; the message lands only at the end.
      tl.to(".ic2-finish", { opacity: 0, duration: 0.22 }, 2.25);
      tl.fromTo(".ic2-final", { opacity: 0, y: 3 }, { opacity: 1, y: 0, duration: 0.3 }, 2.32);

      // ── Phase 6 (~2.6s) · Payoff — quieter than the panel + CTA.
      tl.fromTo(".ic2-payoff", { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3 }, 2.6);

      // CTA — visible + focusable from mount; only a subtle final settle (~2.78s,
      // ending ~3.08s), never animated from opacity 0, never pulsed.
      tl.fromTo(".ic2-cta", { opacity: 0.94, scale: 0.99 }, { opacity: 1, scale: 1, duration: 0.3 }, 2.78);

      if (reduce) {
        tl.progress(1).pause(); // complete final state, no motion, nothing hidden
        return;
      }
      tl.play();
      // One-shot: no repeat, no infinite ambient, no pinning, no scroll trap.
    }, root);

    return () => ctx.revert();
    // Runs once on mount; reduced motion + ctx.revert keep it safe.
  }, []);

  return (
    // Single scroller (the quiz stage) — no own overflow, no fixed viewport
    // height. Safe-area bottom pad keeps the CTA clear of the iOS/Safari bar.
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
      {/* Centre the composition so there is no excessive void between the stage
          and the CTA; on tall screens the block sits centred, not stretched. */}
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
        }}
      >
        {/* Eyebrow — plain language, no product jargon */}
        <p className="ic2-eyebrow v2-hud" style={{ color: c.warm, marginBottom: 10, letterSpacing: "0.16em" }}>
          WHEN EVERYTHING FEELS URGENT
        </p>

        {/* Headline */}
        <h2
          className="ic2-headline v2-display"
          style={{
            fontSize: "clamp(22px, 6vw, 27px)",
            fontWeight: 560,
            lineHeight: 1.16,
            letterSpacing: "-0.01em",
            marginBottom: 10,
            color: "var(--v2-ink)",
          }}
        >
          Know what matters right now.
        </h2>

        {/* Supporting copy */}
        <p className="ic2-support" style={{ fontSize: 14.5, color: "var(--v2-ink-dim)", lineHeight: 1.5, marginBottom: 16 }}>
          FocusRoute turns too many priorities into one clear next step.
        </p>

        {/* Priority field — competing tasks → Finish is selected → it becomes the
            next step. Fixed pixel height (never a viewport unit) + overflow hidden
            keep the small movements from clipping or overflowing the page. */}
        <div
          className="ic2-stage"
          style={{
            position: "relative",
            height: "clamp(202px, 54vw, 226px)",
            borderRadius: 18,
            overflow: "hidden",
            background: c.stage,
            border: `1px solid ${c.stageBorder}`,
            boxShadow: c.stageShadow,
          }}
        >
          {/* Invisible origin marker — the upper-right slot Finish travels from.
              Measured for the FLIP transform; carries no visual or a11y weight. */}
          <span
            className="ic2-finish-origin"
            aria-hidden="true"
            style={{ position: "absolute", left: "75%", top: "18%", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
          />

          {/* Secondary competing priorities — decorative; meaning is in the copy */}
          {secondary.map((f) => (
            <span
              key={f.label}
              className="ic2-frag"
              aria-hidden="true"
              data-cx={f.cx}
              data-cy={f.cy}
              data-ox={f.ox}
              data-oy={f.oy}
              data-cs={f.cs}
              style={{
                position: "absolute",
                left: f.left,
                top: f.top,
                transform: "translate(-50%, -50%)",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: "5px 10px",
                borderRadius: 9,
                background: c.taskBg,
                border: `1px solid ${c.taskBorder}`,
                color: c.taskText,
                fontSize: 12.5,
                fontWeight: 600,
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              {f.label}
              {f.tag && (
                <span style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, color: c.warm }}>
                  {f.tag}
                </span>
              )}
            </span>
          ))}

          {/* Finish → final message. The SAME outer element is the chip, travels
              to the centre and becomes this panel. Its two-line height is fixed by
              the (in-flow) final message so the geometry never jumps; "Finish" is
              an absolute overlay the user tracks until it resolves on landing. */}
          <div
            className="ic2-selected"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 4,
              width: "clamp(210px, 62%, 224px)",
              padding: "17px 22px",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              background: c.panelBg,
              border: `1px solid ${c.selBorderOff}`,
            }}
          >
            {/* Selected-state border + depth — overlays the panel's neutral
                border with ONE thin selected-blue line and a subtle restrained
                shadow (no strong colour ring / double-border glow). Only opacity
                animates (border + shadow static), so theme re-colours cleanly. */}
            <span
              className="ic2-sel-ring"
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 16,
                border: `1px solid ${c.selBorderOn}`,
                boxShadow: "var(--v2-shadow-sm)",
                opacity: 0,
                pointerEvents: "none",
              }}
            />

            {/* Final message — the only content: two explicit lines (never a wrap
                dependency). In flow, so it fixes the panel's height; resolves on
                landing. This is the accessible text the panel announces. */}
            <p
              className="ic2-final"
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: c.selText,
              }}
            >
              <span style={{ display: "block", whiteSpace: "nowrap" }}>
                Start here.
              </span>
              <span
                style={{
                  display: "block",
                  whiteSpace: "nowrap",
                  marginTop: 4,
                }}
              >
                Not everywhere.
              </span>
            </p>

            {/* Finish — the tracked task during competition + travel; an absolute
                overlay (no layout weight) that softens out as the message lands.
                Decorative: the message above carries the panel's meaning. */}
            <span
              className="ic2-finish"
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                fontSize: 20,
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: c.selText,
              }}
            >
              Finish
            </span>
          </div>
        </div>

        {/* Payoff — readable, but quieter than the CTA. Sits directly below the
            stage (no return-anchor slot) so it reads as the visual conclusion. */}
        <p className="ic2-payoff" style={{ fontSize: 14, fontWeight: 550, color: "var(--v2-ink-dim)", textAlign: "center", lineHeight: 1.35, marginTop: 22 }}>
          Less time deciding. More time doing.
        </p>

        {/* CTA — visibly present, clickable and keyboard-focusable from mount;
            the timeline only nudges it from 0.94 → 1, never from 0. */}
        <button
          onClick={onContinue}
          className="ic2-cta v2-cta"
          style={{ width: "100%", minHeight: 54, fontSize: 15, marginTop: 14 }}
        >
          Show Me My Next Step
        </button>
      </div>
    </div>
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
   CARD 4 — From result to action: six steps light up and link, showing what
   to do next and how to adjust (nodes ignite + link).
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
    { label: "See what gets in the way", sub: "based on your answers" },
    { label: "Choose what to do first", sub: "one clear next step" },
    { label: "Try one small action", sub: "clear and doable" },
    { label: "Notice what helps", sub: "keep what works" },
    { label: "Adjust when needed", sub: "without rebuilding everything" },
    { label: "Keep moving forward", sub: "one step at a time" },
  ];

  return (
    <CardShell
      rootRef={ref}
      eyebrow="FROM RESULT TO ACTION"
      eyebrowColor={role.accent}
      title="Know what to do next — and adjust without starting over."
      cta="Show Me What Comes Next"
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
   CARD 5 — Teaser before the result. A visual grammar deliberately distinct
   from Card 1 (no IC1 scan, no vertical route, no four-node column): scattered
   answer fragments converge into THREE clear groups (starting / staying on
   track / getting back), a single route forms beneath them, and "Your pattern
   is ready" lands before the CTA. The exact score and the pattern's name are
   intentionally WITHHELD — they appear for the first time on the result. One
   GSAP timeline (~1.9s) plays once; reduced motion snaps to the final state. The
   CTA is visibly present (it never animates below 0.88 opacity) and clickable +
   keyboard-focusable from the first render — never invisible while interactive.
───────────────────────────────────────────────────────────────────── */
function Card5Unlock({ onContinue }: CardProps) {
  const { theme } = useFunnelTheme();
  const dark = theme === "dark";

  // Three intentional, controlled group colors (light + dark). Color carries
  // the "three distinct areas" meaning; the labels carry it on their own too.
  const groups = [
    {
      label: "Starting",
      caption: "where starting becomes harder",
      color: dark ? "#B39BFF" : "#7A4FD0",
    },
    {
      label: "Staying on track",
      caption: "what tends to interrupt follow-through",
      color: dark ? "#6FE0C2" : "#1C8A5A",
    },
    {
      label: "Getting back",
      caption: "where your next step should begin",
      color: dark ? "#F0DCAE" : "#9A7A2E",
    },
  ];
  const routeColor = dark ? "#9BE8FF" : "#1487B5";
  const eyebrowColor = dark ? "#B39BFF" : "#7A4FD0";

  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      // Route hidden behind a fixed dash, then draws clean (codebase pattern).
      gsap.set(".ic5-route", { strokeDasharray: 340, strokeDashoffset: 340 });

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });

      // 1 · Eyebrow + headline
      tl.fromTo(".ic5-rv", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 }, 0);

      // 2 · Fragments appear loosely scattered across the stage…
      tl.fromTo(
        ".ic5-dot",
        {
          opacity: 0,
          scale: 0.5,
          x: () => gsap.utils.random(-80, 80),
          y: () => gsap.utils.random(-54, 54),
        },
        { opacity: 0.95, scale: 1, duration: 0.35, stagger: 0.015 },
        0.2,
      );
      // …then settle home into their three groups (x/y → 0 = final DOM slot).
      tl.to(".ic5-dot", { x: 0, y: 0, duration: 0.5, stagger: 0.015, ease: "power3.inOut" }, 0.65);

      // 3 · Group labels + captions resolve as the clusters tighten
      tl.fromTo(".ic5-group-label", { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.08 }, 1.0);
      tl.fromTo(".ic5-group-cap", { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.08 }, 1.1);

      // 4 · A single route forms beneath the groups + its three stops ignite
      tl.fromTo(".ic5-route", { strokeDashoffset: 340 }, { strokeDashoffset: 0, duration: 0.55, ease: "power2.inOut" }, 1.15);
      tl.fromTo(".ic5-route-node", { scale: 0 }, { scale: 1, duration: 0.26, stagger: 0.1, ease: "back.out(2)" }, 1.3);

      // 5 · "Your pattern is ready"
      tl.fromTo(".ic5-ready", { opacity: 0, y: 8, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.6)" }, 1.5);

      // 6 · CTA gets a subtle settle only — it is already visible (≥0.88
      // opacity) and focusable from mount, so it is never invisible while
      // interactive. Reduced motion lands it fully opaque via progress(1).
      tl.fromTo(".ic5-cta", { opacity: 0.88, y: 6 }, { opacity: 1, y: 0, duration: 0.33 }, 1.62);

      if (reduce) {
        tl.progress(1).pause(); // complete final state, no motion, nothing hidden
        return;
      }
      tl.play();
      // One-shot: no repeat, no infinite ambient, no pinning, no scroll trap.
    }, root);

    return () => ctx.revert();
    // Runs once on mount; reduced motion + ctx.revert keep it safe.
  }, []);

  return (
    // Single scroller (the quiz stage) — no own overflow, no fixed height.
    // Safe-area bottom pad keeps "See My Result" clear of the iOS/Safari bar.
    <div
      ref={ref}
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 18px calc(24px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div style={{ width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Responsive group layout: three across normally; on very narrow
            screens the first two sit side by side and the third spans full
            width below — one visual system, no font reduction, pure CSS. */}
        <style>{`
          .ic5-groups { grid-template-columns: repeat(3, 1fr); }
          @media (max-width: 359px) {
            .ic5-groups { grid-template-columns: 1fr 1fr; }
            .ic5-group--wide { grid-column: 1 / -1; }
          }
        `}</style>

        {/* Eyebrow — plain language, no instrumentation */}
        <p className="ic5-rv v2-hud" style={{ color: eyebrowColor, marginBottom: 10, letterSpacing: "0.16em" }}>
          Based on what you shared
        </p>

        {/* Headline */}
        <h2
          className="ic5-rv v2-display"
          style={{
            fontSize: "clamp(22px, 6vw, 27px)",
            fontWeight: 560,
            lineHeight: 1.16,
            letterSpacing: "-0.01em",
            marginBottom: 16,
            color: "var(--v2-ink)",
          }}
        >
          Your answers are starting to show a clear pattern.
        </h2>

        {/* Stage — scattered fragments → three groups → one route */}
        <div
          className="ic5-rv"
          style={{
            padding: "16px 14px 14px",
            borderRadius: 18,
            border: `1px solid color-mix(in srgb, ${routeColor} 26%, transparent)`,
            background: `linear-gradient(165deg, color-mix(in srgb, ${routeColor} 9%, transparent), transparent)`,
          }}
        >
          <div className="ic5-groups" style={{ display: "grid", gap: 8 }}>
            {groups.map((g, gi) => (
              <div
                key={g.label}
                className={gi === 2 ? "ic5-group ic5-group--wide" : "ic5-group"}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", minWidth: 0 }}
              >
                {/* Dot cluster — 4 fragments in a tight 2×2; GSAP scatters then settles them */}
                <div
                  style={{
                    width: 34,
                    height: 34,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    justifyContent: "center",
                    alignContent: "center",
                  }}
                >
                  {[0, 1, 2, 3].map((d) => (
                    <span
                      key={d}
                      className="ic5-dot"
                      aria-hidden="true"
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: g.color,
                        boxShadow: `0 0 8px ${g.color}`,
                      }}
                    />
                  ))}
                </div>
                <p
                  className="ic5-group-label"
                  style={{ marginTop: 9, fontSize: 13.5, fontWeight: 700, color: "var(--v2-ink)", lineHeight: 1.25 }}
                >
                  {g.label}
                </p>
                <p
                  className="ic5-group-cap"
                  style={{ marginTop: 4, fontSize: 12, color: "var(--v2-ink-dim)", lineHeight: 1.35 }}
                >
                  {g.caption}
                </p>
              </div>
            ))}
          </div>

          {/* The single route that forms beneath the three groups */}
          <div style={{ position: "relative", marginTop: 12, height: 30 }}>
            <svg
              width="100%"
              height="30"
              viewBox="0 0 300 30"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden="true"
              style={{ position: "absolute", inset: 0 }}
            >
              <path
                className="ic5-route"
                d="M22 18 C 70 4, 90 4, 150 16 C 210 28, 230 28, 278 14"
                stroke={routeColor}
                strokeWidth="2"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 4px ${routeColor})` }}
              />
            </svg>
            {/* Three route stops, aligned to the three groups */}
            {[16, 50, 84].map((leftPct) => (
              <span
                key={leftPct}
                className="ic5-route-node"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: `${leftPct}%`,
                  width: 10,
                  height: 10,
                  marginTop: -5,
                  marginLeft: -5,
                  borderRadius: "50%",
                  background: routeColor,
                  boxShadow: `0 0 9px ${routeColor}`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Your pattern is ready */}
        <div
          className="ic5-ready"
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              color: dark ? "#06070D" : "#FFFFFF",
              background: routeColor,
              boxShadow: `0 0 10px ${routeColor}`,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            ✓
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--v2-ink)" }}>
            Your pattern is ready
          </span>
        </div>

        {/* Spacer pushes the CTA toward the bottom on tall screens */}
        <div style={{ flex: 1, minHeight: 14 }} />

        {/* CTA — visibly present, clickable and keyboard-focusable from mount;
            the timeline only nudges it from 0.88 → 1 opacity, never from 0. */}
        <button
          onClick={onContinue}
          className="ic5-cta v2-cta"
          style={{ width: "100%", minHeight: 54, fontSize: 15, marginTop: 4 }}
        >
          See My Result
        </button>
      </div>
    </div>
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
      return <Card2PriorityLens question={question} onContinue={onContinue} />;
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
