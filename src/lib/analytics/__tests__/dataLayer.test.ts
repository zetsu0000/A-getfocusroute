import { describe, it, expect } from "vitest";

import { FIRST_PARTY_EVENTS } from "../events";
import {
  DATA_LAYER_EVENTS,
  dataLayerEventForFirstParty,
  sanitizeDataLayerParams,
  pushDataLayerEvent,
} from "../dataLayer";

describe("sanitizeDataLayerParams", () => {
  it("keeps non-PII primitives and string arrays", () => {
    const out = sanitizeDataLayerParams({
      product_key: "roadmap",
      value: 97,
      currency: "BRL",
      flagged: true,
      content_ids: ["a", "b"],
      nothing: null,
    });
    expect(out).toEqual({
      product_key: "roadmap",
      value: 97,
      currency: "BRL",
      flagged: true,
      content_ids: ["a", "b"],
      nothing: null,
    });
  });

  it("strips PII keys regardless of casing", () => {
    const out = sanitizeDataLayerParams({
      email: "a@b.com",
      Phone: "+5511999999999",
      CPF: "000.000.000-00",
      name: "Jane",
      address: "Rua X",
      product_key: "assessment",
    });
    expect(out).toEqual({ product_key: "assessment" });
  });

  it("drops undefined and non-serializable nested objects", () => {
    const out = sanitizeDataLayerParams({
      ok: "yes",
      skip: undefined,
      nested: { a: 1 } as unknown as string,
    });
    expect(out).toEqual({ ok: "yes" });
  });
});

describe("dataLayerEventForFirstParty", () => {
  it("maps funnel events to dataLayer event names", () => {
    expect(dataLayerEventForFirstParty(FIRST_PARTY_EVENTS.assessmentStarted)).toBe(
      DATA_LAYER_EVENTS.startAssessment,
    );
    expect(dataLayerEventForFirstParty(FIRST_PARTY_EVENTS.emailSubmitted)).toBe(
      DATA_LAYER_EVENTS.emailSubmitted,
    );
    expect(dataLayerEventForFirstParty(FIRST_PARTY_EVENTS.quizCompleted)).toBe(
      DATA_LAYER_EVENTS.quizCompleted,
    );
    expect(dataLayerEventForFirstParty(FIRST_PARTY_EVENTS.paywallViewed)).toBe(
      DATA_LAYER_EVENTS.paywallViewed,
    );
    expect(
      dataLayerEventForFirstParty(FIRST_PARTY_EVENTS.quizMilestoneReached),
    ).toBe(DATA_LAYER_EVENTS.quizStepCompleted);
    expect(
      dataLayerEventForFirstParty(FIRST_PARTY_EVENTS.checkoutIntent),
    ).toBe(DATA_LAYER_EVENTS.checkoutStarted);
    expect(
      dataLayerEventForFirstParty(FIRST_PARTY_EVENTS.paymentElementLoaded),
    ).toBe(DATA_LAYER_EVENTS.stripeCheckoutOpened);
  });

  it("returns null for page-view style events (no GA4 page_view duplication)", () => {
    expect(dataLayerEventForFirstParty(FIRST_PARTY_EVENTS.homepageView)).toBeNull();
    expect(dataLayerEventForFirstParty(FIRST_PARTY_EVENTS.dashboardViewed)).toBeNull();
    expect(dataLayerEventForFirstParty(FIRST_PARTY_EVENTS.paymentIntentCreated)).toBeNull();
  });

  it("does not bridge high-volume funnel-depth events into the dataLayer", () => {
    expect(dataLayerEventForFirstParty(FIRST_PARTY_EVENTS.questionViewed)).toBeNull();
    expect(dataLayerEventForFirstParty(FIRST_PARTY_EVENTS.infoCardViewed)).toBeNull();
    expect(dataLayerEventForFirstParty(FIRST_PARTY_EVENTS.resultUnlockClicked)).toBeNull();
    expect(dataLayerEventForFirstParty(FIRST_PARTY_EVENTS.upsellSkipped)).toBeNull();
    expect(dataLayerEventForFirstParty(FIRST_PARTY_EVENTS.subscriptionSkipped)).toBeNull();
    expect(dataLayerEventForFirstParty(FIRST_PARTY_EVENTS.successViewed)).toBeNull();
  });
});

describe("pushDataLayerEvent", () => {
  it("is a no-op without a browser window (SSR safe)", () => {
    expect(() => pushDataLayerEvent("start_assessment", { foo: "bar" })).not.toThrow();
  });
});
