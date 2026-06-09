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
});
