"use client";

import { useRef } from "react";
import Link from "next/link";
import { m, useInView, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  ChevronDown, ChevronRight, ArrowRight, Brain, Target,
  Zap, CheckCircle2, Shield, Lock, Clock, Repeat,
  BarChart3, Layers, Lightbulb, Sparkles,
} from "lucide-react";
import { BRAIN_OS } from "@/lib/positioning";

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

const STEPS = [
  { num: "01", icon: Brain, color: "#6757E8", tint: "rgba(103,87,232,0.12)", title: "Take the free assessment", desc: "3 minutes. 28 questions. Maps your attention style, executive function patterns, and focus friction points.", label: "Free · Private · Instant" },
  { num: "02", icon: BarChart3, color: "#3B82B8", tint: "rgba(59,130,184,0.12)", title: "Receive your Brain Profile", desc: "Your full cognitive map: narrative report, Executive Function Radar, and ADHD Signature — explained in plain English.", label: "Personalized · Detailed" },
  { num: "03", icon: Target, color: "#2F8B63", tint: "rgba(47,139,99,0.12)", title: "Follow your Protocol", desc: "28 days of daily micro-actions, reflection prompts, and focus recovery tools — built specifically for your profile.", label: "Actionable · Day-by-day" },
];

const WHAT_YOU_GET = [
  { icon: Brain, color: "#6757E8", tint: "rgba(103,87,232,0.08)", title: "Brain Profile Report", desc: "A detailed narrative of how your brain processes attention, starts tasks, handles time, and recovers from distraction." },
  { icon: BarChart3, color: "#3B82B8", tint: "rgba(59,130,184,0.08)", title: "Executive Function Radar", desc: "A visual map of 6 core cognitive domains — so you can see exactly where your system underperforms and why." },
  { icon: Layers, color: "#2F8B63", tint: "rgba(47,139,99,0.08)", title: "28-Day Protocol", desc: "28 daily actions calibrated to your profile. Structured phases. No willpower required — just follow the next step." },
  { icon: Zap, color: "#C88322", tint: "rgba(200,131,34,0.08)", title: "Focus Toolkit Bundle", desc: "Playsheets, planners, reset rituals, and decision templates designed for your cognitive signature." },
  { icon: Lightbulb, color: "#6757E8", tint: "rgba(103,87,232,0.08)", title: "Profile-to-Protocol Engine", desc: "The system that bridges insight and action — matching your profile output to daily practical strategies." },
  { icon: Repeat, color: "#C64545", tint: "rgba(198,69,69,0.08)", title: "Focus Recovery Tools", desc: "Cues, rituals, and re-entry protocols for the moments when everything falls apart." },
];

const FAQS = [
  { q: "Is this a diagnosis?", a: "No. FocusRoute is an educational self-assessment tool. It maps self-reported behavior patterns and provides practical planning guidance. It is not a medical test, clinical evaluation, or substitute for professional care." },
  { q: "Do I need an ADHD diagnosis to use this?", a: "No. FocusRoute is built for anyone who struggles with focus, task initiation, or cognitive overload — whether diagnosed or not. The profile reflects real patterns regardless of formal diagnosis status." },
  { q: "How long is the assessment?", a: "About 3 minutes. 28 structured questions covering attention, executive function, emotional regulation, and daily behavior patterns." },
  { q: "Is my data private?", a: "Yes. Your assessment data is never sold, shared, or used for advertising. It lives in your profile and is used only to generate your report." },
  { q: "What's included in the free assessment?", a: "The assessment is free. Your full Brain Profile Report, Executive Function Radar, 28-Day Protocol, and Toolkit Bundle are premium products available after you complete the assessment." },
  { q: "Is there a guarantee?", a: "Yes. If your Brain Profile doesn't feel like the most accurate description of how your brain works, email us within 7 days for a full refund. No forms, no questions." },
];

function HeroVisual() {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 420, margin: "0 auto", height: 300, perspective: 1200 }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle,rgba(103,87,232,0.4) 0%,rgba(103,87,232,0) 70%)", filter: "blur(40px)", animation: "pulseGlow 3s ease-in-out infinite" }} />
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <m.div
            key={step.num}
            initial={{ opacity: 0, rotateX: 30, y: 60 }}
            animate={{ opacity: 1, rotateX: 0, y: i * 68 - 60 }}
            transition={{ delay: 0.15 + i * 0.14, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.04, zIndex: 10 }}
            style={{ position: "absolute", left: "50%", top: "50%", transform: "translateX(-50%)", width: "94%", maxWidth: 340, background: "rgba(255,255,255,0.07)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.11)", borderRadius: 18, padding: "15px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: `0 10px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)`, cursor: "default", zIndex: STEPS.length - i }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: step.tint.replace("0.12","0.3"), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${step.color}55` }}>
              <Icon size={18} color={step.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.01em" }}>Step {step.num}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: step.color, background: step.tint.replace("0.12","0.2"), borderRadius: 5, padding: "2px 7px", textTransform: "uppercase" as const, letterSpacing: "0.06em", whiteSpace: "nowrap" as const }}>{step.label}</span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{step.title}</p>
            </div>
            <ChevronRight size={14} color="rgba(255,255,255,0.25)" />
          </m.div>
        );
      })}
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      <style>{`
        @keyframes pulseGlow {
          0%,100%{opacity:0.7;transform:translate(-50%,-50%) scale(1);}
          50%{opacity:1;transform:translate(-50%,-50%) scale(1.14);}
        }
        @media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important;transition-duration:0.01ms!important;}}
      `}</style>
      <div style={{ background: "#F7F2EA", overflowX: "hidden" }}>

        {/* NAV */}
        <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(247,242,234,0.9)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid #E2D8CA" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#171421", letterSpacing: "-0.02em" }}>FocusRoute</span>
            </Link>
            <Link href="/assessment" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#171421", color: "#FFFFFF", fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 999, textDecoration: "none" }}>
              Start Free <ChevronRight size={14} />
            </Link>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ background: "linear-gradient(170deg,#0E0B16 0%,#171421 60%,#1C1630 100%)", padding: "80px 20px 64px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(rgba(103,87,232,0.07) 1px,transparent 1px)`, backgroundSize: "30px 30px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 600, height: 240, background: "radial-gradient(ellipse,rgba(103,87,232,0.18) 0%,transparent 70%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 660, margin: "0 auto", position: "relative", zIndex: 1 }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(103,87,232,0.14)", border: "1px solid rgba(103,87,232,0.28)", borderRadius: 999, padding: "5px 14px", marginBottom: 28 }}>
                <Sparkles size={12} color="#9B8EFF" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9B8EFF", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>FocusRoute Brain OS</span>
              </div>
            </m.div>
            <m.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.65 }} style={{ fontSize: "clamp(34px,7.5vw,56px)", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.1, letterSpacing: "-0.035em", marginBottom: 22 }}>
              {BRAIN_OS.heroTitleBefore}{" "}
              <span style={{ color: "#9B8EFF" }}>Your brain just needs a different operating system.</span>
            </m.h1>
            <m.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17, duration: 0.5 }} style={{ fontSize: "clamp(15px,3.5vw,18px)", color: "rgba(255,255,255,0.58)", lineHeight: 1.65, marginBottom: 38, maxWidth: 540 }}>
              Take the free 3-minute assessment. Get a complete cognitive map — and a 28-day action plan built around how your brain actually works.
            </m.p>
            <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }} style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 56 }}>
              <Link href="/assessment" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#6757E8", color: "#FFFFFF", fontSize: 17, fontWeight: 800, padding: "17px 30px", borderRadius: 999, textDecoration: "none", letterSpacing: "-0.02em", boxShadow: "0 10px 36px rgba(103,87,232,0.45)" }}>
                Start your free Brain Profile <ArrowRight size={18} />
              </Link>
              <a href="#how-it-works" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)", fontSize: 15, fontWeight: 600, padding: "17px 24px", borderRadius: 999, textDecoration: "none", border: "1px solid rgba(255,255,255,0.11)" }}>
                How it works <ChevronDown size={15} />
              </a>
            </m.div>
            <m.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.75 }}>
              <HeroVisual />
            </m.div>
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }} style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px", justifyContent: "center", marginTop: 44 }}>
              {["Free assessment","Private results","No diagnosis","Instant access"].map((t) => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.38)" }}>
                  <CheckCircle2 size={12} color="rgba(103,87,232,0.65)" />{t}
                </span>
              ))}
            </m.div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" style={{ padding: "80px 20px", background: "#F7F2EA" }}>
          <div style={{ maxWidth: 820, margin: "0 auto" }}>
            <SectionReveal>
              <m.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 56 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#6757E8", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 12 }}>How it works</p>
                <h2 style={{ fontSize: "clamp(26px,5vw,40px)", fontWeight: 800, color: "#171421", lineHeight: 1.15, letterSpacing: "-0.025em", maxWidth: 480, margin: "0 auto" }}>
                  Map first. Protocol second.
                </h2>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <m.div key={step.num} variants={fadeUp} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0 28px", alignItems: "stretch" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: 56, height: 56, borderRadius: 18, background: step.tint, border: `1.5px solid ${step.color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon size={24} color={step.color} />
                        </div>
                        {i < STEPS.length - 1 && (
                          <div style={{ width: 2, flex: 1, minHeight: 32, background: `linear-gradient(to bottom,${step.color}35,transparent)`, margin: "10px 0" }} />
                        )}
                      </div>
                      <div style={{ paddingBottom: i < STEPS.length - 1 ? 40 : 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: step.color, background: step.tint, borderRadius: 6, padding: "3px 10px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Step {step.num}</span>
                          <span style={{ fontSize: 11, color: "#9A94AA", fontWeight: 500 }}>{step.label}</span>
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#171421", letterSpacing: "-0.02em", marginBottom: 8 }}>{step.title}</h3>
                        <p style={{ fontSize: 15, color: "#6F6A80", lineHeight: 1.65 }}>{step.desc}</p>
                      </div>
                    </m.div>
                  );
                })}
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* TRANSFORMATION */}
        <section style={{ padding: "80px 20px", background: "#0E0B16", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(rgba(103,87,232,0.06) 1px,transparent 1px)`, backgroundSize: "30px 30px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -60, right: -60, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(103,87,232,0.1) 0%,transparent 70%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 820, margin: "0 auto", position: "relative" }}>
            <SectionReveal>
              <m.div variants={fadeUp} style={{ marginBottom: 48 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9B8EFF", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 14 }}>Why it matters</p>
                <h2 style={{ fontSize: "clamp(26px,5vw,40px)", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.15, letterSpacing: "-0.025em", maxWidth: 560, marginBottom: 20 }}>
                  Generic advice doesn&apos;t work because generic brains don&apos;t exist.
                </h2>
                <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", lineHeight: 1.75, maxWidth: 560 }}>
                  Every focus strategy you&apos;ve tried was built for an average brain. FocusRoute reverses the model: understand your specific cognitive signature first, then build a system that fits it.
                </p>
              </m.div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
                {[
                  { before: "Generic productivity tips", after: "Profile-matched daily actions", color: "#6757E8" },
                  { before: "Willpower and motivation", after: "Structure and environmental cues", color: "#3B82B8" },
                  { before: "Start over after every bad week", after: "Recovery protocol built in", color: "#2F8B63" },
                  { before: "Not knowing why you struggle", after: "A clear map of your friction points", color: "#C88322" },
                ].map(({ before, after, color }) => (
                  <m.div key={before} variants={fadeUp} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "20px 20px" }}>
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 5 }}>Before</p>
                      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", textDecoration: "line-through" }}>{before}</p>
                    </div>
                    <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 12 }} />
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 5 }}>After</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>{after}</p>
                    </div>
                  </m.div>
                ))}
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* WHAT YOU GET */}
        <section style={{ padding: "80px 20px", background: "#FFFFFF" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <SectionReveal>
              <m.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 52 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#6757E8", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 12 }}>What you get</p>
                <h2 style={{ fontSize: "clamp(26px,5vw,40px)", fontWeight: 800, color: "#171421", lineHeight: 1.15, letterSpacing: "-0.025em", maxWidth: 500, margin: "0 auto 14px" }}>
                  A complete cognitive operating system.
                </h2>
                <p style={{ fontSize: 16, color: "#6F6A80", maxWidth: 440, margin: "0 auto" }}>
                  Not generic advice. Not a template. A full system built around your actual brain.
                </p>
              </m.div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
                {WHAT_YOU_GET.map(({ icon: Icon, color, tint, title, desc }) => (
                  <m.div key={title} variants={fadeUp} style={{ background: "#F7F2EA", borderRadius: 20, padding: "24px 22px", border: "1px solid #E2D8CA" }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: tint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                      <Icon size={21} color={color} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "#171421", marginBottom: 8, letterSpacing: "-0.01em" }}>{title}</h3>
                    <p style={{ fontSize: 14, color: "#6F6A80", lineHeight: 1.6 }}>{desc}</p>
                  </m.div>
                ))}
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* TRUST */}
        <section style={{ padding: "64px 20px", background: "#F7F2EA" }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <SectionReveal>
              <m.div variants={fadeUp} style={{ textAlign: "center", marginBottom: 40 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#6757E8", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 10 }}>Built to trust</p>
                <h2 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 800, color: "#171421", letterSpacing: "-0.02em" }}>Private. Honest. Guaranteed.</h2>
              </m.div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
                {[
                  { icon: Lock, title: "Private results", desc: "Your data is never sold, shared, or used for ads. It exists only to generate your profile." },
                  { icon: Shield, title: "7-day guarantee", desc: "If your Brain Profile doesn't feel accurate, email us for a full refund. No questions." },
                  { icon: Clock, title: "Not a diagnosis", desc: "Educational tool only. Not a substitute for professional medical or mental health care." },
                  { icon: Zap, title: "Instant access", desc: "Results, profile, and protocol are available immediately after you complete the assessment." },
                ].map(({ icon: Icon, title, desc }) => (
                  <m.div key={title} variants={fadeUp} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, background: "#FFFFFF", borderRadius: 18, padding: "22px 18px", border: "1px solid #E2D8CA" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(103,87,232,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={19} color="#6757E8" />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#171421" }}>{title}</p>
                    <p style={{ fontSize: 12, color: "#9A94AA", lineHeight: 1.6 }}>{desc}</p>
                  </m.div>
                ))}
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* CTA BLOCK */}
        <section style={{ padding: "88px 20px", background: "#171421", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(rgba(103,87,232,0.07) 1px,transparent 1px)`, backgroundSize: "30px 30px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 350, background: "radial-gradient(ellipse,rgba(103,87,232,0.13) 0%,transparent 68%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 580, margin: "0 auto", textAlign: "center", position: "relative" }}>
            <SectionReveal>
              <m.div variants={fadeUp}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9B8EFF", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 18 }}>Start today</p>
                <h2 style={{ fontSize: "clamp(30px,6.5vw,48px)", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.1, letterSpacing: "-0.035em", marginBottom: 18 }}>
                  Stop guessing. Start with a map.
                </h2>
                <p style={{ fontSize: 16, color: "rgba(255,255,255,0.48)", lineHeight: 1.7, marginBottom: 44, maxWidth: 440, margin: "0 auto 44px" }}>
                  3 minutes. Free assessment. A complete picture of how your brain handles focus, time, and motivation — plus a protocol built to match it.
                </p>
              </m.div>
              <m.div variants={fadeUp} style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", marginBottom: 28 }}>
                <Link href="/assessment" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#6757E8", color: "#FFFFFF", fontSize: 17, fontWeight: 800, padding: "18px 32px", borderRadius: 999, textDecoration: "none", letterSpacing: "-0.02em", boxShadow: "0 14px 44px rgba(103,87,232,0.5)" }}>
                  Start your free Brain Profile <ArrowRight size={19} />
                </Link>
              </m.div>
              <m.div variants={fadeUp} style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", justifyContent: "center" }}>
                {["Free · 3 minutes","No diagnosis","Private results","7-day guarantee"].map((t) => (
                  <span key={t} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.32)" }}>
                    <CheckCircle2 size={11} color="rgba(103,87,232,0.55)" />{t}
                  </span>
                ))}
              </m.div>
            </SectionReveal>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "80px 20px", background: "#F7F2EA" }}>
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
        <section style={{ padding: "48px 20px", background: "#FFFFFF", borderTop: "1px solid #E2D8CA" }}>
          <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#171421", letterSpacing: "-0.02em", marginBottom: 8 }}>Ready to understand your brain?</p>
            <p style={{ fontSize: 14, color: "#9A94AA", marginBottom: 22 }}>Free assessment. 3 minutes. Your cognitive map, instantly.</p>
            <Link href="/assessment" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#171421", color: "#FFFFFF", fontSize: 15, fontWeight: 800, padding: "14px 26px", borderRadius: 999, textDecoration: "none", letterSpacing: "-0.02em" }}>
              Start your free Brain Profile <ArrowRight size={16} />
            </Link>
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #E2D8CA", display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
              {[{href:"/roadmap",label:"28-Day Protocol"},{href:"/privacy",label:"Privacy"},{href:"/terms",label:"Terms"},{href:"/disclaimer",label:"Disclaimer"}].map(({href,label}) => (
                <Link key={href} href={href} style={{ fontSize: 12, color: "#9A94AA", textDecoration: "none" }}>{label}</Link>
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
