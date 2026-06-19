-- ─────────────────────────────────────────────────────────────────────────────
-- PR 7B — transactional email delivery ledger, preferences, and atomic claim RPCs.
-- Repository-only migration: do not apply remotely from this PR.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null,
  email_type text not null,
  result_id uuid not null,
  user_id uuid references auth.users (id) on delete set null,
  provider text not null,
  provider_message_id text,
  status text not null default 'pending',
  attempt_count integer not null default 1 check (attempt_count >= 1),
  last_error_code text,
  claimed_at timestamptz not null default now(),
  lease_expires_at timestamptz not null,
  claim_token uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint email_deliveries_idempotency_key_unique unique (idempotency_key),
  constraint email_deliveries_status_check check (
    status in (
      'pending',
      'sent',
      'previewed',
      'failed',
      'skipped_disabled',
      'skipped_duplicate',
      'skipped_invalid'
    )
  )
);

create index if not exists email_deliveries_status_lease_idx
  on public.email_deliveries (status, lease_expires_at);

create index if not exists email_deliveries_result_id_idx
  on public.email_deliveries (result_id);

create index if not exists email_deliveries_user_id_idx
  on public.email_deliveries (user_id)
  where user_id is not null;

create index if not exists email_deliveries_provider_message_id_idx
  on public.email_deliveries (provider_message_id)
  where provider_message_id is not null;

drop trigger if exists set_email_deliveries_updated_at on public.email_deliveries;
create trigger set_email_deliveries_updated_at
  before update on public.email_deliveries
  for each row execute function public.set_updated_at();

comment on table public.email_deliveries is
  'Operational transactional email delivery ledger. No message bodies or raw answers.';

-- ─── email_preferences (marketing consent foundation) ────────────────────────
create table if not exists public.email_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  result_id uuid references public.quiz_results (id) on delete cascade,
  email_hash text not null,
  marketing_status text not null default 'unknown',
  consent_source text,
  consent_version text,
  consented_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_preferences_marketing_status_check check (
    marketing_status in ('unknown', 'consented', 'unsubscribed')
  )
);

create unique index if not exists email_preferences_email_hash_unique_idx
  on public.email_preferences (email_hash);

create index if not exists email_preferences_user_id_idx
  on public.email_preferences (user_id)
  where user_id is not null;

create index if not exists email_preferences_result_id_idx
  on public.email_preferences (result_id)
  where result_id is not null;

drop trigger if exists set_email_preferences_updated_at on public.email_preferences;
create trigger set_email_preferences_updated_at
  before update on public.email_preferences
  for each row execute function public.set_updated_at();

comment on table public.email_preferences is
  'Marketing consent and unsubscribe state keyed by email_hash. Transactional delivery does not imply consent.';

-- ─── Row level security ───────────────────────────────────────────────────────
alter table public.email_deliveries enable row level security;
alter table public.email_preferences enable row level security;

-- Service-role-only: no policies for anon/authenticated.

-- ─── Atomic claim / reclaim ──────────────────────────────────────────────────
create or replace function public.claim_email_delivery(
  p_idempotency_key text,
  p_email_type text,
  p_result_id uuid,
  p_user_id uuid,
  p_provider text,
  p_lease_seconds integer default 300
)
returns table (
  claim_status text,
  claim_token uuid,
  attempt_count integer,
  provider text,
  provider_message_id text,
  record_status text,
  result_id uuid,
  user_id uuid,
  claimed_at timestamptz,
  lease_expires_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  sent_at timestamptz,
  last_error_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_lease timestamptz := v_now + make_interval(secs => greatest(p_lease_seconds, 1));
  v_token uuid := gen_random_uuid();
  v_row public.email_deliveries%rowtype;
begin
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'invalid_idempotency_key';
  end if;
  if p_email_type is null or length(trim(p_email_type)) = 0 then
    raise exception 'invalid_email_type';
  end if;
  if p_result_id is null then
    raise exception 'invalid_result_id';
  end if;
  if p_provider is null or length(trim(p_provider)) = 0 then
    raise exception 'invalid_provider';
  end if;

  insert into public.email_deliveries (
    idempotency_key,
    email_type,
    result_id,
    user_id,
    provider,
    status,
    attempt_count,
    claim_token,
    claimed_at,
    lease_expires_at
  ) values (
    p_idempotency_key,
    p_email_type,
    p_result_id,
    p_user_id,
    p_provider,
    'pending',
    1,
    v_token,
    v_now,
    v_lease
  )
  on conflict (idempotency_key) do nothing
  returning * into v_row;

  if found then
    return query
    select
      'claimed'::text,
      v_row.claim_token,
      v_row.attempt_count,
      v_row.provider,
      v_row.provider_message_id,
      v_row.status,
      v_row.result_id,
      v_row.user_id,
      v_row.claimed_at,
      v_row.lease_expires_at,
      v_row.created_at,
      v_row.updated_at,
      v_row.sent_at,
      v_row.last_error_code;
    return;
  end if;

  select * into v_row
  from public.email_deliveries
  where idempotency_key = p_idempotency_key
  for update;

  if v_row.status in ('sent', 'previewed') then
    return query
    select
      'duplicate'::text,
      v_row.claim_token,
      v_row.attempt_count,
      v_row.provider,
      v_row.provider_message_id,
      v_row.status,
      v_row.result_id,
      v_row.user_id,
      v_row.claimed_at,
      v_row.lease_expires_at,
      v_row.created_at,
      v_row.updated_at,
      v_row.sent_at,
      v_row.last_error_code;
    return;
  end if;

  if v_row.status = 'failed' then
    update public.email_deliveries
    set
      status = 'pending',
      attempt_count = v_row.attempt_count + 1,
      provider = p_provider,
      provider_message_id = null,
      last_error_code = null,
      claim_token = v_token,
      claimed_at = v_now,
      lease_expires_at = v_lease,
      updated_at = v_now
    where id = v_row.id
    returning * into v_row;

    return query
    select
      'reclaimed'::text,
      v_row.claim_token,
      v_row.attempt_count,
      v_row.provider,
      v_row.provider_message_id,
      v_row.status,
      v_row.result_id,
      v_row.user_id,
      v_row.claimed_at,
      v_row.lease_expires_at,
      v_row.created_at,
      v_row.updated_at,
      v_row.sent_at,
      v_row.last_error_code;
    return;
  end if;

  if v_row.status = 'pending' then
    if v_row.lease_expires_at > v_now then
      return query
      select
        'in_progress'::text,
        v_row.claim_token,
        v_row.attempt_count,
        v_row.provider,
        v_row.provider_message_id,
        v_row.status,
        v_row.result_id,
        v_row.user_id,
        v_row.claimed_at,
        v_row.lease_expires_at,
        v_row.created_at,
        v_row.updated_at,
        v_row.sent_at,
        v_row.last_error_code;
      return;
    end if;

    update public.email_deliveries
    set
      status = 'pending',
      attempt_count = v_row.attempt_count + 1,
      provider = p_provider,
      provider_message_id = null,
      last_error_code = null,
      claim_token = v_token,
      claimed_at = v_now,
      lease_expires_at = v_lease,
      updated_at = v_now
    where id = v_row.id
    returning * into v_row;

    return query
    select
      'reclaimed'::text,
      v_row.claim_token,
      v_row.attempt_count,
      v_row.provider,
      v_row.provider_message_id,
      v_row.status,
      v_row.result_id,
      v_row.user_id,
      v_row.claimed_at,
      v_row.lease_expires_at,
      v_row.created_at,
      v_row.updated_at,
      v_row.sent_at,
      v_row.last_error_code;
    return;
  end if;

  return query
  select
    'duplicate'::text,
    v_row.claim_token,
    v_row.attempt_count,
    v_row.provider,
    v_row.provider_message_id,
    v_row.status,
    v_row.result_id,
    v_row.user_id,
    v_row.claimed_at,
    v_row.lease_expires_at,
    v_row.created_at,
    v_row.updated_at,
    v_row.sent_at,
    v_row.last_error_code;
end;
$$;

create or replace function public.finalize_email_delivery(
  p_idempotency_key text,
  p_claim_token uuid,
  p_status text,
  p_provider text,
  p_provider_message_id text default null,
  p_last_error_code text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'invalid_idempotency_key';
  end if;
  if p_claim_token is null then
    raise exception 'invalid_claim_token';
  end if;
  if p_status is null or p_status not in ('sent', 'previewed', 'failed', 'skipped_disabled', 'skipped_duplicate', 'skipped_invalid') then
    raise exception 'invalid_status';
  end if;

  update public.email_deliveries
  set
    status = p_status,
    provider = coalesce(nullif(trim(p_provider), ''), provider),
    provider_message_id = p_provider_message_id,
    last_error_code = p_last_error_code,
    sent_at = case when p_status = 'sent' then v_now else sent_at end,
    updated_at = v_now
  where idempotency_key = p_idempotency_key
    and claim_token = p_claim_token
    and status = 'pending';

  return found;
end;
$$;

revoke all on function public.claim_email_delivery(text, text, uuid, uuid, text, integer) from public;
revoke all on function public.finalize_email_delivery(text, uuid, text, text, text, text) from public;

grant execute on function public.claim_email_delivery(text, text, uuid, uuid, text, integer) to service_role;
grant execute on function public.finalize_email_delivery(text, uuid, text, text, text, text) to service_role;
