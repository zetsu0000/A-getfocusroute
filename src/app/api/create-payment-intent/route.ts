import Stripe from "stripe";

import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import { recordAnalyticsEvent } from "@/lib/analytics/server";
import { sendMetaEvent } from "@/lib/meta/conversions";
import { buildStripeFunnelMetadata } from "@/lib/stripe/metadata";
import { resolveOneTimeProductKey } from "@/lib/stripe/productKeyPolicy";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
    const body = (await request.json()) as Record<string, unknown>;
    const priceId = body.priceId;
    const email = typeof body.email === "string" ? body.email : "";
    const funnel_step =
      typeof body.funnel_step === "string" ? body.funnel_step : "";
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
    if (!funnel_step) {
      return Response.json({ error: "funnel_step required" }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return Response.json({ error: "email required" }, { status: 400 });
    }

    const productKey = resolveOneTimeProductKey(priceId, funnel_step);
    if (!productKey) {
      return Response.json(
        { error: "Invalid priceId for this funnel_step" },
        { status: 400 },
      );
    }

    const price = await stripe.prices.retrieve(priceId);
    const amount = price.unit_amount!;

    const emailNorm = email.trim().toLowerCase();
    const funnelMeta = buildStripeFunnelMetadata({
      product_key: productKey,
      email: emailNorm,
      funnel_step,
      quiz_result_id,
      user_name,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: price.currency,
      automatic_payment_methods: { enabled: true },
      receipt_email: emailNorm,
      metadata: {
        ...funnelMeta,
        priceId,
        analytics_event_id: analyticsEventId,
        anonymous_id: asString(analyticsContext.anonymous_id, 128),
        session_id: asString(analyticsContext.session_id, 128),
        fbp: asString(analyticsContext.fbp, 300),
        fbc: asString(analyticsContext.fbc, 600),
      },
    });

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
          stripe_payment_intent_id: paymentIntent.id,
          value: amount / 100,
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
          email: emailNorm,
        },
        custom_data: {
          product_key: productKey,
          content_name:
            productKey === "brain_profile"
              ? "FocusRoute Brain Profile"
              : "FocusRoute 28-Day Protocol",
          content_ids: [productKey, priceId],
          content_type: "product",
          value: amount / 100,
          currency: price.currency,
        },
      });
    } catch (analyticsError) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[analytics] payment_intent_created failed", analyticsError);
      }
    }

    return Response.json({
      clientSecret: paymentIntent.client_secret,
      value: amount / 100,
      currency: price.currency,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
