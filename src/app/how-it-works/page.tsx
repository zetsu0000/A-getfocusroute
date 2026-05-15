import type { Metadata } from "next";
import { BRAIN_OS } from "@/lib/positioning";

export const metadata: Metadata = {
  title: `How ${BRAIN_OS.lineTm} Works`,
  description: "See how FocusRoute maps your cognitive profile and turns it into a personalized 28-day ADHD protocol.",
};

const STEPS = [
  {
    number: "01",
    title: "Map your brain",
    description:
      `Complete the ${BRAIN_OS.assessment} to map attention, executive function, emotional regulation, and daily behavior patterns. Most people finish in about 12 minutes.`,
  },
  {
    number: "02",
    title: "Read your Brain Profile",
    description:
      `Instantly receive your ${BRAIN_OS.brainProfile} with your ${BRAIN_OS.radar} and ${BRAIN_OS.signature} — a personalized explanation of how your mind works under pressure, focus, and planning.`,
  },
  {
    number: "03",
    title: "Unlock your protocol",
    description:
      `Unlock your personalized ${BRAIN_OS.protocol} with practical daily actions designed for your profile instead of generic ADHD productivity advice.`,
  },
  {
    number: "04",
    title: "Run your Brain OS",
    description:
      "Apply your profile-based plan one micro-step at a time and build momentum that matches your cognitive style. You can also share your profile with a clinician for professional follow-up.",
  },
];

const FAQ = [
  {
    q: "Is FocusRoute a medical diagnosis?",
    a: "No. FocusRoute is a screening tool, not a diagnostic instrument. It can identify symptom patterns consistent with ADHD, but a formal diagnosis requires evaluation by a licensed mental health professional or physician.",
  },
  {
    q: "What criteria does the assessment use?",
    a: "Our questions are based on the DSM-5 criteria for ADHD, the same framework used by clinicians worldwide. We assess all three presentations: Predominantly Inattentive, Predominantly Hyperactive-Impulsive, and Combined.",
  },
  {
    q: "Can I take the test more than once?",
    a: "Yes. There is no limit on retakes. If your circumstances change or you want to reassess after starting a new strategy, you can take the quiz again at any time.",
  },
  {
    q: "Who is the assessment designed for?",
    a: "FocusRoute is designed primarily for adults aged 18 and older who are curious about ADHD symptoms or have been experiencing persistent difficulties with focus, organization, or impulse control.",
  },
  {
    q: "How is the detailed report different from the free results?",
    a: "The free result shows your symptom score and presentation type. The detailed report includes a full breakdown by dimension, science-backed coping strategies, a daily structure template, and a summary you can share with a healthcare provider.",
  },
];

export default function HowItWorksPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-page)", padding: "0 0 80px" }}>
      <header style={{
        background: "var(--color-bg-card)",
        borderBottom: "1px solid var(--color-border)",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "var(--color-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
              <path d="M1 8 Q3 3 5 8 Q7 13 9 8 Q11 3 13 8 Q15 13 17 8 Q19 3 21 8"
                stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.01em" }}>
              FocusRoute
            </p>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", letterSpacing: "0.08em", fontWeight: 500 }}>
              {BRAIN_OS.headerEyebrow}
            </p>
          </div>
        </a>
        <a href="/" style={{ fontSize: 13, color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>
          ← Start Brain OS
        </a>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 0" }}>
        <h1 style={{ fontSize: "clamp(26px, 5vw, 36px)", marginBottom: 8, color: "var(--color-text)" }}>
          How {BRAIN_OS.lineTm} Works
        </h1>
        <p style={{ fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.7, marginBottom: 48 }}>
          FocusRoute is a four-step profile-to-protocol flow — map first, then run a plan designed for your brain.
        </p>

        <section style={{ marginBottom: 56 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {STEPS.map((step) => (
              <div
                key={step.number}
                style={{
                  display: "flex",
                  gap: 20,
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 16,
                  padding: "24px 24px",
                  alignItems: "flex-start",
                }}
              >
                <div style={{
                  flexShrink: 0,
                  width: 48, height: 48,
                  borderRadius: 12,
                  background: "var(--color-primary-tint)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 800, color: "var(--color-primary)",
                  letterSpacing: "-0.01em",
                }}>
                  {step.number}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.65 }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)", marginBottom: 24 }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQ.map((item) => (
              <details
                key={item.q}
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <summary style={{
                  padding: "16px 20px",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--color-text)",
                  cursor: "pointer",
                  listStyle: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  userSelect: "none",
                }}>
                  {item.q}
                  <span style={{ fontSize: 18, color: "var(--color-primary)", flexShrink: 0, marginLeft: 12 }}>+</span>
                </summary>
                <div style={{
                  padding: "0 20px 18px",
                  fontSize: 14,
                  color: "var(--color-text-body)",
                  lineHeight: 1.7,
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: 14,
                }}>
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        <div style={{
          background: "var(--color-primary)",
          borderRadius: 16,
          padding: "28px 32px",
          textAlign: "center",
          marginBottom: 40,
        }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
            Ready to map your Brain Profile?
          </p>
          <a href="/" style={{
            display: "inline-block",
            background: "#fff",
            color: "var(--color-primary)",
            fontWeight: 700,
            fontSize: 14,
            padding: "12px 28px",
            borderRadius: 10,
            textDecoration: "none",
          }}>
            Start {BRAIN_OS.lineTm} →
          </a>
        </div>

        <div style={{
          marginTop: 56,
          paddingTop: 24,
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          justifyContent: "center",
        }}>
          <a href="/" style={{
            fontSize: 14,
            color: "var(--color-primary)",
            textDecoration: "none",
            fontWeight: 600,
          }}>
            ← Back to FocusRoute Brain OS
          </a>
        </div>
      </main>
    </div>
  );
}
