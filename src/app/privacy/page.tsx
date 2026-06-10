import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy · FocusRoute",
  description:
    "How FocusRoute collects, uses, and protects your quiz data, account information, and payment details.",
};

const h2: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: "var(--color-text)",
  marginBottom: 12,
  marginTop: 0,
  letterSpacing: "-0.01em",
};

const p: React.CSSProperties = {
  fontSize: 15,
  color: "var(--color-text-body)",
  lineHeight: 1.75,
  marginBottom: 12,
};

const section: React.CSSProperties = { marginBottom: 44 };

const ul: React.CSSProperties = {
  fontSize: 15,
  color: "var(--color-text-body)",
  lineHeight: 1.75,
  paddingLeft: 22,
  marginBottom: 12,
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="May 22, 2026">

      <div
        style={{
          borderRadius: 14,
          padding: "16px 18px",
          background: "var(--color-primary-tint)",
          border: "1px solid var(--color-border)",
          marginBottom: 44,
        }}
      >
        <p style={{ ...p, marginBottom: 0, fontWeight: 600 }}>
          FocusRoute is not a medical provider, healthcare organisation, or clinical service. The
          information we collect is used to deliver a self-understanding and productivity support
          product — not to diagnose, treat, or provide medical advice.
        </p>
      </div>

      <section style={section}>
        <h2 style={h2}>1. Information We Collect</h2>

        <p style={{ ...p, fontWeight: 700, color: "var(--color-text)" }}>
          Quiz answers and focus-pattern data
        </p>
        <p style={p}>
          When you complete the FocusRoute assessment, we collect your self-reported answers about
          focus patterns, attention, energy, executive function, and related experiences. These
          answers are used to generate your Brain Profile, Cognitive Signature™, and Executive Function
          Radar™. This data is sensitive by nature — we treat it with care, store it securely, and
          do not use it for advertising profiling or sell it to third parties.
        </p>

        <p style={{ ...p, fontWeight: 700, color: "var(--color-text)" }}>
          Account and login data
        </p>
        <p style={p}>
          If you create an account, we collect your email address and optional display name.
          Authentication is handled by Supabase, which manages session tokens and login state.
          We do not store passwords in plain text. Account data is linked to your quiz results
          and purchased entitlements so your Brain Profile and library are accessible when you
          sign in.
        </p>

        <p style={{ ...p, fontWeight: 700, color: "var(--color-text)" }}>
          Payment data handled by Stripe
        </p>
        <p style={p}>
          All payments are processed by Stripe. FocusRoute never sees, receives, or stores your
          full card number, CVV, or bank account details. We receive a payment confirmation event
          from Stripe (via webhook) that includes your email address, the amount paid, and the
          product purchased. Stripe&apos;s own Privacy Policy governs how they handle your payment
          data and is available at stripe.com/privacy.
        </p>

        <p style={{ ...p, fontWeight: 700, color: "var(--color-text)" }}>
          Automatic usage data
        </p>
        <p style={p}>
          We may collect basic, anonymised usage information such as page visits and feature
          interactions to understand how the product is being used. We also use analytics and
          advertising measurement tools to understand campaign performance and improve marketing.
          This may include page views, button clicks, referrer, campaign parameters, browser or
          device data, anonymised session identifiers, and payment conversion events.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>2. How We Use Your Information</h2>
        <p style={p}>We use the information we collect to:</p>
        <ul style={ul}>
          <li>Generate and display your Brain Profile, protocol, and bonus library</li>
          <li>Deliver the content you have purchased and manage your account entitlements</li>
          <li>Send transactional emails (purchase confirmation, login links)</li>
          <li>Improve the product using aggregated, anonymised usage patterns</li>
          <li>Respond to support requests and account inquiries</li>
        </ul>
        <p style={p}>
          We do not sell your personal data. We do not share raw assessment answers, OTP codes, or
          payment card details with advertising platforms. We may share limited conversion events
          with advertising platforms for measurement, retargeting, and campaign optimisation.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>3. How We Store and Protect Data</h2>
        <p style={p}>
          Your account data and quiz results are stored in a Supabase-managed PostgreSQL database
          with row-level security enabled, meaning your data is scoped to your account. All data
          is transmitted over HTTPS. Access to production data is restricted to authorised team
          members only.
        </p>
        <p style={p}>
          FocusRoute is not a healthcare provider and is not covered by HIPAA or equivalent medical
          privacy regulations. We are not able to guarantee any specific level of healthcare-grade
          data protection. If you have serious concerns about the sensitivity of your information,
          please consider that before submitting it.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>4. Third-Party Services</h2>
        <ul style={ul}>
          <li>
            <strong>Stripe</strong> — processes all payments. Stripe&apos;s privacy policy applies to
            payment data: stripe.com/privacy
          </li>
          <li>
            <strong>Supabase</strong> — provides database, authentication, and row-level data
            security. Supabase&apos;s privacy policy applies: supabase.com/privacy
          </li>
          <li>
            <strong>Vercel</strong> — hosts the FocusRoute application. Basic server logs may be
            retained per Vercel&apos;s standard practices: vercel.com/legal/privacy-policy
          </li>
          <li>
            <strong>Analytics and advertising measurement</strong> — Vercel Analytics and Speed
            Insights help us understand site usage and performance. Meta Pixel and Meta
            Conversions API may receive limited page, click, and conversion events for advertising
            measurement and optimisation. We do not send raw assessment answers, OTP codes, or
            payment card details to these tools.
          </li>
        </ul>
        <p style={p}>
          All third-party providers are selected for their data security standards. We do not use
          providers that sell your data for advertising.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>5. Cookies and Local Storage</h2>
        <p style={p}>
          FocusRoute uses the following limited browser storage:
        </p>
        <ul style={ul}>
          <li>
            <strong>Authentication cookies</strong> — Supabase sets session cookies to keep you
            logged in. These are necessary for the dashboard to function.
          </li>
          <li>
            <strong>Session storage</strong> — used to recover an in-progress quiz if your browser
            session ends unexpectedly. This data is cleared when the tab is closed.
          </li>
          <li>
            <strong>Analytics identifiers</strong> — used to understand anonymous sessions,
            campaign attribution, and whether marketing traffic converts. These identifiers do not
            prove account access or purchase status.
          </li>
        </ul>
        <p style={p}>
          Paid access and entitlements are verified server-side — not from browser storage.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>6. Data Retention</h2>
        <p style={p}>
          We retain your account data and quiz results for as long as your account is active or as
          needed to provide the services you have purchased. If you request account deletion, we
          will remove your personal data within 30 days, except where retention is required by law
          (for example, payment records for tax purposes).
        </p>
        <p style={p}>
          Aggregated, anonymised data (with no individual identifiers) may be retained indefinitely
          for product improvement purposes.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>7. Your Rights and Deletion Requests</h2>
        <p style={p}>Depending on your location, you may have the right to:</p>
        <ul style={ul}>
          <li>Access a copy of the personal data we hold about you</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your account and personal data</li>
          <li>Withdraw consent for email communications (unsubscribe link in any email we send)</li>
          <li>Object to or restrict certain processing of your data</li>
        </ul>
        <p style={p}>
          To exercise any of these rights, email{" "}
          <a
            href="mailto:privacy@getfocusroute.com"
            style={{ color: "var(--color-primary)", fontWeight: 600 }}
          >
            privacy@getfocusroute.com
          </a>
          . We will respond within 30 days.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>8. Children&apos;s Privacy</h2>
        <p style={p}>
          FocusRoute is not intended for use by anyone under the age of 13. We do not knowingly
          collect personal information from children under 13. If we become aware that a child
          under 13 has provided us with personal data, we will delete it promptly. If you believe
          a child has submitted data to our service, please contact us at privacy@getfocusroute.com.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>9. Changes to This Policy</h2>
        <p style={p}>
          We may update this Privacy Policy from time to time. When we do, we will update the
          &ldquo;Last updated&rdquo; date at the top of this page. Continued use of FocusRoute after changes
          are posted constitutes acceptance of the revised policy. For significant changes, we may
          send a notice to the email address on your account.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>10. Contact</h2>
        <p style={p}>
          For privacy-related questions, data access requests, or deletion requests, contact us at:{" "}
          <a
            href="mailto:privacy@getfocusroute.com"
            style={{ color: "var(--color-primary)", fontWeight: 600 }}
          >
            privacy@getfocusroute.com
          </a>
        </p>
        <p style={p}>
          FocusRoute is operated as an independent product. We take your privacy seriously and are
          committed to handling your information with care and transparency.
        </p>
      </section>

    </LegalLayout>
  );
}
