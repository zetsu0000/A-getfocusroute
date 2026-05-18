import Stripe from "stripe";

import {
  abortStripeEventProcessing,
  beginStripeEventProcessing,
  processStripeWebhookEvent,
} from "@/lib/stripe/processWebhook";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!webhookSecret) {
    return Response.json(
      { error: "Stripe webhook is not configured" },
      { status: 503 },
    );
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature error";
    return Response.json({ error: message }, { status: 400 });
  }

  const started = await beginStripeEventProcessing(event);
  if (!started) {
    return Response.json({ received: true, duplicate: true });
  }

  try {
    await processStripeWebhookEvent(event);
  } catch (e) {
    console.error("[stripe/webhook]", e);
    await abortStripeEventProcessing(event);
    return Response.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return Response.json({ received: true });
}
