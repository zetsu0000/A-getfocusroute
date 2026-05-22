import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
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
  Zap,
} from "lucide-react";
export const metadata: Metadata = {
  title: {
    absolute: "FocusRoute — Understand How Your Focus Works",
  },
  description:
    "A guided assessment and Brain Profile to help you understand your focus patterns, friction points, and next best step.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "FocusRoute — Understand How Your Focus Works",
    description:
      "A guided assessment and Brain Profile to help you understand your focus patterns, friction points, and next best step.",
    url: "/",
    type: "website",
  },
  twitter: {
    title: "FocusRoute — Understand How Your Focus Works",
    description:
      "A guided assessment and Brain Profile to help you understand your focus patterns, friction points, and next best step.",
  },
};


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

function PrimaryCta({ children = "Start Assessment" }: { children?: string }) {
  return (
    <Link
      href="/assessment"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        minHeight: 48,
        borderRadius: 14,
        background: "var(--color-accent)",
        color: "#fff",
        padding: "13px 18px",
        fontSize: 14,
        fontWeight: 900,
        textDecoration: "none",
        boxShadow: "var(--shadow-btn-accent)",
        maxWidth: "100%",
      }}
    >
      {children}
      <ArrowRight size={16} strokeWidth={2.6} />
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--color-signal)",
        marginBottom: 10,
      }}
    >
      {children}
    </p>
  );
}

function HeroVisual() {
  const layers = [
    { label: "Attention pattern", value: "Mapped", icon: Brain },
    { label: "Friction point", value: "Task entry", icon: Zap },
    { label: "Next step", value: "Lower the start cost", icon: Target },
  ];

  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        minHeight: 330,
        borderRadius: 28,
        background: "linear-gradient(145deg, var(--color-primary-dark), var(--color-text))",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 30px 90px rgba(20,17,31,0.22)",
        overflow: "hidden",
        padding: 22,
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(76,63,215,0.18) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -80,
          top: -80,
          width: 250,
          height: 250,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(76,63,215,0.32) 0%, rgba(46,111,158,0.16) 42%, transparent 70%)",
        }}
      />
      <div style={{ position: "relative", display: "grid", gap: 13 }}>
        <div
          style={{
            borderRadius: 18,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            padding: "16px 16px",
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.46)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            FocusRoute preview
          </p>
          <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.12, letterSpacing: "-0.02em" }}>
            Cognitive map, not another productivity checklist.
          </p>
        </div>
        {layers.map(({ label, value, icon: Icon }, index) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              maxWidth: `calc(100% - ${index * 14}px)`,
              marginLeft: index * 14,
              borderRadius: 16,
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(255,255,255,0.72)",
              padding: "13px 14px",
              boxShadow: "0 18px 46px rgba(0,0,0,0.18)",
            }}
          >
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: index === 0 ? "var(--color-cognitive-tint)" : "var(--color-signal-tint)",
                color: index === 0 ? "var(--color-cognitive)" : "var(--color-signal)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={18} />
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
              <span style={{ display: "block", fontSize: 14, fontWeight: 900, color: "var(--color-text)", lineHeight: 1.25, overflowWrap: "break-word" }}>{value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <style>{`
        .fr-desktop-nav { display: flex; }
        .fr-mobile-menu { display: none; }
        .fr-shell, .fr-grid-2, .fr-card-grid, .fr-benefit-grid { min-width: 0; max-width: 100%; box-sizing: border-box; }
        .fr-grid-2 { grid-template-columns: minmax(0, 1.02fr) minmax(0, 0.78fr); }
        .fr-card-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .fr-benefit-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .fr-card-grid > *, .fr-benefit-grid > * { min-width: 0; }
        @media (max-width: 820px) {
          .fr-desktop-nav { display: none !important; }
          .fr-mobile-menu { display: block !important; }
          .fr-grid-2, .fr-card-grid, .fr-benefit-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 430px) {
          .fr-shell { padding-left: 16px !important; padding-right: 16px !important; }
          .fr-hero-title { font-size: 34px !important; line-height: 1.03 !important; }
          .fr-section-title { font-size: 26px !important; }
          .fr-hero-visual { margin-top: 8px; }
        }
        @media (max-width: 360px) {
          .fr-shell { padding-left: 14px !important; padding-right: 14px !important; }
          .fr-hero-title { font-size: 31px !important; }
          .fr-section-title { font-size: 24px !important; }
        }
      `}</style>
      <main style={{ minHeight: "100dvh", background: "var(--color-bg-page)", overflowX: "hidden" }}>
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            background: "rgba(244,237,226,0.88)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div className="fr-shell" style={{ maxWidth: 1120, margin: "0 auto", padding: "0 22px", minHeight: 68, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
            <Link href="/" style={{ color: "var(--color-text)", fontSize: 17, fontWeight: 900, letterSpacing: "-0.02em", textDecoration: "none" }}>
              FocusRoute
            </Link>
            <nav className="fr-desktop-nav" style={{ alignItems: "center", gap: 24 }}>
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} style={{ color: "var(--color-text-body)", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="fr-desktop-nav" style={{ alignItems: "center", gap: 10 }}>
              <Link href="/login" style={{ color: "var(--color-text)", fontSize: 13, fontWeight: 800, textDecoration: "none", padding: "10px 12px" }}>
                Login
              </Link>
              <PrimaryCta />
            </div>
            <details className="fr-mobile-menu" style={{ position: "relative" }}>
              <summary
                aria-label="Open navigation menu"
                style={{
                  listStyle: "none",
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  border: "1px solid var(--color-border-2)",
                  background: "var(--color-bg-card)",
                  color: "var(--color-text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Menu size={19} />
              </summary>
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 52,
                  width: "min(270px, calc(100vw - 32px))",
                  borderRadius: 18,
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border-2)",
                  boxShadow: "var(--shadow-card-strong)",
                  padding: 12,
                }}
              >
                {[...navLinks, { href: "/login", label: "Login" }].map((link) => (
                  <Link key={link.href} href={link.href} style={{ display: "block", color: "var(--color-text)", fontSize: 14, fontWeight: 800, textDecoration: "none", padding: "12px 10px", borderRadius: 10 }}>
                    {link.label}
                  </Link>
                ))}
                <div style={{ padding: "8px 2px 2px" }}>
                  <PrimaryCta />
                </div>
              </div>
            </details>
          </div>
        </header>

        <section className="fr-shell" style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 22px 56px" }}>
          <div className="fr-grid-2" style={{ display: "grid", gap: 34, alignItems: "center" }}>
            <div>
              <SectionLabel>Premium cognitive profiling</SectionLabel>
              <h1 className="fr-hero-title" style={{ fontSize: "clamp(46px, 7vw, 76px)", lineHeight: 0.98, letterSpacing: "-0.045em", fontWeight: 900, color: "var(--color-text)", maxWidth: 760, marginBottom: 22 }}>
                Understand how your focus works.
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.7, color: "var(--color-text-body)", maxWidth: 610, marginBottom: 28, overflowWrap: "break-word" }}>
                FocusRoute helps you understand your attention patterns, friction points, and next best step through a simple guided assessment.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <PrimaryCta />
                <a href="#how-it-works" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 48, borderRadius: 14, border: "1px solid var(--color-border-2)", color: "var(--color-text)", background: "var(--color-bg-card)", padding: "13px 17px", fontSize: 14, fontWeight: 900, textDecoration: "none" }}>
                  How it works
                </a>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px 16px" }}>
                {["Private results", "3 minutes", "Not a diagnosis"].map((item) => (
                  <span key={item} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--color-text-muted)", fontSize: 12, fontWeight: 800 }}>
                    <CheckCircle2 size={13} color="var(--color-signal)" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="fr-hero-visual">
              <HeroVisual />
            </div>
          </div>
        </section>

        <section className="fr-shell" style={{ maxWidth: 1120, margin: "0 auto", padding: "30px 22px 58px" }}>
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 34 }}>
            <SectionLabel>Patterns people recognize</SectionLabel>
            <div className="fr-card-grid" style={{ display: "grid", gap: 12 }}>
              {recognition.map((item) => (
                <div key={item} style={{ minHeight: 112, borderRadius: 18, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderTop: "2px solid var(--color-signal)", boxShadow: "var(--shadow-card)", padding: 18, minWidth: 0 }}>
                  <p style={{ color: "var(--color-text)", fontSize: 16, fontWeight: 900, lineHeight: 1.32, letterSpacing: "-0.01em", overflowWrap: "break-word" }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="brain-profile" style={{ background: "var(--color-bg-card)", borderBlock: "1px solid var(--color-border)" }}>
          <div className="fr-shell" style={{ maxWidth: 1120, margin: "0 auto", padding: "64px 22px" }}>
            <div style={{ maxWidth: 640, marginBottom: 30 }}>
              <SectionLabel>What FocusRoute gives you</SectionLabel>
              <h2 className="fr-section-title" style={{ fontSize: 38, lineHeight: 1.12, letterSpacing: "-0.03em", fontWeight: 900, marginBottom: 12 }}>
                A premium report for turning self-observation into a clearer next step.
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--color-text-body)" }}>
                The assessment is designed to make your patterns easier to see, explain, and act on without clinical claims or generic productivity scripts.
              </p>
            </div>
            <div className="fr-card-grid" style={{ display: "grid", gap: 14 }}>
              {profileCards.map(({ icon: Icon, title, body }, index) => (
                <article key={title} style={{ borderRadius: 20, background: index === 0 ? "var(--color-bg-card-2)" : "var(--color-bg-card)", border: "1px solid var(--color-border)", boxShadow: index === 0 ? "var(--shadow-card-strong)" : "var(--shadow-card)", padding: 20, minWidth: 0 }}>
                  <span style={{ width: 42, height: 42, borderRadius: 13, display: "inline-flex", alignItems: "center", justifyContent: "center", color: index < 2 ? "var(--color-cognitive)" : "var(--color-signal)", background: index < 2 ? "var(--color-cognitive-tint)" : "var(--color-signal-tint)", marginBottom: 15 }}>
                    <Icon size={20} />
                  </span>
                  <h3 style={{ fontSize: 17, fontWeight: 900, color: "var(--color-text)", letterSpacing: "-0.015em", marginBottom: 7 }}>{title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--color-text-body)", overflowWrap: "break-word" }}>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="fr-shell" style={{ maxWidth: 1120, margin: "0 auto", padding: "66px 22px" }}>
          <div className="fr-grid-2" style={{ display: "grid", gap: 30, alignItems: "start" }}>
            <div>
              <SectionLabel>How it works</SectionLabel>
              <h2 className="fr-section-title" style={{ fontSize: 38, lineHeight: 1.12, letterSpacing: "-0.03em", fontWeight: 900, marginBottom: 12 }}>
                Simple enough to start today. Detailed enough to feel personal.
              </h2>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                ["01", "Take the assessment", "Answer pattern-based questions about attention, task entry, friction, and recovery."],
                ["02", "Get your FocusRoute preview", "See the beginning of your cognitive map and whether the language feels accurate."],
                ["03", "Unlock your full Brain Profile if it feels useful", "Keep the full report, explanation script, and next-step recommendations in your account."],
              ].map(([num, title, body]) => (
                <div key={num} style={{ display: "grid", gridTemplateColumns: "42px 1fr", gap: 14, padding: "16px 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ width: 42, height: 42, borderRadius: 13, background: "var(--color-signal-tint)", color: "var(--color-signal)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900 }}>{num}</span>
                  <span>
                    <strong style={{ display: "block", fontSize: 16, color: "var(--color-text)", marginBottom: 4 }}>{title}</strong>
                    <span style={{ display: "block", fontSize: 14, lineHeight: 1.6, color: "var(--color-text-body)" }}>{body}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="fr-shell" style={{ maxWidth: 1120, margin: "0 auto", padding: "18px 22px 66px" }}>
          <div className="fr-benefit-grid" style={{ display: "grid", gap: 14 }}>
            <div style={{ borderRadius: 24, background: "var(--color-primary-dark)", color: "#fff", padding: 26, boxShadow: "var(--shadow-card-strong)" }}>
              <SectionLabel>Why people use it</SectionLabel>
              <h2 className="fr-section-title" style={{ color: "#fff", fontSize: 34, lineHeight: 1.14, letterSpacing: "-0.03em", fontWeight: 900 }}>
                Better language for the moments where effort alone is not the answer.
              </h2>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {benefits.map((benefit) => (
                <div key={benefit} style={{ display: "flex", gap: 11, alignItems: "flex-start", borderRadius: 16, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", padding: "14px 15px" }}>
                  <CheckCircle2 size={17} color="var(--color-success)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <p style={{ fontSize: 14, lineHeight: 1.58, color: "var(--color-text-body)", fontWeight: 700 }}>{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="fr-shell" style={{ maxWidth: 1120, margin: "0 auto", padding: "0 22px 66px" }}>
          <div style={{ borderRadius: 28, background: "var(--color-bg-card)", border: "1px solid var(--color-border-2)", boxShadow: "var(--shadow-card)", padding: "28px 24px", display: "grid", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 44, height: 44, borderRadius: 14, background: "var(--color-cognitive-tint)", color: "var(--color-cognitive)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <Map size={21} />
              </span>
              <div>
                <SectionLabel>Optional next step</SectionLabel>
                <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", color: "var(--color-text)", lineHeight: 1.18 }}>
                  Turn your Brain Profile into a 28-day focus system.
                </h2>
              </div>
            </div>
            <p style={{ maxWidth: 690, fontSize: 15, lineHeight: 1.7, color: "var(--color-text-body)" }}>
              The 28-Day Protocol is the guided roadmap after the profile: daily micro-actions, reflection prompts, recovery tools, and practical routines for turning insight into action.
            </p>
            <Link href="/roadmap" style={{ justifySelf: "start", display: "inline-flex", alignItems: "center", gap: 8, color: "var(--color-text)", background: "var(--color-bg-card-2)", border: "1px solid var(--color-border-2)", borderRadius: 14, padding: "12px 16px", fontSize: 14, fontWeight: 900, textDecoration: "none" }}>
              Explore the 28-Day Protocol
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section style={{ background: "var(--color-bg-card)", borderBlock: "1px solid var(--color-border)" }}>
          <div className="fr-shell" style={{ maxWidth: 1120, margin: "0 auto", padding: "54px 22px" }}>
            <div className="fr-card-grid" style={{ display: "grid", gap: 12 }}>
              {[
                { icon: Lock, title: "Private results", body: "Your assessment data is used to generate your profile, not to sell ads." },
                { icon: FileText, title: "Educational profiling", body: "FocusRoute is for self-understanding and productivity support." },
                { icon: Shield, title: "Not medical treatment", body: "It is not a diagnosis, medical test, therapy, or clinical substitute." },
                { icon: Clock, title: "Low-friction start", body: "The assessment takes about 3 minutes and gives you a preview before purchase." },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} style={{ borderRadius: 18, background: "var(--color-bg-card-2)", border: "1px solid var(--color-border)", padding: 18 }}>
                  <Icon size={18} color="var(--color-signal)" />
                  <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--color-text)", marginTop: 12, marginBottom: 6 }}>{title}</h3>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--color-text-muted)" }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="fr-shell" style={{ maxWidth: 760, margin: "0 auto", padding: "72px 22px", textAlign: "center" }}>
          <SectionLabel>Start here</SectionLabel>
          <h2 className="fr-section-title" style={{ fontSize: 42, lineHeight: 1.08, letterSpacing: "-0.04em", fontWeight: 900, color: "var(--color-text)", marginBottom: 16 }}>
            Start with a clearer picture of how your focus works.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--color-text-body)", marginBottom: 24 }}>
            Take the free assessment first. You can decide whether the full profile is useful after you see the preview.
          </p>
          <PrimaryCta />
        </section>

        <footer style={{ background: "var(--color-text)", color: "#fff" }}>
          <div className="fr-shell" style={{ maxWidth: 1120, margin: "0 auto", padding: "30px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
            <p style={{ fontSize: 14, fontWeight: 900 }}>FocusRoute</p>
            <div style={{ display: "flex", gap: "12px 18px", flexWrap: "wrap" }}>
              {[
                ["/privacy", "Privacy Policy"],
                ["/terms", "Terms"],
                ["/refund-policy", "Refund Policy"],
                ["/disclaimer", "Disclaimer"],
                ["/login", "Login"],
                ["/about", "About"],
                ["/roadmap", "Roadmap"],
              ].map(([href, label]) => (
                <Link key={href} href={href} style={{ color: "rgba(255,255,255,0.68)", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
