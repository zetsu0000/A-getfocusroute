import type { Metadata } from "next";
import { BRAIN_OS } from "@/lib/positioning";

export const metadata: Metadata = {
  title: "Privacy Policy · FocusRoute Brain OS",
  description: "Learn how FocusRoute handles Brain OS profile data, payment data, and privacy requests.",
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 48 }}>
          Last updated: May 2026
        </p>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>
            Data We Collect
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.7 }}>
            FocusRoute collects only the information required to deliver {BRAIN_OS.lineTm}. This includes your
            response data, profile outputs, and (if you purchase) the contact details needed to deliver access.
            We do not require government ID or unrelated personal documents.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>
            How We Use It
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.7 }}>
            Your responses are used to generate your profile and protocol outputs. We may use anonymized aggregate
            patterns to improve model quality and user experience. We do not sell individual personal data for ad targeting.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>
            Stripe &amp; Third Parties
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.7 }}>
            Payments for paid Brain OS products are processed securely by Stripe. FocusRoute never sees or stores
            your full credit card number. Stripe's privacy policy governs all payment data and is available at
            stripe.com/privacy. We use Vercel for hosting and may use analytics tools that process anonymized
            usage data. All third-party providers are bound by data processing agreements.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>
            Data Retention
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.7 }}>
            Session data stored in your browser (via localStorage/sessionStorage) remains client-side unless needed
            for paid fulfillment workflows. Contact and transaction-related records are retained only as long as
            operationally necessary, legal requirements permitting. Aggregate anonymized metrics may be retained
            for product improvement.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>
            Your Rights
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.7 }}>
            You have the right to access, correct, or delete any personal data we hold about you. You may also
            withdraw consent for email communications at any time by clicking the unsubscribe link in any message
            we send. To exercise any of these rights, contact us at the address below. We will respond to all
            requests within 30 days.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>
            Contact
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.7 }}>
            For privacy-related questions or data requests, please email{" "}
            <a href="mailto:privacy@getfocusroute.com" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
              privacy@getfocusroute.com
            </a>
            . FocusRoute is operated independently and takes your privacy seriously. We are committed to handling
            your information with care and transparency.
          </p>
        </section>

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
