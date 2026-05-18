-- Email-based product grants before auth.users exists; claimed into entitlements on login (server, service role).

create table if not exists public.email_product_grants (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  product_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  claimed_user_id uuid references auth.users (id) on delete set null
);

comment on table public.email_product_grants is
  'Product purchases keyed by normalized email; merged into public.entitlements when the user signs in.';

create index if not exists email_product_grants_email_unclaimed_idx
  on public.email_product_grants (email)
  where claimed_user_id is null;

alter table public.email_product_grants enable row level security;
-- No policies: anon/authenticated cannot read or write via PostgREST; service_role bypasses RLS for webhooks / claim.
