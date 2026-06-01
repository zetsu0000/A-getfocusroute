# Meta Pixel Production Checklist

Current mode: Pixel-only. Conversions API remains present in code for future use,
but it is disabled automatically unless `META_ACCESS_TOKEN` is configured.

## Vercel Environment Variables

Configure these in Vercel for Production. Keep server-only secrets out of the browser.

- `NEXT_PUBLIC_META_PIXEL_ID=1787404968898761`
  - Browser Pixel ID. This must use the `NEXT_PUBLIC_` prefix.
- `META_PIXEL_ID=1787404968898761`
  - Optional server-side Pixel ID override for future CAPI use.
- `META_CONVERSIONS_API_VERSION`
  - Optional. Current default in code is `v23.0`; only used if CAPI is enabled later.
- `META_TEST_EVENT_CODE`
  - CAPI-only test code. Not required for Pixel-only testing.
- `META_ACCESS_TOKEN`
  - Leave blank in Pixel-only mode. If absent, all CAPI sends return without throwing.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - Browser-safe Stripe key for the production Stripe account.
- `STRIPE_SECRET_KEY`
  - Server-only Stripe secret key for the same production account.
- `STRIPE_WEBHOOK_SECRET`
  - Signing secret from the production Stripe webhook endpoint.
- `NEXT_PUBLIC_PRICE_ASSESSMENT`
- `NEXT_PUBLIC_PRICE_ROADMAP`
- `NEXT_PUBLIC_PRICE_MONTHLY`
- `NEXT_PUBLIC_PRICE_ANNUAL`
- `STRIPE_PRICE_BRAIN_PROFILE`
- `STRIPE_PRICE_ROADMAP_28_DAY`
- `STRIPE_PRICE_MEMBERSHIP_MONTHLY`
- `STRIPE_PRICE_MEMBERSHIP_ANNUAL`

Production base URL is currently `https://getfocusroute.com`.

## Stripe Webhook

Production endpoint:

```text
https://getfocusroute.com/api/stripe/webhook
```

Required Stripe events:

- `payment_intent.succeeded`
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.paid`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Validation steps:

- Create the production webhook endpoint in Stripe.
- Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
- Confirm the webhook request returns 200 for real Stripe deliveries.
- Confirm duplicate Stripe deliveries return success without creating duplicate rows.
- Confirm failed webhook handler attempts return 500 so Stripe retries.

## Meta Events Manager

Use the "Test events" tab:

- Visit the site and confirm `PageView` appears once per real route.
- Complete email capture and confirm `Lead` appears only after email submit.
- Complete the quiz and confirm `CompleteRegistration`.
- Open offer/paywall screens and confirm `ViewContent`.
- Start checkout and confirm browser `InitiateCheckout`.
- Do not expect `Purchase` in browser Pixel. Purchase is intentionally disabled until there is a real, trusted confirmation path selected for Meta reporting.

## Browser Pixel Events

- `PageView`: active.
- `ViewContent`: active.
- `Lead`: active.
- `CompleteRegistration`: active.
- `InitiateCheckout`: active.
- `Purchase`: inactive in browser.

Event IDs are still generated and retained for future CAPI deduplication.

## Privacy Checks

- Browser Pixel must not receive email, phone, name, CPF, or similar PII in event params.
- If CAPI is enabled later, email is hashed server-side before sending to Meta.
- Browser Pixel is blocked on URLs with sensitive query params such as `email`, `phone`, `cpf`, or `name`.

## Production Guardrails

- Do not fire `Lead`, `CompleteRegistration`, or `Purchase` on page view.
- Do not fire `Purchase` from the client.
- Do not add fake conversion events for optimization.
- Do not use cloaking, review bypasses, misleading redirects, or event inflation.
