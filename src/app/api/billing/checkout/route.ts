import Stripe from "stripe";

import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import { recordAnalyticsEvent } from "@/lib/analytics/server";
import { jsonInputError, readJsonObject } from "@/lib/api/request";
import { isPlanKey, PLANS } from "@/lib/billing/plans";
import { planKeyToProductKey, resolvePlanPrices } from "@/lib/billing/planRegistry";
import { sendMetaEvent } from "@/lib/meta/conversions";
import { subscriptionVerificationEvidenceReady } from "@/lib/payment-verification";
import {
  enforceRateLimit,
  rateLimitResponse,
  temporaryUnavailableResponse,
} from "@/lib/rate-limit/server";
import { getStripeClient } from "@/lib/stripe/client";
import { buildStripeFunnelMetadata } from "@/lib/stripe/metadata";

type AnalyticsContext = {
  anonymous_id?: unknown;
  session_id?: unknown;
  path?: unknown;
  referrer?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  utm_content?: unknown;
  utm_term?: unknown;
  fbclid?: unknown;
  fbp?: unknown;
  fbc?: unknown;
};

function asString(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function requestIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

/**
 * V2 subscription checkout — 3-plan intro→renewal model.
 *
 * Flow (embedded Payment Element):
 *   1. Resolve plan_key → intro + renewal Price IDs (server-only registry).
 *   2. Create/reuse the customer; attach + default the payment method.
 *   3. Create the subscription on the INTRO price (returns the first invoice's
 *      PaymentIntent client_secret for the Payment Element to confirm).
 *   4. Attach a 2-phase Subscription Schedule (intro × 1 cycle → renewal) so the
 *      price automatically steps up to the standard rate after the intro window.
 *
 * SECURITY: the browser only sends `plan_key`; never a Price ID, amount, or
 * currency. All Stripe mutations carry idempotency keys derived from the unique
 * per-attempt paymentMethodId so network retries can't double-charge.
 */
export async function POST(request: Request) {
  try {
    const parsed = await readJsonObject(request, {
      maxBytes: 16 * 1024,
      requireJsonContentType: true,
    });
    if (!parsed.ok) return jsonInputError(parsed);

    const body = parsed.body;
    const planKeyRaw = body.plan_key;
    const emailRaw = typeof body.email === "string" ? body.email : "";
    const paymentMethodId = body.paymentMethodId;
    const funnel_step =
      typeof body.funnel_step === "string" ? body.funnel_step : "subscription";
    const quiz_result_id =
      typeof body.quiz_result_id === "string" ? body.quiz_result_id : "";
    const user_name = typeof body.user_name === "string" ? body.user_name : "";
    const analyticsEventId =
      typeof body.analytics_event_id === "string"
        ? body.analytics_event_id.slice(0, 200)
        : "";
    const analyticsContext =
      body.analytics_context && typeof body.analytics_context === "object"
        ? (body.analytics_context as AnalyticsContext)
        : {};

    if (!isPlanKey(planKeyRaw)) {
      return Response.json({ error: "valid plan_key required" }, { status: 400 });
    }
    if (typeof paymentMethodId !== "string" || !paymentMethodId) {
      return Response.json(
        { error: "paymentMethodId required" },
        { status: 400 },
      );
    }
    if (!emailRaw || !emailRaw.includes("@")) {
      return Response.json({ error: "email required" }, { status: 400 });
    }

    const planKey = planKeyRaw;
    const plan = PLANS[planKey];
    const email = emailRaw.trim().toLowerCase();
    const productKey = planKeyToProductKey(planKey);

    const prices = resolvePlanPrices(planKey);
    if (!prices) {
      // Prices not provisioned for this environment — fail closed, never guess.
      console.error(`[api/billing/checkout] missing Stripe prices for ${planKey}`);
      return Response.json(
        { error: "This plan is not available right now." },
        { status: 503 },
      );
    }

    const limit = await enforceRateLimit("createSubscription", {
      request,
      email,
      productKey,
    });
    if (!limit.ok) {
      if (limit.kind === "limited") return rateLimitResponse(limit);
      return temporaryUnavailableResponse();
    }

    const stripe = getStripeClient();
    const funnelMeta = {
      ...buildStripeFunnelMetadata({
        product_key: productKey,
        email,
        funnel_step,
        quiz_result_id,
        user_name,
      }),
      plan_key: planKey,
    };

    // 1. Customer (idempotent create keyed on email).
    let customer: Stripe.Customer;
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) {
      customer = existing.data[0];
      await stripe.customers.update(customer.id, { metadata: funnelMeta });
    } else {
      customer = await stripe.customers.create(
        { email, metadata: funnelMeta },
        { idempotencyKey: `cust_create:${email}` },
      );
    }

    // 2. Attach + default the payment method.
    await stripe.paymentMethods.attach(
      paymentMethodId,
      { customer: customer.id },
      { idempotencyKey: `pm_attach:${paymentMethodId}` },
    );
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // 3. Subscription on the INTRO price (collect first payment now).
    const subscription = await stripe.subscriptions.create(
      {
        customer: customer.id,
        items: [{ price: prices.introPriceId }],
        payment_settings: { save_default_payment_method: "on_subscription" },
        metadata: funnelMeta,
        expand: ["latest_invoice.payment_intent"],
      },
      { idempotencyKey: `sub_create:${paymentMethodId}` },
    );

    const invoice = subscription.latest_invoice as Stripe.Invoice & {
      payment_intent?: Stripe.PaymentIntent | string;
    };
    const rawPI = invoice?.payment_intent;
    const paymentIntent =
      typeof rawPI === "string"
        ? null
        : (rawPI as Stripe.PaymentIntent | undefined);

    if (
      !subscriptionVerificationEvidenceReady({
        subscriptionId: subscription.id,
        paymentIntentId: paymentIntent?.id,
        clientSecret: paymentIntent?.client_secret,
      })
    ) {
      return Response.json(
        {
          error:
            "Unable to initialize subscription payment verification. Please try again.",
        },
        { status: 502 },
      );
    }

    // 4. Attach the intro→renewal schedule (best-effort: payment already
    //    initialized; if scheduling fails the webhook/portal can reconcile the
    //    renewal step rather than failing a charged checkout).
    try {
      const schedule = await stripe.subscriptionSchedules.create(
        { from_subscription: subscription.id },
        { idempotencyKey: `sched_create:${subscription.id}` },
      );
      const currentPhaseStart = schedule.phases[0]?.start_date;
      await stripe.subscriptionSchedules.update(schedule.id, {
        end_behavior: "release",
        metadata: funnelMeta,
        phases: [
          {
            items: [{ price: prices.introPriceId, quantity: 1 }],
            ...(currentPhaseStart ? { start_date: currentPhaseStart } : {}),
            // Stripe SDK 22.x: phases use `duration` ({ interval, interval_count }),
            // not the legacy `iterations`. The intro phase lasts exactly the intro
            // window (all windows are whole weeks: 7/28/84d → 1/4/12), after which
            // the schedule steps to the renewal phase. Equivalent to one intro
            // billing cycle because the intro price's interval == the window.
            duration: { interval: "week", interval_count: plan.introDays / 7 },
          },
          {
            items: [{ price: prices.renewalPriceId, quantity: 1 }],
          },
        ],
      });
    } catch (scheduleError) {
      console.error(
        "[api/billing/checkout] failed to attach intro→renewal schedule",
        scheduleError,
      );
    }

    try {
      await recordAnalyticsEvent({
        event_name: FIRST_PARTY_EVENTS.paymentIntentCreated,
        anonymous_id: asString(analyticsContext.anonymous_id, 128),
        session_id: asString(analyticsContext.session_id, 128),
        path: asString(analyticsContext.path, 1000),
        referrer: asString(analyticsContext.referrer, 1000),
        utm_source: asString(analyticsContext.utm_source, 200),
        utm_medium: asString(analyticsContext.utm_medium, 200),
        utm_campaign: asString(analyticsContext.utm_campaign, 300),
        utm_content: asString(analyticsContext.utm_content, 300),
        utm_term: asString(analyticsContext.utm_term, 300),
        fbclid: asString(analyticsContext.fbclid, 500),
        fbp: asString(analyticsContext.fbp, 300),
        fbc: asString(analyticsContext.fbc, 600),
        meta_event_id: analyticsEventId,
        metadata: {
          product_key: productKey,
          plan_key: planKey,
          stripe_subscription_id: subscription.id,
          stripe_payment_intent_id: paymentIntent?.id ?? null,
          value: plan.introAmount / 100,
          currency: plan.currency,
          funnel_step,
        },
      });

      await sendMetaEvent({
        event_name: "InitiateCheckout",
        event_id: analyticsEventId,
        event_source_url: asString(analyticsContext.path, 1000)
          ? new URL(asString(analyticsContext.path, 1000), request.url).toString()
          : request.url,
        user_data: {
          client_ip_address: requestIp(request),
          client_user_agent: request.headers.get("user-agent"),
          fbp: asString(analyticsContext.fbp, 300),
          fbc: asString(analyticsContext.fbc, 600),
          email,
        },
        custom_data: {
          product_key: productKey,
          content_name: `FocusRoute Membership — ${plan.name}`,
          content_ids: [productKey, planKey],
          content_type: "subscription",
          value: plan.introAmount / 100,
          currency: plan.currency,
        },
      });
    } catch (analyticsError) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[analytics] billing checkout failed", analyticsError);
      }
    }

    return Response.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret ?? null,
      status: subscription.status,
      plan_key: planKey,
      value: plan.introAmount / 100,
      currency: plan.currency,
    });
  } catch (err) {
    console.error("[api/billing/checkout]", err);
    const message =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : "Unable to start checkout";
    return Response.json({ error: message }, { status: 500 });
  }
}
