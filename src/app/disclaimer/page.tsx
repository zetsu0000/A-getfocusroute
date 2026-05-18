import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Disclaimer · FocusRoute",
  description:
    "FocusRoute is an educational self-understanding tool. It does not diagnose ADHD or provide medical treatment. Read the full disclaimer.",
};

const h2: React.CSSProperties = {
  fontSize: 20, fontWeight: 800, color: "var(--color-text)",
  marginBottom: 12, marginTop: 0, letterSpacing: "-0.01em",
};
const p: React.CSSProperties = {
  fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.75, marginBottom: 12,
};
const ul: React.CSSProperties = {
  fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.75,
  paddingLeft: 22, marginBottom: 12,
};
const section: React.CSSProperties = { marginBottom: 44 };

export default function DisclaimerPage() {
  return (
    <LegalLayout title="Disclaimer" lastUpdated="May 17, 2026">

      {/* Crisis notice — always visible, always first */}
      <div style={{ borderRadius: 14, padding: "16px 18px", background: "var(--color-accent-tint)", border: "2px solid var(--color-accent-dark)", marginBottom: 28 }}>
        <p style={{ fontSize: 14, fontWeight: 900, color: "var(--color-accent-dark)", marginBottom: 6, letterSpacing: "-0.01em" }}>
          If you are in crisis or may harm yourself or others
        </p>
        <p style={{ fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.65, margin: 0 }}>
          Please contact your local emergency services (such as 911 in the US) or a crisis hotline
          immediately. In the US you can call or text <strong>988</strong> (Suicide & Crisis Lifeline).
          FocusRoute is not a crisis service and cannot provide emergency support.
        </p>
      </div>

      {/* Summary box */}
      <div style={{ borderRadius: 14, padding: "16px 18px", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", marginBottom: 44 }}>
        <p style={{ ...p, marginBottom: 0, fontWeight: 600, color: "var(--color-text)" }}>
          FocusRoute is an educational self-understanding tool. It does not diagnose ADHD or any
          other condition, does not provide medical treatment or therapy, and does not offer crisis
          support. Results are based on self-reported answers and vary between individuals.
        </p>
      </div>

      <section style={section}>
        <h2 style={h2}>1. Not a Medical Diagnosis</h2>
        <p style={p}>
          FocusRoute does not diagnose ADHD, any learning difference, or any other medical or
          psychiatric condition. The assessment generates a self-reported profile — a description
          of patterns you recognise in yourself — not a clinical finding.
        </p>
        <p style={p}>
          An ADHD diagnosis requires evaluation by a licensed clinician — typically a psychiatrist,
          psychologist, or other qualified health professional — using validated clinical instruments
          and professional judgment. FocusRoute cannot and does not substitute for that process.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>2. No Treatment, Therapy, or Medication Advice</h2>
        <p style={p}>
          FocusRoute does not provide therapy, counselling, psychiatric care, or any form of clinical
          treatment. The 28-Day Protocol is a structured self-management guide — practical and
          educational, not therapeutic. Bonus content, session guides, and templates are organisational
          tools for personal use.
        </p>
        <p style={p}>
          Nothing on FocusRoute should be used as a basis for starting, stopping, or adjusting any
          medication or medical treatment. Always consult a qualified healthcare professional for
          those decisions.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>3. No Crisis Support</h2>
        <p style={p}>
          FocusRoute is not equipped to provide crisis support of any kind. If you or someone you
          know is in crisis, experiencing suicidal thoughts, or may harm themselves or others, please:
        </p>
        <ul style={ul}>
          <li>Call your local emergency services immediately</li>
          <li>In the US: call or text <strong>988</strong> (Suicide &amp; Crisis Lifeline)</li>
          <li>In the UK: call <strong>116 123</strong> (Samaritans)</li>
          <li>Or visit your nearest emergency department</li>
        </ul>
        <p style={p}>
          Do not rely on FocusRoute for emergency situations.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>4. What FocusRoute Is For</h2>
        <p style={p}>
          FocusRoute is designed to help you:
        </p>
        <ul style={ul}>
          <li>Better understand your own focus and executive function patterns through self-reflection</li>
          <li>Build practical productivity habits suited to how you naturally work</li>
          <li>Develop structured routines and self-management strategies</li>
          <li>Describe your focus experience to others more clearly</li>
        </ul>
        <p style={p}>
          These are personal development and productivity goals. FocusRoute is most useful as a
          complement to professional support — not a replacement for it.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>5. Consult a Licensed Clinician</h2>
        <p style={p}>
          If you have concerns about ADHD, a learning difference, mental health, or any related
          topic, please consult a licensed clinician. Your GP, a psychiatrist, or a psychologist can
          provide an evidence-based assessment and guide you toward the right support.
        </p>
        <p style={p}>
          Many people find FocusRoute helpful alongside therapy, coaching, or medication management —
          but it is not a substitute for clinical care.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>6. Self-Reported Results — May Be Incomplete or Inaccurate</h2>
        <p style={p}>
          Your Brain Profile is generated entirely from the answers you provide. The accuracy and
          completeness of your profile depends on the information you share. We cannot verify
          self-reported data or cross-reference it with clinical records.
        </p>
        <p style={p}>
          Profile results may not capture the full picture of your experience. They are a starting
          point for self-reflection, not a definitive account of who you are or how your brain works.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>7. No Guaranteed Outcomes</h2>
        <p style={p}>
          FocusRoute does not guarantee any specific result — including productivity improvement,
          focus gains, ADHD symptom reduction, or any other outcome. Individual results vary
          based on how the product is used, personal circumstances, and many other factors outside
          our control.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>8. Questions</h2>
        <p style={p}>
          If you have questions about this disclaimer, contact us at{" "}
          <a href="mailto:support@getfocusroute.com" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            support@getfocusroute.com
          </a>
          . See also our{" "}
          <a href="/terms" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Terms of Service</a>
          {" "}and{" "}
          <a href="/privacy" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Privacy Policy</a>.
        </p>
      </section>

    </LegalLayout>
  );
}
