import { describe, expect, it } from "vitest";

import {
  FIRST_PARTY_EVENTS,
  META_ALLOWED_FIRST_PARTY_EVENTS,
  META_EVENT_BY_FIRST_PARTY,
  isAllowedFirstPartyEvent,
} from "../events";

describe("first-party funnel event registry", () => {
  it("allows the Lead regression event", () => {
    expect(isAllowedFirstPartyEvent(FIRST_PARTY_EVENTS.emailSubmitted)).toBe(true);
    expect(META_ALLOWED_FIRST_PARTY_EVENTS.has(FIRST_PARTY_EVENTS.emailSubmitted)).toBe(true);
    expect(META_EVENT_BY_FIRST_PARTY[FIRST_PARTY_EVENTS.emailSubmitted]).toBe("Lead");
  });

  it("maps checkout intent to InitiateCheckout", () => {
    expect(isAllowedFirstPartyEvent(FIRST_PARTY_EVENTS.checkoutIntent)).toBe(true);
    expect(META_ALLOWED_FIRST_PARTY_EVENTS.has(FIRST_PARTY_EVENTS.checkoutIntent)).toBe(true);
    expect(META_EVENT_BY_FIRST_PARTY[FIRST_PARTY_EVENTS.checkoutIntent]).toBe("InitiateCheckout");
  });

  it("does not use payment intent creation as Meta checkout intent", () => {
    expect(isAllowedFirstPartyEvent(FIRST_PARTY_EVENTS.paymentIntentCreated)).toBe(true);
    expect(META_ALLOWED_FIRST_PARTY_EVENTS.has(FIRST_PARTY_EVENTS.paymentIntentCreated)).toBe(false);
    expect(META_EVENT_BY_FIRST_PARTY[FIRST_PARTY_EVENTS.paymentIntentCreated]).toBeUndefined();
  });

  it("registers the funnel-depth events as first-party only (never Meta)", () => {
    const depthEvents = [
      FIRST_PARTY_EVENTS.questionViewed,
      FIRST_PARTY_EVENTS.infoCardViewed,
      FIRST_PARTY_EVENTS.resultUnlockClicked,
      FIRST_PARTY_EVENTS.upsellSkipped,
      FIRST_PARTY_EVENTS.subscriptionSkipped,
      FIRST_PARTY_EVENTS.successViewed,
      // analytics-depth pass
      FIRST_PARTY_EVENTS.questionAnswered,
      FIRST_PARTY_EVENTS.resultLoadingViewed,
      FIRST_PARTY_EVENTS.resultLoadingCompleted,
      FIRST_PARTY_EVENTS.emailFieldFocused,
      FIRST_PARTY_EVENTS.fullResultViewed,
      FIRST_PARTY_EVENTS.checkoutSectionReached,
      FIRST_PARTY_EVENTS.checkoutCtaClicked,
      FIRST_PARTY_EVENTS.upsellViewed,
      FIRST_PARTY_EVENTS.subscriptionViewed,
      FIRST_PARTY_EVENTS.planSelected,
      FIRST_PARTY_EVENTS.secureCheckoutRevealed,
      FIRST_PARTY_EVENTS.paymentAttempted,
      FIRST_PARTY_EVENTS.dashboardFirstActionClicked,
      FIRST_PARTY_EVENTS.socialProofImpression,
      FIRST_PARTY_EVENTS.socialProofExpanded,
    ] as const;
    for (const eventName of depthEvents) {
      expect(isAllowedFirstPartyEvent(eventName)).toBe(true);
      expect(META_ALLOWED_FIRST_PARTY_EVENTS.has(eventName)).toBe(false);
      expect(META_EVENT_BY_FIRST_PARTY[eventName]).toBeUndefined();
    }
  });

  it("keeps checkout funnel stages distinguishable by name", () => {
    // Reaching the payment section, the payment intent existing, and the
    // Payment Element rendering are three different facts — none may alias.
    const distinct = new Set([
      FIRST_PARTY_EVENTS.paywallViewed,
      FIRST_PARTY_EVENTS.checkoutSectionReached,
      FIRST_PARTY_EVENTS.checkoutCtaClicked,
      FIRST_PARTY_EVENTS.paymentIntentCreated,
      FIRST_PARTY_EVENTS.paymentElementLoaded,
      FIRST_PARTY_EVENTS.checkoutIntent,
    ]);
    expect(distinct.size).toBe(6);
    // Only the explicit buyer action maps to Meta InitiateCheckout.
    expect(META_EVENT_BY_FIRST_PARTY[FIRST_PARTY_EVENTS.checkoutSectionReached]).toBeUndefined();
    expect(META_EVENT_BY_FIRST_PARTY[FIRST_PARTY_EVENTS.checkoutCtaClicked]).toBeUndefined();
    expect(META_EVENT_BY_FIRST_PARTY[FIRST_PARTY_EVENTS.checkoutIntent]).toBe("InitiateCheckout");
  });

  it("keeps the social-proof impression a distinct, first-party-only fact", () => {
    // Seeing real proof must not alias the result view, the paywall view, or
    // the CTA click — and, being diagnostic, it never reaches Meta.
    const distinct = new Set([
      FIRST_PARTY_EVENTS.fullResultViewed,
      FIRST_PARTY_EVENTS.paywallViewed,
      FIRST_PARTY_EVENTS.checkoutCtaClicked,
      FIRST_PARTY_EVENTS.socialProofImpression,
    ]);
    expect(distinct.size).toBe(4);
    expect(isAllowedFirstPartyEvent(FIRST_PARTY_EVENTS.socialProofImpression)).toBe(true);
    expect(META_ALLOWED_FIRST_PARTY_EVENTS.has(FIRST_PARTY_EVENTS.socialProofImpression)).toBe(false);
    expect(META_EVENT_BY_FIRST_PARTY[FIRST_PARTY_EVENTS.socialProofImpression]).toBeUndefined();
    expect(isAllowedFirstPartyEvent(FIRST_PARTY_EVENTS.socialProofExpanded)).toBe(true);
    expect(META_ALLOWED_FIRST_PARTY_EVENTS.has(FIRST_PARTY_EVENTS.socialProofExpanded)).toBe(false);
    expect(META_EVENT_BY_FIRST_PARTY[FIRST_PARTY_EVENTS.socialProofExpanded]).toBeUndefined();
  });

  it("separates the free preview from the full result", () => {
    expect(FIRST_PARTY_EVENTS.resultPreviewViewed).not.toBe(FIRST_PARTY_EVENTS.fullResultViewed);
    // full_result_viewed is diagnostic-only; the preview keeps its Meta bridge.
    expect(META_ALLOWED_FIRST_PARTY_EVENTS.has(FIRST_PARTY_EVENTS.resultPreviewViewed)).toBe(true);
    expect(META_ALLOWED_FIRST_PARTY_EVENTS.has(FIRST_PARTY_EVENTS.fullResultViewed)).toBe(false);
  });

  it("registers subscription checkout funnel events as first-party only", () => {
    const subscriptionEvents = [
      FIRST_PARTY_EVENTS.planSelected,
      FIRST_PARTY_EVENTS.secureCheckoutRevealed,
      FIRST_PARTY_EVENTS.paymentAttempted,
    ] as const;
    for (const eventName of subscriptionEvents) {
      expect(isAllowedFirstPartyEvent(eventName)).toBe(true);
      expect(META_ALLOWED_FIRST_PARTY_EVENTS.has(eventName)).toBe(false);
      expect(META_EVENT_BY_FIRST_PARTY[eventName]).toBeUndefined();
    }
  });

  it("keeps subscription checkout stages distinguishable by name", () => {
    const distinct = new Set([
      FIRST_PARTY_EVENTS.subscriptionViewed,
      FIRST_PARTY_EVENTS.planSelected,
      FIRST_PARTY_EVENTS.secureCheckoutRevealed,
      FIRST_PARTY_EVENTS.paymentElementLoaded,
      FIRST_PARTY_EVENTS.paymentAttempted,
      FIRST_PARTY_EVENTS.paymentError,
      FIRST_PARTY_EVENTS.checkoutIntent,
    ]);
    expect(distinct.size).toBe(7);
  });
});
