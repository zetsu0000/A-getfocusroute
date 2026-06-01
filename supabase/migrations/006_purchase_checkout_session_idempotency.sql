-- Prevent duplicate purchase rows when Stripe delivers repeated checkout
-- session events that do not include a payment_intent id.

create unique index if not exists purchases_stripe_checkout_session_id_unique
  on public.purchases (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
