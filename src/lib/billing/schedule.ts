/**
 * Intro → renewal Subscription Schedule lifecycle (V2 billing).
 *
 * The checkout creates the subscription on the INTRO price first (to collect the
 * first payment via the Payment Element). The renewal step-up lives in a 2-phase
 * Subscription Schedule. If that schedule is ever missing, the subscription would
 * keep renewing at the intro price forever — a silent revenue leak.
 *
 * `ensurePlanSchedule` is the single, idempotent, self-healing entry point used
 * by BOTH the checkout (fast path) and the webhook (reconciliation). It:
 *   - is a no-op when the schedule already exists with the renewal phase,
 *   - creates the schedule when missing,
 *   - REPAIRS a partial failure (schedule created but the renewal phase never
 *     attached — e.g. create succeeded, update failed),
 *   - never throws: a failure returns { status: "pending", reason } so the
 *     caller records it and a later webhook / reconcile retries.
 *
 * The webhook is the reliability backbone: Stripe retries delivery, and every
 * renewal `invoice.paid` re-runs reconciliation, so a transient failure is
 * eventually healed rather than left as intro-forever.
 */

import type Stripe from "stripe";

import { PLANS, type PlanKey } from "@/lib/billing/plans";
import { resolvePlanPrices } from "@/lib/billing/planRegistry";

export type ScheduleResult =
  | { status: "active"; scheduleId: string }
  | { status: "pending"; reason: string };

/** The minimal shape we read off a subscription (event payload or API object). */
type SubscriptionLike = Pick<Stripe.Subscription, "id" | "schedule">;

function scheduleIdOf(
  schedule: Stripe.Subscription["schedule"],
): string | null {
  if (!schedule) return null;
  return typeof schedule === "string" ? schedule : schedule.id;
}

function phaseItemPriceId(
  item: Stripe.SubscriptionSchedule.Phase.Item,
): string | null {
  const price = item.price;
  if (!price) return null;
  return typeof price === "string" ? price : price.id;
}

/** True once any phase carries the renewal price — i.e. the step-up is in place. */
function hasRenewalPhase(
  schedule: Stripe.SubscriptionSchedule,
  renewalPriceId: string,
): boolean {
  return schedule.phases.some((phase) =>
    phase.items.some((item) => phaseItemPriceId(item) === renewalPriceId),
  );
}

/**
 * Idempotently ensure a plan subscription has its intro→renewal schedule.
 * Safe to call repeatedly. Never throws.
 */
export async function ensurePlanSchedule(
  stripe: Stripe,
  subscription: SubscriptionLike,
  planKey: PlanKey,
): Promise<ScheduleResult> {
  const plan = PLANS[planKey];
  const prices = resolvePlanPrices(planKey);
  if (!prices) {
    // Prices not configured for this environment — cannot build the step-up.
    return { status: "pending", reason: `prices_unconfigured:${planKey}` };
  }

  try {
    let scheduleId = scheduleIdOf(subscription.schedule);
    let currentPhaseStart: number | undefined;

    if (scheduleId) {
      // A schedule already exists — verify it actually carries the renewal phase
      // (guards the create-succeeded / update-failed partial case).
      const existing = await stripe.subscriptionSchedules.retrieve(scheduleId);
      if (existing.status === "released" || existing.status === "canceled") {
        // Terminal schedule we can no longer steer — flag for reconciliation.
        return { status: "pending", reason: `schedule_${existing.status}` };
      }
      if (hasRenewalPhase(existing, prices.renewalPriceId)) {
        return { status: "active", scheduleId };
      }
      currentPhaseStart = existing.phases[0]?.start_date;
    } else {
      // No schedule yet — wrap the running subscription in one.
      const created = await stripe.subscriptionSchedules.create(
        { from_subscription: subscription.id },
        { idempotencyKey: `sched_create:${subscription.id}` },
      );
      scheduleId = created.id;
      currentPhaseStart = created.phases[0]?.start_date;
    }

    // Attach the 2-phase intro→renewal structure. Phase 1 lasts exactly the
    // intro window (all windows are whole weeks: 7/28/84d → 1/4/12); phase 2 is
    // the renewal price with no end, so the subscription auto-renews at the
    // standard rate every period until the customer cancels. `release` only
    // applies if the schedule ever completes (it does not, phase 2 is open).
    await stripe.subscriptionSchedules.update(scheduleId, {
      end_behavior: "release",
      phases: [
        {
          items: [{ price: prices.introPriceId, quantity: 1 }],
          ...(currentPhaseStart ? { start_date: currentPhaseStart } : {}),
          duration: { interval: "week", interval_count: plan.introDays / 7 },
        },
        {
          items: [{ price: prices.renewalPriceId, quantity: 1 }],
        },
      ],
    });

    return { status: "active", scheduleId };
  } catch (err) {
    return {
      status: "pending",
      reason: err instanceof Error ? err.message : "schedule_error",
    };
  }
}
