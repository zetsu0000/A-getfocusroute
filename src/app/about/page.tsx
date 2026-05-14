import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About FocusRoute · ADHD Assessment",
  description: "Learn about FocusRoute's mission to make ADHD screening accessible, science-backed, and free for everyone.",
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
              ADHD TEST
            </p>
          </div>
        </a>
        <a href="/" style={{ fontSize: 13, color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>
          ← Take the test
        </a>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 0" }}>
        <h1 style={{ fontSize: "clamp(26px, 5vw, 36px)", marginBottom: 16, color: "var(--color-text)" }}>
          About FocusRoute
        </h1>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>
            Our Mission
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.7 }}>
            FocusRoute exists to make ADHD screening accessible to everyone, regardless of location or income.
            Millions of adults live with undiagnosed ADHD — experiencing chronic disorganization, emotional
            dysregulation, and missed potential — without ever knowing why. We built FocusRoute to give people
            a fast, science-backed starting point for understanding their own neurology. Knowledge is the first
            step toward change.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>
            How the Assessment Works
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.7 }}>
            FocusRoute guides you through 20 carefully selected questions covering the four core ADHD dimensions:
            attention and focus, executive function, emotional regulation, and daily life impact. The questions
            are adapted from validated clinical screening instruments used by mental health professionals.
            At the end, you receive a symptom profile showing your level across each dimension, along with a
            brief interpretation of what your results mean.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>
            The Science Behind It
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.7 }}>
            Our assessment is grounded in the DSM-5 diagnostic criteria for Attention Deficit Hyperactivity
            Disorder. The DSM-5 defines three ADHD presentations — Predominantly Inattentive, Predominantly
            Hyperactive-Impulsive, and Combined — and specifies that symptoms must be persistent, appear in
            multiple settings, and cause meaningful impairment. FocusRoute is a <em>screening tool</em>, not a
            diagnostic instrument. It identifies patterns consistent with ADHD and recommends professional
            evaluation where appropriate.
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
            A Note from the Founder
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.7 }}>
            FocusRoute was built by someone who received an ADHD diagnosis as an adult and spent years wondering
            why simple tasks felt impossibly hard. The goal was never to replace professional care — it was to
            lower the barrier to self-understanding. If this tool helps even one person recognize themselves in
            the results and take the next step, it has done its job.
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
            Ready to discover your ADHD profile?
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
            Take the Free Assessment →
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
            ← Back to the ADHD Assessment
          </a>
        </div>
      </main>
    </div>
  );
}
