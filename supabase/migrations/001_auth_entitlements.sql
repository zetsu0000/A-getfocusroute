-- Auth-linked user data + entitlements (paid access must be enforced server-side via this data, not localStorage).

-- ─── profiles ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── quiz_results (optional persistence; ephemeral quiz UI may stay in localStorage) ───
create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists quiz_results_user_id_created_at_idx
  on public.quiz_results (user_id, created_at desc);

-- ─── purchases (Stripe; rows written by backend — users read only) ────────────
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  stripe_payment_intent_id text unique,
  stripe_checkout_session_id text,
  amount_cents integer,
  currency text not null default 'usd',
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists purchases_user_id_idx on public.purchases (user_id);

-- ─── subscriptions (Stripe; backend writes) ───────────────────────────────────
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);

-- ─── entitlements (source of truth for feature access; server-validated) ─────
create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists entitlements_user_id_idx on public.entitlements (user_id);
create index if not exists entitlements_user_active_idx
  on public.entitlements (user_id)
  where active = true;

-- ─── updated_at trigger helper ───────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

drop trigger if exists entitlements_set_updated_at on public.entitlements;
create trigger entitlements_set_updated_at
  before update on public.entitlements
  for each row execute function public.set_updated_at();

-- ─── Auto-create profile on signup ───────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      ''
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.quiz_results enable row level security;
alter table public.purchases enable row level security;
alter table public.subscriptions enable row level security;
alter table public.entitlements enable row level security;

-- Drop policies if re-applying migration (idempotent policy names)
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;

drop policy if exists "quiz_results_select_own" on public.quiz_results;
drop policy if exists "quiz_results_insert_own" on public.quiz_results;
drop policy if exists "quiz_results_update_own" on public.quiz_results;

drop policy if exists "purchases_select_own" on public.purchases;
drop policy if exists "subscriptions_select_own" on public.subscriptions;
drop policy if exists "entitlements_select_own" on public.entitlements;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "quiz_results_select_own"
  on public.quiz_results for select
  to authenticated
  using (auth.uid() = user_id);

create policy "quiz_results_insert_own"
  on public.quiz_results for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "quiz_results_update_own"
  on public.quiz_results for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "purchases_select_own"
  on public.purchases for select
  to authenticated
  using (user_id is not null and auth.uid() = user_id);

create policy "subscriptions_select_own"
  on public.subscriptions for select
  to authenticated
  using (user_id is not null and auth.uid() = user_id);

create policy "entitlements_select_own"
  on public.entitlements for select
  to authenticated
  using (auth.uid() = user_id);
