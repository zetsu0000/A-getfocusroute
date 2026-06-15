import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const src = readFileSync(
  fileURLToPath(new URL("../UpsellScreen.tsx", import.meta.url)),
  "utf8",
);
const checkoutHelperSrc = readFileSync(
  fileURLToPath(new URL("../../paywall/paywallCheckout.ts", import.meta.url)),
  "utf8",
);

function sliceFrom(startNeedle: string, endNeedle: string, haystack = src): string {
  const start = haystack.indexOf(startNeedle);
  expect(start).toBeGreaterThan(-1);
  const end = haystack.indexOf(endNeedle, start);
  expect(end).toBeGreaterThan(start);
  return haystack.slice(start, end);
}

const checkoutForm = sliceFrom(
  "function UpsellCheckoutForm",
  "function UpsellDeclineButton",
);
const declineHandler = sliceFrom("const handleDecline", "return (");
const mainScreen = src.slice(src.indexOf("export function UpsellScreen"));
const requestCheckoutIntent = sliceFrom(
  "const requestCheckoutIntent = async () =>",
  "const handleCheckoutCtaClick",
  mainScreen,
);
const checkoutCtaClick = sliceFrom(
  "const handleCheckoutCtaClick",
  "const handleCheckoutRetry",
  mainScreen,
);
const viewEffect = sliceFrom(
  "trackEvent(FIRST_PARTY_EVENTS.upsellViewed",
  "}, []);",
  mainScreen,
);
const initialOfferBranch = sliceFrom(
  "{!checkoutRequested ? (",
  ") : loadingSecret ? (",
  mainScreen,
);

describe("UpsellScreen deferred checkout structure", () => {
  it("does not create a PaymentIntent on initial upsell render", () => {
    const paymentFetchHits =
      (src.match(/fetch\("\/api\/create-payment-intent"/g) || []).length;

    expect(paymentFetchHits).toBe(1);
    expect(viewEffect).toContain("FIRST_PARTY_EVENTS.upsellViewed");
    expect(viewEffect).toContain("FIRST_PARTY_EVENTS.paywallViewed");
    expect(viewEffect).not.toContain("/api/create-payment-intent");
    expect(src).toContain("const [loadingSecret, setLoadingSecret] = useState(false)");
    expect(src).toContain("const [checkoutRequested, setCheckoutRequested] = useState(false)");
  });

  it("does not load Stripe.js or mount the Payment Element on initial render", () => {
    expect(initialOfferBranch).toContain("Continue to Secure Checkout");
    expect(initialOfferBranch).toContain("<UpsellDeclineButton");
    expect(initialOfferBranch).not.toContain("<UpsellStripeElements");
    expect(initialOfferBranch).not.toContain("<PaymentElement");
    expect(initialOfferBranch).not.toContain("getStripePromise()");
    expect(src).toContain("clientSecret ? (");
    expect(src).toContain("<UpsellStripeElements");
  });

  it("keeps the skip path free of PaymentIntent creation and advances normally", () => {
    expect(declineHandler).toContain("FIRST_PARTY_EVENTS.upsellSkipped");
    expect(declineHandler).toContain('setStep("subscription")');
    expect(declineHandler).not.toContain("/api/create-payment-intent");
    expect(declineHandler).not.toContain("getStripePromise");
  });

  it("creates checkout only from the explicit checkout CTA", () => {
    expect(checkoutCtaClick).toContain("FIRST_PARTY_EVENTS.checkoutCtaClicked");
    expect(checkoutCtaClick).toContain('product_key: "roadmap_28_day"');
    expect(checkoutCtaClick).toContain('cta_location: "upsell_offer"');
    expect(checkoutCtaClick).toContain("void requestCheckoutIntent()");
    expect(checkoutCtaClick).not.toContain("checkoutIntent");
    expect(checkoutCtaClick).not.toContain("email");
    expect(checkoutCtaClick).not.toContain("user_name");
    expect(requestCheckoutIntent).toContain('fetch("/api/create-payment-intent"');
    expect(requestCheckoutIntent).toContain('funnel_step: "upsell"');
  });

  it("prevents duplicate in-flight requests and rerender duplicates", () => {
    expect(requestCheckoutIntent).toContain("canStartCheckoutRequest");
    expect(requestCheckoutIntent).toContain("clientSecret,");
    expect(requestCheckoutIntent).toContain("loading: loadingSecret || checkoutRequestInFlightRef.current");
    expect(requestCheckoutIntent).toContain("retryBlockedUntil,");
    expect(requestCheckoutIntent).toContain("checkoutRequestInFlightRef.current = true");
    expect(requestCheckoutIntent).toContain("checkoutRequestInFlightRef.current = false");
    expect(checkoutHelperSrc).toContain("if (clientSecret) return false");
  });

  it("mounts the existing checkout only after a valid clientSecret is returned", () => {
    expect(requestCheckoutIntent).toContain("hasCheckoutClientSecret(data)");
    expect(requestCheckoutIntent).toContain("setClientSecret(data.clientSecret)");
    expect(mainScreen).toContain("clientSecret ? (");
    expect(mainScreen).toContain("<UpsellStripeElements");
    expect(src).toContain("<UpsellCheckoutForm onSuccess={onSuccess} onDecline={onDecline} />");
  });

  it("reuses an existing clientSecret instead of creating another PaymentIntent", () => {
    expect(requestCheckoutIntent).toContain("clientSecret,");
    expect(checkoutHelperSrc).toContain("if (clientSecret) return false");
    expect(src).toContain("<Elements key={clientSecret}");
  });

  it("handles checkout-load errors with the shared safe messages", () => {
    expect(requestCheckoutIntent).toContain("checkoutLoadErrorForStatus");
    expect(requestCheckoutIntent).toContain('response.headers.get("Retry-After")');
    expect(requestCheckoutIntent).toContain("checkoutLoadErrorForStatus(500, null)");
    expect(mainScreen).toContain('role="alert"');
    expect(mainScreen).toContain('aria-live="polite"');
    expect(src).not.toContain("Please refresh");
    expect(src).not.toContain("Upstash");
    expect(src).not.toContain("Redis");
  });

  it("keeps retry explicit and blocked until Retry-After expires", () => {
    expect(src).toContain(
      "const retryBlocked = retryBlockedUntil !== null && retryBlockedUntil > retryClock",
    );
    expect(requestCheckoutIntent).toContain("error.retryAfterSeconds");
    expect(requestCheckoutIntent).toContain("setRetryBlockedUntil(blockedUntil)");
    expect(src).toContain("disabled={loadingSecret || retryBlocked}");
    expect(src).toContain("{!retryBlocked && (");
    expect(src).toContain("onClick={handleCheckoutRetry}");
    expect(src).not.toContain("setTimeout(() => requestCheckoutIntent");
  });

  it("preserves payment confirmation and return URL behavior", () => {
    expect(checkoutForm).toContain("elements.submit()");
    expect(checkoutForm).toContain("stripe.confirmPayment");
    expect(checkoutForm).toContain('/assessment?step=subscription');
    expect(checkoutForm).toContain('redirect: "if_required"');
    expect(checkoutForm).toContain("onSuccess()");
    expect(checkoutForm).toContain("BRAIN_OS.price.upsell");
  });

  it("keeps analytics meanings distinct", () => {
    expect(viewEffect).toContain("FIRST_PARTY_EVENTS.upsellViewed");
    expect(viewEffect).toContain("FIRST_PARTY_EVENTS.paywallViewed");
    expect(viewEffect).not.toContain("FIRST_PARTY_EVENTS.checkoutCtaClicked");
    expect(viewEffect).not.toContain("FIRST_PARTY_EVENTS.checkoutIntent");

    expect(checkoutCtaClick).toContain("FIRST_PARTY_EVENTS.checkoutCtaClicked");
    expect(checkoutCtaClick).not.toContain("FIRST_PARTY_EVENTS.checkoutIntent");

    expect(checkoutForm).toContain("FIRST_PARTY_EVENTS.checkoutIntent");
    expect(checkoutForm).toContain("FIRST_PARTY_EVENTS.paymentElementLoaded");
    expect(checkoutForm).toContain("FIRST_PARTY_EVENTS.paymentError");
    expect(declineHandler).toContain("FIRST_PARTY_EVENTS.upsellSkipped");
  });
});
