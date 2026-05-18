# Stripe CNPJ Account Migration

Migration of FocusRoute from the original Stripe account to the new CNPJ-based account.

---

## Product & Price IDs

| Product | Product ID | Price ID | product_key |
|---|---|---|---|
| Brain Profile | `prod_UXJk96M7dM1kAG` | `price_1TYF7sLqKfCkbv0vKvmuXHFv` | `brain_profile` |
| 28-Day Protocol | `prod_UXJkUuiPI2Yxao` | `price_1TYF81LqKfCkbv0vhoXnDltZ` | `roadmap_28_day` |
| Membership Monthly | `prod_UXJlXSX8vrfW64` | `price_1TYF8gLqKfCkbv0vHmj73P2s` | `membership_monthly` |
| Membership Annual | `prod_UXJlQgLWJRaB8k` | `price_1TYF8tLqKfCkbv0viiVboOdW` | `membership_annual` |

### Entitlement grants per product

| product_key | Entitlements granted |
|---|---|
| `brain_profile` | `brain_profile`, `bonus_explain_script` |
| `roadmap_28_day` | `roadmap_28_day`, `bonus_toolkit`, `bonus_audio` |
| `membership_monthly` | `membership`, `retake_quiz`, `billing_portal` |
| `membership_annual` | `membership`, `retake_quiz`, `billing_portal` |

---

## Env Var Checklist

Copy `.env.example` to `.env.local` and fill in the blanks. Set the same vars in Vercel.

### Required for all environments

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — from new CNPJ account
- [ ] `STRIPE_SECRET_KEY` — from new CNPJ account (secret)
- [ ] `STRIPE_WEBHOOK_SECRET` — from new webhook endpoint (see below)

### Price ID env vars (fill with values from table above)

- [ ] `NEXT_PUBLIC_PRICE_ASSESSMENT=price_1TYF7sLqKfCkbv0vKvmuXHFv`
- [ ] `NEXT_PUBLIC_PRICE_ROADMAP=price_1TYF81LqKfCkbv0vhoXnDltZ`
- [ ] `NEXT_PUBLIC_PRICE_MONTHLY=price_1TYF8gLqKfCkbv0vHmj73P2s`
- [ ] `NEXT_PUBLIC_PRICE_ANNUAL=price_1TYF8tLqKfCkbv0viiVboOdW`
- [ ] `STRIPE_PRICE_BRAIN_PROFILE=price_1TYF7sLqKfCkbv0vKvmuXHFv`
- [ ] `STRIPE_PRICE_ROADMAP_28_DAY=price_1TYF81LqKfCkbv0vhoXnDltZ`
- [ ] `STRIPE_PRICE_MEMBERSHIP_MONTHLY=price_1TYF8gLqKfCkbv0vHmj73P2s`
- [ ] `STRIPE_PRICE_MEMBERSHIP_ANNUAL=price_1TYF8tLqKfCkbv0viiVboOdW`

> The `STRIPE_PRICE_*` vars are server-only (no `NEXT_PUBLIC_` prefix).  
> They duplicate the NEXT_PUBLIC values and serve as a webhook fallback when  
> Stripe product metadata is empty after account migration.

---

## Webhook Setup Checklist

In Stripe Dashboard → Developers → Webhooks:

- [ ] Create a new webhook endpoint pointing to `https://your-domain.com/api/stripe/webhook`
      (or `/api/webhook` — both are wired to the same handler)
- [ ] Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET`
- [ ] Enable the following events:

| Event | Handler |
|---|---|
| `payment_intent.succeeded` | Grants one-time product, inserts purchase row |
| `checkout.session.completed` | Grants product, inserts purchase row (Checkout flow) |
| `customer.subscription.created` | Upserts subscription row, grants membership |
| `customer.subscription.updated` | Upserts subscription row, deactivates if canceled |
| `customer.subscription.deleted` | Marks subscription canceled, deactivates entitlements |
| `invoice.paid` | Upserts subscription row on renewal |
| `invoice.payment_succeeded` | Legacy alias — same handler as invoice.paid |

---

## Stripe Metadata Checklist

The FocusRoute webhook resolves `product_key` in this order:
1. `metadata.product_key` (set by our API when creating PaymentIntent / Subscription)
2. Price ID from metadata → `STRIPE_PRICE_*` env var mapping (fallback)
3. Subscription item price ID → `STRIPE_PRICE_*` env var mapping (fallback for subscriptions)

**The new Stripe products currently have empty metadata.** The price ID fallback  
(steps 2–3) handles this. Optionally backfill metadata on each Stripe product:

- [ ] In Stripe Dashboard → Products → Brain Profile → Metadata: add `product_key=brain_profile`
- [ ] In Stripe Dashboard → Products → 28-Day Protocol → Metadata: add `product_key=roadmap_28_day`
- [ ] In Stripe Dashboard → Products → Membership Monthly → Metadata: add `product_key=membership_monthly`
- [ ] In Stripe Dashboard → Products → Membership Annual → Metadata: add `product_key=membership_annual`

> Backfilling metadata is optional but recommended — it makes the system resilient  
> even if env vars change or are misconfigured.

---

## Customer Portal Checklist

In Stripe Dashboard → Settings → Customer Portal:

- [ ] Enable the Customer Portal
- [ ] Allow customers to cancel subscriptions
- [ ] Allow customers to update payment method
- [ ] Add the FocusRoute branding (logo, colors)
- [ ] Set the return URL to `https://your-domain.com/dashboard/membership`
- [ ] Test portal access via `/dashboard/membership` → Billing section

---

## Vercel Checklist

In Vercel Dashboard → Project → Settings → Environment Variables:

- [ ] Add all env vars from the checklist above to **Production** environment
- [ ] Verify `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are **not** prefixed with `NEXT_PUBLIC_`
- [ ] Redeploy after adding env vars (Vercel does not hot-reload env vars)
- [ ] Confirm the webhook endpoint URL matches what you registered in Stripe

---

## Live Test Checklist

Use Stripe test mode first, then repeat with live mode.

### One-time purchase (Brain Profile)

- [ ] Complete quiz → paywall → use test card `4242 4242 4242 4242`
- [ ] Confirm `payment_intent.succeeded` webhook fires and is logged
- [ ] Confirm `brain_profile` and `bonus_explain_script` entitlements appear in Supabase
- [ ] Log in → confirm `/dashboard/profile` is accessible

### One-time purchase (28-Day Protocol / Upsell)

- [ ] After paywall → upsell → use test card
- [ ] Confirm `roadmap_28_day`, `bonus_toolkit`, `bonus_audio` entitlements appear
- [ ] Confirm `/dashboard/roadmap` shows full content (not locked preview)

### Subscription (Monthly)

- [ ] Subscription screen → select Monthly → complete payment
- [ ] Confirm `customer.subscription.created` webhook fires
- [ ] Confirm `membership`, `retake_quiz`, `billing_portal` entitlements appear
- [ ] Confirm `/dashboard/membership` shows Member Area

### Subscription (Annual)

- [ ] Repeat above for Annual plan
- [ ] Confirm `membership_annual` is the product_key in Supabase grant metadata

### Cancellation

- [ ] Cancel subscription via Stripe Dashboard
- [ ] Confirm `customer.subscription.deleted` webhook fires
- [ ] Confirm `membership`, `retake_quiz`, `billing_portal` entitlements are deactivated
- [ ] Confirm `brain_profile` and `roadmap_28_day` remain active

### Webhook idempotency

- [ ] Resend a webhook event via Stripe Dashboard → "Resend"
- [ ] Confirm response is `{ received: true, duplicate: true }` (no duplicate grant)

### Metadata-empty scenario (new account)

- [ ] Remove `product_key` from a test PaymentIntent metadata
- [ ] Trigger `payment_intent.succeeded`
- [ ] Confirm the webhook still resolves the correct product_key via price ID fallback
- [ ] Confirm entitlement is granted correctly

---

## Notes

- Both `/api/webhook` and `/api/stripe/webhook` are active — configure Stripe to use either.
- The `STRIPE_WEBHOOK_SECRET` must match the endpoint that Stripe is sending to.
- One-time purchase entitlements (`brain_profile`, `roadmap_28_day`, bonuses) are permanent — they are never deactivated by subscription cancellation.
- Membership entitlements (`membership`, `retake_quiz`, `billing_portal`) are deactivated when the subscription is canceled or deleted.