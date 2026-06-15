import type { ProductKey } from "@/lib/access/products";
import type { FunnelStep } from "@/types/quiz";

/**
 * Funnel entry gating (production audit, PR 1).
 *
 * Guarded funnel steps (paywall, upsell, subscription, success) were reachable
 * from the query string alone — /assessment?step=paywall rendered a generic
 * paywall, /assessment?step=success a generic success — with no earned funnel
 * context. A query parameter must never advance the funnel by itself. These
 * helpers decide — purely, so the rules are unit-testable — whether a ?step=
 * entry may advance the funnel:
 *
 *  - "allow":  the persisted store already earned a position at/beyond the
 *              requested step (a legit in-app refresh or re-entry).
 *  - "verify": a post-purchase Stripe redirect return (payment_intent in the
 *              URL) — the PaymentIntent must be verified server-side first.
 *  - "deny":   no earned position and no payment evidence — the query string is
 *              ignored and the user stays at their real funnel position.
 *
 * paywall is pre-purchase and is never a Stripe redirect target, so it can only
 * be "allow" (earned) or "deny". Email, a query parameter, or a signed-in
 * session are never, on their own, treated as proof that a guarded step was
 * earned.
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

/**
 * The full set of `?step=` values the assessment honors as an entry request.
 * Every one is gated: it requires earned store state (or, for the post-purchase
 * subset, verified payment evidence) before the query string may advance the
 * funnel. The pre-purchase steps (quiz/loading/email/name/chart) are not entry
 * targets — they are only reached by completing the flow in-app.
 */
const GUARDED_ENTRY_STEPS: ReadonlySet<FunnelStep> = new Set([
  "paywall",
  "upsell",
  "subscription",
  "success",
]);

export function isGuardedEntryStep(step: FunnelStep): boolean {
  return GUARDED_ENTRY_STEPS.has(step);
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

/**
 * Decides whether a requested `?step=` entry may advance the funnel. A query
 * parameter alone never advances it: a guarded step is honored only when the
 * persisted store already earned it, or — for post-purchase steps — a Stripe
 * redirect return is present and must be verified server-side.
 */
export function gateFunnelEntry(
  requested: FunnelStep,
  storeStep: FunnelStep,
  hasPaymentIntentParam: boolean,
): EntryDecision {
  // Unguarded steps (quiz/loading/email/name/chart) are not entry targets and
  // are never blocked if somehow requested.
  if (!isGuardedEntryStep(requested)) return "allow";
  // The persisted store already legitimately reached this step (or further):
  // a real in-app refresh or re-entry. Honor it.
  if ((STEP_ORDER[storeStep] ?? 0) >= STEP_ORDER[requested]) return "allow";
  // Only post-purchase steps are legitimate Stripe redirect targets. A
  // payment_intent in the URL means we must verify server-side before trusting
  // it. paywall is never a Stripe return target, so it falls through to deny.
  if (isPostPurchaseStep(requested) && hasPaymentIntentParam) return "verify";
  // A query parameter (or email, or a signed-in session) alone is not proof.
  return "deny";
}

/** Funnel-entry query parameters the gate consumes and then strips from the URL. */
export const FUNNEL_ENTRY_URL_PARAMS = [
  "step",
  "payment_intent",
  "payment_intent_client_secret",
  "redirect_status",
  "subscription_id",
  "upgrade",
] as const;

/**
 * Returns the query string ("?a=b" or "") with every funnel-entry parameter
 * removed and all unrelated parameters (UTMs, attribution) preserved in order.
 * Pure, so URL cleanup is observable in tests without a DOM.
 */
export function stripFunnelEntryParams(search: string): string {
  const params = new URLSearchParams(search);
  for (const key of FUNNEL_ENTRY_URL_PARAMS) params.delete(key);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * The action the assessment client should take for a given `?step=` request,
 * derived purely from the URL search string and the persisted store position.
 * Keeping this pure makes the entry behavior unit-testable without rendering
 * React or touching Stripe:
 *
 *  - "ready":  no guarded entry requested — render the persisted position.
 *  - "enter":  the request is earned — clean the URL and advance to `step`.
 *  - "ignore": the request is not earned — clean the URL and keep the persisted
 *              position (the query string never advances the funnel).
 *  - "verify": a post-purchase Stripe return — verify server-side, then advance.
 */
export type FunnelEntryAction =
  | { kind: "ready" }
  | { kind: "enter"; step: FunnelStep }
  | { kind: "ignore" }
  | {
      kind: "verify";
      step: FunnelStep;
      paymentIntentId: string;
      subscriptionId: string | null;
    };

export function planFunnelEntry(
  search: string,
  storeStep: FunnelStep,
): FunnelEntryAction {
  const params = new URLSearchParams(search);
  const requested = params.get("step");
  if (!isFunnelStep(requested) || !isGuardedEntryStep(requested)) {
    return { kind: "ready" };
  }

  const paymentIntentId = params.get("payment_intent") ?? "";
  const rawSubscriptionId = params.get("subscription_id");
  const subscriptionId = isSubscriptionId(rawSubscriptionId)
    ? rawSubscriptionId
    : null;

  const decision = gateFunnelEntry(
    requested,
    storeStep,
    isPaymentIntentId(paymentIntentId),
  );
  if (decision === "allow") return { kind: "enter", step: requested };
  if (decision === "deny") return { kind: "ignore" };
  return { kind: "verify", step: requested, paymentIntentId, subscriptionId };
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
