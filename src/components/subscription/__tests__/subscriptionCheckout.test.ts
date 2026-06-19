import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { PLANS, DEFAULT_PLAN_KEY, formatMoney } from "@/lib/billing/plans";

/*
 * Source-level guards for the checkout conversion / trust pass. The screen is a
 * client-only component (Stripe Elements + framer-motion) and the project runs
 * tests in a `node` environment with no DOM, so — like the paywall and social
 * proof suites — these assert the structural and copy invariants directly
 * against the component source.
 */
const src = readFileSync(
  fileURLToPath(new URL("../SubscriptionPlansScreen.tsx", import.meta.url)),
  "utf8",
);

describe("subscription checkout — approved opening copy", () => {
  it("uses the approved headline and supporting line", () => {
    expect(src).toContain("Stop starting over.");
    expect(src).toContain("Your answers showed where focus breaks.");
    expect(src).toContain("start, recover, and follow through.");
  });

  it("does not add an eyebrow or the old explanatory header above the plans", () => {
    expect(src).not.toContain("Choose your plan");
    expect(src).not.toContain("Start your FocusRoute system");
    // the old multi-line "Pick an intro window…" paragraph is gone
    expect(src).not.toContain("Pick an intro window");
  });
});

describe("subscription checkout — product-value module (benefit-first)", () => {
  it("renders the two-phase ValueModule and drops the old generic route", () => {
    expect(src).toContain("<ValueModule />");
    expect(src).not.toContain("<ValueRoute />");
    // the old directional-but-vague outcomes are gone
    expect(src).not.toContain("Know where to start");
    expect(src).not.toContain("Know how to recover");
    expect(src).not.toContain("Keep moving forward");
  });

  it("leads each immediate-value stop with a plain-English benefit", () => {
    expect(src).toContain("What you can use right away");
    expect(src).toContain("See where focus breaks");
    expect(src).toContain("Know what to work on first");
    expect(src).toContain("Have help when the day goes off track");
    // the benefit is explained before any product term
    expect(src).toContain(
      "A clear view of what's behind starting, staying focused, prioritizing, and getting back on track.",
    );
    expect(src).toContain(
      "A 28-day path of small actions, organized from your assessment result.",
    );
    expect(src).toContain(
      "Scripts, planners, and practical guides for starting, prioritizing, and getting back into the task.",
    );
  });

  it("keeps product names as secondary labels, not jargon-led headlines", () => {
    expect(src).toContain("Your detailed Focus Profile");
    expect(src).toContain("Your 28-day action path");
    expect(src).toContain("Your member tools");
    // banned primary framings / instrumentation language
    expect(src).not.toContain("Full Brain Profile");
    expect(src).not.toContain("Brain OS");
    expect(src).not.toContain("first practical reset");
    expect(src).not.toContain("scan complete");
    expect(src).not.toContain("signal detected");
  });

  it("explains recurring value with real member capabilities only", () => {
    expect(src).toContain("Why it keeps helping");
    expect(src).toContain("Retake");
    expect(src).toContain("when your work or life changes");
    expect(src).toContain("Refresh");
    expect(src).toContain("your results and next steps");
    expect(src).toContain("your member tools and guides");
    // no self-updating / automatic-personalization claim
    expect(src.toLowerCase()).not.toContain("updates itself");
    expect(src.toLowerCase()).not.toContain("automatically personal");
  });

  it("distinguishes the free result from the subscription without devaluing it", () => {
    expect(src).toContain("Your free result shows where focus breaks.");
    expect(src).toContain("Your plan helps you act on it");
    expect(src.toLowerCase()).not.toContain("fake");
    // no fake scarcity in the value module
    expect(src).not.toContain("limited time");
    expect(src).not.toContain("spots left");
  });
});

describe("subscription checkout — 4-Week recommendation", () => {
  it("adds a small recommendation note tied to the popular plan only", () => {
    expect(src).toContain(
      "Recommended — enough time to use the plan, adjust it, and repeat",
    );
    // rendered conditionally on the default/popular plan, as small <p> copy
    expect(src).toMatch(/plan\.popular && \(\s*<p/);
    // it does not invent a statistic or discount
    expect(src).not.toMatch(/\d+% of (users|members|people)/);
  });
});

describe("subscription checkout — no upsell or unsupported claims", () => {
  it("does not reintroduce an upsell or a second pricing/checkout step", () => {
    expect(src.toLowerCase()).not.toContain("upsell");
    expect(src).not.toContain("one-time offer");
    expect(src).not.toContain("add to your order");
  });

  it("makes no email-delivery promise on the checkout", () => {
    expect(src).not.toContain("Check your inbox");
    expect(src).not.toContain("emailed your");
    expect(src).not.toContain("results are waiting in your inbox");
  });
});

describe("subscription checkout — CTA labels (no price / duration inside)", () => {
  it("labels the reveal button 'Continue to secure checkout'", () => {
    expect(src).toContain("Continue to secure checkout");
    // the old price-bearing reveal label is gone
    expect(src).not.toContain("Continue — ");
  });

  it("labels the final payment button 'Get My FocusRoute'", () => {
    expect(src).toContain('"Get My FocusRoute"');
    // the old final label embedded the plan short name + intro price
    expect(src).not.toContain("shortName");
  });

  it("keeps the loading state but no price/duration in either CTA", () => {
    expect(src).toContain('loading ? "Processing..." : "Get My FocusRoute"');
    // the final CTA no longer interpolates an intro price
    expect(src).not.toContain("Get My FocusRoute — ");
  });
});

describe("subscription checkout — plan cards remain locked", () => {
  it("keeps the radio-group plan cards, MOST POPULAR strip, and 4-Week default", () => {
    expect(src).toContain('role="radiogroup"');
    expect(src).toContain('role="radio"');
    expect(src).toContain("MOST POPULAR");
    expect(src).toContain("useState<PlanKey>(DEFAULT_PLAN_KEY)");
    expect(DEFAULT_PLAN_KEY).toBe("plan_4week");
    expect(PLANS[DEFAULT_PLAN_KEY].popular).toBe(true);
  });
});

describe("subscription checkout — restored expandable social proof", () => {
  it("renders the exact historical expandable proof component", () => {
    expect(src).toContain(
      'import { PaywallSocialProofDisclosure } from "@/components/signature/SocialProof"',
    );
    expect(src).toContain("<PaywallSocialProofDisclosure />");
  });

  it("places the proof after the order summary and before the payment action", () => {
    const summary = src.indexOf("<OrderSummary plan={plan} />");
    const proof = src.indexOf("<PaywallSocialProofDisclosure />");
    const cta = src.indexOf("Continue to secure checkout");
    expect(summary).toBeGreaterThan(-1);
    expect(proof).toBeGreaterThan(summary);
    expect(cta).toBeGreaterThan(proof);
  });
});

describe("subscription checkout — Stripe localization & branding", () => {
  it("forces the Payment Element UI to English", () => {
    expect(src).toContain('locale: "en"');
  });

  it("sets the customer-facing business name to FocusRoute", () => {
    expect(src).toContain('business: { name: "FocusRoute" }');
  });

  it("defaults the billing country to the US (still user-editable)", () => {
    expect(src).toContain("defaultValues: { billingDetails: { address: { country: \"US\" } } }");
  });

  it("does not hide Stripe terms or override the legal entity", () => {
    expect(src).not.toContain("terms:");
    expect(src).not.toContain("legal_entity");
  });
});

describe("subscription checkout — billing disclosure & redundant copy", () => {
  it("states the billing disclosure exactly once near the final payment area", () => {
    const disclosure =
      "Intro price today. Renews at the regular price shown. Cancel anytime.";
    expect(src).toContain(disclosure);
    expect(src.split(disclosure).length - 1).toBe(1);
  });

  it("removes dashboard / customer-portal cancellation claims", () => {
    expect(src.toLowerCase()).not.toContain("manage it from your dashboard");
    expect(src).not.toContain("Customer Portal");
    expect(src).not.toContain("dashboard");
  });

  it("drops the duplicated bottom cancellation reassurance", () => {
    expect(src).not.toContain("Cancel anytime before your intro window ends");
    expect(src).not.toContain("Cancel anytime before renewal");
  });
});

describe("subscription checkout — order-summary pricing copy is unchanged", () => {
  it("keeps the locked order-summary rows derived from the plan catalogue", () => {
    expect(src).toContain("${plan.name} — due today");
    expect(src).toContain("Renews after ${introWindowLabel(plan)}");
    expect(src).toContain("formatMoney(plan.introAmount)");
    expect(src).toContain(
      "`${formatMoney(plan.renewalAmount)}/${renewalCadenceLabel(plan)}`",
    );
  });
});

describe("subscription checkout — pricing values regression", () => {
  it("renders the contracted intro and renewal prices unchanged", () => {
    expect(formatMoney(PLANS.plan_1week.introAmount)).toBe("$10.50");
    expect(formatMoney(PLANS.plan_4week.introAmount)).toBe("$19.99");
    expect(formatMoney(PLANS.plan_12week.introAmount)).toBe("$34.99");
    expect(formatMoney(PLANS.plan_4week.renewalAmount)).toBe("$43.50");
    expect(formatMoney(PLANS.plan_12week.renewalAmount)).toBe("$89.99");
  });
});

describe("subscription checkout — subscription funnel analytics instrumentation", () => {
  it("registers the new subscription funnel events", () => {
    for (const ev of [
      "FIRST_PARTY_EVENTS.planSelected",
      "FIRST_PARTY_EVENTS.secureCheckoutRevealed",
      "FIRST_PARTY_EVENTS.paymentAttempted",
    ]) {
      expect(src).toContain(ev);
    }
  });

  it("fires plan_selected only on explicit plan changes while always updating UI state", () => {
    expect(src).toContain("planSelectAnalyticsDecision(selected, nextKey)");
    expect(src).toMatch(
      /if \(decision\.trackPlanSelected\) \{[\s\S]*FIRST_PARTY_EVENTS\.planSelected/,
    );
    expect(src).toMatch(
      /if \(decision\.updateUiState\) \{[\s\S]*setSelected\(nextKey\);[\s\S]*setShowPayment\(false\);/,
    );
    expect(src).not.toMatch(
      /if \(!shouldTrackPlanSelection\(selected, nextKey\)\) return;/,
    );
  });

  it("fires secure_checkout_revealed on Continue to secure checkout while preserving paywall_viewed", () => {
    expect(src).toContain("handleRevealSecureCheckout");
    expect(src).toContain("FIRST_PARTY_EVENTS.secureCheckoutRevealed");
    expect(src).toContain("FIRST_PARTY_EVENTS.paywallViewed");
    expect(src).toContain("Canonical subscription checkout reveal: secure_checkout_revealed");
    expect(src).toMatch(/if \(showPayment\) return;/);
  });

  it("fires payment_attempted after Stripe Elements validation and before billing checkout", () => {
    expect(src).toContain("FIRST_PARTY_EVENTS.paymentAttempted");
    expect(src).toContain("await elements.submit()");
    expect(src).toMatch(
      /await elements\.submit\(\)[\s\S]*FIRST_PARTY_EVENTS\.paymentAttempted[\s\S]*createPaymentMethod/,
    );
  });

  it("uses a fresh action_event_id per payment attempt and pairs failures", () => {
    expect(src).toContain('createAnalyticsEventId("payment_attempt")');
    expect(src).toContain("buildPaymentAttemptMetadata");
    expect(src).toContain("resolvePaymentFailureMetadata");
    expect(src).toMatch(
      /FIRST_PARTY_EVENTS\.paymentAttempted[\s\S]*eventId: attemptId/,
    );
  });

  describe("Meta InitiateCheckout deduplication IDs", () => {
    it("creates a stable checkoutEventId per plan checkout session", () => {
      expect(src).toContain("const checkoutEventId = useMemo(");
      expect(src).toContain("checkoutAnalyticsStorageKey(plan.key)");
      expect(src).toMatch(
        /getOrCreateActionEventId\([\s\S]*checkoutAnalyticsStorageKey\(plan\.key\)[\s\S]*"initiate_checkout"/,
      );
    });

    it("uses checkoutEventId for checkout_intent and the billing request", () => {
      expect(src).toMatch(
        /FIRST_PARTY_EVENTS\.checkoutIntent[\s\S]*eventId: checkoutEventId/,
      );
      expect(src).toContain("analytics_event_id: checkoutEventId");
      expect(src).not.toContain("analytics_event_id: attemptId");
    });

    it("uses attemptId only for attempt-level first-party events", () => {
      expect(src).toMatch(
        /FIRST_PARTY_EVENTS\.paymentAttempted[\s\S]*eventId: attemptId/,
      );
      expect(src).toMatch(
        /FIRST_PARTY_EVENTS\.paymentError[\s\S]*eventId: actionEventId/,
      );
      expect(src).not.toMatch(
        /FIRST_PARTY_EVENTS\.checkoutIntent[\s\S]*eventId: attemptId/,
      );
    });

    it("fires checkout_intent once per form mount while attempt IDs rotate on retry", () => {
      expect(src).toContain("checkoutIntentTracked");
      expect(src).toMatch(/if \(!checkoutIntentTracked\.current\)/);
      expect(src).toContain('createAnalyticsEventId("payment_attempt")');
    });

    it("clears stale attempt context before Stripe Elements validation", () => {
      expect(src).toContain("currentAttemptIdRef.current = null");
      expect(src).toMatch(
        /currentAttemptIdRef\.current = null;[\s\S]*await elements\.submit\(\)/,
      );
      expect(src).toContain("resolvePaymentFailureMetadata");
    });
  });

  it("keeps payment_element_loaded separate from checkout reveal", () => {
    expect(src).toContain("FIRST_PARTY_EVENTS.paymentElementLoaded");
    expect(src).toMatch(/onReady=\{\(\) => \{[\s\S]*paymentElementLoaded/);
    expect(src).not.toMatch(
      /handleRevealSecureCheckout[\s\S]*FIRST_PARTY_EVENTS\.paymentElementLoaded/,
    );
  });

  it("routes analytics metadata through shared subscription funnel helpers", () => {
    expect(src).toContain("buildPlanAnalyticsMetadata");
    expect(src).toContain("buildPaywallViewedMetadata");
    expect(src).toContain("buildPaymentAttemptMetadata");
    expect(src).toContain("resolvePaymentFailureMetadata");
    expect(src).toContain("checkoutAnalyticsStorageKey");
    expect(src).toContain("planSelectAnalyticsDecision");
  });
});

describe("subscription checkout — protected analytics events (no renames)", () => {
  it("preserves every funnel-stage analytics event", () => {
    for (const ev of [
      "FIRST_PARTY_EVENTS.subscriptionViewed",
      "FIRST_PARTY_EVENTS.paywallViewed",
      "FIRST_PARTY_EVENTS.checkoutIntent",
      "FIRST_PARTY_EVENTS.paymentElementLoaded",
      "FIRST_PARTY_EVENTS.paymentError",
    ]) {
      expect(src).toContain(ev);
    }
  });

  it("leaves the embedded subscription checkout + verification flow intact", () => {
    expect(src).toContain('fetch("/api/billing/checkout"');
    expect(src).toContain("stripe.confirmPayment");
    expect(src).toContain("subscription_id=");
    expect(src).toContain('setStep("success")');
  });
});
