import "server-only";

import Stripe from "stripe";

import { grantProductByEmail } from "@/lib/access/entitlements";
import type { ProductKey } from "@/lib/access/products";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import { recordAnalyticsEvent } from "@/lib/analytics/server";
import { sendMetaEvent } from "@/lib/meta/conversions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";
import {
  parseEmailFromMetadata,
  parseFunnelMetadata,
  parseProductKeyFromMetadata,
} from "@/lib/stripe/metadata";
import {
  firstSubscriptionItemPriceId,
  paymentIntentProductKeyMatchesPolicy,
  resolvePriceIdToProductKey,
  subscriptionProductKeyMatchesPolicy,
} from "@/lib/stripe/productKeyPolicy";

export async function beginStripeEventProcessing(
  event: Stripe.Event,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("stripe_webhook_events").insert({
    event_id: event.id,
    event_type: event.type,
  });
  if (error?.code === "23505") {
    return false;
  }
  if (error) {
    throw new Error(`stripe_webhook_events insert: ${error.message}`);
  }
  return true;
}

export async function abortStripeEventProcessing(
  event: Stripe.Event,
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("stripe_webhook_events").delete().eq("event_id", event.id);
}

export async function processStripeWebhookEvent(
  event: Stripe.Event,
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event);
      break;
    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(event);
      break;
    case "invoice.payment_succeeded":
    case "invoice.paid":
      await handleInvoicePaymentSucceeded(event);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpsert(event);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event);
      break;
    default:
      break;
  }
}

function subscriptionPeriodBounds(sub: Stripe.Subscription): {
  start: string | null;
  end: string | null;
} {
  const item = sub.items?.data?.[0];
  if (!item) {
    return { start: null, end: null };
  }
  const cps = item.current_period_start;
  const cpe = item.current_period_end;
  return {
    start: cps ? new Date(cps * 1000).toISOString() : null,
    end: cpe ? new Date(cpe * 1000).toISOString() : null,
  };
}

async function upsertSubscriptionRow(
  admin: ReturnType<typeof createAdminClient>,
  subInput: Stripe.Subscription,
  emailHint?: string | null,
): Promise<void> {
  const stripe = getStripeClient();
  let sub = subInput;
  if (!sub.items?.data?.length) {
    sub = await stripe.subscriptions.retrieve(sub.id, {
      expand: ["items.data"],
    });
  }

  const customerId =
    typeof sub.customer === "string"
      ? sub.customer
      : sub.customer?.id ?? "";
  const { start: cps, end: cpe } = subscriptionPeriodBounds(sub);
  const fm = parseFunnelMetadata(sub.metadata ?? undefined);
  const priceId = firstSubscriptionItemPriceId(sub);
  const email =
    emailHint ??
    fm.email ??
    (await resolveCustomerEmail(customerId)) ??
    "";

  const { error } = await admin.from("subscriptions").upsert(
    {
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      user_id: null,
      email,
      price_id: priceId,
      status: sub.status,
      current_period_start: cps,
      current_period_end: cpe,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
    },
    { onConflict: "stripe_subscription_id" },
  );
  if (error) {
    throw new Error(`subscriptions upsert: ${error.message}`);
  }
}

async function hasEmailGrantForPaymentIntent(
  admin: ReturnType<typeof createAdminClient>,
  paymentIntentId: string,
): Promise<boolean> {
  const { data } = await admin
    .from("email_product_grants")
    .select("id")
    .eq("metadata->>stripe_payment_intent_id", paymentIntentId)
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

async function grantSubscriptionProductOnce(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  productKey: ProductKey,
  subscriptionId: string,
  stripeEventId: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  const { data: existing } = await admin
    .from("email_product_grants")
    .select("id")
    .eq("metadata->>stripe_subscription_id", subscriptionId)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return;
  }

  await grantProductByEmail(email, productKey, {
    stripe_subscription_id: subscriptionId,
    stripe_event_id: stripeEventId,
    ...extra,
  });
}

async function resolveCustomerEmail(
  customerId: string | null | undefined,
): Promise<string | null> {
  if (!customerId) return null;
  const stripe = getStripeClient();
  const cust = await stripe.customers.retrieve(customerId);
  if (cust.deleted || !("email" in cust) || !cust.email) return null;
  return cust.email.trim().toLowerCase();
}

function piMetadataAsRecord(
  meta: Stripe.Metadata | null | undefined,
): Record<string, string | undefined> {
  return { ...(meta ?? {}) };
}

async function emitPurchaseAnalytics(input: {
  eventId: string;
  paymentIntentId?: string | null;
  checkoutSessionId?: string | null;
  email: string;
  productKey: ProductKey;
  amount: number | null;
  currency: string;
  priceId?: string | null;
  metadata?: Stripe.Metadata | null;
}): Promise<void> {
  const value =
    typeof input.amount === "number" && input.amount > 0
      ? input.amount / 100
      : null;
  const purchaseEventId = input.paymentIntentId
    ? `purchase_${input.paymentIntentId}`
    : input.checkoutSessionId
      ? `purchase_${input.checkoutSessionId}`
      : `purchase_${input.eventId}`;
  const meta = input.metadata ?? {};

  try {
    await recordAnalyticsEvent({
      event_name: FIRST_PARTY_EVENTS.purchaseSucceeded,
      anonymous_id: meta.anonymous_id,
      session_id: meta.session_id,
      fbp: meta.fbp,
      fbc: meta.fbc,
      meta_event_id: purchaseEventId,
      metadata: {
        product_key: input.productKey,
        stripe_payment_intent_id: input.paymentIntentId ?? null,
        stripe_checkout_session_id: input.checkoutSessionId ?? null,
        stripe_event_id: input.eventId,
        value,
        currency: input.currency,
      },
    });

    await sendMetaEvent({
      event_name: "Purchase",
      event_id: purchaseEventId,
      event_source_url: "https://getfocusroute.com/assessment",
      user_data: {
        fbp: meta.fbp,
        fbc: meta.fbc,
        email: input.email,
      },
      custom_data: {
        value,
        currency: input.currency,
        product_key: input.productKey,
        content_name:
          input.productKey === "roadmap_28_day"
            ? "FocusRoute 28-Day Protocol"
            : "FocusRoute Brain Profile",
        content_ids: [input.priceId ?? input.productKey],
        content_type: "product",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[analytics] purchase_succeeded failed", error);
    }
  }
}

async function handlePaymentIntentSucceeded(event: Stripe.Event): Promise<void> {
  const pi = event.data.object as Stripe.PaymentIntent;
  const admin = createAdminClient();

  const { data: existingPurchase } = await admin
    .from("purchases")
    .select("id")
    .eq("stripe_payment_intent_id", pi.id)
    .maybeSingle();

  if (existingPurchase) {
    return;
  }

  const hasExistingGrant = await hasEmailGrantForPaymentIntent(admin, pi.id);

  const email = parseEmailFromMetadata(pi.metadata);
  const productKey = parseProductKeyFromMetadata(pi.metadata);
  if (!email || !productKey) {
    return;
  }

  const metaFlat = piMetadataAsRecord(pi.metadata);
  if (!paymentIntentProductKeyMatchesPolicy(metaFlat, productKey)) {
    console.warn(
      "[stripe/webhook] payment_intent.succeeded product_key policy mismatch",
      { payment_intent: pi.id },
    );
    return;
  }

  const fm = parseFunnelMetadata(pi.metadata);
  const amount =
    typeof pi.amount_received === "number" && pi.amount_received > 0
      ? pi.amount_received
      : pi.amount;

  if (!hasExistingGrant) {
    await grantProductByEmail(email, productKey, {
      stripe_payment_intent_id: pi.id,
      stripe_event_id: event.id,
      funnel_step: fm.funnel_step,
      quiz_result_id: fm.quiz_result_id,
      user_name: fm.user_name,
    });
  }

  const stripeCustomerId =
    typeof pi.customer === "string"
      ? pi.customer
      : pi.customer?.id ?? null;

  const { error: insErr } = await admin.from("purchases").insert({
    user_id: null,
    email,
    stripe_customer_id: stripeCustomerId,
    stripe_payment_intent_id: pi.id,
    stripe_checkout_session_id: null,
    product_key: productKey,
    amount,
    currency: pi.currency ?? "usd",
    status: "succeeded",
  });

  if (insErr?.code === "23505") {
    return;
  }
  if (insErr) {
    throw new Error(`purchases insert: ${insErr.message}`);
  }

  await emitPurchaseAnalytics({
    eventId: event.id,
    paymentIntentId: pi.id,
    email,
    productKey,
    amount,
    currency: pi.currency ?? "usd",
    priceId: metaFlat.priceId ?? null,
    metadata: pi.metadata,
  });
}

async function handleCheckoutSessionCompleted(
  event: Stripe.Event,
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const admin = createAdminClient();
  const stripe = getStripeClient();

  const { data: existingBySession } = await admin
    .from("purchases")
    .select("id")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  if (existingBySession) {
    return;
  }

  const meta = session.metadata ?? undefined;
  let email =
    parseEmailFromMetadata(meta) ??
    (session.customer_details?.email
      ? session.customer_details.email.trim().toLowerCase()
      : null) ??
    (session.customer_email
      ? session.customer_email.trim().toLowerCase()
      : null);

  let productKey = parseProductKeyFromMetadata(meta);

  // Fallback: resolve from priceId in session metadata when product_key absent.
  if (!productKey && meta?.priceId) {
    productKey = resolvePriceIdToProductKey(meta.priceId);
  }
  if (!email) {
    const cid =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
    email = await resolveCustomerEmail(cid);
  }

  if (!email || !productKey) {
    return;
  }

  const fm = parseFunnelMetadata(meta);
  const baseGrantMeta = {
    stripe_checkout_session_id: session.id,
    stripe_event_id: event.id,
    funnel_step: fm.funnel_step,
    quiz_result_id: fm.quiz_result_id,
    user_name: fm.user_name,
  };

  if (session.mode === "payment") {
    const piId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (piId) {
      const { data: existingPi } = await admin
        .from("purchases")
        .select("id")
        .eq("stripe_payment_intent_id", piId)
        .maybeSingle();
      if (existingPi) {
        return;
      }
    }

    const sessionMetaFlat = piMetadataAsRecord(meta);
    if (!paymentIntentProductKeyMatchesPolicy(sessionMetaFlat, productKey)) {
      console.warn(
        "[stripe/webhook] checkout.session.completed payment product_key policy mismatch",
        { session: session.id },
      );
      return;
    }

    const hasExistingGrant = piId
      ? await hasEmailGrantForPaymentIntent(admin, piId)
      : false;

    if (!hasExistingGrant) {
      await grantProductByEmail(email, productKey, {
        ...baseGrantMeta,
        stripe_payment_intent_id: piId ?? undefined,
      });
    }

    const stripeCustomerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id ?? null;

    const { error: insErr } = await admin.from("purchases").insert({
      user_id: null,
      email,
      stripe_customer_id: stripeCustomerId,
      stripe_payment_intent_id: piId ?? null,
      stripe_checkout_session_id: session.id,
      product_key: productKey,
      amount: session.amount_total ?? null,
      currency: session.currency ?? "usd",
      status: "succeeded",
    });

    if (insErr?.code === "23505") {
      return;
    }
    if (insErr) {
      throw new Error(`purchases insert (checkout): ${insErr.message}`);
    }
    await emitPurchaseAnalytics({
      eventId: event.id,
      paymentIntentId: piId ?? null,
      checkoutSessionId: session.id,
      email,
      productKey,
      amount: session.amount_total ?? null,
      currency: session.currency ?? "usd",
      priceId: meta?.priceId ?? null,
      metadata: meta ?? null,
    });
    return;
  }

  if (session.mode === "subscription") {
    const subId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;
    if (!subId) {
      return;
    }

    let sub = await stripe.subscriptions.retrieve(subId);
    if (!sub.items?.data?.length) {
      sub = await stripe.subscriptions.retrieve(subId, {
        expand: ["items.data"],
      });
    }
    await upsertSubscriptionRow(admin, sub, email);

    if (!subscriptionProductKeyMatchesPolicy(sub, productKey)) {
      console.warn(
        "[stripe/webhook] checkout subscription product_key mismatch",
        { subscription: sub.id, session: session.id },
      );
      return;
    }

    await grantSubscriptionProductOnce(
      admin,
      email,
      productKey,
      sub.id,
      event.id,
      baseGrantMeta,
    );
  }
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const inv = invoice as Stripe.Invoice & {
    parent?: {
      type?: string;
      subscription_details?: {
        subscription?: string | Stripe.Subscription;
      };
    };
    subscription?: string | Stripe.Subscription | null;
  };

  const parentSub = inv.parent?.subscription_details?.subscription;
  if (typeof parentSub === "string") {
    return parentSub;
  }
  if (parentSub && typeof parentSub === "object" && "id" in parentSub) {
    return parentSub.id;
  }

  const legacy = inv.subscription;
  if (typeof legacy === "string") {
    return legacy;
  }
  if (legacy && typeof legacy === "object" && "id" in legacy) {
    return legacy.id;
  }

  return null;
}

async function handleInvoicePaymentSucceeded(
  event: Stripe.Event,
): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  const subId = invoiceSubscriptionId(invoice);
  if (!subId) {
    return;
  }

  const stripe = getStripeClient();
  let sub = await stripe.subscriptions.retrieve(subId);
  if (!sub.items?.data?.length) {
    sub = await stripe.subscriptions.retrieve(subId, {
      expand: ["items.data"],
    });
  }
  const admin = createAdminClient();
  await upsertSubscriptionRow(admin, sub);
}

async function handleSubscriptionUpsert(event: Stripe.Event): Promise<void> {
  let sub = event.data.object as Stripe.Subscription;
  const admin = createAdminClient();
  const stripe = getStripeClient();
  if (!sub.items?.data?.length) {
    sub = await stripe.subscriptions.retrieve(sub.id, {
      expand: ["items.data"],
    });
  }

  const parsed = parseFunnelMetadata(sub.metadata ?? undefined);
  let email = parsed.email;
  let productKey: ProductKey | null = parsed.product_key;

  // Fallback: resolve from subscription price ID when metadata.product_key absent.
  if (!productKey) {
    const subPriceId = firstSubscriptionItemPriceId(sub);
    if (subPriceId) productKey = resolvePriceIdToProductKey(subPriceId);
  }

  if (!email) {
    const cid =
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    email = await resolveCustomerEmail(cid);
  }

  await upsertSubscriptionRow(admin, sub, email);

  if (sub.status === "canceled") {
    await finalizeSubscriptionCancellation(admin, sub.id);
    return;
  }

  if (!email || !productKey) {
    return;
  }

  if (!subscriptionProductKeyMatchesPolicy(sub, productKey)) {
    console.warn("[stripe/webhook] subscription metadata product_key mismatch", {
      subscription: sub.id,
    });
    return;
  }

  await grantSubscriptionProductOnce(admin, email, productKey, sub.id, event.id, {
    funnel_step: parsed.funnel_step,
    quiz_result_id: parsed.quiz_result_id,
    user_name: parsed.user_name,
  });
}

/** Entitlement keys issued from membership subscriptions via email product grants. */
const SUBSCRIPTION_ENTITLEMENT_KINDS = [
  "membership",
  "retake_quiz",
  "billing_portal",
] as const;

async function deactivateSubscriptionLinkedEntitlements(
  admin: ReturnType<typeof createAdminClient>,
  subscriptionId: string,
): Promise<void> {
  const endsAt = new Date().toISOString();
  const { data: grants, error: selErr } = await admin
    .from("email_product_grants")
    .select("id")
    .eq("metadata->>stripe_subscription_id", subscriptionId);

  if (selErr) {
    throw new Error(`email_product_grants select for subscription cancel: ${selErr.message}`);
  }

  const grantIds = (grants ?? []).map((row) => row.id).filter(Boolean);
  if (grantIds.length === 0) {
    return;
  }

  const { error: upErr } = await admin
    .from("entitlements")
    .update({ active: false, expires_at: endsAt })
    .eq("source", "email_product_grant")
    .in("source_id", grantIds)
    .eq("active", true)
    .in("entitlement_key", [...SUBSCRIPTION_ENTITLEMENT_KINDS]);

  if (upErr) {
    throw new Error(`entitlements deactivate: ${upErr.message}`);
  }
}

async function finalizeSubscriptionCancellation(
  admin: ReturnType<typeof createAdminClient>,
  subscriptionId: string,
): Promise<void> {
  await deleteUnclaimedGrantsForSubscription(admin, subscriptionId);
  await deactivateSubscriptionLinkedEntitlements(admin, subscriptionId);
}

async function deleteUnclaimedGrantsForSubscription(
  admin: ReturnType<typeof createAdminClient>,
  subscriptionId: string,
): Promise<void> {
  const { data: rows, error: selErr } = await admin
    .from("email_product_grants")
    .select("id")
    .eq("metadata->>stripe_subscription_id", subscriptionId)
    .is("claimed_user_id", null);

  if (selErr) {
    throw new Error(`email_product_grants select (cancel): ${selErr.message}`);
  }

  for (const row of rows ?? []) {
    if (!row.id) continue;
    const { error: delErr } = await admin
      .from("email_product_grants")
      .delete()
      .eq("id", row.id);
    if (delErr) {
      throw new Error(`email_product_grants delete (cancel): ${delErr.message}`);
    }
  }
}

async function handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
  const sub = event.data.object as Stripe.Subscription;
  const admin = createAdminClient();

  const { error: subErr } = await admin
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
    })
    .eq("stripe_subscription_id", sub.id);

  if (subErr) {
    throw new Error(`subscriptions cancel: ${subErr.message}`);
  }

  await finalizeSubscriptionCancellation(admin, sub.id);
}
