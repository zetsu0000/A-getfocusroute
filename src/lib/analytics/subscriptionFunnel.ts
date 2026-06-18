import type { PlanDisplay, PlanKey } from "@/lib/billing/plans";
import { introWindowLabel, renewalCadenceLabel } from "@/lib/billing/plans";

/** Client-safe product_key per plan — mirrors SubscriptionPlansScreen. */
export const SUBSCRIPTION_PRODUCT_KEY_BY_PLAN: Record<PlanKey, string> = {
  plan_1week: "membership_1week",
  plan_4week: "membership_4week",
  plan_12week: "membership_12week",
};

/** Legacy stage keys emitted by PlanCheckoutForm before sanitization. */
export type SubscriptionPaymentFailureStage =
  | "element_submit"
  | "create_payment_method"
  | "billing_checkout"
  | "subscription_verification_evidence"
  | "confirm_payment";

/** Sanitized failure-stage values for analytics (no PII). */
export type SubscriptionPaymentFailureStageCanonical =
  | "elements_validation"
  | "subscription_creation"
  | "stripe_confirmation"
  | "server_verification"
  | "unknown";

export type PlanAnalyticsMetadata = {
  plan_key: PlanKey;
  product_key: string;
  plan_name: string;
  intro_amount: number;
  renewal_amount: number;
  currency: string;
  intro_interval: string;
  renewal_interval: string;
};

export function productKeyForPlan(planKey: PlanKey): string {
  return SUBSCRIPTION_PRODUCT_KEY_BY_PLAN[planKey];
}

/** Monetary amounts are major units (dollars), matching checkout_intent convention. */
export function buildPlanAnalyticsMetadata(plan: PlanDisplay): PlanAnalyticsMetadata {
  return {
    plan_key: plan.key,
    product_key: productKeyForPlan(plan.key),
    plan_name: plan.name,
    intro_amount: plan.introAmount / 100,
    renewal_amount: plan.renewalAmount / 100,
    currency: plan.currency.toUpperCase(),
    intro_interval: introWindowLabel(plan),
    renewal_interval: renewalCadenceLabel(plan),
  };
}

/** Only explicit plan changes — never the default selection on mount. */
export function shouldTrackPlanSelection(
  currentPlanKey: PlanKey,
  nextPlanKey: PlanKey,
): boolean {
  return nextPlanKey !== currentPlanKey;
}

export function mapPaymentFailureStage(
  stage: SubscriptionPaymentFailureStage,
): SubscriptionPaymentFailureStageCanonical {
  switch (stage) {
    case "element_submit":
      return "elements_validation";
    case "create_payment_method":
      return "stripe_confirmation";
    case "billing_checkout":
      return "subscription_creation";
    case "subscription_verification_evidence":
      return "server_verification";
    case "confirm_payment":
      return "stripe_confirmation";
    default:
      return "unknown";
  }
}

export type StripeErrorAnalyticsFields = {
  stripe_error_type?: string;
  stripe_error_code?: string;
};

/** Safe Stripe error fields only — never message text or customer data. */
export function stripeErrorAnalyticsFields(error: {
  type?: string;
  code?: string;
} | null | undefined): StripeErrorAnalyticsFields {
  if (!error) return {};
  const out: StripeErrorAnalyticsFields = {};
  if (typeof error.type === "string" && error.type) {
    out.stripe_error_type = error.type;
  }
  if (typeof error.code === "string" && error.code) {
    out.stripe_error_code = error.code;
  }
  return out;
}

export type PaymentAttemptAnalyticsMetadata = PlanAnalyticsMetadata & {
  attempt_number: number;
  action_event_id: string;
};

export type PaymentFailureAnalyticsMetadata = PaymentAttemptAnalyticsMetadata & {
  failure_stage: SubscriptionPaymentFailureStageCanonical;
} & StripeErrorAnalyticsFields;

export function buildPaymentAttemptMetadata(
  plan: PlanDisplay,
  attemptNumber: number,
  actionEventId: string,
): PaymentAttemptAnalyticsMetadata {
  return {
    ...buildPlanAnalyticsMetadata(plan),
    attempt_number: attemptNumber,
    action_event_id: actionEventId,
  };
}

export function buildPaymentFailureMetadata(
  plan: PlanDisplay,
  attemptNumber: number,
  actionEventId: string,
  stage: SubscriptionPaymentFailureStage,
  stripeError?: { type?: string; code?: string } | null,
): PaymentFailureAnalyticsMetadata {
  return {
    ...buildPaymentAttemptMetadata(plan, attemptNumber, actionEventId),
    failure_stage: mapPaymentFailureStage(stage),
    ...stripeErrorAnalyticsFields(stripeError),
  };
}

/** Stripe Elements validation failed before a payment_attempted was recorded. */
export function buildPreAttemptPaymentFailureMetadata(
  plan: PlanDisplay,
  stage: SubscriptionPaymentFailureStage,
  stripeError?: { type?: string; code?: string } | null,
): PlanAnalyticsMetadata & {
  failure_stage: SubscriptionPaymentFailureStageCanonical;
} & StripeErrorAnalyticsFields {
  return {
    ...buildPlanAnalyticsMetadata(plan),
    failure_stage: mapPaymentFailureStage(stage),
    ...stripeErrorAnalyticsFields(stripeError),
  };
}

/** Meta ViewContent bridge — preserved for backward-compatible reporting. */
export function buildPaywallViewedMetadata(plan: PlanDisplay) {
  const base = buildPlanAnalyticsMetadata(plan);
  return {
    ...base,
    content_name: `FocusRoute Membership — ${plan.name}`,
    content_ids: [base.product_key, plan.key],
    content_type: "subscription",
    num_items: 1,
    value: base.intro_amount,
  };
}
