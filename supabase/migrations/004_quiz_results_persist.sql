-- Persist quiz results with optional auth (nullable user_id) and structured columns.

alter table public.quiz_results alter column user_id drop not null;

alter table public.quiz_results add column if not exists email text;
alter table public.quiz_results add column if not exists name text;
alter table public.quiz_results add column if not exists answers jsonb not null default '[]'::jsonb;
alter table public.quiz_results add column if not exists signature_key text;
alter table public.quiz_results add column if not exists signature_name text;
alter table public.quiz_results add column if not exists signature_description text;
alter table public.quiz_results add column if not exists signature_bullets jsonb not null default '[]'::jsonb;

alter table public.quiz_results drop constraint if exists quiz_results_email_or_user;
alter table public.quiz_results add constraint quiz_results_email_or_user check (
  user_id is not null
  or (email is not null and length(trim(email)) > 0)
);

create index if not exists quiz_results_email_created_idx
  on public.quiz_results (lower(trim(email)), created_at desc);
