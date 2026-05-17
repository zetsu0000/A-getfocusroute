import Stripe from "stripe";
import {
  deactivateEntitlementsBySource,
  findUserIdByEmail,
  grantEntitlements,
  isSubscriptionActive,
  savePurchase,
  saveSubscription,
  subscriptionSnapshot,
} from "@/lib/access/entitlements";
import { assertProductKey, productKeyForPriceId } from "@/lib/access/products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? "";
}

function customerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined) {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

function getMetadataProductKey(metadata: Stripe.Metadata | null | undefined, priceId?: string | null) {
  const metadataProductKey = metadata?.product_key;
  if (metadataProductKey) return assertProductKey(metadataProductKey);

  const productKey = productKeyForPriceId(priceId);
  if (productKey) return productKey;

  throw new Error("Stripe object is missing product_key metadata.");
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const productKey = getMetadataProductKey(paymentIntent.metadata);
  const email = normalizeEmail(
    paymentIntent.metadata.email || paymentIntent.receipt_email || undefined
  );

  if (!email) throw new Error("PaymentIntent is missing email metadata.");

  const userId = await findUserIdByEmail(email);
  const purchase = await savePurchase({
    userId,
    email,
    customerId: customerId(paymentIntent.customer),
    paymentIntentId: paymentIntent.id,
    productKey,
    amount: paymentIntent.amount_received || paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
  });

  await grantEntitlements({
    userId,
    email,
    productKey,
    source: "purchase",
    sourceId: purchase.id,
  });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "payment") return;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const productKey = getMetadataProductKey(session.metadata);
  const email = normalizeEmail(
    session.metadata?.email || session.customer_details?.email || session.customer_email
  );

  if (!email) throw new Error("Checkout Session is missing email metadata.");

  const userId = await findUserIdByEmail(email);
  const purchase = await savePurchase({
    userId,
    email,
    customerId: customerId(session.customer),
    paymentIntentId,
    checkoutSessionId: session.id,
    productKey,
    amount: session.amount_total,
    currency: session.currency,
    status: session.payment_status,
  });

  await grantEntitlements({
    userId,
    email,
    productKey,
    source: "purchase",
    sourceId: purchase.id,
  });
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  const snapshot = subscriptionSnapshot(subscription);
  const productKey = getMetadataProductKey(subscription.metadata, snapshot.priceId);
  const email = normalizeEmail(subscription.metadata.email);

  if (!email) throw new Error("Subscription is missing email metadata.");

  const userId = await findUserIdByEmail(email);
  const savedSubscription = await saveSubscription({
    userId,
    email,
    subscriptionId: subscription.id,
    ...snapshot,
  });

  if (isSubscriptionActive(subscription.status)) {
    await grantEntitlements({
      userId,
      email,
      productKey,
      source: "subscription",
      sourceId: savedSubscription.id,
      expiresAt: snapshot.currentPeriodEnd,
    });
  } else {
    await deactivateEntitlementsBySource({
      source: "subscription",
      sourceId: savedSubscription.id,
    });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id ?? null;

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  });

  await handleSubscriptionEvent(subscription);
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      requiredEnv("STRIPE_WEBHOOK_SECRET")
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid Stripe webhook";
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }

    return Response.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
