import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  PRODUCT_TO_ENTITLEMENTS,
  type ProductKey,
  isProductKey,
} from "./products";

export const ENTITLEMENT_KEYS = [
  "brain_profile",
  "roadmap_28_day",
  "bonus_toolkit",
  "bonus_audio",
  "bonus_explain_script",
  "membership",
  "retake_quiz",
  "billing_portal",
] as const;

export type EntitlementKey = (typeof ENTITLEMENT_KEYS)[number];

export function isEntitlementKey(value: string): value is EntitlementKey {
  return (ENTITLEMENT_KEYS as readonly string[]).includes(value);
}

export function entitlementsGrantedByProduct(
  product: ProductKey,
): readonly EntitlementKey[] {
  return PRODUCT_TO_ENTITLEMENTS[product] as readonly EntitlementKey[];
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Active = active row and (no expires_at or expires_at in the future). */
export async function getActiveEntitlementKindsForUser(
  userId: string,
  email?: string,
): Promise<Set<EntitlementKey>> {
  const admin = createAdminClient();
  const normalized = email ? normalizeEmail(email) : null;
  let query = admin
    .from("entitlements")
    .select("entitlement_key, expires_at")
    .eq("active", true);

  query = normalized
    ? query.or(`user_id.eq.${userId},email.eq.${normalized}`)
    : query.eq("user_id", userId);

  const { data, error } = await query;

  if (error || !data) {
    return new Set();
  }

  const nowMs = Date.now();
  const out = new Set<EntitlementKey>();
  for (const row of data) {
    if (row.expires_at != null && new Date(row.expires_at).getTime() <= nowMs) {
      continue;
    }
    if (row.entitlement_key && isEntitlementKey(row.entitlement_key)) {
      out.add(row.entitlement_key);
    }
  }
  return out;
}

export async function userHasEntitlement(
  userId: string,
  kind: EntitlementKey,
): Promise<boolean> {
  const kinds = await getActiveEntitlementKindsForUser(userId);
  return kinds.has(kind);
}

export async function userHasAnyEntitlement(
  userId: string,
  kinds: readonly EntitlementKey[],
): Promise<boolean> {
  const active = await getActiveEntitlementKindsForUser(userId);
  return kinds.some((k) => active.has(k));
}

/**
 * Record a product purchase for an email before the user account exists.
 * Call from trusted server code only (e.g. Stripe webhook with service role).
 */
export async function grantProductByEmail(
  email: string,
  productKey: ProductKey,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const admin = createAdminClient();
  const normalized = normalizeEmail(email);
  const { error } = await admin.from("email_product_grants").insert({
    email: normalized,
    product_key: productKey,
    metadata,
  });
  if (error) {
    throw new Error(`grantProductByEmail: ${error.message}`);
  }
}

/**
 * Move pending email grants into `entitlements` for this user. Idempotent per key.
 */
export async function claimEmailProductGrantsForUser(
  userId: string,
  email: string,
): Promise<void> {
  const admin = createAdminClient();
  const normalized = normalizeEmail(email);

  const { data: grants, error: fetchError } = await admin
    .from("email_product_grants")
    .select("id, product_key, metadata")
    .eq("email", normalized)
    .is("claimed_user_id", null);

  if (fetchError) {
    throw new Error(`claimEmailProductGrantsForUser fetch: ${fetchError.message}`);
  }

  if (grants?.length) {
    for (const grant of grants) {
      if (!grant.id || typeof grant.product_key !== "string") continue;
      if (!isProductKey(grant.product_key)) continue;

      const keys = entitlementsGrantedByProduct(grant.product_key);

      for (const key of keys) {
        const { data: existing } = await admin
          .from("entitlements")
          .select("id")
          .eq("user_id", userId)
          .eq("entitlement_key", key)
          .eq("active", true)
          .maybeSingle();

        if (existing) continue;

        const { error: insErr } = await admin.from("entitlements").insert({
          user_id: userId,
          email: normalized,
          entitlement_key: key,
          source: "email_product_grant",
          source_id: grant.id,
          active: true,
        });
        if (insErr) {
          throw new Error(`claimEmailProductGrantsForUser insert: ${insErr.message}`);
        }
      }

      const { error: updErr } = await admin
        .from("email_product_grants")
        .update({
          claimed_at: new Date().toISOString(),
          claimed_user_id: userId,
        })
        .eq("id", grant.id)
        .is("claimed_user_id", null);

      if (updErr) {
        throw new Error(`claimEmailProductGrantsForUser update: ${updErr.message}`);
      }
    }
  }

  await linkAnonymousQuizResultsToUser(userId, email);
}

/**
 * Attach anonymous quiz rows (saved before login) to the user account by normalized email.
 */
export async function linkAnonymousQuizResultsToUser(
  userId: string,
  email: string,
): Promise<void> {
  const admin = createAdminClient();
  const normalized = normalizeEmail(email);
  const { error } = await admin
    .from("quiz_results")
    .update({ user_id: userId })
    .is("user_id", null)
    .eq("email", normalized);

  if (error) {
    console.error("[entitlements] linkAnonymousQuizResultsToUser", error.message);
  }
}

/** Any of these counts as paid access to the account dashboard. */
export const DASHBOARD_ENTITLEMENTS: readonly EntitlementKey[] = [
  "brain_profile",
  "roadmap_28_day",
  "membership",
];
