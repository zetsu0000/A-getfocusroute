import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/*
 * Source-level guards for the copy-compression pass. The funnel components are
 * client-only and the project has no DOM test environment, so these assert the
 * structural invariants directly against the component source instead.
 */
const src = readFileSync(
  fileURLToPath(new URL("../PaywallScreen.tsx", import.meta.url)),
  "utf8",
);

describe("PaywallScreen structure (copy compression)", () => {
  it("keeps the checkout section id and the top-CTA scroll target", () => {
    expect(src).toContain("id={PAYWALL_CHECKOUT_ID}");
    expect(src).toContain("scrollToCheckout()");
  });

  it("preserves every funnel-stage analytics event (no renames)", () => {
    for (const ev of [
      "FIRST_PARTY_EVENTS.paywallViewed",
      "FIRST_PARTY_EVENTS.checkoutSectionReached",
      "FIRST_PARTY_EVENTS.checkoutCtaClicked",
      "FIRST_PARTY_EVENTS.checkoutIntent",
      "FIRST_PARTY_EVENTS.paymentElementLoaded",
      "FIRST_PARTY_EVENTS.paymentError",
    ]) {
      expect(src).toContain(ev);
    }
  });

  it("presents the anchored price exactly once (no duplicate offer block)", () => {
    const anchorHits = (src.match(/price\.paywallAnchor/g) || []).length;
    expect(anchorHits).toBe(1);
    const priceHits = (src.match(/BRAIN_OS\.price\.paywall\b/g) || []).length;
    expect(priceHits).toBe(1);
  });

  it("keeps the pre-checkout scroll CTA price-free", () => {
    const start = src.indexOf('cta_location: "paywall_offer_top"');
    const end = src.indexOf("</button>", start);
    const topCta = src.slice(start, end);

    expect(topCta).toContain("Unlock My Full Plan");
    expect(topCta).toContain("scrollToCheckout()");
    expect(topCta).not.toContain("price.paywall");
  });

  it("removed the duplicated 'Your full plan' section and its rationale", () => {
    expect(src).not.toContain("What's in your full plan");
    expect(src).not.toContain("instead of"); // the "Why $27 instead of $97" copy
    expect(src).not.toContain("revealsFor");
  });

  it("removed the separate 'After you pay' card", () => {
    expect(src).not.toContain("After you pay");
  });

  it("drops unverified security claims, keeps one Stripe signal", () => {
    expect(src).not.toContain("256-bit");
    expect(src).not.toContain("encrypted payment");
    expect(src).toContain("SECURE_PAYMENT_LINE");
  });

  it("renders the shared deliverables exactly once", () => {
    const hits = (src.match(/paywallDeliverables\(/g) || []).length;
    expect(hits).toBe(1);
  });

  it("keeps checkout immediately after the offer", () => {
    const offerEnd = src.indexOf("</m.div>", src.indexOf("Primary offer"));
    const checkoutStart = src.indexOf("id={PAYWALL_CHECKOUT_ID}", offerEnd);
    const between = src.slice(offerEnd, checkoutStart);

    expect(checkoutStart).toBeGreaterThan(offerEnd);
    expect(between).not.toContain("PaywallSocialProofDisclosure");
    expect(between).not.toContain("ArtifactPreview");
    expect(between).not.toContain("PAYWALL_FAQ");
  });

  it("places social proof after checkout and post-payment expectation", () => {
    expect(src).toContain("PaywallSocialProofDisclosure");
    const checkout = src.indexOf("id={PAYWALL_CHECKOUT_ID}");
    const expectation = src.indexOf("POST_PAYMENT_EXPECTATION", checkout);
    const proof = src.indexOf("<PaywallSocialProofDisclosure", expectation);

    expect(checkout).toBeGreaterThan(-1);
    expect(expectation).toBeGreaterThan(checkout);
    expect(proof).toBeGreaterThan(expectation);
  });

  it("removes paywall FAQ, paywall artifact preview, and fabricated proof", () => {
    expect(src).not.toContain("PAYWALL_FAQ");
    expect(src).not.toContain("v2-faq");
    expect(src).not.toContain("ArtifactPreview");
    expect(src).not.toContain("Your full pattern map");
    expect(src.toLowerCase()).not.toContain("verified customer");
    expect(src).not.toContain("Sarah");
  });

  it("leaves payment creation + confirmation logic intact", () => {
    expect(src).toContain("/api/create-payment-intent");
    expect(src).toContain("stripe.confirmPayment");
    expect(src).toContain('setStep("upsell")');
  });
});
