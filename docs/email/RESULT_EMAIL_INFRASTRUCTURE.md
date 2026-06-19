# Result email infrastructure (PR 7A)

Safe, server-only foundation for transactional result emails. **Production delivery is disabled by default.**

## Audit outcome

- **Email provider:** none installed (Outcome C)
- **Supabase remote:** not verified (MCP unavailable); schema inferred from repository migrations only
- **Idempotency storage:** no delivery table yet — atomic `claim()` contract implemented in-memory for tests only
- **Production trigger:** not connected — callable service only

## Components

| Module | Purpose |
|--------|---------|
| `result-email-payload.ts` | Canonical payload from persisted `quiz_results` rows |
| `result-email-service.ts` | Server-only orchestration with atomic claim + feature flag |
| `delivery-ledger.ts` | `claim()` / `markSent()` / retry contract (future Supabase atomic upsert) |
| `providers/mock-provider.ts` | Local/test adapter only — returns `previewed`, never real `sent` |
| `result-email-analytics.ts` | First-party operational events only |

## Feature flag

```env
RESULT_EMAIL_SENDING_ENABLED=false   # missing or false => no send attempt
RESULT_EMAIL_PROVIDER=mock           # forbidden when NODE_ENV=production
RESULT_EMAIL_ALLOW_MOCK=             # optional local guard
RESULT_EMAIL_TEMPLATE_VERSION=1
RESULT_EMAIL_SITE_ORIGIN=            # optional; allowlisted production hosts only
```

## Recipient sources

| Source | Meaning |
|--------|---------|
| `authenticated_user` | Supabase auth email with matching `quizRow.user_id` |
| `submitted_quiz_result_email` | Guest email persisted on the row — **not verified**; requires `explicitDeliveryRequest: true`; **only for rows without `user_id`** |

Authenticated quiz rows must use `authenticated_user`. Guest source rejects any row with a non-empty `user_id`.

Do **not** auto-send on every quiz save. Guest delivery requires an explicit server-side request signal (future trigger in PR 7B).

## Canonical pattern

Email payloads require `hasUsableSignatureSignal(answers)` from `signature.ts`, then always use `getSignatureFromAnswers(answers)`. Stored `signature_*` fields are compared for mismatch diagnostics only — never trusted as canonical.

Unknown question IDs, malformed canonical values, and demographic-only rows fail with `result_email_insufficient_answers`.

## Secure links

Origin comes from server configuration only (`RESULT_EMAIL_SITE_ORIGIN`, `NEXT_PUBLIC_SITE_URL`, or approved production default). Callers cannot supply arbitrary origins.

- Result: `/dashboard/profile`
- Dashboard: `/dashboard`

## Score source

Payload score uses `resolveResultScoreData()` only. Unavailable scores remain `null`.

## Idempotency and retry

- Service uses atomic `ledger.claim()` — no `find → upsert` concurrency guard
- Only `claimed` or `reclaimed` may invoke the provider
- `sent` and `previewed` are terminal duplicates
- Active `pending` claims hold a lease (default 5 minutes) — concurrent callers receive `skipped_in_progress`
- Expired `pending` claims may be reclaimed
- `failed` records may be reclaimed for retry; `attemptCount` increments only on claim/reclaim, not on status updates
- Disabled sends **do not claim** the idempotency key (can retry after enablement)
- In-memory ledger protects duplicates **within one process only**
- **Production duplicate protection and retry require a verified Supabase delivery ledger migration**

Future persistent shape (conceptual — not implemented in PR 7A):

```sql
INSERT INTO email_deliveries (idempotency_key, status, attempt_count, claimed_at, lease_expires_at, ...)
ON CONFLICT (idempotency_key) DO UPDATE SET
  status = 'pending',
  attempt_count = email_deliveries.attempt_count + 1,
  claimed_at = now(),
  lease_expires_at = now() + interval '5 minutes'
WHERE
  email_deliveries.status = 'failed'
  OR (
    email_deliveries.status = 'pending'
    AND email_deliveries.lease_expires_at < now()
  );
```

A simple `INSERT ... ON CONFLICT DO NOTHING` alone is **not** sufficient for failed/stale-pending retry.

## Mock behavior

- Blocked when `NODE_ENV=production`
- Records status `previewed`, not `sent`
- Does **not** emit `result_email_sent`
- Placeholder copy allowed only for mock path

## PR 7B — Composer 2.5 implementation

- Approved transactional provider adapter
- Verified Supabase `email_deliveries` migration + RLS
- Persistent atomic ledger implementing the claim/reclaim contract
- Final subject, preview text, HTML template, plain-text template
- Explicit transactional send trigger
- Lifecycle templates
- Marketing consent model before any marketing sequence
- Unsubscribe handling where marketing applies
- Provider webhook foundation if selected and required

## PR 7C — Opus audit and review

Reviews (does not primarily implement):

- Security, consent, deliverability
- Email copy, score explanation, subscription clarity, pricing accuracy
- Mobile email rendering, dark-mode client behavior
- Unsubscribe, rate limiting, abuse risk
- Duplicate prevention, provider webhook verification
- Monitoring and production enablement readiness

PR 7C may produce narrowly scoped fixes after audit; it is not the primary build phase for ledger, provider, or trigger.
