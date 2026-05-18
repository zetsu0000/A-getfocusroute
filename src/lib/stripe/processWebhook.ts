import "server-only";

import Stripe from "stripe";

import { grantProductByEmail } from "@/lib/access/entitlements";
import type { ProductKey } from "@/lib/access/products";
import { createAdminClient } from "@/lib/supabase/admin";
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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
): Promise<void> {
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

  const { error } = await admin.from("subscriptions").upsert(
    {
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      user_id: null,
      status: sub.status,
      current_period_start: cps,
      current_period_end: cpe,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      metadata: {
        ...fm,
        stripe_subscription_id: sub.id,
      },
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
  const cust = await stripe.customers.retrieve(customerId);
  if (cust.deleted || !("email" in cust) || !cust.email) return null;
  return cust.email.trim().toLowerCase();
}

function piMetadataAsRecord(
  meta: Stripe.Metadata | null | undefined,
): Record<string, string | undefined> {
  return { ...(meta ?? {}) };
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

  if (await hasEmailGrantForPaymentIntent(admin, pi.id)) {
    return;
  }

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

  await grantProductByEmail(email, productKey, {
    stripe_payment_intent_id: pi.id,
    stripe_event_id: event.id,
    funnel_step: fm.funnel_step,
    quiz_result_id: fm.quiz_result_id,
    user_name: fm.user_name,
  });

  const { error: insErr } = await admin.from("purchases").insert({
    user_id: null,
    stripe_payment_intent_id: pi.id,
    stripe_checkout_session_id: null,
    amount_cents: amount,
    currency: pi.currency ?? "usd",
    status: "succeeded",
    metadata: {
      ...fm,
      product_key: productKey,
      stripe_event_id: event.id,
    },
  });

  if (insErr?.code === "23505") {
    return;
  }
  if (insErr) {
    throw new Error(`purchases insert: ${insErr.message}`);
  }
}

async function handleCheckoutSessionCompleted(
  event: Stripe.Event,
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const admin = createAdminClient();

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
      if (await hasEmailGrantForPaymentIntent(admin, piId)) {
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

    await grantProductByEmail(email, productKey, {
      ...baseGrantMeta,
      stripe_payment_intent_id: piId ?? undefined,
    });

    const { error: insErr } = await admin.from("purchases").insert({
      user_id: null,
      stripe_payment_intent_id: piId ?? null,
      stripe_checkout_session_id: session.id,
      amount_cents: session.amount_total ?? null,
      currency: session.currency ?? "usd",
      status: "succeeded",
      metadata: {
        ...fm,
        product_key: productKey,
        stripe_event_id: event.id,
        checkout_session_id: session.id,
      },
    });

    if (insErr?.code === "23505") {
      return;
    }
    if (insErr) {
      throw new Error(`purchases insert (checkout): ${insErr.message}`);
    }
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
    await upsertSubscriptionRow(admin, sub);

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
  if (!sub.items?.data?.length) {
    sub = await stripe.subscriptions.retrieve(sub.id, {
      expand: ["items.data"],
    });
  }
  await upsertSubscriptionRow(admin, sub);

  if (sub.status === "canceled") {
    await finalizeSubscriptionCancellation(admin, sub.id);
    return;
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

/** Entitlement kinds issued from membership subscriptions (Stripe subscription id in metadata). */
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
  const { data: rows, error: selErr } = await admin
    .from("entitlements")
    .select("id")
    .eq("metadata->>stripe_subscription_id", subscriptionId)
    .eq("active", true)
    .in("kind", [...SUBSCRIPTION_ENTITLEMENT_KINDS]);

  if (selErr) {
    throw new Error(`entitlements select for subscription cancel: ${selErr.message}`);
  }

  for (const row of rows ?? []) {
    if (!row.id) continue;
    const { error: upErr } = await admin
      .from("entitlements")
      .update({ active: false, ends_at: endsAt })
      .eq("id", row.id)
      .eq("active", true);
    if (upErr) {
      throw new Error(`entitlements deactivate: ${upErr.message}`);
    }
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
