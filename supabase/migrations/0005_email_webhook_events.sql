-- ─────────────────────────────────────────────────────────────────────────────
-- PR 7C — Resend webhook event ledger (at-least-once dedup + provider correlation).
-- Repository-only migration: do not apply remotely from this PR.
-- ─────────────────────────────────────────────────────────────────────────────

-- Provider lifecycle status is distinct from the internal claim status.
alter table public.email_deliveries
  add column if not exists provider_status text,
  add column if not exists provider_status_at timestamptz;

create table if not exists public.email_webhook_events (
  id uuid primary key default gen_random_uuid(),
  svix_id text not null,
  event_type text not null,
  provider_message_id text,
  delivery_id uuid references public.email_deliveries (id) on delete set null,
  occurred_at timestamptz,
  created_at timestamptz not null default now(),
  constraint email_webhook_events_svix_id_unique unique (svix_id)
);

create index if not exists email_webhook_events_provider_message_id_idx
  on public.email_webhook_events (provider_message_id)
  where provider_message_id is not null;

comment on table public.email_webhook_events is
  'Resend webhook dedup ledger keyed by svix_id. No recipient addresses or raw payloads.';

-- ─── Row level security ───────────────────────────────────────────────────────
alter table public.email_webhook_events enable row level security;

revoke all on table public.email_webhook_events from public, anon, authenticated;
grant select, insert on table public.email_webhook_events to service_role;

-- ─── At-least-once event recording with provider correlation ─────────────────
create or replace function public.record_email_webhook_event(
  p_svix_id text,
  p_event_type text,
  p_provider_message_id text default null,
  p_occurred_at timestamptz default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery_id uuid;
  v_row_count integer := 0;
begin
  if p_svix_id is null or length(trim(p_svix_id)) = 0 then
    raise exception 'invalid_svix_id';
  end if;
  if p_event_type is null or length(trim(p_event_type)) = 0 then
    raise exception 'invalid_event_type';
  end if;

  if p_provider_message_id is not null then
    select id into v_delivery_id
    from public.email_deliveries
    where provider_message_id = p_provider_message_id
    limit 1;
  end if;

  insert into public.email_webhook_events (
    svix_id,
    event_type,
    provider_message_id,
    delivery_id,
    occurred_at
  ) values (
    p_svix_id,
    p_event_type,
    p_provider_message_id,
    v_delivery_id,
    p_occurred_at
  )
  on conflict (svix_id) do nothing;

  get diagnostics v_row_count = row_count;
  if v_row_count = 0 then
    return 'duplicate';
  end if;

  if v_delivery_id is null then
    return 'applied_unmatched';
  end if;

  update public.email_deliveries
  set
    provider_status = p_event_type,
    provider_status_at = coalesce(p_occurred_at, now()),
    updated_at = now()
  where id = v_delivery_id;

  return 'applied';
end;
$$;

revoke all on function public.record_email_webhook_event(text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.record_email_webhook_event(text, text, text, timestamptz) to service_role;
