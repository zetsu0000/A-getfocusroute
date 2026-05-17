import type Stripe from "stripe";
import { getEntitlementsForProduct, type ProductKey } from "./products";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

type ProfileRow = {
  id: string;
  email: string;
};

type PurchaseRow = {
  id: string;
  user_id: string | null;
  email: string;
  stripe_customer_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  product_key: string;
  amount: number | null;
  currency: string;
  status: string;
};

type SubscriptionRow = {
  id: string;
  user_id: string | null;
  email: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  price_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

type EntitlementSource = "purchase" | "subscription";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://xhzpmeplpsgnhfzgleaz.supabase.co";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

function getServiceRoleKey() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return SUPABASE_SERVICE_ROLE_KEY;
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? "";
}

function toIsoFromUnix(value?: number | null) {
  if (!value) return null;
  return new Date(value * 1000).toISOString();
}

function stripeId(value: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function postgresOrFilter(filters: Record<string, string | null | undefined>) {
  return Object.entries(filters)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}.eq.${value}`)
    .join(",");
}

async function supabaseRest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: getServiceRoleKey(),
      Authorization: `Bearer ${getServiceRoleKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      typeof body?.message === "string"
        ? body.message
        : `Supabase request failed: ${response.status}`
    );
  }

  return body as T;
}

async function selectOne<T>(path: string): Promise<T | null> {
  const rows = await supabaseRest<T[]>(`${path}&limit=1`);
  return rows[0] ?? null;
}

async function insertRow<T>(table: string, payload: Record<string, Json | undefined>) {
  return supabaseRest<T[]>(table, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  }).then((rows) => rows[0]);
}

async function updateRows<T>(tableAndQuery: string, payload: Record<string, Json | undefined>) {
  return supabaseRest<T[]>(tableAndQuery, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
}

export async function findUserIdByEmail(email?: string | null) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const profile = await selectOne<ProfileRow>(
    `profiles?select=id,email&email=eq.${encodeURIComponent(normalizedEmail)}`
  );

  return profile?.id ?? null;
}

async function findPurchase(params: {
  paymentIntentId?: string | null;
  checkoutSessionId?: string | null;
}) {
  const filter = postgresOrFilter({
    stripe_payment_intent_id: params.paymentIntentId,
    stripe_checkout_session_id: params.checkoutSessionId,
  });

  if (!filter) return null;

  return selectOne<PurchaseRow>(`purchases?select=*&or=(${filter})`);
}

export async function savePurchase(params: {
  userId?: string | null;
  email: string;
  customerId?: string | null;
  paymentIntentId?: string | null;
  checkoutSessionId?: string | null;
  productKey: ProductKey;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
}) {
  const email = normalizeEmail(params.email);
  if (!email) throw new Error("Purchase email is required.");

  const payload = {
    user_id: params.userId ?? null,
    email,
    stripe_customer_id: params.customerId ?? null,
    stripe_payment_intent_id: params.paymentIntentId ?? null,
    stripe_checkout_session_id: params.checkoutSessionId ?? null,
    product_key: params.productKey,
    amount: params.amount ?? null,
    currency: (params.currency ?? "usd").toLowerCase(),
    status: params.status ?? "paid",
    updated_at: new Date().toISOString(),
  };

  const existing = await findPurchase({
    paymentIntentId: params.paymentIntentId,
    checkoutSessionId: params.checkoutSessionId,
  });

  if (existing) {
    const [updated] = await updateRows<PurchaseRow>(`purchases?id=eq.${existing.id}`, payload);
    return updated;
  }

  return insertRow<PurchaseRow>("purchases", payload);
}

async function findEntitlement(params: {
  entitlementKey: string;
  source: EntitlementSource;
  sourceId: string;
}) {
  return selectOne<{ id: string }>(
    `entitlements?select=id&entitlement_key=eq.${encodeURIComponent(params.entitlementKey)}&source=eq.${params.source}&source_id=eq.${encodeURIComponent(params.sourceId)}`
  );
}

export async function grantEntitlements(params: {
  userId?: string | null;
  email: string;
  productKey: ProductKey;
  source: EntitlementSource;
  sourceId: string;
  expiresAt?: string | null;
}) {
  const email = normalizeEmail(params.email);
  if (!email) throw new Error("Entitlement email is required.");

  const now = new Date().toISOString();
  const entitlements = getEntitlementsForProduct(params.productKey);

  await Promise.all(
    entitlements.map(async (entitlementKey) => {
      const payload = {
        user_id: params.userId ?? null,
        email,
        entitlement_key: entitlementKey,
        source: params.source,
        source_id: params.sourceId,
        active: true,
        granted_at: now,
        expires_at: params.expiresAt ?? null,
        updated_at: now,
      };

      const existing = await findEntitlement({
        entitlementKey,
        source: params.source,
        sourceId: params.sourceId,
      });

      if (existing) {
        await updateRows("entitlements?id=eq." + existing.id, payload);
        return;
      }

      await insertRow("entitlements", payload);
    })
  );
}

export async function deactivateEntitlementsBySource(params: {
  source: EntitlementSource;
  sourceId: string;
}) {
  await updateRows(
    `entitlements?source=eq.${params.source}&source_id=eq.${encodeURIComponent(params.sourceId)}`,
    { active: false, updated_at: new Date().toISOString() }
  );
}

export async function saveSubscription(params: {
  userId?: string | null;
  email: string;
  customerId?: string | null;
  subscriptionId: string;
  priceId?: string | null;
  status: string;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}) {
  const email = normalizeEmail(params.email);
  if (!email) throw new Error("Subscription email is required.");

  const payload = {
    user_id: params.userId ?? null,
    email,
    stripe_customer_id: params.customerId ?? null,
    stripe_subscription_id: params.subscriptionId,
    price_id: params.priceId ?? null,
    status: params.status,
    current_period_start: params.currentPeriodStart ?? null,
    current_period_end: params.currentPeriodEnd ?? null,
    cancel_at_period_end: params.cancelAtPeriodEnd ?? false,
    updated_at: new Date().toISOString(),
  };

  const existing = await selectOne<SubscriptionRow>(
    `subscriptions?select=*&stripe_subscription_id=eq.${encodeURIComponent(params.subscriptionId)}`
  );

  if (existing) {
    const [updated] = await updateRows<SubscriptionRow>(`subscriptions?id=eq.${existing.id}`, payload);
    return updated;
  }

  return insertRow<SubscriptionRow>("subscriptions", payload);
}

export function subscriptionSnapshot(subscription: Stripe.Subscription) {
  const firstItem = subscription.items.data[0];
  const values = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };

  return {
    customerId: stripeId(subscription.customer),
    priceId: firstItem?.price?.id ?? null,
    status: subscription.status,
    currentPeriodStart: toIsoFromUnix(values.current_period_start),
    currentPeriodEnd: toIsoFromUnix(values.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
}

export function isSubscriptionActive(status: Stripe.Subscription.Status | string) {
  return status === "active" || status === "trialing";
}
