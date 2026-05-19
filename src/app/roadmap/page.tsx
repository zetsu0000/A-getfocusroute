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

const PHASES = [
  { id: "map", num: "01", label: "Map", days: "Days 1–7", color: "#6757E8", tint: "rgba(103,87,232,0.12)", objective: "Understand your friction landscape", what: "Identify your top 3 friction points, map your natural energy windows, and locate your activation blockers.", why: "You can't optimize what you haven't mapped. This phase turns your profile into a personal operating manual.", icon: Brain },
  { id: "stabilize", num: "02", label: "Stabilize", days: "Days 8–14", color: "#3B82B8", tint: "rgba(59,130,184,0.12)", objective: "Build a reliable daily baseline", what: "Install one consistent anchor habit, create a reset ritual, and reduce the decision load of starting.", why: "Stability before growth. A single repeatable routine does more than ten inconsistent strategies.", icon: Layers },
  { id: "build", num: "03", label: "Build", days: "Days 15–21", color: "#2F8B63", tint: "rgba(47,139,99,0.12)", objective: "Stack momentum with micro-wins", what: "Add one focus block per day, practice the recovery protocol, and start protecting your peak window.", why: "Momentum is a system, not a trait. Small consistent wins create neurological pathways that make the next action easier.", icon: BarChart3 },
  { id: "practice", num: "04", label: "Practice", days: "Days 22–28", color: "#C88322", tint: "rgba(200,131,34,0.12)", objective: "Design your next loop", what: "Run a weekly review, calibrate your routine to real life, and plan your next iteration.", why: "The protocol ends — the system doesn't. This phase teaches you to self-diagnose and self-correct going forward.", icon: Repeat },
];

const SAMPLE_DAYS = [
  { day: 1, title: "Map your friction", task: "Write down the 3 moments this week where you stopped before starting. No judgment — just observation.", phase: "Map", phaseColor: "#6757E8" },
  { day: 3, title: "Find your activation cue", task: "Identify one physical or environmental signal that tells your brain 'it's time.' Test it once today.", phase: "Map", phaseColor: "#6757E8" },
  { day: 7, title: "Build your reset ritual", task: "Design a 90-second reset: one breath cue + one physical reset + one re-entry sentence. Run it after lunch.", phase: "Map", phaseColor: "#6757E8" },
  { day: 14, title: "Protect your focus window", task: "Block your best 60-minute window for the next 7 days. Treat it like a meeting you can't move.", phase: "Stabilize", phaseColor: "#3B82B8" },
  { day: 21, title: "Practice recovery", task: "When you lose focus today, use your reset ritual instead of restarting from zero. Log how fast you returned.", phase: "Build", phaseColor: "#2F8B63" },
  { day: 28, title: "Design your next loop", task: "Review what worked in the past 28 days. Choose one routine to keep and one to improve. Plan your next cycle.", phase: "Practice", phaseColor: "#C88322" },
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
const stagger = { visible: { transition: { staggerChildren: 0.09 } } };

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
    <div style={{ borderBottom: "1px solid #E2D8CA" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "18px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#171421", lineHeight: 1.4 }}>{q}</span>
        <m.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0, color: "#6757E8" }}>
          <ChevronDown size={18} />
        </m.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div key="c" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: "easeInOut" }}>
            <p style={{ fontSize: 14, color: "#444058", lineHeight: 1.7, paddingBottom: 18 }}>{a}</p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HeroVisual() {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 380, margin: "0 auto", height: 280, perspective: 1000 }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(103,87,232,0.35) 0%,rgba(103,87,232,0) 70%)", filter: "blur(32px)", animation: "pulseGlow 3s ease-in-out infinite" }} />
      {PHASES.map((phase, i) => {
        const Icon = phase.icon;
        return (
          <m.div key={phase.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: i * 54 - 50 }} transition={{ delay: 0.2 + i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }} whileHover={{ scale: 1.03, zIndex: 10 }} style={{ position: "absolute", left: "50%", top: "50%", transform: "translateX(-50%)", width: "92%", maxWidth: 320, background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "13px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.3)", cursor: "default", zIndex: PHASES.length - i }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: phase.tint.replace("0.12","0.25"), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${phase.color}44` }}>
              <Icon size={17} color={phase.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF" }}>{phase.label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: phase.color, background: phase.tint.replace("0.12","0.2"), borderRadius: 6, padding: "2px 8px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{phase.days}</span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{phase.objective}</p>
            </div>
            <ChevronRight size={14} color="rgba(255,255,255,0.3)" />
          </m.div>
        );
      })}
    </div>
  );
}

export default function RoadmapLandingPage() {
  return (
    <>
      <style>{`
        @keyframes pulseGlow {
          0%,100%{opacity:0.7;transform:translate(-50%,-50%) scale(1);}
          50%{opacity:1;transform:translate(-50%,-50%) scale(1.12);}
        }
        @media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important;transition-duration:0.01ms!important;}}
        @media(max-width:420px){.roadmap-nav-cta{display:none!important;}}
      `}</style>
      <div style={{ background: "#F7F2EA", overflowX: "hidden" }}>

        {/* NAV */}
        <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(247,242,234,0.9)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid #E2D8CA" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#171421", letterSpacing: "-0.02em" }}>FocusRoute</span>
            </Link>
            <Link href="/assessment?step=upsell" className="roadmap-nav-cta" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#171421", color: "#FFFFFF", fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 999, textDecoration: "none", whiteSpace: "nowrap" }}>
              Start the Protocol <ChevronRight size={14} />
            </Link>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ background: "linear-gradient(170deg,#0E0B16 0%,#171421 55%,#1A1630 100%)", padding: "72px 20px 56px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(rgba(103,87,232,0.08) 1px,transparent 1px)`, backgroundSize: "32px 32px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 500, height: 200, background: "radial-gradient(ellipse,rgba(103,87,232,0.2) 0%,transparent 70%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 1 }}>
            <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(103,87,232,0.15)", border: "1px solid rgba(103,87,232,0.3)", borderRadius: 999, padding: "5px 14px", marginBottom: 24 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6757E8" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9B8EFF", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>28-Day Protocol</span>
              </div>
            </m.div>
            <m.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6 }} style={{ fontSize: "clamp(32px,7vw,52px)", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.12, letterSpacing: "-0.03em", marginBottom: 20 }}>
              Turn your Brain Profile into a{" "}
              <span style={{ color: "#9B8EFF" }}>28-day focus system.</span>
            </m.h1>
            <m.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.5 }} style={{ fontSize: "clamp(15px,3.5vw,17px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.65, marginBottom: 36, maxWidth: 520 }}>
              A guided daily protocol for reducing friction, building momentum, and creating focus routines that fit how your mind actually works.
            </m.p>
            <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.5 }} style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 48 }}>
              <Link href="/assessment?step=upsell" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#6757E8", color: "#FFFFFF", fontSize: 16, fontWeight: 800, padding: "16px 28px", borderRadius: 999, textDecoration: "none", letterSpacing: "-0.02em", boxShadow: "0 8px 32px rgba(103,87,232,0.4)" }}>
                Start the 28-Day Protocol <ArrowRight size={18} />
              </Link>
              <a href="#what-you-get" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", fontSize: 15, fontWeight: 600, padding: "16px 24px", borderRadius: 999, textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)" }}>
                See what&apos;s inside <ChevronDown size={15} />
              </a>
            </m.div>
            <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.7 }}>
              <HeroVisual />
            </m.div>
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", justifyContent: "center", marginTop: 40 }}>
              {["Instant access","Private & secure","One-time purchase","7-day guarantee"].map((t) => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  <CheckCircle2 size={12} color="rgba(103,87,232,0.7)" />{t}
                </span>
              ))}
            </m.div>
          </div>
        </section>

        {/* PROBLEM */}
        <section style={{ padding: "72px 20px", background: "#F7F2EA" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <SectionReveal>
              <m.div variants={fadeUp}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#6757E8", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 16 }}>The problem</p>
                <h2 style={{ fontSize: "clamp(26px,5vw,38px)", fontWeight: 800, color: "#171421", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 20 }}>
                  Understanding your pattern is not the same as acting on it.
                </h2>
              </m.div>
              <m.p variants={fadeUp} style={{ fontSize: 16, color: "#444058", lineHeight: 1.75, marginBottom: 24 }}>
                You can read the most accurate profile of your brain and still wake up tomorrow doing the same thing. Knowledge doesn&apos;t create systems. Structure does.
              </m.p>
              <m.p variants={fadeUp} style={{ fontSize: 16, color: "#444058", lineHeight: 1.75, marginBottom: 28 }}>
                The 28-Day Protocol bridges the gap between insight and action. It takes your cognitive map and turns it into a daily structure — one that reduces friction, builds momentum, and adapts to how your mind actually operates.
              </m.p>
              <m.div variants={fadeUp} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {["You can understand your patterns and still not know what to do next.","Generic productivity advice ignores how your specific brain works.","The protocol turns your profile into day-by-day decisions that feel natural."].map((text) => (
                  <div key={text} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(103,87,232,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      <CheckCircle2 size={13} color="#6757E8" />
                    </div>
                    <p style={{ fontSize: 15, color: "#444058", lineHeight: 1.55 }}>{text}</p>
                  </div>
                ))}
              </m.div>
            </SectionReveal>
          </div>
        </section>

        {/* WHAT YOU GET */}
        <section id="what-you-get" style={{ padding: "72px 20px", background: "#FFFFFF" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <SectionReveal>
              <m.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 48 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#6757E8", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 12 }}>What you get</p>
                <h2 style={{ fontSize: "clamp(26px,5vw,38px)", fontWeight: 800, color: "#171421", lineHeight: 1.2, letterSpacing: "-0.02em", maxWidth: 520, margin: "0 auto 16px" }}>
                  A complete cognitive action system.
                </h2>
                <p style={{ fontSize: 16, color: "#6F6A80", maxWidth: 440, margin: "0 auto" }}>Not a course. Not a template. A structured daily protocol built around your profile.</p>
              </m.div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
                {[
                  { icon: Calendar, title: "28 guided days", desc: "Each day has one clear micro-action. No decision needed — just execute.", color: "#6757E8", tint: "rgba(103,87,232,0.08)" },
                  { icon: Target, title: "4 structured phases", desc: "Map → Stabilize → Build → Practice. Each phase builds on the last.", color: "#3B82B8", tint: "rgba(59,130,184,0.08)" },
                  { icon: Zap, title: "Daily micro-actions", desc: "5–15 minutes per day. Designed to fit into real life, not a perfect day.", color: "#2F8B63", tint: "rgba(47,139,99,0.08)" },
                  { icon: Brain, title: "Reflection prompts", desc: "Short daily check-ins that build self-awareness and surface what's working.", color: "#C88322", tint: "rgba(200,131,34,0.08)" },
                  { icon: Repeat, title: "Focus recovery tools", desc: "Reset rituals, re-entry protocols, and momentum restarters for hard days.", color: "#6757E8", tint: "rgba(103,87,232,0.08)" },
                  { icon: Lightbulb, title: "Decision-friction reducers", desc: "Pre-made decision templates so you spend energy on work, not logistics.", color: "#C64545", tint: "rgba(198,69,69,0.08)" },
                ].map(({ icon: Icon, title, desc, color, tint }) => (
                  <m.div key={title} variants={fadeUp} style={{ background: "#F7F2EA", borderRadius: 20, padding: "24px 22px", border: "1px solid #E2D8CA" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 13, background: tint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                      <Icon size={20} color={color} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "#171421", marginBottom: 8, letterSpacing: "-0.01em" }}>{title}</h3>
                    <p style={{ fontSize: 14, color: "#6F6A80", lineHeight: 1.6 }}>{desc}</p>
                  </m.div>
                ))}
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* 4-PHASE TIMELINE */}
        <section style={{ padding: "72px 20px", background: "#0E0B16", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(rgba(103,87,232,0.06) 1px,transparent 1px)`, backgroundSize: "32px 32px", pointerEvents: "none" }} />
          <div style={{ maxWidth: 960, margin: "0 auto", position: "relative" }}>
            <SectionReveal>
              <m.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 56 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9B8EFF", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 12 }}>The 4 phases</p>
                <h2 style={{ fontSize: "clamp(26px,5vw,38px)", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2, letterSpacing: "-0.02em", maxWidth: 480, margin: "0 auto" }}>
                  A path from friction to flow.
                </h2>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {PHASES.map((phase, i) => {
                  const Icon = phase.icon;
                  return (
                    <m.div key={phase.id} variants={fadeUp} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0 24px", alignItems: "stretch" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: phase.tint, border: `1.5px solid ${phase.color}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon size={22} color={phase.color} />
                        </div>
                        {i < PHASES.length - 1 && (
                          <div style={{ width: 1.5, flex: 1, minHeight: 24, background: `linear-gradient(to bottom,${phase.color}40,transparent)`, margin: "8px 0" }} />
                        )}
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "22px 22px 24px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 12 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: phase.color, background: phase.tint, borderRadius: 6, padding: "3px 10px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{phase.days}</span>
                          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>Phase {phase.num}: {phase.label}</h3>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: phase.color, marginBottom: 10 }}>{phase.objective}</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>What you do</p>
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>{phase.what}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>Why it matters</p>
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>{phase.why}</p>
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
        <section style={{ padding: "72px 20px", background: "#F7F2EA" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <SectionReveal>
              <m.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 48 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#6757E8", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 12 }}>A look inside</p>
                <h2 style={{ fontSize: "clamp(26px,5vw,38px)", fontWeight: 800, color: "#171421", lineHeight: 1.2, letterSpacing: "-0.02em" }}>Sample days from the protocol.</h2>
              </m.div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
                {SAMPLE_DAYS.map((day) => (
                  <m.div key={day.day} variants={fadeUp} style={{ background: "#FFFFFF", borderRadius: 20, padding: "22px", border: "1px solid #E2D8CA" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 11, background: "#171421", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#FFFFFF" }}>{day.day}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: day.phaseColor, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Day {day.day} · {day.phase}</p>
                        <p style={{ fontSize: 15, fontWeight: 800, color: "#171421", letterSpacing: "-0.01em" }}>{day.title}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: "#6F6A80", lineHeight: 1.65 }}>{day.task}</p>
                  </m.div>
                ))}
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* WHY IT WORKS */}
        <section style={{ padding: "72px 20px", background: "#FFFFFF" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <SectionReveal>
              <m.div variants={fadeUp} style={{ marginBottom: 48 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#6757E8", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 12 }}>Why it works</p>
                <h2 style={{ fontSize: "clamp(26px,5vw,38px)", fontWeight: 800, color: "#171421", lineHeight: 1.2, letterSpacing: "-0.02em", maxWidth: 480 }}>
                  Built around how brains actually build habits.
                </h2>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {WHY_IT_WORKS.map(({ icon: Icon, title, body }, i) => (
                  <m.div key={title} variants={fadeUp} style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: "22px 0", borderTop: i === 0 ? "1px solid #E2D8CA" : "none", borderBottom: "1px solid #E2D8CA" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(103,87,232,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={20} color="#6757E8" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: "#171421", marginBottom: 6, letterSpacing: "-0.01em" }}>{title}</h3>
                      <p style={{ fontSize: 14, color: "#6F6A80", lineHeight: 1.65 }}>{body}</p>
                    </div>
                  </m.div>
                ))}
              </div>
              <m.p variants={fadeUp} style={{ fontSize: 12, color: "#9A94AA", fontStyle: "italic", marginTop: 20 }}>
                * The protocol is not a medical treatment. It is a structured habit system designed for self-directed improvement.
              </m.p>
            </SectionReveal>
          </div>
        </section>

        {/* BONUS STACK */}
        <section style={{ padding: "72px 20px", background: "linear-gradient(160deg,#0E0B16 0%,#171421 100%)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(103,87,232,0.12) 0%,transparent 70%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
            <SectionReveal>
              <m.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 40 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9B8EFF", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 12 }}>Everything included</p>
                <h2 style={{ fontSize: "clamp(26px,5vw,38px)", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2, letterSpacing: "-0.02em" }}>The full bonus stack.</h2>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {BONUSES.map((bonus) => (
                  <m.div key={bonus.name} variants={fadeUp} style={{ display: "flex", gap: 16, alignItems: "flex-start", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "18px 20px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(103,87,232,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CheckCircle2 size={17} color="#9B8EFF" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.01em" }}>{bonus.name}</h3>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#2F8B63", background: "rgba(47,139,99,0.2)", borderRadius: 6, padding: "2px 8px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{bonus.tag}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{bonus.desc}</p>
                    </div>
                  </m.div>
                ))}
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* TRUST */}
        <section style={{ padding: "56px 20px", background: "#F7F2EA" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <SectionReveal>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
                {[
                  { icon: Zap, title: "Instant access", desc: "Available immediately in your dashboard after purchase." },
                  { icon: Lock, title: "Private & secure", desc: "Your assessment data is never shared or sold." },
                  { icon: Shield, title: "7-day guarantee", desc: "If it doesn't feel right, email us for a full refund." },
                  { icon: Clock, title: "Not a diagnosis", desc: "This is a habit system, not a medical treatment." },
                ].map(({ icon: Icon, title, desc }) => (
                  <m.div key={title} variants={fadeUp} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, background: "#FFFFFF", borderRadius: 18, padding: "22px 18px", border: "1px solid #E2D8CA" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(103,87,232,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={19} color="#6757E8" />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#171421" }}>{title}</p>
                    <p style={{ fontSize: 12, color: "#9A94AA", lineHeight: 1.55 }}>{desc}</p>
                  </m.div>
                ))}
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* PRICE CTA */}
        <section style={{ padding: "80px 20px", background: "#171421", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(rgba(103,87,232,0.07) 1px,transparent 1px)`, backgroundSize: "32px 32px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -120, left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "radial-gradient(ellipse,rgba(103,87,232,0.15) 0%,transparent 70%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", position: "relative" }}>
            <SectionReveal>
              <m.div variants={fadeUp}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9B8EFF", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 16 }}>Get started today</p>
                <h2 style={{ fontSize: "clamp(28px,6vw,44px)", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: 16 }}>
                  Your brain has the map. Now build the system.
                </h2>
                <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, marginBottom: 36 }}>
                  One-time purchase. Instant access. 28 days to a focus routine that fits how you actually work.
                </p>
              </m.div>
              <m.div variants={fadeUp} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "28px 24px", marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div style={{ textAlign: "left" }}>
                    <p style={{ fontSize: 17, fontWeight: 800, color: "#FFFFFF" }}>{BRAIN_OS.protocol}</p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>One-time · Instant access · All bonuses included</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", textDecoration: "line-through" }}>{BRAIN_OS.price.upsellAnchor}</p>
                    <p style={{ fontSize: 36, fontWeight: 800, color: "#FFFFFF", lineHeight: 1, letterSpacing: "-0.03em" }}>{BRAIN_OS.price.upsell}</p>
                  </div>
                </div>
                <Link href="/assessment?step=upsell" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", background: "#6757E8", color: "#FFFFFF", fontSize: 17, fontWeight: 800, padding: "18px 24px", borderRadius: 16, textDecoration: "none", letterSpacing: "-0.02em", boxShadow: "0 12px 40px rgba(103,87,232,0.45)" }}>
                  Unlock the 28-Day Protocol <ArrowRight size={19} />
                </Link>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 14 }}>7-day guarantee · Secure checkout · Not a subscription</p>
              </m.div>
              <m.div variants={fadeUp} style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", justifyContent: "center" }}>
                {["28 guided days","4 phases","All bonuses included","Mobile-ready"].map((t) => (
                  <span key={t} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                    <CheckCircle2 size={11} color="rgba(103,87,232,0.6)" />{t}
                  </span>
                ))}
              </m.div>
            </SectionReveal>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "72px 20px", background: "#F7F2EA" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <SectionReveal>
              <m.div variants={fadeUp} style={{ marginBottom: 40 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#6757E8", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 12 }}>FAQ</p>
                <h2 style={{ fontSize: "clamp(24px,4.5vw,34px)", fontWeight: 800, color: "#171421", lineHeight: 1.2, letterSpacing: "-0.02em" }}>Common questions.</h2>
              </m.div>
              <m.div variants={fadeUp}>
                {FAQS.map((faq) => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
              </m.div>
            </SectionReveal>
          </div>
        </section>

        {/* FOOTER */}
        <section style={{ padding: "56px 20px", background: "#FFFFFF", borderTop: "1px solid #E2D8CA" }}>
          <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: "#171421", letterSpacing: "-0.02em", marginBottom: 8 }}>Ready to build your focus system?</p>
            <p style={{ fontSize: 14, color: "#9A94AA", marginBottom: 24 }}>28 days. One action per day. Adapted to your cognitive profile.</p>
            <Link href="/assessment?step=upsell" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#171421", color: "#FFFFFF", fontSize: 16, fontWeight: 800, padding: "16px 28px", borderRadius: 999, textDecoration: "none", letterSpacing: "-0.02em" }}>
              Start the 28-Day Protocol <ArrowRight size={17} />
            </Link>
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #E2D8CA", display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
              {[{href:"/privacy",label:"Privacy"},{href:"/terms",label:"Terms"},{href:"/refund-policy",label:"Refund Policy"},{href:"/disclaimer",label:"Disclaimer"}].map(({href,label}) => (
                <Link key={href} href={href} style={{ fontSize: 12, color: "#9A94AA", textDecoration: "none" }}>{label}</Link>
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}

