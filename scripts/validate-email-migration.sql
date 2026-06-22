-- Local validation for migration 0004 against migrations 0001-0003.
-- Run via scripts/validate-email-migration.ps1 (disposable Docker Postgres).
-- Uses SET ROLE to validate anon/authenticated/service_role permissions.

\set ON_ERROR_STOP on

DO $$
BEGIN
  IF to_regclass('public.email_deliveries') IS NULL THEN
    RAISE EXCEPTION 'email_deliveries missing';
  END IF;
  IF to_regclass('public.email_preferences') IS NULL THEN
    RAISE EXCEPTION 'email_preferences missing';
  END IF;
  IF to_regprocedure('public.set_updated_at()') IS NULL THEN
    RAISE EXCEPTION 'set_updated_at() missing';
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
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE rel.relname = 'email_preferences'
      AND c.contype = 'f'
      AND a.attname = 'user_id'
      AND c.confdeltype = 'n'
  ) THEN
    RAISE EXCEPTION 'user_id FK must use ON DELETE SET NULL';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE rel.relname = 'email_preferences'
      AND c.contype = 'f'
      AND a.attname = 'result_id'
      AND c.confdeltype = 'n'
  ) THEN
    RAISE EXCEPTION 'result_id FK must use ON DELETE SET NULL';
  END IF;
END $$;

DO $$
DECLARE
  v_user_id uuid := '22222222-2222-4222-8222-222222222222';
  v_result_id uuid := '33333333-3333-4333-8333-333333333333';
  v_email_hash text := 'hash-fk-survival';
BEGIN
  INSERT INTO auth.users (id) VALUES (v_user_id);
  INSERT INTO public.quiz_results (id, email, answers)
  VALUES (v_result_id, 'fk-survival@example.com', '{}'::jsonb);
  INSERT INTO public.email_preferences (
    user_id,
    result_id,
    email_hash,
    marketing_status,
    unsubscribed_at
  ) VALUES (
    v_user_id,
    v_result_id,
    v_email_hash,
    'unsubscribed',
    now()
  );

  DELETE FROM public.quiz_results WHERE id = v_result_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.email_preferences WHERE email_hash = v_email_hash
  ) THEN
    RAISE EXCEPTION 'preference row deleted with quiz result';
  END IF;
  IF (SELECT result_id FROM public.email_preferences WHERE email_hash = v_email_hash) IS NOT NULL THEN
    RAISE EXCEPTION 'result_id should be null after quiz result deletion';
  END IF;
  IF (SELECT marketing_status FROM public.email_preferences WHERE email_hash = v_email_hash) <> 'unsubscribed' THEN
    RAISE EXCEPTION 'status changed after quiz result deletion';
  END IF;

  DELETE FROM auth.users WHERE id = v_user_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.email_preferences WHERE email_hash = v_email_hash
  ) THEN
    RAISE EXCEPTION 'preference row deleted with user';
  END IF;
  IF (SELECT user_id FROM public.email_preferences WHERE email_hash = v_email_hash) IS NOT NULL THEN
    RAISE EXCEPTION 'user_id should be null after user deletion';
  END IF;
  IF (SELECT marketing_status FROM public.email_preferences WHERE email_hash = v_email_hash) <> 'unsubscribed' THEN
    RAISE EXCEPTION 'status changed after user deletion';
  END IF;
END $$;

DO $$
BEGIN
  SET ROLE anon;
  BEGIN
    PERFORM count(*) FROM public.email_preferences;
    RAISE EXCEPTION 'anon must not select email_preferences';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  BEGIN
    INSERT INTO public.email_preferences (email_hash, marketing_status)
    VALUES ('hash-anon-deny', 'unknown');
    RAISE EXCEPTION 'anon must not insert email_preferences';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  BEGIN
    UPDATE public.email_preferences SET marketing_status = 'consented' WHERE email_hash = 'hash-fk-survival';
    RAISE EXCEPTION 'anon must not update email_preferences';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  BEGIN
    PERFORM count(*) FROM public.email_deliveries;
    RAISE EXCEPTION 'anon must not select email_deliveries';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  BEGIN
    INSERT INTO public.email_deliveries (
      idempotency_key, email_type, result_id, provider, lease_expires_at, claim_token
    ) VALUES (
      'anon-deny', 'transactional', '11111111-1111-4111-8111-111111111111', 'mock', now() + interval '5 minutes', gen_random_uuid()
    );
    RAISE EXCEPTION 'anon must not insert email_deliveries';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  BEGIN
    PERFORM public.claim_email_delivery(
      'anon-claim-deny', 'transactional', '11111111-1111-4111-8111-111111111111', NULL, 'mock', 300
    );
    RAISE EXCEPTION 'anon must not execute claim_email_delivery';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  BEGIN
    PERFORM public.finalize_email_delivery(
      'anon-finalize-deny', gen_random_uuid(), 'sent', 'mock', NULL, NULL
    );
    RAISE EXCEPTION 'anon must not execute finalize_email_delivery';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  RESET ROLE;
END $$;

DO $$
BEGIN
  SET ROLE authenticated;
  BEGIN
    PERFORM count(*) FROM public.email_preferences;
    RAISE EXCEPTION 'authenticated must not select email_preferences';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  BEGIN
    PERFORM count(*) FROM public.email_deliveries;
    RAISE EXCEPTION 'authenticated must not select email_deliveries';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  BEGIN
    PERFORM public.claim_email_delivery(
      'auth-claim-deny', 'transactional', '11111111-1111-4111-8111-111111111111', NULL, 'mock', 300
    );
    RAISE EXCEPTION 'authenticated must not execute claim_email_delivery';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  RESET ROLE;
END $$;

DO $$
DECLARE
  v_status text;
  v_claim record;
  v_finalize boolean;
  v_token uuid;
  v_result_id uuid := '44444444-4444-4444-8444-444444444444';
BEGIN
  SET ROLE service_role;

  SELECT marketing_status INTO v_status
  FROM public.email_preferences
  WHERE email_hash = 'hash-fk-survival';

  IF v_status <> 'unsubscribed' THEN
    RAISE EXCEPTION 'service_role must read marketing_status by email_hash';
  END IF;

  INSERT INTO public.email_preferences (email_hash, marketing_status, consent_source, consent_version, consented_at)
  VALUES ('hash-service-role', 'consented', 'validation', '1', now())
  ON CONFLICT (email_hash) DO UPDATE
  SET marketing_status = EXCLUDED.marketing_status,
      consent_source = EXCLUDED.consent_source,
      consent_version = EXCLUDED.consent_version,
      consented_at = EXCLUDED.consented_at,
      unsubscribed_at = NULL;

  UPDATE public.email_preferences
  SET marketing_status = 'unsubscribed', unsubscribed_at = now()
  WHERE email_hash = 'hash-service-role';

  SELECT * INTO v_claim
  FROM public.claim_email_delivery(
    'validation-key-service-role',
    'transactional',
    v_result_id,
    NULL,
    'mock',
    300
  );

  IF v_claim.claim_status <> 'claimed' THEN
    RAISE EXCEPTION 'service_role claim failed: %', v_claim.claim_status;
  END IF;

  v_token := v_claim.claim_token;

  SELECT public.finalize_email_delivery(
    'validation-key-service-role',
    v_token,
    'sent',
    'mock',
    'msg-service-role',
    NULL
  ) INTO v_finalize;

  IF NOT v_finalize THEN
    RAISE EXCEPTION 'service_role finalize failed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.email_deliveries
    WHERE idempotency_key = 'validation-key-service-role'
      AND status = 'sent'
      AND provider_message_id = 'msg-service-role'
  ) THEN
    RAISE EXCEPTION 'service_role must select finalized delivery row';
  END IF;

  RESET ROLE;
END $$;

DO $$
DECLARE
  v_claim record;
  v_second record;
  v_token uuid;
  v_finalize boolean;
  v_result_id uuid := '11111111-1111-4111-8111-111111111111';
BEGIN
  SET ROLE service_role;

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

  SELECT claim_status INTO v_second.claim_status
  FROM public.claim_email_delivery(
    'validation-key-1',
    'transactional',
    v_result_id,
    NULL,
    'mock',
    300
  );

  IF v_second.claim_status <> 'duplicate' THEN
    RAISE EXCEPTION 'sent must be terminal duplicate, got %', v_second.claim_status;
  END IF;

  RESET ROLE;
END $$;

SET ROLE service_role;

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

-- ─── 0005 webhook event ledger (dedup, correlation, suppression, ordering) ────
DO $$
DECLARE
  v_result text;
  v_status text;
  v_suppressed boolean;
BEGIN
  INSERT INTO public.email_deliveries (
    idempotency_key, email_type, result_id, provider, provider_message_id,
    lease_expires_at, claim_token
  ) VALUES (
    'webhook-key-1', 'transactional', gen_random_uuid(), 'resend', 'pm-1',
    now() + interval '5 minutes', gen_random_uuid()
  );

  v_result := public.record_email_webhook_event('svix-1', 'email.delivered', 'pm-1', now());
  IF v_result <> 'applied' THEN
    RAISE EXCEPTION 'expected applied, got %', v_result;
  END IF;

  v_result := public.record_email_webhook_event('svix-1', 'email.delivered', 'pm-1', now());
  IF v_result <> 'duplicate' THEN
    RAISE EXCEPTION 'duplicate svix_id must be ignored, got %', v_result;
  END IF;

  v_result := public.record_email_webhook_event('svix-unmatched', 'email.delivered', 'pm-missing', now());
  IF v_result <> 'applied_unmatched' THEN
    RAISE EXCEPTION 'unmatched provider id expected applied_unmatched, got %', v_result;
  END IF;

  v_result := public.record_email_webhook_event('svix-2', 'email.bounced', 'pm-1', now());
  SELECT provider_status, suppressed INTO v_status, v_suppressed
  FROM public.email_deliveries WHERE provider_message_id = 'pm-1';
  IF v_suppressed IS NOT TRUE OR v_status <> 'email.bounced' THEN
    RAISE EXCEPTION 'bounce must suppress and set status, got %/%', v_status, v_suppressed;
  END IF;

  -- Out-of-order: an older delivered event must not clear suppression or regress status.
  v_result := public.record_email_webhook_event('svix-3', 'email.delivered', 'pm-1', now() - interval '1 day');
  SELECT provider_status, suppressed INTO v_status, v_suppressed
  FROM public.email_deliveries WHERE provider_message_id = 'pm-1';
  IF v_suppressed IS NOT TRUE OR v_status <> 'email.bounced' THEN
    RAISE EXCEPTION 'out-of-order delivered regressed state, got %/%', v_status, v_suppressed;
  END IF;
END $$;

-- anon/authenticated must not touch the webhook ledger or RPC.
SET ROLE anon;
DO $$
BEGIN
  BEGIN
    PERFORM 1 FROM public.email_webhook_events LIMIT 1;
    RAISE EXCEPTION 'anon must not select email_webhook_events';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.record_email_webhook_event('x', 'email.sent', NULL, now());
    RAISE EXCEPTION 'anon must not execute record_email_webhook_event';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;

RESET ROLE;

SELECT 'migration_0004_validation_passed' AS result;
SELECT 'migration_0005_validation_passed' AS result;
