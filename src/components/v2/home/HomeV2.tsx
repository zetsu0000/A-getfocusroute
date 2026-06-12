"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Clock,
  Compass,
  FileText,
  Lock,
  Map,
  Menu,
  Route,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";
import { RouteScene } from "@/components/v2/RouteScene";
import { FocusField } from "@/components/v2/FocusField";
import { FocusRadar } from "@/components/v2/FocusRadar";
import { Magnetic } from "@/components/v2/Magnetic";
import { TiltCard } from "@/components/v2/TiltCard";
import { HudLabel, TelemetryChip, SignalRule } from "@/components/v2/primitives";

/**
 * HomeV2 — the Focus Observatory landing.
 *
 * Dark cinematic rebuild of the homepage: WebGL route nebula hero, GSAP
 * scroll choreography, glass instrument panels, route-station walkthrough.
 * All routes, claims and CTAs match the production page — only the visual
 * and motion layer changed.
 */

const navLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#brain-profile", label: "Brain Profile" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/about", label: "About" },
];

const recognition = [
  "You know what to do, but can't enter the task.",
  "You start with energy, then lose momentum.",
  "Simple things feel heavier than they should.",
  "Rest doesn't always reset you.",
];

const profileCards = [
  {
    icon: Brain,
    title: "Brain Profile",
    body: "A plain-English report that maps how your attention starts, stalls, and recovers.",
  },
  {
    icon: Sparkles,
    title: "Cognitive Signature",
    body: "A memorable shorthand for your self-reported focus pattern and working style.",
  },
  {
    icon: BarChart3,
    title: "Focus friction map",
    body: "A clearer view of the moments where task initiation, context switching, or recovery break down.",
  },
  {
    icon: Target,
    title: "Best starting conditions",
    body: "Practical cues for the environments, prompts, and first steps that reduce resistance.",
  },
  {
    icon: Compass,
    title: "Recovery style",
    body: "How you tend to return after distraction, overload, or a stalled day.",
  },
  {
    icon: Route,
    title: "Next-step protocols",
    body: "Recommendations for turning insight into action, including the 28-Day Protocol.",
  },
];

const benefits = [
  "Clearer self-understanding without turning it into a diagnosis.",
  "Less self-blame when your starting system is overloaded.",
  "Better language for explaining your patterns to someone else.",
  "More useful next steps than generic productivity advice.",
];

const stations = [
  ["01", "Take the assessment", "Answer pattern-based questions about attention, task entry, friction, and recovery."],
  ["02", "Get your FocusRoute preview", "See the beginning of your cognitive map and whether the language feels accurate."],
  ["03", "Unlock your full Brain Profile if it feels useful", "Keep the full report, explanation script, and next-step recommendations in your account."],
] as const;

const trustCards = [
  { icon: Lock, title: "Private results", body: "Your assessment data is used to generate your profile, not to sell ads." },
  { icon: FileText, title: "Educational profiling", body: "FocusRoute is for self-understanding and productivity support." },
  { icon: Shield, title: "Not medical treatment", body: "It is not a diagnosis, medical test, therapy, or clinical substitute." },
  { icon: Clock, title: "Low-friction start", body: "The assessment takes about 3 minutes and gives you a preview before purchase." },
];

function PrimaryCta({ children = "Begin the Assessment" }: { children?: string }) {
  return (
    <Magnetic>
      <Link href="/assessment" className="v2-cta">
        {children}
        <ArrowRight size={16} strokeWidth={2.6} />
      </Link>
    </Magnetic>
  );
}

/** Splits text into word spans the hero timeline can choreograph in 3D. */
function HeroWords({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          data-hero-word
          className={className}
          style={{ display: "inline-block", whiteSpace: "pre", willChange: "transform" }}
        >
          {w + (i < words.length - 1 ? " " : "")}
        </span>
      ))}
    </>
  );
}

export default function HomeV2() {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroProgress = useRef(0);

  useEffect(() => {
    let ctx: { revert: () => void } | null = null;
    let cancelled = false;

    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled || !rootRef.current) return;

      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const mm = gsap.matchMedia();

        // Hero scroll progress feeds the WebGL route draw-in.
        ScrollTrigger.create({
          trigger: "[data-hero]",
          start: "top top",
          end: "bottom top",
          onUpdate: (self) => {
            heroProgress.current = self.progress;
          },
        });

        mm.add("(prefers-reduced-motion: no-preference)", () => {
          // Cinematic hero entrance: eyebrow → headline words rising out of
          // 3D space → supporting copy → CTAs → telemetry chips.
          const intro = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.18 });
          intro
            .from("[data-hero-eyebrow]", { y: 18, opacity: 0, duration: 0.7 })
            .from(
              "[data-hero-word]",
              {
                yPercent: 85,
                opacity: 0,
                rotateX: -55,
                filter: "blur(7px)",
                transformPerspective: 700,
                transformOrigin: "50% 100%",
                duration: 0.9,
                stagger: 0.065,
              },
              "-=0.35",
            )
            .from("[data-hero-sub]", { y: 26, opacity: 0, filter: "blur(6px)", duration: 0.8 }, "-=0.5")
            .from("[data-hero-actions]", { y: 22, opacity: 0, duration: 0.7 }, "-=0.55")
            .from("[data-hero-chips]", { y: 14, opacity: 0, duration: 0.6 }, "-=0.45");

          // Hero content recedes into depth while scrolling past.
          gsap.to("[data-hero-inner]", {
            opacity: 0,
            scale: 0.94,
            yPercent: -6,
            ease: "none",
            scrollTrigger: {
              trigger: "[data-hero]",
              start: "12% top",
              end: "bottom 35%",
              scrub: true,
            },
          });

          // Generic reveal-on-scroll blocks.
          gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
            gsap.from(el, {
              y: 44,
              opacity: 0,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 86%" },
            });
          });

          // Staggered card grids.
          gsap.utils.toArray<HTMLElement>("[data-reveal-grid]").forEach((grid) => {
            gsap.from(grid.children, {
              y: 38,
              opacity: 0,
              duration: 0.8,
              stagger: 0.08,
              ease: "power3.out",
              scrollTrigger: { trigger: grid, start: "top 84%" },
            });
          });

          // Instrument panel: cards swing in from 3D space.
          gsap.utils.toArray<HTMLElement>("[data-reveal-3d]").forEach((grid) => {
            gsap.from(grid.children, {
              y: 48,
              opacity: 0,
              rotateY: -16,
              rotateX: 5,
              transformPerspective: 900,
              transformOrigin: "left center",
              duration: 1.0,
              stagger: 0.09,
              ease: "power3.out",
              scrollTrigger: { trigger: grid, start: "top 82%" },
            });
          });

          // Stations light up as the route line reaches them.
          gsap.utils.toArray<HTMLElement>("[data-station]").forEach((station) => {
            const marker = station.querySelector(".v2-station");
            if (!marker) return;
            ScrollTrigger.create({
              trigger: station,
              start: "top 64%",
              onEnter: () => marker.classList.add("is-active"),
              onLeaveBack: () => marker.classList.remove("is-active"),
            });
          });

          // The floating radar drifts against scroll for depth.
          const radar = document.querySelector("[data-radar-float]");
          if (radar) {
            gsap.to(radar, {
              y: -70,
              ease: "none",
              scrollTrigger: {
                trigger: "#brain-profile",
                start: "top bottom",
                end: "bottom top",
                scrub: 0.8,
              },
            });
          }

          // The route line between stations draws itself in.
          const path = document.querySelector<SVGPathElement>("[data-route-path]");
          if (path) {
            const len = path.getTotalLength();
            gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
            gsap.to(path, {
              strokeDashoffset: 0,
              ease: "none",
              scrollTrigger: {
                trigger: "[data-stations]",
                start: "top 70%",
                end: "bottom 60%",
                scrub: 0.6,
              },
            });
          }
        });
      }, rootRef);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="v2-screen v2-grain" style={{ overflowX: "clip" }}>
      <style>{`
        .v2h-shell { max-width: 1180px; margin: 0 auto; padding-left: 26px; padding-right: 26px; min-width: 0; }
        .v2h-desktop-nav { display: flex; }
        .v2h-mobile-menu { display: none; }
        .v2h-grid-cards { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 16px; }
        .v2h-grid-recognition { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 14px; }
        .v2h-grid-trust { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 14px; }
        .v2h-benefit-grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 16px; }
        .v2h-card { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), border-color 0.35s, box-shadow 0.35s; }
        .v2h-card:hover {
          transform: translateY(-4px);
          border-color: rgba(163,178,255,0.38) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 26px 70px rgba(2,3,10,0.6), 0 0 44px rgba(124,138,255,0.14) !important;
        }
        .v2h-nav-link { color: var(--v2-ink-dim); font-size: 13px; font-weight: 600; text-decoration: none; transition: color 0.2s; }
        .v2h-nav-link:hover { color: var(--v2-ink); }
        .v2h-menu-link { display: block; color: var(--v2-ink); font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 10px; border-radius: 10px; }
        .v2h-menu-link:hover { background: var(--v2-glass-2); }
        .v2h-mobile-menu summary::-webkit-details-marker { display: none; }
        @media (max-width: 1080px) {
          .v2h-radar { display: none; }
        }
        @media (max-width: 880px) {
          .v2h-desktop-nav { display: none !important; }
          .v2h-mobile-menu { display: block !important; }
          .v2h-grid-cards { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
          .v2h-grid-recognition { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
          .v2h-grid-trust { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
          .v2h-benefit-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 560px) {
          .v2h-shell { padding-left: 18px; padding-right: 18px; }
          .v2h-grid-cards { grid-template-columns: 1fr !important; }
          .v2h-grid-recognition { grid-template-columns: 1fr !important; }
          .v2h-grid-trust { grid-template-columns: 1fr !important; }
          .v2h-hero-actions { flex-direction: column; align-items: stretch !important; }
          .v2h-hero-actions > * { width: 100%; }
          .v2h-hero-actions a { width: 100%; }
        }
      `}</style>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "rgba(6,7,13,0.55)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: "1px solid var(--v2-line)",
        }}
      >
        <div
          className="v2h-shell"
          style={{
            minHeight: 66,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              gap: 8,
              textDecoration: "none",
            }}
          >
            <span className="v2-display" style={{ fontSize: 19, fontWeight: 600, color: "var(--v2-ink)" }}>
              FocusRoute
            </span>
            <span className="v2-hud" style={{ fontSize: 9, color: "var(--v2-signal-2)" }}>
              V2
            </span>
          </Link>

          <nav className="v2h-desktop-nav" style={{ alignItems: "center", gap: 26 }}>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="v2h-nav-link">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="v2h-desktop-nav" style={{ alignItems: "center", gap: 14 }}>
            <Link href="/login" className="v2h-nav-link" style={{ fontWeight: 700 }}>
              Login
            </Link>
            <Link
              href="/assessment"
              className="v2-cta"
              style={{ minHeight: 42, padding: "10px 20px", fontSize: 13 }}
            >
              Start free
            </Link>
          </div>

          <details className="v2h-mobile-menu" style={{ position: "relative" }}>
            <summary
              aria-label="Open navigation menu"
              style={{
                listStyle: "none",
                width: 42,
                height: 42,
                borderRadius: 12,
                border: "1px solid var(--v2-line)",
                background: "var(--v2-glass)",
                color: "var(--v2-ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Menu size={19} />
            </summary>
            <div
              className="v2-panel"
              style={{
                position: "absolute",
                right: 0,
                top: 52,
                width: "min(280px, calc(100vw - 36px))",
                padding: 12,
                background: "rgba(10,13,24,0.92)",
              }}
            >
              {[...navLinks, { href: "/login", label: "Login" }].map((link) => (
                <Link key={link.href} href={link.href} className="v2h-menu-link">
                  {link.label}
                </Link>
              ))}
              <div style={{ padding: "10px 4px 4px" }}>
                <Link href="/assessment" className="v2-cta" style={{ width: "100%", minHeight: 48 }}>
                  Start free <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </details>
        </div>
      </header>

      {/* ── Hero: the route nebula ──────────────────────────────── */}
      <section data-hero style={{ position: "relative", height: "172svh" }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            height: "100svh",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
          }}
        >
          <RouteScene progressRef={heroProgress} />

          {/* readability scrim — quiets the particle field behind the
              headline column so type and CTA own the hierarchy */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(70% 80% at 30% 48%, rgba(4,5,12,0.62) 0%, rgba(4,5,12,0.30) 45%, transparent 72%)",
              pointerEvents: "none",
            }}
          />

          {/* horizon glow */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(80% 55% at 50% 115%, rgba(124,138,255,0.16) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />

          <div data-hero-inner className="v2h-shell" style={{ position: "relative", width: "100%", zIndex: 2 }}>
            <div style={{ maxWidth: 880, paddingTop: 66 }}>
              <div data-hero-eyebrow>
                <HudLabel tone="signal" style={{ marginBottom: 22 }}>
                  Focus pattern intelligence — free 3-minute assessment
                </HudLabel>
              </div>
              <h1
                className="v2-display"
                style={{
                  fontSize: "clamp(46px, 8.4vw, 104px)",
                  lineHeight: 0.98,
                  fontWeight: 550,
                  letterSpacing: "-0.03em",
                  marginBottom: 26,
                  perspective: 700,
                }}
              >
                <HeroWords text="Your focus isn't broken." />
                <br />
                <em style={{ fontStyle: "italic", fontWeight: 500 }}>
                  <HeroWords text="It's unmapped." className="v2-text-signal" />
                </em>
              </h1>
              <p
                data-hero-sub
                style={{
                  fontSize: "clamp(16px, 2vw, 19px)",
                  lineHeight: 1.7,
                  color: "var(--v2-ink-dim)",
                  maxWidth: 560,
                  marginBottom: 34,
                }}
              >
                A guided assessment that maps how your attention starts, stalls, and
                recovers — then shows you the next step that fits, without turning it
                into a diagnosis.
              </p>
              <div
                data-hero-actions
                className="v2h-hero-actions"
                style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 30 }}
              >
                <PrimaryCta />
                <a href="#how-it-works" className="v2-ghost">
                  How it works
                </a>
              </div>
              <div data-hero-chips style={{ display: "flex", gap: "10px 22px", flexWrap: "wrap" }}>
                <TelemetryChip>Free</TelemetryChip>
                <TelemetryChip>3 minutes</TelemetryChip>
                <TelemetryChip>Private results</TelemetryChip>
                <TelemetryChip color="var(--v2-ink-faint)">Not a diagnosis</TelemetryChip>
              </div>
            </div>
          </div>

          {/* scroll cue */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: 26,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              zIndex: 2,
            }}
          >
            <span className="v2-hud" style={{ fontSize: 9 }}>
              Scroll to trace the route
            </span>
            <span
              style={{
                width: 1,
                height: 44,
                background: "linear-gradient(to bottom, rgba(155,232,255,0.7), transparent)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  width: 1,
                  height: 12,
                  background: "var(--v2-signal-2)",
                  animation: "v2-scan 1.8s ease-in-out infinite",
                }}
              />
            </span>
          </div>
        </div>
      </section>

      {/* ── Signal readings: recognition ────────────────────────── */}
      <section className="v2h-shell" style={{ padding: "30px 26px 90px", position: "relative" }}>
        <div data-reveal style={{ marginBottom: 30 }}>
          <HudLabel style={{ marginBottom: 14 }}>Signal readings — patterns people recognize</HudLabel>
          <SignalRule />
        </div>
        <div data-reveal-grid className="v2h-grid-recognition">
          {recognition.map((item, i) => (
            <TiltCard key={item} maxTilt={6} style={{ height: "100%" }}>
              <div
                className="v2-panel v2h-card"
                style={{
                  padding: "22px 20px",
                  minHeight: 150,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <span className="v2-hud" style={{ color: "var(--v2-signal-2)", fontSize: 10 }}>
                  {String(i + 1).padStart(2, "0")} / NOISE
                </span>
                <p
                  className="v2-display"
                  style={{ fontSize: 19, fontWeight: 500, lineHeight: 1.3, letterSpacing: "-0.015em" }}
                >
                  {item}
                </p>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* ── Instrument panel: what you get ──────────────────────── */}
      <section id="brain-profile" style={{ position: "relative", borderBlock: "1px solid var(--v2-line)", background: "rgba(8,10,20,0.5)" }}>
        <div className="v2-aurora" aria-hidden="true" />
        {/* floating focus-map instrument, drifting against scroll */}
        <div
          data-radar-float
          className="v2h-radar"
          aria-hidden="true"
          style={{ position: "absolute", right: "4%", top: 40, opacity: 0.85, pointerEvents: "none" }}
        >
          <FocusRadar size={300} />
        </div>
        <div className="v2h-shell" style={{ position: "relative", padding: "90px 26px" }}>
          <div data-reveal style={{ maxWidth: 680, marginBottom: 44 }}>
            <HudLabel tone="signal" style={{ marginBottom: 16 }}>
              The instrument panel
            </HudLabel>
            <h2
              className="v2-display"
              style={{ fontSize: "clamp(30px, 4.6vw, 52px)", lineHeight: 1.06, marginBottom: 16 }}
            >
              A premium report for turning self-observation into a{" "}
              <em className="v2-text-signal" style={{ fontStyle: "italic" }}>clearer next step</em>.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--v2-ink-dim)", maxWidth: 560 }}>
              The assessment makes your patterns easier to see, explain, and act on —
              without clinical claims or generic productivity scripts.
            </p>
          </div>

          <div data-reveal-3d className="v2h-grid-cards" style={{ perspective: 1200 }}>
            {profileCards.map(({ icon: Icon, title, body }, index) => (
              <TiltCard key={title} maxTilt={5} style={{ height: "100%" }}>
                <article
                  className="v2-panel v2h-card"
                  style={{
                    padding: "24px 22px",
                    height: "100%",
                    ...(index === 0
                      ? {
                          borderColor: "rgba(124,138,255,0.4)",
                          boxShadow:
                            "inset 0 1px 0 rgba(255,255,255,0.1), 0 24px 60px rgba(2,3,10,0.55), 0 0 56px rgba(124,138,255,0.18)",
                        }
                      : null),
                  }}
                >
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--v2-signal-2)",
                      background: "rgba(124,138,255,0.10)",
                      border: "1px solid rgba(124,138,255,0.25)",
                      marginBottom: 18,
                    }}
                  >
                    <Icon size={20} strokeWidth={1.8} />
                  </span>
                  <h3 className="v2-display" style={{ fontSize: 20, fontWeight: 550, marginBottom: 8 }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--v2-ink-dim)" }}>{body}</p>
                </article>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Route stations: how it works ────────────────────────── */}
      <section id="how-it-works" className="v2h-shell" style={{ padding: "96px 26px" }}>
        <div data-reveal style={{ maxWidth: 640, marginBottom: 50 }}>
          <HudLabel tone="signal" style={{ marginBottom: 16 }}>
            The route
          </HudLabel>
          <h2 className="v2-display" style={{ fontSize: "clamp(30px, 4.6vw, 52px)", lineHeight: 1.06 }}>
            Three stations between{" "}
            <em style={{ fontStyle: "italic", color: "var(--v2-ink-faint)" }}>noise</em> and{" "}
            <em className="v2-text-signal" style={{ fontStyle: "italic" }}>signal</em>.
          </h2>
        </div>

        <div data-stations style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
          {/* the drawn route line */}
          <svg
            aria-hidden="true"
            viewBox="0 0 60 600"
            preserveAspectRatio="none"
            style={{ position: "absolute", left: 20, top: 0, width: 60, height: "100%", overflow: "visible" }}
          >
            <path
              d="M30 10 C 50 120, 10 200, 30 300 C 50 400, 10 480, 30 590"
              fill="none"
              stroke="rgba(163,178,255,0.12)"
              strokeWidth="1.5"
            />
            <path
              data-route-path
              d="M30 10 C 50 120, 10 200, 30 300 C 50 400, 10 480, 30 590"
              fill="none"
              stroke="url(#v2h-route-grad)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="v2h-route-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C8AFF" />
                <stop offset="100%" stopColor="#9BE8FF" />
              </linearGradient>
            </defs>
          </svg>

          <div style={{ display: "grid", gap: 56, paddingLeft: 86 }}>
            {stations.map(([num, title, body]) => (
              <div data-reveal data-station key={num} style={{ position: "relative" }}>
                <span
                  aria-hidden="true"
                  className="v2-station"
                  style={{
                    position: "absolute",
                    left: -66,
                    top: 4,
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "1px solid rgba(163,178,255,0.4)",
                    background: "rgba(10,13,24,0.9)",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--v2-font-mono)",
                    fontSize: 12,
                    color: "var(--v2-signal-2)",
                    boxShadow: "0 0 24px rgba(124,138,255,0.25)",
                  }}
                >
                  {num}
                </span>
                <h3 className="v2-display" style={{ fontSize: 23, fontWeight: 550, marginBottom: 8 }}>
                  {title}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--v2-ink-dim)", maxWidth: 520 }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why people use it ───────────────────────────────────── */}
      <section className="v2h-shell" style={{ padding: "20px 26px 90px" }}>
        <div className="v2h-benefit-grid">
          <div
            data-reveal
            className="v2-panel"
            style={{
              padding: "34px 30px",
              borderRadius: "var(--v2-r-lg)",
              background:
                "radial-gradient(120% 110% at 15% 0%, rgba(124,138,255,0.16) 0%, transparent 55%), linear-gradient(165deg, rgba(148,163,255,0.08), rgba(148,163,255,0.03))",
            }}
          >
            <HudLabel tone="signal" style={{ marginBottom: 16 }}>
              Why people use it
            </HudLabel>
            <h2 className="v2-display" style={{ fontSize: "clamp(26px, 3.6vw, 40px)", lineHeight: 1.12 }}>
              Better language for the moments where{" "}
              <em className="v2-text-signal" style={{ fontStyle: "italic" }}>effort alone</em> is not the answer.
            </h2>
          </div>
          <div data-reveal-grid style={{ display: "grid", gap: 12, alignContent: "center" }}>
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="v2-panel"
                style={{ display: "flex", gap: 13, alignItems: "flex-start", padding: "16px 18px", borderRadius: 16 }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    marginTop: 6,
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: "var(--v2-signal-2)",
                    boxShadow: "0 0 10px var(--v2-signal-2)",
                    flexShrink: 0,
                  }}
                />
                <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--v2-ink-dim)", fontWeight: 600 }}>
                  {benefit}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 28-Day Protocol banner ──────────────────────────────── */}
      <section className="v2h-shell" style={{ padding: "0 26px 96px" }}>
        <div
          data-reveal
          className="v2-panel"
          style={{
            borderRadius: "var(--v2-r-lg)",
            borderColor: "rgba(217,188,127,0.28)",
            background:
              "radial-gradient(110% 120% at 85% -10%, rgba(217,188,127,0.12) 0%, transparent 55%), linear-gradient(165deg, rgba(217,188,127,0.05), rgba(148,163,255,0.03))",
            padding: "32px 28px",
            display: "grid",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: "rgba(217,188,127,0.12)",
                border: "1px solid rgba(217,188,127,0.3)",
                color: "var(--v2-gold)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Map size={21} strokeWidth={1.8} />
            </span>
            <div>
              <HudLabel tone="gold" style={{ marginBottom: 6 }}>
                Optional next step
              </HudLabel>
              <h2 className="v2-display" style={{ fontSize: "clamp(22px, 3vw, 30px)", lineHeight: 1.15 }}>
                Turn your Brain Profile into a{" "}
                <em className="v2-text-gold" style={{ fontStyle: "italic" }}>28-day focus system</em>.
              </h2>
            </div>
          </div>
          <p style={{ maxWidth: 700, fontSize: 15, lineHeight: 1.7, color: "var(--v2-ink-dim)" }}>
            The 28-Day Protocol is the guided roadmap after the profile: daily
            micro-actions, reflection prompts, recovery tools, and practical routines
            for turning insight into action.
          </p>
          <Link href="/roadmap" className="v2-ghost" style={{ justifySelf: "start" }}>
            Explore the 28-Day Protocol
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── Trust grid ──────────────────────────────────────────── */}
      <section style={{ position: "relative", borderBlock: "1px solid var(--v2-line)", background: "rgba(8,10,20,0.5)" }}>
        <div className="v2-aurora" aria-hidden="true" />
        <div className="v2h-shell" style={{ position: "relative", padding: "70px 26px" }}>
          <div data-reveal-grid className="v2h-grid-trust">
            {trustCards.map(({ icon: Icon, title, body }) => (
              <div key={title} className="v2-panel v2h-card" style={{ padding: "22px 20px" }}>
                <Icon size={18} color="var(--v2-signal-2)" strokeWidth={1.8} />
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--v2-ink)", marginTop: 14, marginBottom: 7 }}>
                  {title}
                </h3>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--v2-ink-faint)" }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────── */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <FocusField coherence={0.9} showRoute intensity={0.8} interactive />
        <div
          className="v2h-shell"
          style={{ position: "relative", maxWidth: 820, padding: "120px 26px", textAlign: "center" }}
        >
          <div data-reveal>
            <HudLabel tone="signal" style={{ marginBottom: 18 }}>
              Start here — station 01
            </HudLabel>
            <h2
              className="v2-display"
              style={{ fontSize: "clamp(34px, 5.6vw, 62px)", lineHeight: 1.04, marginBottom: 20 }}
            >
              Start with a clearer picture of{" "}
              <em className="v2-text-signal" style={{ fontStyle: "italic" }}>how your focus works</em>.
            </h2>
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.7,
                color: "var(--v2-ink-dim)",
                maxWidth: 520,
                margin: "0 auto 32px",
              }}
            >
              Take the free assessment first. You decide whether the full profile is
              useful after you see the preview.
            </p>
            <PrimaryCta>Find My Focus Pattern</PrimaryCta>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--v2-line)", background: "var(--v2-bg-deep)" }}>
        <div
          className="v2h-shell"
          style={{
            padding: "34px 26px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          <p className="v2-display" style={{ fontSize: 16, fontWeight: 600 }}>
            FocusRoute
          </p>
          <div style={{ display: "flex", gap: "12px 20px", flexWrap: "wrap" }}>
            {[
              ["/privacy", "Privacy Policy"],
              ["/terms", "Terms"],
              ["/refund-policy", "Refund Policy"],
              ["/disclaimer", "Disclaimer"],
              ["/login", "Login"],
              ["/about", "About"],
              ["/roadmap", "Roadmap"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                style={{ color: "var(--v2-ink-faint)", fontSize: 12, fontWeight: 600, textDecoration: "none" }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
