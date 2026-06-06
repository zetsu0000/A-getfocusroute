import Stripe from "stripe";

import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import { recordAnalyticsEvent } from "@/lib/analytics/server";
import { sendMetaEvent } from "@/lib/meta/conversions";
import { getStripeClient } from "@/lib/stripe/client";
import { buildStripeFunnelMetadata } from "@/lib/stripe/metadata";
import { resolveMembershipProductKey } from "@/lib/stripe/productKeyPolicy";

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

export async function POST(request: Request) {
  try {
    const stripe = getStripeClient();
    const body = (await request.json()) as Record<string, unknown>;
    const priceId = body.priceId;
    const emailRaw = typeof body.email === "string" ? body.email : "";
    const paymentMethodId = body.paymentMethodId;
    const funnel_step =
      typeof body.funnel_step === "string" ? body.funnel_step : "subscription";
    const quiz_result_id =
      typeof body.quiz_result_id === "string" ? body.quiz_result_id : "";
    const user_name =
      typeof body.user_name === "string" ? body.user_name : "";
    const analyticsEventId =
      typeof body.analytics_event_id === "string"
        ? body.analytics_event_id.slice(0, 200)
        : "";
    const analyticsContext =
      body.analytics_context && typeof body.analytics_context === "object"
        ? (body.analytics_context as AnalyticsContext)
        : {};

    if (typeof priceId !== "string" || !priceId) {
      return Response.json({ error: "priceId required" }, { status: 400 });
    }
    if (typeof paymentMethodId !== "string" || !paymentMethodId) {
      return Response.json({ error: "paymentMethodId required" }, { status: 400 });
    }
    if (!emailRaw || !emailRaw.includes("@")) {
      return Response.json({ error: "email required" }, { status: 400 });
    }

    const email = emailRaw.trim().toLowerCase();

    const productKey = resolveMembershipProductKey(priceId);
    if (!productKey) {
      return Response.json({ error: "Invalid priceId" }, { status: 400 });
    }

    const funnelMeta = buildStripeFunnelMetadata({
      product_key: productKey,
      email,
      funnel_step,
      quiz_result_id,
      user_name,
    });

    let customer: Stripe.Customer;
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) {
      customer = existing.data[0];
      await stripe.customers.update(customer.id, { metadata: funnelMeta });
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: funnelMeta,
      });
    }

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      metadata: funnelMeta,
      expand: ["latest_invoice.payment_intent"],
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice & {
      payment_intent?: Stripe.PaymentIntent | string;
    };
    const rawPI = invoice?.payment_intent;
    const paymentIntent =
      typeof rawPI === "string" ? null : (rawPI as Stripe.PaymentIntent | undefined);
    const price = await stripe.prices.retrieve(priceId);

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
          stripe_subscription_id: subscription.id,
          stripe_payment_intent_id: paymentIntent?.id ?? null,
          value: typeof price.unit_amount === "number" ? price.unit_amount / 100 : null,
          currency: price.currency,
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
          content_name: "FocusRoute Membership",
          content_ids: [productKey, priceId],
          content_type: "subscription",
          value: typeof price.unit_amount === "number" ? price.unit_amount / 100 : null,
          currency: price.currency,
        },
      });
    } catch (analyticsError) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[analytics] subscription checkout failed", analyticsError);
      }
    }

    return Response.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret ?? null,
      status: subscription.status,
      value: typeof price.unit_amount === "number" ? price.unit_amount / 100 : null,
      currency: price.currency,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
