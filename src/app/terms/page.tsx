import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Service · FocusRoute",
  description:
    "The terms governing your use of FocusRoute — what the product is, what it is not, and how purchases and accounts work.",
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

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="May 17, 2026">

      <div style={{ borderRadius: 14, padding: "16px 18px", background: "var(--color-primary-tint)", border: "1px solid var(--color-border)", marginBottom: 44 }}>
        <p style={{ ...p, marginBottom: 0, fontWeight: 600 }}>
          By using FocusRoute you agree to these terms. If you do not agree, please do not use the
          service. These terms are written to be readable — if anything is unclear, please reach out.
        </p>
      </div>

      <section style={section}>
        <h2 style={h2}>1. Acceptance of Terms</h2>
        <p style={p}>
          These Terms of Service govern your use of FocusRoute, including the assessment, Brain
          Profile, 28-Day Protocol, bonus library, and membership (&ldquo;the Service&rdquo;). Using the
          Service means you agree to these terms. You must be at least 18 years old to use FocusRoute.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>2. What FocusRoute Provides</h2>
        <p style={p}>
          FocusRoute is a self-understanding and productivity support tool. The Service helps you
          explore your own attention, focus, and executive function patterns through a self-reported
          assessment and generates a personalised profile, structured protocol, and practical resources
          based on your answers.
        </p>
        <p style={p}><strong>FocusRoute does not provide:</strong></p>
        <ul style={ul}>
          <li>Medical diagnosis of ADHD or any other condition</li>
          <li>Clinical evaluation or assessment</li>
          <li>Therapy, counselling, or psychiatric treatment</li>
          <li>Medication guidance or prescriptions</li>
          <li>Crisis support or emergency services</li>
        </ul>
        <p style={p}>
          FocusRoute is not a healthcare provider. If you have concerns about your mental health,
          ADHD, or any medical matter, please consult a licensed clinician.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>3. Not Medical Advice</h2>
        <p style={p}>
          Nothing in the Service — including the quiz, Brain Profile, ADHD Signature™, Executive
          Function Radar™, 28-Day Protocol, bonus content, or any other material — is medical advice.
          All content is for informational and self-educational purposes only.
        </p>
        <p style={p}>
          Profile results are based entirely on what you report about yourself. They reflect your
          self-described experience, not a clinical finding. Do not use FocusRoute outputs to make
          medical decisions. See our{" "}
          <a href="/disclaimer" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Disclaimer</a>{" "}
          for full detail.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>4. Your Account</h2>
        <p style={p}>
          To access purchased content you create an account with your email address. Please keep your
          login credentials private — you are responsible for any activity on your account. If you
          think your account has been compromised, contact us right away.
        </p>
        <p style={p}>
          One account per person. Paid content is for your personal use and may not be shared,
          resold, or redistributed.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>5. Purchases and Subscriptions</h2>
        <p style={p}>
          Payments are processed securely by Stripe. By completing a purchase you authorise the
          charge shown at checkout. Prices are in USD and may change — you will always see the
          current price before confirming.
        </p>
        <p style={p}>
          Membership subscriptions renew automatically at the end of each billing period until you
          cancel. You can cancel at any time and your access continues until the end of the period
          you have paid for. We will send a renewal reminder before each charge where technically
          feasible.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>6. Refund Policy</h2>
        <p style={p}>
          Brain Profile purchases come with a 7-day &ldquo;This Is Me&rdquo; Guarantee. If the profile does
          not feel like a useful description of how your brain works, email us within 7 days for a
          full refund — no forms, no questions. See our{" "}
          <a href="/refund-policy" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            Refund Policy
          </a>{" "}
          for full details including roadmap/bonus purchases and subscription renewals.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>7. Acceptable Use</h2>
        <p style={p}>Please do not:</p>
        <ul style={ul}>
          <li>Present FocusRoute outputs as a clinical diagnosis or medical recommendation to others</li>
          <li>Share, resell, or sublicense paid account access</li>
          <li>Scrape, copy, or reproduce the Service or its content at scale</li>
          <li>Attempt to reverse-engineer any part of the platform</li>
          <li>Use the Service in any way that violates applicable law</li>
        </ul>
      </section>

      <section style={section}>
        <h2 style={h2}>8. Intellectual Property</h2>
        <p style={p}>
          All FocusRoute content — the assessment, profile outputs, protocol text, bonus templates,
          copy, and design — belongs to FocusRoute or its licensors. You are welcome to use it for
          your own personal purposes. You may not reproduce, distribute, or sell it without
          written permission.
        </p>
        <p style={p}>
          Your quiz answers and account data remain yours. We do not claim ownership of information
          you provide.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>9. No Guarantee of Results</h2>
        <p style={p}>
          Profiles are generated from self-reported answers and are as accurate as the information
          provided. Individual results vary. FocusRoute does not promise any specific productivity
          improvement, symptom reduction, or other outcome from using the Service.
        </p>
        <p style={p}>
          The Service is provided &ldquo;as is.&rdquo; We work hard to make it useful and accurate, but we
          cannot guarantee it will be error-free or right for every person.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>10. Limitation of Liability</h2>
        <p style={p}>
          To the extent permitted by law, FocusRoute is not liable for indirect, incidental, or
          consequential damages arising from your use of the Service. Our total liability for any
          claim is limited to the amount you paid to FocusRoute in the twelve months before the
          claim arose.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>11. Changes to the Service</h2>
        <p style={p}>
          We may update these Terms or the Service over time. When we make significant changes,
          we will update the &ldquo;Last updated&rdquo; date and, where possible, let you know by email.
          Continuing to use the Service after changes are posted means you accept the updated terms.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>12. Contact</h2>
        <p style={p}>
          Questions about these terms? Email us at{" "}
          <a href="mailto:support@getfocusroute.com" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            support@getfocusroute.com
          </a>
          . We are a small team and aim to respond within two business days.
        </p>
      </section>

    </LegalLayout>
  );
}
