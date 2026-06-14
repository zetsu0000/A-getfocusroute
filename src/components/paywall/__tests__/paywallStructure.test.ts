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
const socialProofSrc = readFileSync(
  fileURLToPath(new URL("../../signature/SocialProof.tsx", import.meta.url)),
  "utf8",
);
const rateLimitPolicySrc = readFileSync(
  fileURLToPath(new URL("../../../lib/rate-limit/policies.ts", import.meta.url)),
  "utf8",
);
const paymentRouteSrc = readFileSync(
  fileURLToPath(new URL("../../../app/api/create-payment-intent/route.ts", import.meta.url)),
  "utf8",
);

describe("PaywallScreen structure (copy compression)", () => {
  it("keeps the checkout section id and the top-CTA scroll target", () => {
    expect(src).toContain("id={PAYWALL_CHECKOUT_ID}");
    expect(src).toContain("id={PAYWALL_TRUST_CHECKOUT_ID}");
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

    const offerStart = src.indexOf("Primary offer");
    const offerEnd = src.indexOf("onClick={handleCheckoutCtaClick}", offerStart);
    const offerCopy = src.slice(offerStart, offerEnd);
    const offerPriceHits = (offerCopy.match(/BRAIN_OS\.price\.paywall\b/g) || []).length;
    expect(offerPriceHits).toBe(1);
  });

  it("uses distinct top and final CTA copy, with the top CTA price-free", () => {
    const start = src.indexOf("onClick={handleCheckoutCtaClick}");
    const end = src.indexOf("</m.button>", start);
    const topCta = src.slice(start, end);
    const checkoutForm = src.slice(
      src.indexOf("function CheckoutForm"),
      src.indexOf("function PaywallStripeElements"),
    );

    expect(topCta).toContain("Continue to Secure Checkout");
    expect(topCta).not.toContain("BRAIN_OS.price.paywall");
    expect(topCta).not.toContain("confirmPayment");
    // Final CTA copy is now a single centralized string so the spacing around
    // the price can't break. The old two-fragment "&amp;" form is gone.
    expect(checkoutForm).toContain("{payCtaLabel(BRAIN_OS.price.paywall)}");
    expect(checkoutForm).not.toContain("&amp; Unlock My Plan");
    expect(checkoutForm).toContain("elements.submit()");
    expect(checkoutForm).toContain("stripe.confirmPayment");
    expect(checkoutForm).toContain('/assessment?step=upsell');
  });

  it("resets the page to the top on mount only (instant, not smooth)", () => {
    // The reset lives in its own effect: it begins at the rAF call and ends at
    // the empty-deps marker. Scoping the assertions to that slice proves it is
    // mount-only (empty deps, so it never reruns when Stripe loads or social
    // proof expands) and instant (no smooth behavior fighting the top CTA).
    const effectStart = src.indexOf("window.requestAnimationFrame");
    const depsEnd = src.indexOf("}, []);", effectStart);
    expect(effectStart).toBeGreaterThan(-1);
    expect(depsEnd).toBeGreaterThan(effectStart);

    const resetEffect = src.slice(effectStart, depsEnd);
    expect(resetEffect).toContain("window.scrollTo(0, 0)");
    expect(resetEffect).toContain("window.cancelAnimationFrame(frame)");
    expect(resetEffect).not.toContain("behavior:");
    expect(resetEffect).not.toContain("checkoutRequested");
    expect(resetEffect).not.toContain("clientSecret");

    // The top CTA keeps its own smooth scroll-to-checkout, untouched.
    expect(src).toContain('scrollIntoView({ behavior: "smooth"');
  });

  it("removes the blue/purple CTA: both buttons are gold and the final is the strongest", () => {
    // The PR#33 regression used the bare blue/purple `.v2-cta` on the top
    // button. No standalone blue CTA may remain; the only `.v2-cta` usage is
    // the gold pairing on the final payment button.
    expect(src).not.toContain('className="v2-cta"');
    expect(src).not.toContain('"v2-cta"');
    expect(src).not.toContain("v2-cta-blue");

    const topCta = src.slice(
      src.indexOf("onClick={handleCheckoutCtaClick}"),
      src.indexOf("</m.button>", src.indexOf("onClick={handleCheckoutCtaClick}")),
    );
    // top CTA wears the restrained Fable gold treatment (no signal/blue glow)
    expect(topCta).toContain("var(--v2-gold-bright)");
    expect(topCta).toContain("217,188,127");
    expect(topCta).not.toContain("v2-signal");
    expect(topCta).not.toContain("124,138,255");

    // final payment CTA keeps the full gold fill and stays the strongest action
    const checkoutForm = src.slice(
      src.indexOf("function CheckoutForm"),
      src.indexOf("function PaywallStripeElements"),
    );
    expect(checkoutForm).toContain("v2-cta v2-cta-gold");
    expect(checkoutForm).toContain("fontWeight: 800");
  });

  it("states trust as one quiet line, not three icon chips", () => {
    expect(src).toContain("{TRUST_LINE}");
    expect(src).not.toContain("TRUST_LINE_ITEMS");
    // the old three-badge map is gone
    expect(src).not.toContain("TRUST_LINE_ITEMS.map");
    expect(src).not.toContain("BadgeCheck");
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

  it("keeps social proof before the requested checkout panel", () => {
    const offerEnd = src.indexOf("</m.div>", src.indexOf("Primary offer"));
    const trustTarget = src.indexOf("id={PAYWALL_TRUST_CHECKOUT_ID}", offerEnd);
    const proof = src.indexOf("<PaywallSocialProofDisclosure", trustTarget);
    const checkoutStart = src.indexOf("id={PAYWALL_CHECKOUT_ID}", proof);
    const between = src.slice(offerEnd, checkoutStart);

    expect(trustTarget).toBeGreaterThan(offerEnd);
    expect(proof).toBeGreaterThan(trustTarget);
    expect(checkoutStart).toBeGreaterThan(offerEnd);
    expect(proof).toBeLessThan(checkoutStart);
    expect(between).not.toContain("ArtifactPreview");
    expect(between).not.toContain("PAYWALL_FAQ");
  });

  it("defers PaymentIntent creation until explicit checkout intent", () => {
    const paymentFetchHits = (src.match(/fetch\("\/api\/create-payment-intent"/g) || []).length;

    expect(paymentFetchHits).toBe(1);
    expect(src).toContain("const requestCheckoutIntent = async () =>");
    expect(src).toContain("void requestCheckoutIntent();");
    expect(src).toContain("onClick={handleCheckoutCtaClick}");
    expect(src).toContain("checkoutRequestInFlightRef");
    expect(src).toContain("hasCheckoutClientSecret");
    expect(src).toContain("disabled={loadingSecret || retryBlocked}");
    expect(src).not.toContain(".finally(() => setLoadingSecret(false))");
    expect(socialProofSrc).not.toContain("/api/create-payment-intent");
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

  it("handles checkout-load errors without refresh guidance or raw server details", () => {
    expect(src).toContain('response.headers.get("Retry-After")');
    expect(src).toContain('role="alert"');
    expect(src).toContain('aria-live="polite"');
    expect(src).toContain("checkoutLoadErrorForStatus");
    expect(src).not.toContain("Please refresh");
    expect(src).not.toContain("rate_limited");
    expect(src).not.toContain("Upstash");
    expect(src).not.toContain("Redis");
  });

  it("forces Stripe Elements copy to English without overriding country detection", () => {
    expect(src).toContain('locale: "en"');
    expect(src).not.toContain("defaultCountry");
  });

  it("leaves rate-limit policy and payment endpoint security in place", () => {
    expect(rateLimitPolicySrc).toContain("createPaymentIntent");
    expect(rateLimitPolicySrc).toContain('name: "email_product"');
    expect(rateLimitPolicySrc).toContain("limit: 4");
    expect(paymentRouteSrc).toContain('enforceRateLimit("createPaymentIntent"');
    expect(paymentRouteSrc).toContain("getStripeClient()");
    expect(paymentRouteSrc).toContain("paymentIntents.create");
  });
});
