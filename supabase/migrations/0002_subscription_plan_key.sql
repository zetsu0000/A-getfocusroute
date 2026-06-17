-- ─── V2 3-plan subscription model: plan_key on subscriptions ──────────────────
-- Adds a nullable plan_key column recording which intro→renewal plan a Stripe
-- subscription was started on ("plan_1week" | "plan_4week" | "plan_12week").
--
-- The column is nullable and backfill-free: the webhook also derives the plan
-- from the current price ID, so legacy rows (membership_monthly / annual) and
-- historical one-time purchases are unaffected. Apply this migration before (or
-- with) deploying the billing code; the webhook upsert degrades gracefully if it
-- is missing.

alter table public.subscriptions
  add column if not exists plan_key text;

create index if not exists subscriptions_plan_key_idx
  on public.subscriptions (plan_key)
  where plan_key is not null;
