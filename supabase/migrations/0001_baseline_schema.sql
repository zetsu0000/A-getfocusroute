-- ─────────────────────────────────────────────────────────────────────────────
-- FocusRoute canonical baseline schema.
--
-- This single migration reproduces the live production schema exactly. It
-- replaces the earlier 001–006 files, which had drifted from production
-- (wrong column names such as `amount_cents`/`kind`, missing idempotency
-- indexes, and divergent webhook/quiz definitions).
--
-- Every statement is idempotent (`if not exists`, `drop ... if exists`,
-- `create or replace`), so it is safe to run against a fresh database
-- (`supabase db reset`) and harmless if ever applied to the existing
-- production database.
--
-- Paid access is the source of truth in `entitlements` and must always be
-- enforced server-side via these tables — never from localStorage.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

-- ─── updated_at trigger helper ───────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─── quiz_results (anonymous-capable: user_id nullable, keyed by email) ────────
create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  email text not null,
  name text,
  answers jsonb not null default '{}'::jsonb,
  signature_key text,
  signature_name text,
  signature_description text,
  signature_bullets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quiz_results_user_id_idx on public.quiz_results (user_id);
create index if not exists quiz_results_email_idx on public.quiz_results (email);

drop trigger if exists set_quiz_results_updated_at on public.quiz_results;
create trigger set_quiz_results_updated_at
  before update on public.quiz_results
  for each row execute function public.set_updated_at();

-- ─── purchases (one-time Stripe payments; backend writes, users read) ─────────
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  stripe_customer_id text,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  product_key text not null,
  amount integer,
  currency text not null default 'usd',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists purchases_user_id_idx on public.purchases (user_id);
create index if not exists purchases_email_idx on public.purchases (email);
create index if not exists purchases_stripe_customer_id_idx on public.purchases (stripe_customer_id);
create index if not exists purchases_stripe_payment_intent_id_idx on public.purchases (stripe_payment_intent_id);
create index if not exists purchases_stripe_checkout_session_id_idx on public.purchases (stripe_checkout_session_id);

-- Idempotency guards relied on by the webhook (insert error code 23505).
create unique index if not exists purchases_unique_payment_intent_idx
  on public.purchases (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
create unique index if not exists purchases_unique_checkout_session_idx
  on public.purchases (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

drop trigger if exists set_purchases_updated_at on public.purchases;
create trigger set_purchases_updated_at
  before update on public.purchases
  for each row execute function public.set_updated_at();

-- ─── subscriptions (Stripe memberships; backend writes) ───────────────────────
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  price_id text,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_email_idx on public.subscriptions (email);
create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions (stripe_customer_id);
create index if not exists subscriptions_stripe_subscription_id_idx on public.subscriptions (stripe_subscription_id);

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ─── entitlements (source of truth for feature access; server-validated) ──────
create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  email text not null,
  entitlement_key text not null,
  source text,
  source_id text,
  active boolean not null default true,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists entitlements_user_id_idx on public.entitlements (user_id);
create index if not exists entitlements_email_idx on public.entitlements (email);
create index if not exists entitlements_entitlement_key_idx on public.entitlements (entitlement_key);
create index if not exists entitlements_active_idx on public.entitlements (active);

-- One active grant per (user, key) and per (email, key) before the account exists.
create unique index if not exists entitlements_unique_user_key_idx
  on public.entitlements (user_id, entitlement_key)
  where user_id is not null;
create unique index if not exists entitlements_unique_email_key_when_no_user_idx
  on public.entitlements (lower(email), entitlement_key)
  where user_id is null;

drop trigger if exists set_entitlements_updated_at on public.entitlements;
create trigger set_entitlements_updated_at
  before update on public.entitlements
  for each row execute function public.set_updated_at();

-- ─── stripe_webhook_events (idempotency ledger; one row per event id) ─────────
create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text unique,
  event_type text not null,
  created_at timestamptz not null default now()
);

create index if not exists stripe_webhook_events_event_type_idx on public.stripe_webhook_events (event_type);
create index if not exists stripe_webhook_events_created_at_idx on public.stripe_webhook_events (created_at desc);

-- ─── email_product_grants (purchases keyed by email before auth.users) ────────
create table if not exists public.email_product_grants (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  product_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  claimed_user_id uuid references auth.users (id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_product_grants_email_idx on public.email_product_grants (email);
create index if not exists email_product_grants_claimed_user_id_idx on public.email_product_grants (claimed_user_id);
create index if not exists email_product_grants_created_at_idx on public.email_product_grants (created_at desc);
create index if not exists email_product_grants_email_unclaimed_idx
  on public.email_product_grants (email)
  where claimed_user_id is null;
create index if not exists email_product_grants_meta_payment_intent_id_idx
  on public.email_product_grants ((metadata ->> 'stripe_payment_intent_id'));
create index if not exists email_product_grants_meta_subscription_id_idx
  on public.email_product_grants ((metadata ->> 'stripe_subscription_id'));
create index if not exists email_product_grants_metadata_gin_idx
  on public.email_product_grants using gin (metadata);

comment on table public.email_product_grants is
  'Product purchases keyed by normalized email; merged into public.entitlements when the user signs in.';

-- ─── analytics_events (first-party funnel analytics; service-role writes) ─────
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  anonymous_id text,
  session_id text,
  user_id uuid,
  path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  fbp text,
  fbc text,
  meta_event_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_event_name_created_at_idx
  on public.analytics_events (event_name, created_at desc);
create index if not exists analytics_events_anonymous_id_created_at_idx
  on public.analytics_events (anonymous_id, created_at desc);
create index if not exists analytics_events_session_id_created_at_idx
  on public.analytics_events (session_id, created_at desc);
create index if not exists analytics_events_meta_event_id_idx
  on public.analytics_events (meta_event_id)
  where meta_event_id is not null;

comment on table public.analytics_events is
  'Privacy-conscious first-party product and marketing funnel analytics.';

-- ─── Row level security ───────────────────────────────────────────────────────
alter table public.profiles              enable row level security;
alter table public.quiz_results          enable row level security;
alter table public.purchases             enable row level security;
alter table public.subscriptions         enable row level security;
alter table public.entitlements          enable row level security;
-- Service-role-only tables: RLS on, no policies (anon/authenticated get nothing;
-- service_role bypasses RLS for webhook writes and claim logic).
alter table public.stripe_webhook_events enable row level security;
alter table public.email_product_grants  enable row level security;
alter table public.analytics_events      enable row level security;

-- profiles
drop policy if exists "Users can select own profile" on public.profiles;
create policy "Users can select own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- quiz_results (own by user_id OR by JWT email — supports anonymous-then-login)
drop policy if exists "Users can select own quiz results" on public.quiz_results;
create policy "Users can select own quiz results"
  on public.quiz_results for select to authenticated
  using (auth.uid() = user_id or lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "Users can insert own quiz results" on public.quiz_results;
create policy "Users can insert own quiz results"
  on public.quiz_results for insert to authenticated
  with check (auth.uid() = user_id or lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "Users can update own quiz results" on public.quiz_results;
create policy "Users can update own quiz results"
  on public.quiz_results for update to authenticated
  using (auth.uid() = user_id or lower(email) = lower(auth.jwt() ->> 'email'))
  with check (auth.uid() = user_id or lower(email) = lower(auth.jwt() ->> 'email'));

-- purchases (read-only to users; backend writes via service role)
drop policy if exists "Users can select own purchases" on public.purchases;
create policy "Users can select own purchases"
  on public.purchases for select to authenticated
  using (auth.uid() = user_id or lower(email) = lower(auth.jwt() ->> 'email'));

-- subscriptions (read-only to users)
drop policy if exists "Users can select own subscriptions" on public.subscriptions;
create policy "Users can select own subscriptions"
  on public.subscriptions for select to authenticated
  using (auth.uid() = user_id or lower(email) = lower(auth.jwt() ->> 'email'));

-- entitlements (read-only to users)
drop policy if exists "Users can select own entitlements" on public.entitlements;
create policy "Users can select own entitlements"
  on public.entitlements for select to authenticated
  using (auth.uid() = user_id or lower(email) = lower(auth.jwt() ->> 'email'));
