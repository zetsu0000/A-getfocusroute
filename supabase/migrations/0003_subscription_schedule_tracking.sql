-- ─── V2 billing: intro→renewal schedule tracking on subscriptions ────────────
-- Records whether a plan subscription's 2-phase Subscription Schedule (intro
-- price → renewal price) is attached, so a missing schedule is observable and
-- reconcilable instead of silently renewing forever at the intro price.
--
--   schedule_id      — the Stripe subscription_schedule id once attached
--   schedule_status  — 'active' (step-up in place) | 'pending' (needs reconcile)
--
-- Both columns are nullable and backfill-free: the webhook reconciles on every
-- plan-subscription event and degrades gracefully if these columns are absent,
-- so apply order does not matter. Legacy / one-time rows are unaffected.

alter table public.subscriptions
  add column if not exists schedule_id text;

alter table public.subscriptions
  add column if not exists schedule_status text;

-- Fast lookup for the reconcile/alert path: plan subscriptions still missing a
-- healthy schedule.
create index if not exists subscriptions_schedule_pending_idx
  on public.subscriptions (schedule_status)
  where schedule_status is distinct from 'active';
