-- Idempotent Stripe webhook processing (one row per delivered event id).

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now()
);

comment on table public.stripe_webhook_events is
  'Stripe webhook idempotency ledger; inserts succeed once per event_id.';

alter table public.stripe_webhook_events enable row level security;
-- No policies: only service_role writes from the app webhook handler.
