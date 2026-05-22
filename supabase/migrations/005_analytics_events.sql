-- First-party funnel analytics. Public clients do not read or write this table;
-- the app inserts through trusted server routes using the service role.

create extension if not exists pgcrypto;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  anonymous_id text,
  session_id text,
  user_id uuid null,
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

alter table public.analytics_events enable row level security;
-- No policies: only service_role writes from trusted app routes.
