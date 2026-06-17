/**
 * Provision the 6 V2 subscription Price IDs in Stripe **TEST mode**.
 *
 * Creates (idempotently) one product per plan and an intro + renewal recurring
 * price for each, then prints the STRIPE_PRICE_PLAN_* env lines to paste into
 * .env.local. The amounts/intervals here are the contract — they must match
 * src/lib/billing/plans.ts.
 *
 *   1-Week:  $10.50 / week×1   ->  $43.50 / month
 *   4-Week:  $19.99 / week×4   ->  $43.50 / month
 *   12-Week: $34.99 / week×12  ->  $89.99 / month×3 (quarter)
 *
 * SAFETY: refuses to run unless STRIPE_SECRET_KEY is a test key (sk_test_…),
 * and re-verifies livemode === false on a live API object before writing. It
 * never touches live data.
 *
 * Usage (PowerShell):
 *   $env:STRIPE_SECRET_KEY = "sk_test_xxx"; node scripts/provision-stripe-test-prices.mjs
 * Usage (bash):
 *   STRIPE_SECRET_KEY=sk_test_xxx node scripts/provision-stripe-test-prices.mjs
 */

import Stripe from "stripe";

const KEY = process.env.STRIPE_SECRET_KEY ?? "";

if (!KEY) {
  console.error("✗ STRIPE_SECRET_KEY is not set. Provide your TEST key (sk_test_…).");
  process.exit(1);
}
if (!KEY.startsWith("sk_test_") && !KEY.startsWith("rk_test_")) {
  console.error(
    "✗ Refusing to run: STRIPE_SECRET_KEY is not a TEST key (expected sk_test_/rk_test_).\n" +
      "  This script only provisions TEST-mode prices and will never write to a live account.",
  );
  process.exit(1);
}

const stripe = new Stripe(KEY);

/** The plan contract — keep in sync with src/lib/billing/plans.ts. */
const PLANS = [
  {
    key: "plan_1week",
    name: "FocusRoute Membership — 1-Week",
    introAmount: 1050,
    introIntervalCount: 1, // billed every 1 week
    renewal: { amount: 4350, interval: "month", interval_count: 1 },
  },
  {
    key: "plan_4week",
    name: "FocusRoute Membership — 4-Week",
    introAmount: 1999,
    introIntervalCount: 4, // billed every 4 weeks
    renewal: { amount: 4350, interval: "month", interval_count: 1 },
  },
  {
    key: "plan_12week",
    name: "FocusRoute Membership — 12-Week",
    introAmount: 3499,
    introIntervalCount: 12, // billed every 12 weeks
    renewal: { amount: 8999, interval: "month", interval_count: 3 },
  },
];

async function assertTestMode() {
  const balance = await stripe.balance.retrieve();
  if (balance.livemode !== false) {
    console.error("✗ Aborting: Stripe reports livemode=true. This key is not test mode.");
    process.exit(1);
  }
}

/** Find a price by lookup_key, else create it. Idempotent across re-runs. */
async function ensurePrice({ lookupKey, productId, unitAmount, recurring }) {
  const existing = await stripe.prices.search({
    query: `lookup_key:'${lookupKey}'`,
  });
  if (existing.data[0]) return existing.data[0];

  return stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: unitAmount,
    recurring,
    lookup_key: lookupKey,
    transfer_lookup_key: true,
  });
}

/** Find a product by deterministic id, else create it. */
async function ensureProduct(id, name, planKey) {
  try {
    return await stripe.products.retrieve(id);
  } catch {
    return stripe.products.create({
      id,
      name,
      metadata: { plan_key: planKey },
    });
  }
}

async function main() {
  await assertTestMode();
  console.log("✓ Confirmed TEST mode. Provisioning prices…\n");

  const env = {};

  for (const plan of PLANS) {
    const product = await ensureProduct(`focusroute_${plan.key}`, plan.name, plan.key);

    const intro = await ensurePrice({
      lookupKey: `${plan.key}_intro`,
      productId: product.id,
      unitAmount: plan.introAmount,
      recurring: { interval: "week", interval_count: plan.introIntervalCount },
    });

    const renewal = await ensurePrice({
      lookupKey: `${plan.key}_renewal`,
      productId: product.id,
      unitAmount: plan.renewal.amount,
      recurring: {
        interval: plan.renewal.interval,
        interval_count: plan.renewal.interval_count,
      },
    });

    const base = `STRIPE_PRICE_${plan.key.toUpperCase()}`;
    env[`${base}_INTRO`] = intro.id;
    env[`${base}_RENEWAL`] = renewal.id;
    console.log(`  ${plan.key}: intro=${intro.id}  renewal=${renewal.id}`);
  }

  console.log("\n── Paste into .env.local (TEST) ───────────────────────────────");
  for (const [k, v] of Object.entries(env)) console.log(`${k}=${v}`);
  console.log("───────────────────────────────────────────────────────────────");
}

main().catch((err) => {
  console.error("✗ Provisioning failed:", err?.message ?? err);
  process.exit(1);
});
