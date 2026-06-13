import type { ProductKey } from "@/lib/access/products";
import type { FunnelStep } from "@/types/quiz";

/**
 * Post-purchase entry gating (production audit, PR 1).
 *
 * The funnel's post-purchase steps were reachable from the query string
 * alone (/assessment?step=success). These helpers decide — purely, so the
 * rules are unit-testable — whether a ?step= entry may advance the funnel:
 *
 *  - "allow":  pre-purchase step, or the persisted store already earned a
 *              position at/beyond the requested step (legit refresh/return).
 *  - "verify": a Stripe redirect return (payment_intent in the URL) — the
 *              PaymentIntent must be verified server-side before advancing.
 *  - "deny":   no evidence at all — the query string is ignored.
 */

export const STEP_ORDER: Record<FunnelStep, number> = {
  quiz: 0,
  loading: 1,
  email: 2,
  name: 2,
  chart: 3,
  paywall: 4,
  upsell: 5,
  subscription: 6,
  success: 7,
};

const POST_PURCHASE_STEPS: ReadonlySet<FunnelStep> = new Set([
  "upsell",
  "subscription",
  "success",
]);

export function isPostPurchaseStep(step: FunnelStep): boolean {
  return POST_PURCHASE_STEPS.has(step);
}

export function isFunnelStep(value: unknown): value is FunnelStep {
  return (
    value === "quiz" ||
    value === "loading" ||
    value === "email" ||
    value === "name" ||
    value === "chart" ||
    value === "paywall" ||
    value === "upsell" ||
    value === "subscription" ||
    value === "success"
  );
}

export type EntryDecision = "allow" | "verify" | "deny";

export function gatePostPurchaseEntry(
  requested: FunnelStep,
  storeStep: FunnelStep,
  hasPaymentIntentParam: boolean,
): EntryDecision {
  if (!isPostPurchaseStep(requested)) return "allow";
  if ((STEP_ORDER[storeStep] ?? 0) >= STEP_ORDER[requested]) return "allow";
  if (hasPaymentIntentParam) return "verify";
  return "deny";
}

/** Strict shape check before the id is ever sent to Stripe. */
export function isPaymentIntentId(value: unknown): value is string {
  return typeof value === "string" && /^pi_[A-Za-z0-9]{8,}$/.test(value);
}

export function isSubscriptionId(value: unknown): value is string {
  return typeof value === "string" && /^sub_[A-Za-z0-9]{8,}$/.test(value);
}

export function oneTimeProductCanAdvanceToStep(
  productKey: ProductKey,
  targetStep: FunnelStep,
): boolean {
  if (productKey === "brain_profile") return targetStep === "upsell";
  if (productKey === "roadmap_28_day") return targetStep === "subscription";
  return false;
}

export function expectedFunnelStepForOneTimeProduct(
  productKey: ProductKey,
): FunnelStep | null {
  if (productKey === "brain_profile") return "paywall";
  if (productKey === "roadmap_28_day") return "upsell";
  return null;
}

export function subscriptionVerificationEvidenceReady(input: {
  subscriptionId: unknown;
  paymentIntentId: unknown;
  clientSecret: unknown;
}): boolean {
  return (
    isSubscriptionId(input.subscriptionId) &&
    isPaymentIntentId(input.paymentIntentId) &&
    typeof input.clientSecret === "string" &&
    input.clientSecret.length > 0
  );
}

/**
 * Collapses Stripe's PaymentIntent statuses into the only three facts the
 * funnel cares about. Anything that is not money-confirmed or in-flight
 * (requires_payment_method, requires_action, canceled, …) is "failed" —
 * it must never advance the funnel.
 */
export type VerifyVerdict = "succeeded" | "processing" | "failed";

export function verdictForPaymentIntentStatus(status: string): VerifyVerdict {
  if (status === "succeeded") return "succeeded";
  if (status === "processing") return "processing";
  return "failed";
}

export type VerifyPaymentRequest = {
  paymentIntentId: string;
  targetStep: FunnelStep;
  subscriptionId?: string | null;
};

export function paymentVerificationRequestKey(
  request: VerifyPaymentRequest,
): string {
  return [
    request.paymentIntentId,
    request.targetStep,
    request.subscriptionId ?? "",
  ].join("|");
}

export type PaymentVerifier = (
  request: VerifyPaymentRequest,
) => Promise<VerifyVerdict>;

export function createSharedPaymentVerifier(
  verify: PaymentVerifier,
): PaymentVerifier {
  const inFlight = new Map<string, Promise<VerifyVerdict>>();

  return (request) => {
    const key = paymentVerificationRequestKey(request);
    const existing = inFlight.get(key);
    if (existing) return existing;

    const promise = verify(request).finally(() => {
      if (inFlight.get(key) === promise) {
        inFlight.delete(key);
      }
    });
    inFlight.set(key, promise);
    return promise;
  };
}

type VerifyPaymentResponse = {
  verified?: boolean;
  status?: VerifyVerdict;
};

function isVerifyPaymentResponse(value: unknown): value is VerifyPaymentResponse {
  if (!value || typeof value !== "object") return false;
  const status = (value as { status?: unknown }).status;
  return (
    status === "succeeded" ||
    status === "processing" ||
    status === "failed" ||
    status === undefined
  );
}

export async function pollVerifyPayment(
  request: VerifyPaymentRequest,
  options: {
    fetchFn?: typeof fetch;
    sleep?: (ms: number) => Promise<void>;
    maxAttempts?: number;
    delayMs?: number;
  } = {},
): Promise<VerifyVerdict> {
  const fetchFn = options.fetchFn ?? fetch;
  const sleep =
    options.sleep ??
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const maxAttempts = Math.max(1, options.maxAttempts ?? 5);
  const delayMs = Math.max(0, options.delayMs ?? 3000);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetchFn("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_intent: request.paymentIntentId,
          target_step: request.targetStep,
          subscription_id: request.subscriptionId ?? undefined,
        }),
      });
      const data: unknown = await response.json();
      if (!isVerifyPaymentResponse(data)) return "failed";
      if (data.verified === true && data.status === "succeeded") {
        return "succeeded";
      }
      if (data.status !== "processing") return "failed";
    } catch {
      return "failed";
    }

    if (attempt < maxAttempts - 1) {
      await sleep(delayMs);
    }
  }

  return "processing";
}
