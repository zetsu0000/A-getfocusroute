import type { Metadata } from "next";
import { BRAIN_OS } from "@/lib/positioning";

export const metadata: Metadata = {
  title: "About FocusRoute Brain OS",
  description: "Learn why FocusRoute was built around a map-first ADHD approach: profile first, protocol second.",
};

export default function AboutPage() {
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
        <h1 style={{ fontSize: "clamp(26px, 5vw, 36px)", marginBottom: 16, color: "var(--color-text)" }}>
          About {BRAIN_OS.lineTm}
        </h1>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>
            Our Mission
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.7 }}>
            {BRAIN_OS.lineTm} exists to solve one core problem: most ADHD programs give generic advice before
            understanding how your brain actually works. We reverse that order. We map your cognitive patterns
            first, then help you run a practical protocol built for your profile. The mission is simple:
            reduce years of confusion into a clear starting point you can act on immediately.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>
            The {BRAIN_OS.assessment} Approach
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.7 }}>
            FocusRoute guides you through a structured mapping flow that captures attention style,
            executive-function friction, emotional regulation patterns, and day-to-day behavior loops.
            The output is not generic “tips”; it is your {BRAIN_OS.brainProfile} with a concrete next-step plan
            via the {BRAIN_OS.protocol}.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>
            Clinical Positioning (Important)
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.7 }}>
            FocusRoute is a profiling and screening experience — not a medical diagnosis. We use established
            ADHD frameworks to identify symptom patterns and behavior signatures, but formal diagnosis must come
            from a licensed clinician. If your profile flags significant impairment, we recommend clinical follow-up.
          </p>
        </section>

        <section style={{
          marginBottom: 40,
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          padding: "24px 28px",
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>
            Why “Brain OS”
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.7 }}>
            The positioning behind FocusRoute is operational: most people are not “failing discipline” — they are
            running the wrong system for their cognitive style. Brain OS means map → profile → protocol.
            That sequencing is the product.
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 12, fontStyle: "italic" }}>
            — The FocusRoute Team
          </p>
        </section>

        <div style={{
          background: "var(--color-primary)",
          borderRadius: 16,
          padding: "28px 32px",
          textAlign: "center",
          marginBottom: 40,
        }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
            Ready to map your brain profile?
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
