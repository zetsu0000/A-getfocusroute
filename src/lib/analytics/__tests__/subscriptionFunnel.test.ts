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
  resolvePaymentFailureMetadata,
  shouldTrackPlanSelection,
  shouldUsePreAttemptPaymentFailureMetadata,
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

  it("routes pre-attempt validation failures without attempt pairing", () => {
    expect(shouldUsePreAttemptPaymentFailureMetadata(null, 1)).toBe(true);
    expect(shouldUsePreAttemptPaymentFailureMetadata("attempt_A", 0)).toBe(true);
    expect(shouldUsePreAttemptPaymentFailureMetadata("attempt_A", 1)).toBe(false);
  });

  it("models attempt A failure, retry validation failure, and attempt B", () => {
    let attemptNumber = 0;
    let actionEventId: string | null = null;
    const checkoutId = "checkout_A";

    actionEventId = null;
    attemptNumber += 1;
    actionEventId = "attempt_A";
    const attemptA = buildPaymentAttemptMetadata(fourWeek, attemptNumber, actionEventId);
    expect(attemptA.attempt_number).toBe(1);
    expect(attemptA.action_event_id).toBe("attempt_A");
    expect(attemptA.action_event_id).not.toBe(checkoutId);

    const failA = resolvePaymentFailureMetadata(
      fourWeek,
      "confirm_payment",
      attemptNumber,
      actionEventId,
      { type: "card_error", code: "card_declined" },
    );
    expect(failA).toMatchObject({
      action_event_id: "attempt_A",
      attempt_number: 1,
      failure_stage: "stripe_confirmation",
    });

    actionEventId = null;
    const validationFail = resolvePaymentFailureMetadata(
      fourWeek,
      "element_submit",
      attemptNumber,
      actionEventId,
      { type: "validation_error", code: "incomplete_number" },
    );
    expect(validationFail.failure_stage).toBe("elements_validation");
    expect(validationFail).not.toHaveProperty("action_event_id");
    expect(validationFail).not.toHaveProperty("attempt_number");

    attemptNumber += 1;
    actionEventId = "attempt_B";
    const attemptB = buildPaymentAttemptMetadata(fourWeek, attemptNumber, actionEventId);
    expect(attemptB.attempt_number).toBe(2);
    expect(attemptB.action_event_id).toBe("attempt_B");
    expect(attemptB.action_event_id).not.toBe("attempt_A");
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
