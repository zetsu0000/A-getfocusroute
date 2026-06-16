import { userHasAnyEntitlement } from "@/lib/access/entitlements";
import { getStripeClient } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Authenticated Stripe Customer Portal session.
 *
 * SECURITY:
 *   - Requires a signed-in Supabase user; never trusts a client-supplied customer.
 *   - Gated on the `billing_portal` (or `membership`) entitlement.
 *   - Resolves the Stripe customer server-side from the user's own rows
 *     (subscriptions → purchases → Stripe lookup by verified account email).
 *   - `return_url` is derived from the request origin + an allow-listed relative
 *     path, so it can't be used as an open redirect.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const allowed = await userHasAnyEntitlement(user.id, [
      "billing_portal",
      "membership",
    ]);
    if (!allowed) {
      return Response.json({ error: "No active membership" }, { status: 403 });
    }

    const returnPath = await readReturnPath(request);
    const returnUrl = new URL(returnPath, request.url).toString();

    const customerId = await resolveStripeCustomerId(user.id, user.email);
    if (!customerId) {
      return Response.json(
        { error: "No billing account found" },
        { status: 404 },
      );
    }

    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[api/billing/portal]", err);
    const message =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : "Unable to open billing portal";
    return Response.json({ error: message }, { status: 500 });
  }
}

/** Only accept a same-site relative path; default to the dashboard. */
async function readReturnPath(request: Request): Promise<string> {
  try {
    const body = (await request.json()) as { return_path?: unknown };
    const raw = typeof body.return_path === "string" ? body.return_path : "";
    if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  } catch {
    // No/invalid JSON body — fall through to default.
  }
  return "/dashboard";
}

/**
 * Resolve the user's Stripe customer id from their own data only:
 * 1. subscriptions (most recent), 2. purchases (most recent),
 * 3. Stripe customer lookup by the authenticated account email.
 */
async function resolveStripeCustomerId(
  userId: string,
  email: string,
): Promise<string | null> {
  const admin = createAdminClient();

  const { data: subRow } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (subRow?.stripe_customer_id) return subRow.stripe_customer_id as string;

  const { data: purchaseRow } = await admin
    .from("purchases")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (purchaseRow?.stripe_customer_id) {
    return purchaseRow.stripe_customer_id as string;
  }

  const stripe = getStripeClient();
  const found = await stripe.customers.list({
    email: email.trim().toLowerCase(),
    limit: 1,
  });
  return found.data[0]?.id ?? null;
}
