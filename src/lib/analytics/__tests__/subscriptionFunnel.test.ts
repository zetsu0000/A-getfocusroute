import { describe, expect, it } from "vitest";

import { PLANS } from "@/lib/billing/plans";
import {
  buildPaymentAttemptMetadata,
  buildPaymentFailureMetadata,
  buildPlanAnalyticsMetadata,
  buildPreAttemptPaymentFailureMetadata,
  checkoutAnalyticsStorageKey,
  mapPaymentFailureStage,
  planSelectAnalyticsDecision,
  shouldTrackPlanSelection,
  stripeErrorAnalyticsFields,
} from "../subscriptionFunnel";

describe("subscription funnel analytics helpers", () => {
  const fourWeek = PLANS.plan_4week;
  const oneWeek = PLANS.plan_1week;

  it("builds plan metadata with major-unit amounts and no PII fields", () => {
    const meta = buildPlanAnalyticsMetadata(fourWeek);
    expect(meta).toEqual({
      plan_key: "plan_4week",
      product_key: "membership_4week",
      plan_name: "4-Week Plan",
      intro_amount: 19.99,
      renewal_amount: 43.5,
      currency: "USD",
      intro_interval: "4 weeks",
      renewal_interval: "month",
    });
    expect(meta).not.toHaveProperty("email");
    expect(meta).not.toHaveProperty("clientSecret");
    expect(meta).not.toHaveProperty("paymentMethodId");
  });

  it("does not track plan selection for the same plan or default re-selection", () => {
    expect(shouldTrackPlanSelection("plan_4week", "plan_4week")).toBe(false);
    expect(shouldTrackPlanSelection("plan_4week", "plan_1week")).toBe(true);
    expect(shouldTrackPlanSelection("plan_1week", "plan_12week")).toBe(true);
  });

  it("keeps plan-card UI updates separate from plan_selected tracking", () => {
    expect(planSelectAnalyticsDecision("plan_4week", "plan_4week")).toEqual({
      trackPlanSelected: false,
      updateUiState: true,
    });
    expect(planSelectAnalyticsDecision("plan_4week", "plan_1week")).toEqual({
      trackPlanSelected: true,
      updateUiState: true,
    });
  });

  it("uses a stable checkout analytics storage key per plan for Meta deduplication", () => {
    expect(checkoutAnalyticsStorageKey("plan_4week")).toBe("billing_plan_4week");
    expect(checkoutAnalyticsStorageKey("plan_1week")).toBe("billing_plan_1week");
  });

  it("keeps checkout and attempt IDs distinct for retry correlation", () => {
    const checkoutId = "initiate_checkout_stable";
    const attemptA = buildPaymentAttemptMetadata(fourWeek, 1, "payment_attempt_a");
    const attemptB = buildPaymentAttemptMetadata(fourWeek, 2, "payment_attempt_b");
    expect(attemptA.action_event_id).not.toBe(checkoutId);
    expect(attemptB.action_event_id).not.toBe(checkoutId);
    expect(attemptA.action_event_id).not.toBe(attemptB.action_event_id);
  });

  it("maps legacy failure stages to canonical analytics stages", () => {
    expect(mapPaymentFailureStage("element_submit")).toBe("elements_validation");
    expect(mapPaymentFailureStage("billing_checkout")).toBe("subscription_creation");
    expect(mapPaymentFailureStage("confirm_payment")).toBe("stripe_confirmation");
    expect(mapPaymentFailureStage("subscription_verification_evidence")).toBe(
      "server_verification",
    );
  });

  it("pairs payment failure metadata with the same action_event_id as the attempt", () => {
    const attemptId = "payment_attempt_test_123";
    const failure = buildPaymentFailureMetadata(
      fourWeek,
      2,
      attemptId,
      "confirm_payment",
      { type: "card_error", code: "card_declined" },
    );
    expect(failure.action_event_id).toBe(attemptId);
    expect(failure.attempt_number).toBe(2);
    expect(failure.failure_stage).toBe("stripe_confirmation");
    expect(failure.stripe_error_type).toBe("card_error");
    expect(failure.stripe_error_code).toBe("card_declined");
    expect(failure).not.toHaveProperty("message");
  });

  it("records pre-attempt validation failures without an action_event_id", () => {
    const failure = buildPreAttemptPaymentFailureMetadata(oneWeek, "element_submit", {
      type: "validation_error",
      code: "incomplete_number",
    });
    expect(failure.failure_stage).toBe("elements_validation");
    expect(failure.plan_key).toBe("plan_1week");
    expect(failure).not.toHaveProperty("action_event_id");
    expect(failure).not.toHaveProperty("attempt_number");
  });

  it("builds distinct attempt metadata per retry", () => {
    const first = buildPaymentAttemptMetadata(fourWeek, 1, "payment_attempt_a");
    const second = buildPaymentAttemptMetadata(fourWeek, 2, "payment_attempt_b");
    expect(first.action_event_id).not.toBe(second.action_event_id);
    expect(first.attempt_number).toBe(1);
    expect(second.attempt_number).toBe(2);
  });

  it("never includes raw Stripe error messages in analytics fields", () => {
    const fields = stripeErrorAnalyticsFields({
      type: "card_error",
      code: "card_declined",
      message: "Your card was declined",
    } as { type: string; code: string; message: string });
    expect(fields).toEqual({
      stripe_error_type: "card_error",
      stripe_error_code: "card_declined",
    });
    expect(fields).not.toHaveProperty("message");
  });
});
