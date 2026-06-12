"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { m, useInView, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronRight, Zap, Target, Calendar,
  Brain, CheckCircle2, Shield, Lock, Clock, Repeat,
  ArrowRight, Layers, BarChart3, Lightbulb,
} from "lucide-react";
import { BRAIN_OS } from "@/lib/positioning";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/client";
import { HudLabel, TelemetryChip } from "@/components/v2/primitives";

/* Dark-world phase accents — same vocabulary as the assessment funnel. */
const PHASES = [
  { id: "map", num: "01", label: "Map", days: "Days 1-7", color: "#9BE8FF", rgb: "155,232,255", objective: "Understand your friction landscape", what: "Identify your top 3 friction points, map your natural energy windows, and locate your activation blockers.", why: "You can't optimize what you haven't mapped. This phase turns your profile into a personal operating manual.", icon: Brain },
  { id: "stabilize", num: "02", label: "Stabilize", days: "Days 8-14", color: "#B39BFF", rgb: "179,155,255", objective: "Build a reliable daily baseline", what: "Install one consistent anchor habit, create a reset ritual, and reduce the decision load of starting.", why: "Stability before growth. A single repeatable routine does more than ten inconsistent strategies.", icon: Layers },
  { id: "build", num: "03", label: "Build", days: "Days 15-21", color: "#7FE0B2", rgb: "127,224,178", objective: "Stack momentum with micro-wins", what: "Add one focus block per day, practice the recovery protocol, and start protecting your peak window.", why: "Momentum is a system, not a trait. Small consistent wins create neurological pathways that make the next action easier.", icon: BarChart3 },
  { id: "practice", num: "04", label: "Practice", days: "Days 22-28", color: "#FFB28B", rgb: "255,178,139", objective: "Design your next loop", what: "Run a weekly review, calibrate your routine to real life, and plan your next iteration.", why: "The protocol ends, the system doesn't. This phase teaches you to self-assess and adjust going forward.", icon: Repeat },
];

const SAMPLE_DAYS = [
  { day: 1, title: "Map your friction", task: "Write down the 3 moments this week where you stopped before starting. No judgment, just observation.", phase: "Map", phaseColor: "#9BE8FF" },
  { day: 3, title: "Find your activation cue", task: "Identify one physical or environmental signal that tells your brain 'it's time.' Test it once today.", phase: "Map", phaseColor: "#9BE8FF" },
  { day: 7, title: "Build your reset ritual", task: "Design a 90-second reset: one breath cue, one physical reset, one re-entry sentence. Run it after lunch.", phase: "Map", phaseColor: "#9BE8FF" },
  { day: 14, title: "Protect your focus window", task: "Block your best 60-minute window for the next 7 days. Treat it like a meeting you can't move.", phase: "Stabilize", phaseColor: "#B39BFF" },
  { day: 21, title: "Practice recovery", task: "When you lose focus today, use your reset ritual instead of restarting from zero. Log how fast you returned.", phase: "Build", phaseColor: "#7FE0B2" },
  { day: 28, title: "Design your next loop", task: "Review what worked in the past 28 days. Choose one routine to keep and one to improve. Plan your next cycle.", phase: "Practice", phaseColor: "#FFB28B" },
];

const WHY_IT_WORKS = [
  { icon: Zap, title: "Small actions reduce resistance", body: "Micro-actions require less activation energy. They bypass the brain's hesitation loop and build momentum without pressure." },
  { icon: Calendar, title: "Structure reduces decision fatigue", body: "When the daily action is already decided, you don't spend cognitive resources figuring out what to do first." },
  { icon: Lightbulb, title: "Reflection builds self-awareness", body: "Daily check-ins create a feedback loop. You learn what actually works for your brain, not what works in theory." },
  { icon: Target, title: "Routines are profile-adapted", body: "The protocol is built around your specific cognitive signature, not a one-size-fits-all productivity template." },
  { icon: Repeat, title: "Momentum comes from repetition", body: "Neurologically, repetition builds automaticity. The more you practice the routine, the less effort it requires." },
];

const BONUSES = [
  { name: "Toolkit Bundle", desc: "Printable focus tools, daily planners, and executive function playsheets calibrated to your profile type.", tag: "Included" },
  { name: "Focus Audio Sessions", desc: "Short guided audio sessions for task initiation, mid-day resets, and end-of-day wind-downs.", tag: "Included" },
  { name: "Weekly Reset Ritual", desc: "A structured 10-minute weekly review template to calibrate your routine and spot friction early.", tag: "Included" },
  { name: "Brain Dump Converter", desc: "Turn mental overload into a prioritized action list using a simple 3-step capture protocol.", tag: "Included" },
];

const FAQS = [
  { q: "Do I need the Brain Profile first?", a: "The 28-Day Protocol is designed to work alongside your Brain Profile results. It's most effective when you've already identified your cognitive signature — but the protocol itself is self-contained and accessible to anyone familiar with their focus patterns." },
  { q: "Is this medical treatment?", a: "No. FocusRoute is not a medical treatment, diagnostic tool, or substitute for professional care. It's a structured productivity and self-awareness protocol. If you're working with a therapist or psychiatrist, think of this as a complementary habit system." },
  { q: "How long does each day take?", a: "Each daily action takes 5–15 minutes. The protocol is designed for real life — not for people with unlimited free time. Most days it's a short read, one micro-action, and a 2-minute reflection." },
  { q: "What if I miss a day?", a: "You pick up where you left off. The protocol is flexible by design. Missing a day doesn't restart the clock — it just means you continue from the next day. There's no streak anxiety built in." },
  { q: "Do I get instant access?", a: "Yes. After purchase, your protocol is available immediately inside your dashboard. No waiting, no shipping." },
  { q: "Can I use it on mobile?", a: "Yes. The entire protocol is mobile-optimized. Most users access their daily action from their phone in the morning." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};
const stagger = { visible: { transition: { staggerChildren: 0.035 } } };

/* Always render the animation props — the global MotionConfig (reducedMotion
   "user") tones motion down for prefers-reduced-motion. Stripping initial/
   animate per-client desyncs from the SSR markup and leaves content stuck at
   the server-rendered opacity 0. */
function SectionReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <m.div ref={ref} variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}>
      {children}
    </m.div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--v2-line)" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "18px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--v2-ink)", lineHeight: 1.4 }}>{q}</span>
        <m.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0, color: "var(--v2-signal-2)" }}>
          <ChevronDown size={18} />
        </m.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div key="c" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: "easeInOut" }}>
            <p style={{ fontSize: 14, color: "var(--v2-ink-dim)", lineHeight: 1.7, paddingBottom: 18 }}>{a}</p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HeroVisual() {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 380, margin: "0 auto", height: 280 }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,138,255,0.18) 0%, transparent 70%)", filter: "blur(34px)" }} />
      {PHASES.map((phase, i) => {
        const Icon = phase.icon;
        return (
          <m.div key={phase.id} initial={{ opacity: 0, y: i * 54 - 22 }} animate={{ opacity: 1, y: i * 54 - 50 }} transition={{ delay: 0.12 + i * 0.08, duration: 0.48, ease: [0.22, 1, 0.36, 1] }} style={{ position: "absolute", left: "50%", top: "50%", x: "-50%", width: "92%", maxWidth: 320, background: "linear-gradient(165deg, rgba(20,25,44,0.92), rgba(13,16,30,0.94))", border: "1px solid var(--v2-line-bright)", borderRadius: 16, padding: "13px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 16px 44px rgba(2,3,10,0.55), inset 0 1px 0 rgba(255,255,255,0.07)", cursor: "default", zIndex: PHASES.length - i }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(${phase.rgb},0.12)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid rgba(${phase.rgb},0.35)` }}>
              <Icon size={17} color={phase.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "var(--v2-ink)" }}>{phase.label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: phase.color, background: `rgba(${phase.rgb},0.12)`, borderRadius: 6, padding: "2px 8px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{phase.days}</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--v2-ink-faint)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{phase.objective}</p>
            </div>
            <ChevronRight size={14} color="rgba(228,233,255,0.3)" />
          </m.div>
        );
      })}
    </div>
  );
}

export default function RoadmapLandingPage() {
  const trackRoadmapCta = (ctaLocation: string) => {
    trackEvent(FIRST_PARTY_EVENTS.roadmapCtaClicked, {
      metadata: { cta_location: ctaLocation },
    });
  };

  return (
    <>
      <style>{`
        @media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important;transition-duration:0.01ms!important;}}
        @media(max-width:420px){.roadmap-nav-cta{display:none!important;}}
      `}</style>
      <div className="v2-screen v2-grain" style={{ overflowX: "hidden" }}>

        {/* NAV */}
        <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(6,7,13,0.82)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderBottom: "1px solid var(--v2-line)" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <span className="v2-display" style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>FocusRoute</span>
            </Link>
            <Link href="/assessment?step=upsell" onClick={() => trackRoadmapCta("nav")} className="roadmap-nav-cta v2-cta v2-cta-gold" style={{ minHeight: 38, padding: "8px 18px", fontSize: 13, gap: 6 }}>
              Start the Protocol <ChevronRight size={14} />
            </Link>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ padding: "72px 20px 56px", position: "relative", overflow: "hidden" }}>
          <div className="v2-aurora" aria-hidden="true" />
          <div aria-hidden="true" style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 560, height: 240, background: "radial-gradient(ellipse, rgba(124,138,255,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 1 }}>
            <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,138,255,0.10)", border: "1px solid rgba(124,138,255,0.32)", borderRadius: 999, padding: "6px 14px", marginBottom: 24 }}>
                <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--v2-signal-2)", boxShadow: "0 0 8px var(--v2-signal-2)" }} />
                <span className="v2-hud" style={{ color: "var(--v2-signal-2)", fontSize: 10 }}>Route extension — 28-Day Protocol</span>
              </div>
            </m.div>
            <m.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6 }} className="v2-display" style={{ fontSize: "clamp(32px,7vw,52px)", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 20 }}>
            Turn your Brain Profile into a{" "}
              <em className="v2-text-signal" style={{ fontStyle: "italic" }}>28-day focus system.</em>
            </m.h1>
            <m.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.5 }} style={{ fontSize: "clamp(15px,3.5vw,17px)", color: "var(--v2-ink-dim)", lineHeight: 1.65, marginBottom: 36, maxWidth: 520 }}>
              A guided daily protocol for reducing friction, building momentum, and creating focus routines that fit how your mind actually works.
            </m.p>
            <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.5 }} style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 48 }}>
              <Link href="/assessment?step=upsell" onClick={() => trackRoadmapCta("hero")} className="v2-cta v2-cta-gold" style={{ fontSize: 16 }}>
                Start the 28-Day Protocol <ArrowRight size={18} />
              </Link>
              <a href="#what-you-get" className="v2-ghost">
                See what&apos;s inside <ChevronDown size={15} />
              </a>
            </m.div>
            <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.7 }}>
              <HeroVisual />
            </m.div>
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} style={{ display: "flex", flexWrap: "wrap", gap: "10px 22px", justifyContent: "center", marginTop: 40 }}>
              {["Instant access", "Private & secure", "One-time purchase", "7-day guarantee"].map((t) => (
                <TelemetryChip key={t}>{t}</TelemetryChip>
              ))}
            </m.div>
          </div>
        </section>

        {/* PROBLEM */}
        <section style={{ padding: "72px 20px", position: "relative" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <SectionReveal>
              <m.div variants={fadeUp}>
                <HudLabel tone="signal" style={{ marginBottom: 16 }}>The problem</HudLabel>
                <h2 className="v2-display" style={{ fontSize: "clamp(26px,5vw,38px)", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 20 }}>
                  Understanding your pattern is not the same as acting on it.
                </h2>
              </m.div>
              <m.p variants={fadeUp} style={{ fontSize: 16, color: "var(--v2-ink-dim)", lineHeight: 1.75, marginBottom: 24 }}>
                You can read the most accurate profile of your brain and still wake up tomorrow doing the same thing. Knowledge doesn&apos;t create systems. Structure does.
              </m.p>
              <m.p variants={fadeUp} style={{ fontSize: 16, color: "var(--v2-ink-dim)", lineHeight: 1.75, marginBottom: 28 }}>
                The 28-Day Protocol bridges the gap between insight and action. It takes your cognitive map and turns it into a daily structure — one that reduces friction, builds momentum, and adapts to how your mind actually operates.
              </m.p>
              <m.div variants={fadeUp} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {["You can understand your patterns and still not know what to do next.", "Generic productivity advice ignores how your specific brain works.", "The protocol turns your profile into day-by-day decisions that feel natural."].map((text) => (
                  <div key={text} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(124,138,255,0.12)", border: "1px solid rgba(124,138,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      <CheckCircle2 size={13} color="var(--v2-signal-2)" />
                    </div>
                    <p style={{ fontSize: 15, color: "var(--v2-ink-dim)", lineHeight: 1.55 }}>{text}</p>
                  </div>
                ))}
              </m.div>
            </SectionReveal>
          </div>
        </section>

        {/* WHAT YOU GET */}
        <section id="what-you-get" style={{ padding: "72px 20px", position: "relative" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <SectionReveal>
              <m.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 48 }}>
                <HudLabel tone="signal" style={{ marginBottom: 12 }}>What you get</HudLabel>
                <h2 className="v2-display" style={{ fontSize: "clamp(26px,5vw,38px)", lineHeight: 1.2, letterSpacing: "-0.02em", maxWidth: 520, margin: "0 auto 16px" }}>
                  A complete cognitive action system.
                </h2>
                <p style={{ fontSize: 16, color: "var(--v2-ink-faint)", maxWidth: 440, margin: "0 auto" }}>Not a course. Not a template. A structured daily protocol built around your profile.</p>
              </m.div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
                {[
                  { icon: Calendar, title: "28 guided days", desc: "Each day has one clear micro-action. No decision needed — just execute.", color: "#7C8AFF", rgb: "124,138,255" },
                  { icon: Target, title: "4 structured phases", desc: "Map, Stabilize, Build, Practice. Each phase builds on the last.", color: "#9BE8FF", rgb: "155,232,255" },
                  { icon: Zap, title: "Daily micro-actions", desc: "5–15 minutes per day. Designed to fit into real life, not a perfect day.", color: "#7FE0B2", rgb: "127,224,178" },
                  { icon: Brain, title: "Reflection prompts", desc: "Short daily check-ins that build self-awareness and surface what's working.", color: "#FFB28B", rgb: "255,178,139" },
                  { icon: Repeat, title: "Focus recovery tools", desc: "Reset rituals, re-entry protocols, and momentum restarters for hard days.", color: "#B39BFF", rgb: "179,155,255" },
                  { icon: Lightbulb, title: "Decision-friction reducers", desc: "Pre-made decision templates so you spend energy on work, not logistics.", color: "#FF8B8B", rgb: "255,139,139" },
                ].map(({ icon: Icon, title, desc, color, rgb }) => (
                  <m.div key={title} variants={fadeUp} className="v2-panel" style={{ borderRadius: 20, padding: "24px 22px" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 13, background: `rgba(${rgb},0.10)`, border: `1px solid rgba(${rgb},0.3)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                      <Icon size={20} color={color} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--v2-ink)", marginBottom: 8, letterSpacing: "-0.01em" }}>{title}</h3>
                    <p style={{ fontSize: 14, color: "var(--v2-ink-faint)", lineHeight: 1.6 }}>{desc}</p>
                  </m.div>
                ))}
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* 4-PHASE TIMELINE */}
        <section style={{ padding: "72px 20px", position: "relative", overflow: "hidden", background: "linear-gradient(180deg, transparent, rgba(12,15,28,0.7) 18%, rgba(12,15,28,0.7) 82%, transparent)" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", position: "relative" }}>
            <SectionReveal>
              <m.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 56 }}>
                <HudLabel tone="signal" style={{ marginBottom: 12 }}>The 4 phases</HudLabel>
                <h2 className="v2-display" style={{ fontSize: "clamp(26px,5vw,38px)", lineHeight: 1.2, letterSpacing: "-0.02em", maxWidth: 480, margin: "0 auto" }}>
                  A path from friction to flow.
                </h2>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {PHASES.map((phase, i) => {
                  const Icon = phase.icon;
                  return (
                    <m.div key={phase.id} variants={fadeUp} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0 24px", alignItems: "stretch" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: `rgba(${phase.rgb},0.10)`, border: `1px solid rgba(${phase.rgb},0.4)`, boxShadow: `0 0 22px rgba(${phase.rgb},0.18)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon size={22} color={phase.color} />
                        </div>
                        {i < PHASES.length - 1 && (
                          <div style={{ width: 1.5, flex: 1, minHeight: 24, background: `linear-gradient(to bottom, rgba(${phase.rgb},0.4), transparent)`, margin: "8px 0" }} />
                        )}
                      </div>
                      <div className="v2-panel" style={{ borderRadius: 20, padding: "22px 22px 24px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 12 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: phase.color, background: `rgba(${phase.rgb},0.12)`, border: `1px solid rgba(${phase.rgb},0.28)`, borderRadius: 6, padding: "3px 10px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{phase.days}</span>
                          <h3 className="v2-display" style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>Phase {phase.num}: {phase.label}</h3>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: phase.color, marginBottom: 10 }}>{phase.objective}</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <p className="v2-hud" style={{ fontSize: 10, marginBottom: 6 }}>What you do</p>
                            <p style={{ fontSize: 13, color: "var(--v2-ink-dim)", lineHeight: 1.6 }}>{phase.what}</p>
                          </div>
                          <div>
                            <p className="v2-hud" style={{ fontSize: 10, marginBottom: 6 }}>Why it matters</p>
                            <p style={{ fontSize: 13, color: "var(--v2-ink-dim)", lineHeight: 1.6 }}>{phase.why}</p>
                          </div>
                        </div>
                      </div>
                    </m.div>
                  );
                })}
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* SAMPLE DAYS */}
        <section style={{ padding: "72px 20px", position: "relative" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <SectionReveal>
              <m.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 48 }}>
                <HudLabel tone="signal" style={{ marginBottom: 12 }}>A look inside</HudLabel>
                <h2 className="v2-display" style={{ fontSize: "clamp(26px,5vw,38px)", lineHeight: 1.2, letterSpacing: "-0.02em" }}>Sample days from the protocol.</h2>
              </m.div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
                {SAMPLE_DAYS.map((day) => (
                  <m.div key={day.day} variants={fadeUp} className="v2-panel" style={{ borderRadius: 20, padding: "22px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(124,138,255,0.14)", border: "1px solid rgba(124,138,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontFamily: "var(--v2-font-mono)", fontSize: 14, fontWeight: 700, color: "var(--v2-signal-2)" }}>{day.day}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: day.phaseColor, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Day {day.day} · {day.phase}</p>
                        <p style={{ fontSize: 15, fontWeight: 800, color: "var(--v2-ink)", letterSpacing: "-0.01em" }}>{day.title}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--v2-ink-faint)", lineHeight: 1.65 }}>{day.task}</p>
                  </m.div>
                ))}
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* WHY IT WORKS */}
        <section style={{ padding: "72px 20px", position: "relative" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <SectionReveal>
              <m.div variants={fadeUp} style={{ marginBottom: 48 }}>
                <HudLabel tone="signal" style={{ marginBottom: 12 }}>Why it works</HudLabel>
                <h2 className="v2-display" style={{ fontSize: "clamp(26px,5vw,38px)", lineHeight: 1.2, letterSpacing: "-0.02em", maxWidth: 480 }}>
                  Built around how brains actually build habits.
                </h2>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {WHY_IT_WORKS.map(({ icon: Icon, title, body }, i) => (
                  <m.div key={title} variants={fadeUp} style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: "22px 0", borderTop: i === 0 ? "1px solid var(--v2-line)" : "none", borderBottom: "1px solid var(--v2-line)" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(124,138,255,0.10)", border: "1px solid rgba(124,138,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={20} color="var(--v2-signal)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--v2-ink)", marginBottom: 6, letterSpacing: "-0.01em" }}>{title}</h3>
                      <p style={{ fontSize: 14, color: "var(--v2-ink-faint)", lineHeight: 1.65 }}>{body}</p>
                    </div>
                  </m.div>
                ))}
              </div>
              <m.p variants={fadeUp} style={{ fontSize: 12, color: "var(--v2-ink-ghost)", fontStyle: "italic", marginTop: 20 }}>
                * The protocol is not a medical treatment. It is a structured habit system designed for self-directed improvement.
              </m.p>
            </SectionReveal>
          </div>
        </section>

        {/* BONUS STACK */}
        <section style={{ padding: "72px 20px", position: "relative", overflow: "hidden", background: "linear-gradient(180deg, transparent, rgba(12,15,28,0.7) 18%, rgba(12,15,28,0.7) 82%, transparent)" }}>
          <div aria-hidden="true" style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(217,188,127,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
            <SectionReveal>
              <m.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 40 }}>
                <HudLabel tone="gold" style={{ marginBottom: 12 }}>Everything included</HudLabel>
                <h2 className="v2-display" style={{ fontSize: "clamp(26px,5vw,38px)", lineHeight: 1.2, letterSpacing: "-0.02em" }}>The full bonus stack.</h2>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {BONUSES.map((bonus) => (
                  <m.div key={bonus.name} variants={fadeUp} className="v2-panel" style={{ display: "flex", gap: 16, alignItems: "flex-start", borderRadius: 18, padding: "18px 20px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(217,188,127,0.12)", border: "1px solid rgba(217,188,127,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CheckCircle2 size={17} color="var(--v2-gold)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--v2-ink)", letterSpacing: "-0.01em" }}>{bonus.name}</h3>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--v2-success)", background: "rgba(127,224,178,0.12)", border: "1px solid rgba(127,224,178,0.28)", borderRadius: 6, padding: "2px 8px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{bonus.tag}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--v2-ink-faint)", lineHeight: 1.6 }}>{bonus.desc}</p>
                    </div>
                  </m.div>
                ))}
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* TRUST */}
        <section style={{ padding: "56px 20px", position: "relative" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <SectionReveal>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
                {[
                  { icon: Zap, title: "Instant access", desc: "Available immediately in your dashboard after purchase." },
                  { icon: Lock, title: "Private & secure", desc: "Your assessment data is never shared or sold." },
                  { icon: Shield, title: "7-day guarantee", desc: "If it doesn't feel right, email us for a full refund." },
                  { icon: Clock, title: "Not a diagnosis", desc: "This is a habit system, not a medical treatment." },
                ].map(({ icon: Icon, title, desc }) => (
                  <m.div key={title} variants={fadeUp} className="v2-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, borderRadius: 18, padding: "22px 18px" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(124,138,255,0.10)", border: "1px solid rgba(124,138,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={19} color="var(--v2-signal-2)" />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "var(--v2-ink)" }}>{title}</p>
                    <p style={{ fontSize: 12, color: "var(--v2-ink-faint)", lineHeight: 1.55 }}>{desc}</p>
                  </m.div>
                ))}
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* PRICE CTA */}
        <section style={{ padding: "80px 20px", position: "relative", overflow: "hidden" }}>
          <div aria-hidden="true" style={{ position: "absolute", bottom: -120, left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(217,188,127,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", position: "relative" }}>
            <SectionReveal>
              <m.div variants={fadeUp}>
                <HudLabel tone="gold" style={{ marginBottom: 16 }}>Get started today</HudLabel>
                <h2 className="v2-display" style={{ fontSize: "clamp(28px,6vw,44px)", lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: 16 }}>
                  Your brain has the map. Now build the system.
                </h2>
                <p style={{ fontSize: 16, color: "var(--v2-ink-dim)", lineHeight: 1.65, marginBottom: 36 }}>
                  One-time purchase. Instant access. 28 days to a focus routine that fits how you actually work.
                </p>
              </m.div>
              <m.div variants={fadeUp} className="v2-panel" style={{ borderRadius: 24, padding: "28px 24px", marginBottom: 24, border: "1px solid rgba(217,188,127,0.30)", background: "linear-gradient(170deg, rgba(217,188,127,0.07), rgba(14,18,32,0.85) 45%)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12 }}>
                  <div style={{ textAlign: "left" }}>
                    <p style={{ fontSize: 17, fontWeight: 800, color: "var(--v2-ink)" }}>{BRAIN_OS.protocol}</p>
                    <p style={{ fontSize: 13, color: "var(--v2-ink-faint)", marginTop: 3 }}>One-time · Instant access · All bonuses included</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 13, color: "var(--v2-ink-ghost)", textDecoration: "line-through" }}>{BRAIN_OS.price.upsellAnchor}</p>
                    <p className="v2-text-gold" style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em", fontFamily: "var(--v2-font-display)" }}>{BRAIN_OS.price.upsell}</p>
                  </div>
                </div>
                <Link href="/assessment?step=upsell" onClick={() => trackRoadmapCta("price_cta")} className="v2-cta v2-cta-gold" style={{ width: "100%", fontSize: 17 }}>
                  Unlock the 28-Day Protocol <ArrowRight size={19} />
                </Link>
                <p style={{ fontSize: 12, color: "var(--v2-ink-faint)", marginTop: 14 }}>7-day guarantee · Secure checkout · Not a subscription</p>
              </m.div>
              <m.div variants={fadeUp} style={{ display: "flex", flexWrap: "wrap", gap: "10px 18px", justifyContent: "center" }}>
                {["28 guided days", "4 phases", "All bonuses included", "Mobile-ready"].map((t) => (
                  <TelemetryChip key={t} color="var(--v2-gold)">{t}</TelemetryChip>
                ))}
              </m.div>
            </SectionReveal>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "72px 20px", position: "relative" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <SectionReveal>
              <m.div variants={fadeUp} style={{ marginBottom: 40 }}>
                <HudLabel tone="signal" style={{ marginBottom: 12 }}>FAQ</HudLabel>
                <h2 className="v2-display" style={{ fontSize: "clamp(24px,4.5vw,34px)", lineHeight: 1.2, letterSpacing: "-0.02em" }}>Common questions.</h2>
              </m.div>
              <m.div variants={fadeUp}>
                {FAQS.map((faq) => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
              </m.div>
            </SectionReveal>
          </div>
        </section>

        {/* FOOTER */}
        <section style={{ padding: "56px 20px", borderTop: "1px solid var(--v2-line)", position: "relative" }}>
          <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
            <p className="v2-display" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 8 }}>Ready to build your focus system?</p>
            <p style={{ fontSize: 14, color: "var(--v2-ink-faint)", marginBottom: 24 }}>28 days. One action per day. Adapted to your cognitive profile.</p>
            <Link href="/assessment?step=upsell" onClick={() => trackRoadmapCta("footer")} className="v2-cta v2-cta-gold" style={{ fontSize: 16 }}>
              Start the 28-Day Protocol <ArrowRight size={17} />
            </Link>
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--v2-line)", display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
              {[{ href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }, { href: "/refund-policy", label: "Refund Policy" }, { href: "/disclaimer", label: "Disclaimer" }].map(({ href, label }) => (
                <Link key={href} href={href} style={{ fontSize: 12, color: "var(--v2-ink-faint)", textDecoration: "none" }}>{label}</Link>
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
