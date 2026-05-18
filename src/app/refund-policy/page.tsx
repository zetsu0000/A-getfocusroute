import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Refund Policy · FocusRoute",
  description:
    "FocusRoute offers a 7-day satisfaction guarantee on Brain Profile purchases. Learn how refunds work.",
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

export default function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund Policy" lastUpdated="May 17, 2026">

      {/* Guarantee callout */}
      <div style={{ borderRadius: 14, padding: "20px 22px", background: "linear-gradient(135deg, var(--color-primary-tint), var(--color-cognitive-tint))", border: "1px solid var(--color-border)", marginBottom: 44 }}>
        <p style={{ fontSize: 16, fontWeight: 900, color: "var(--color-text)", marginBottom: 8, letterSpacing: "-0.01em" }}>
          The &ldquo;This Is Me&rdquo; 7-Day Guarantee
        </p>
        <p style={{ ...p, marginBottom: 0 }}>
          Read your Brain Profile. If it does not feel like a clear, useful explanation of how your
          focus patterns work, email us within 7 days of purchase and we will refund you in full.
          No forms. No interrogation. Just include your purchase email and we will take care of it.
        </p>
      </div>

      <section style={section}>
        <h2 style={h2}>1. Brain Profile — 7-Day Guarantee</h2>
        <p style={p}>
          The Brain Profile one-time purchase is covered by a full 7-day money-back guarantee from
          the date of purchase. If the profile does not feel like an accurate or useful description
          of your focus patterns, you qualify for a refund — no explanation required.
        </p>
        <p style={p}>To request a refund:</p>
        <ul style={ul}>
          <li>Email <a href="mailto:support@getfocusroute.com" style={{ color: "var(--color-primary)", fontWeight: 600 }}>support@getfocusroute.com</a> within 7 days of your purchase</li>
          <li>Include the email address used at checkout so we can locate your order</li>
          <li>You do not need to give a reason, though feedback is always welcome</li>
        </ul>
        <p style={p}>
          Refunds are processed through Stripe and returned to the original payment method. This
          typically takes 5–10 business days depending on your bank or card issuer.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>2. Roadmap and Bonus Purchases</h2>
        <p style={p}>
          The 28-Day Protocol and bonus library purchase is also covered by the 7-day window,
          provided you have not substantially used or downloaded the content. If you have worked
          through a significant portion of the protocol or downloaded the bonus templates, a refund
          may not be available — but we will always try to find a fair resolution.
        </p>
        <p style={p}>
          If local consumer law in your jurisdiction provides stronger protections, those rights
          apply regardless of this policy.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>3. Membership Subscriptions</h2>
        <p style={p}>
          The first charge of a new membership subscription is covered by the 7-day guarantee.
          After that initial period, subscription renewal charges are generally non-refundable —
          we charge in advance for the full billing period and cannot recover time already provided.
        </p>
        <p style={p}>
          If a renewal charge was unexpected or made in error, contact us within 48 hours and we
          will investigate and resolve it.
        </p>
        <p style={p}>
          You can cancel future subscription renewals at any time. Once cancelled, you retain
          access until the end of the current paid period and will not be charged again.
          Cancellation through a billing portal will be available when that feature is ready —
          in the meantime, email us and we will cancel promptly.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>4. How Refunds Are Processed</h2>
        <p style={p}>
          All refunds are handled through Stripe and returned to the original payment method used
          at checkout. We do not issue refunds via gift card, store credit, or alternative methods
          unless the original method is no longer valid.
        </p>
        <p style={p}>
          Once a refund is issued, access to the refunded product is removed from your account.
          Your account remains open and you are welcome to repurchase at any time.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>5. When Refunds Are Not Available</h2>
        <p style={p}>We are unable to offer refunds for:</p>
        <ul style={ul}>
          <li>Requests made more than 7 days after the original purchase date</li>
          <li>Subscription renewals beyond the initial charge (except errors or as required by law)</li>
          <li>Accounts found to be in violation of our <a href="/terms" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Terms of Service</a></li>
        </ul>
        <p style={p}>
          If your situation is not covered above and you feel a refund is fair, please reach out —
          we will do our best to work with you.
        </p>
      </section>

      <section style={section}>
        <h2 style={h2}>6. Contact</h2>
        <p style={p}>
          For refund requests or billing questions, email{" "}
          <a href="mailto:support@getfocusroute.com" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            support@getfocusroute.com
          </a>{" "}
          with your purchase email address. We aim to respond within one business day.
        </p>
      </section>

    </LegalLayout>
  );
}
