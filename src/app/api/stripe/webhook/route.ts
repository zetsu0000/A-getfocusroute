import Stripe from "stripe";

import { getStripeClient } from "@/lib/stripe/client";
import {
  abortStripeEventProcessing,
  beginStripeEventProcessing,
  processStripeWebhookEvent,
} from "@/lib/stripe/processWebhook";

const MAX_WEBHOOK_BODY_BYTES = 1024 * 1024;

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return Response.json(
      { error: "Stripe webhook is not configured" },
      { status: 503 },
    );
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_WEBHOOK_BODY_BYTES) {
    return Response.json({ error: "Webhook payload too large" }, { status: 413 });
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).length > MAX_WEBHOOK_BODY_BYTES) {
    return Response.json({ error: "Webhook payload too large" }, { status: 413 });
  }
  const sig = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
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
