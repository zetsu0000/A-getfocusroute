-- Local validation for migration 0004 against migrations 0001-0003.
-- Run via scripts/validate-email-migration.ps1 (disposable Docker Postgres).

\set ON_ERROR_STOP on

DO $$
BEGIN
  IF to_regclass('public.email_deliveries') IS NULL THEN
    RAISE EXCEPTION 'email_deliveries missing';
  END IF;
  IF to_regclass('public.email_preferences') IS NULL THEN
    RAISE EXCEPTION 'email_preferences missing';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'email_preferences'
      AND indexname = 'email_preferences_email_hash_unique_idx'
  ) THEN
    RAISE EXCEPTION 'email_hash unique index missing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'email_preferences'
      AND indexname IN (
        'email_preferences_user_id_unique_idx',
        'email_preferences_result_id_unique_idx'
      )
  ) THEN
    RAISE EXCEPTION 'competing unique consent indexes still present';
  END IF;
END $$;

DO $$
DECLARE
  v_claim record;
  v_second record;
  v_token uuid;
  v_finalize boolean;
  v_result_id uuid := '11111111-1111-4111-8111-111111111111';
BEGIN
  SELECT * INTO v_claim
  FROM public.claim_email_delivery(
    'validation-key-1',
    'transactional',
    v_result_id,
    NULL,
    'mock',
    300
  );

  IF v_claim.claim_status <> 'claimed' THEN
    RAISE EXCEPTION 'first claim failed: %', v_claim.claim_status;
  END IF;

  v_token := v_claim.claim_token;

  SELECT * INTO v_second
  FROM public.claim_email_delivery(
    'validation-key-1',
    'transactional',
    v_result_id,
    NULL,
    'mock',
    300
  );

  IF v_second.claim_status <> 'in_progress' THEN
    RAISE EXCEPTION 'concurrent claim expected in_progress, got %', v_second.claim_status;
  END IF;

  SELECT public.finalize_email_delivery(
    'validation-key-1',
    v_token,
    'failed',
    'mock',
    NULL,
    'provider_rejected'
  ) INTO v_finalize;

  IF NOT v_finalize THEN
    RAISE EXCEPTION 'failed finalize rejected';
  END IF;

  SELECT * INTO v_claim
  FROM public.claim_email_delivery(
    'validation-key-1',
    'transactional',
    v_result_id,
    NULL,
    'mock',
    300
  );

  IF v_claim.claim_status <> 'reclaimed' OR v_claim.attempt_count <> 2 THEN
    RAISE EXCEPTION 'failed reclaim expected attempt 2, got %/%', v_claim.claim_status, v_claim.attempt_count;
  END IF;

  v_token := v_claim.claim_token;

  SELECT public.finalize_email_delivery(
    'validation-key-1',
    gen_random_uuid(),
    'sent',
    'mock',
    'stale-token',
    NULL
  ) INTO v_finalize;

  IF v_finalize THEN
    RAISE EXCEPTION 'stale claim token must not finalize';
  END IF;

  SELECT public.finalize_email_delivery(
    'validation-key-1',
    v_token,
    'sent',
    'mock',
    'msg-validation',
    NULL
  ) INTO v_finalize;

  IF NOT v_finalize THEN
    RAISE EXCEPTION 'valid sent finalize rejected';
  END IF;

  SELECT claim_status INTO v_claim.claim_status
  FROM public.claim_email_delivery(
    'validation-key-1',
    'transactional',
    v_result_id,
    NULL,
    'mock',
    300
  );

  IF v_claim.claim_status <> 'duplicate' THEN
    RAISE EXCEPTION 'sent must be terminal duplicate, got %', v_claim.claim_status;
  END IF;
END $$;

INSERT INTO public.email_preferences (email_hash, marketing_status, consent_source, consent_version, consented_at)
VALUES ('hash-a', 'consented', 'validation', '1', now())
ON CONFLICT (email_hash) DO UPDATE
SET marketing_status = EXCLUDED.marketing_status,
    consent_source = EXCLUDED.consent_source,
    consent_version = EXCLUDED.consent_version,
    consented_at = EXCLUDED.consented_at,
    unsubscribed_at = NULL;

INSERT INTO public.email_preferences (email_hash, marketing_status, unsubscribed_at)
VALUES ('hash-a', 'unsubscribed', now())
ON CONFLICT (email_hash) DO UPDATE
SET marketing_status = 'unsubscribed',
    unsubscribed_at = EXCLUDED.unsubscribed_at;

INSERT INTO public.email_preferences (email_hash, marketing_status, unsubscribed_at)
VALUES ('hash-a', 'unsubscribed', now())
ON CONFLICT (email_hash) DO UPDATE
SET marketing_status = 'unsubscribed',
    unsubscribed_at = EXCLUDED.unsubscribed_at;

DO $$
BEGIN
  IF (SELECT marketing_status FROM public.email_preferences WHERE email_hash = 'hash-a') <> 'unsubscribed' THEN
    RAISE EXCEPTION 'unsubscribe upsert failed';
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    INSERT INTO public.email_preferences (email_hash, marketing_status)
    VALUES ('hash-a', 'consented');
    RAISE EXCEPTION 'duplicate email_hash insert should fail';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END $$;

SELECT 'migration_0004_validation_passed' AS result;
