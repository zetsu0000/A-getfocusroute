import type Stripe from "stripe";

import { isSubscriptionProduct } from "@/lib/access/products";
import {
  expectedFunnelStepForOneTimeProduct,
  isFunnelStep,
  isPaymentIntentId,
  isSubscriptionId,
  oneTimeProductCanAdvanceToStep,
  verdictForPaymentIntentStatus,
  type VerifyVerdict,
} from "@/lib/payment-verification";
import { getStripeClient } from "@/lib/stripe/client";
import {
  parseEmailFromMetadata,
  parseFunnelMetadata,
  parseProductKeyFromMetadata,
} from "@/lib/stripe/metadata";
import {
  paymentIntentProductKeyMatchesPolicy,
  subscriptionProductKeyMatchesPolicy,
} from "@/lib/stripe/productKeyPolicy";

type VerifyBody = {
  payment_intent?: unknown;
  target_step?: unknown;
  subscription_id?: unknown;
};

type InvoiceWithPaymentIntent = Stripe.Invoice & {
  payment_intent?: Stripe.PaymentIntent | string | null;
};

function coarseResponse(status: VerifyVerdict, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(
    { verified: status === "succeeded", status },
    {
      ...init,
      headers,
    },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stripeMetadataAsRecord(
  meta: Stripe.Metadata | null | undefined,
): Record<string, string | undefined> {
  return { ...(meta ?? {}) };
}

function verifyOneTimeIntent(
  intent: Stripe.PaymentIntent,
  targetStep: VerifyBody["target_step"],
): VerifyVerdict {
  if (!isFunnelStep(targetStep)) return "failed";

  const productKey = parseProductKeyFromMetadata(intent.metadata);
  const email = parseEmailFromMetadata(intent.metadata);
  if (!productKey || !email || isSubscriptionProduct(productKey)) {
    return "failed";
  }

  const expectedSourceStep = expectedFunnelStepForOneTimeProduct(productKey);
  const funnel = parseFunnelMetadata(intent.metadata).funnel_step;
  if (!expectedSourceStep || funnel !== expectedSourceStep) {
    return "failed";
  }

  if (!oneTimeProductCanAdvanceToStep(productKey, targetStep)) {
    return "failed";
  }

  if (
    !paymentIntentProductKeyMatchesPolicy(
      stripeMetadataAsRecord(intent.metadata),
      productKey,
    )
  ) {
    return "failed";
  }

  return verdictForPaymentIntentStatus(intent.status);
}

async function verifySubscriptionIntent(input: {
  stripe: Stripe;
  paymentIntentId: string;
  subscriptionId: string;
  targetStep: VerifyBody["target_step"];
}): Promise<VerifyVerdict> {
  if (input.targetStep !== "success") return "failed";

  const subscription = await input.stripe.subscriptions.retrieve(
    input.subscriptionId,
    { expand: ["latest_invoice.payment_intent", "items.data.price"] },
  );
  const invoice =
    typeof subscription.latest_invoice === "string"
      ? null
      : (subscription.latest_invoice as InvoiceWithPaymentIntent | null);
  const rawIntent = invoice?.payment_intent;
  const intent =
    typeof rawIntent === "string"
      ? await input.stripe.paymentIntents.retrieve(rawIntent)
      : rawIntent;

  if (!intent || intent.id !== input.paymentIntentId) {
    return "failed";
  }

  const funnel = parseFunnelMetadata(subscription.metadata ?? undefined);
  if (
    !funnel.email ||
    !funnel.product_key ||
    !isSubscriptionProduct(funnel.product_key) ||
    funnel.funnel_step !== "subscription"
  ) {
    return "failed";
  }

  if (!subscriptionProductKeyMatchesPolicy(subscription, funnel.product_key)) {
    return "failed";
  }

  return verdictForPaymentIntentStatus(intent.status);
}

/**
 * Server-side PaymentIntent verification for Stripe redirect returns.
 *
 * The client may only advance to a post-purchase funnel step after this route
 * confirms the returned PaymentIntent is both successful enough and belongs to
 * the expected part of this funnel. Responses stay coarse: no Stripe objects,
 * metadata, emails, client secrets, or raw provider errors leave the server.
 */
export async function POST(request: Request) {
  try {
    const parsed = (await request.json().catch(() => null)) as unknown;
    if (!isRecord(parsed)) {
      return coarseResponse("failed", { status: 400 });
    }

    const body = parsed as VerifyBody;
    const paymentIntentId = body.payment_intent;
    const targetStep = body.target_step;
    const subscriptionId = body.subscription_id;

    if (!isPaymentIntentId(paymentIntentId) || !isFunnelStep(targetStep)) {
      return coarseResponse("failed", { status: 400 });
    }
    if (subscriptionId !== undefined && !isSubscriptionId(subscriptionId)) {
      return coarseResponse("failed", { status: 400 });
    }

    const stripe = getStripeClient();
    const status =
      typeof subscriptionId === "string"
        ? await verifySubscriptionIntent({
            stripe,
            paymentIntentId,
            subscriptionId,
            targetStep,
          })
        : verifyOneTimeIntent(
            await stripe.paymentIntents.retrieve(paymentIntentId),
            targetStep,
          );

    return coarseResponse(status);
  } catch {
    return coarseResponse("failed");
  }
}
