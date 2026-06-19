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
| `delivery-ledger.ts` | `claim()` / `markSent()` contract (future Supabase UNIQUE insert) |
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
| `submitted_quiz_result_email` | Guest email persisted on the row — **not verified**; requires `explicitDeliveryRequest: true` |

Do **not** auto-send on every quiz save. Guest delivery requires an explicit server-side request signal (future trigger).

## Canonical pattern

Email payloads always use `getSignatureFromAnswers(answers)`. Stored `signature_*` fields are compared for mismatch diagnostics only — never trusted as canonical.

## Secure links

Origin comes from server configuration only (`RESULT_EMAIL_SITE_ORIGIN`, `NEXT_PUBLIC_SITE_URL`, or approved production default). Callers cannot supply arbitrary origins.

- Result: `/dashboard/profile`
- Dashboard: `/dashboard`

## Score source

Payload score uses `resolveResultScoreData()` only. Unavailable scores remain `null`.

## Idempotency limitations

- Service uses atomic `ledger.claim()` — no `find → upsert` concurrency guard
- In-memory ledger protects duplicates **within one process only**
- Disabled sends **do not claim** the idempotency key (can retry after enablement)
- **Production duplicate protection requires a verified Supabase delivery ledger migration**

Future SQL shape:

```sql
INSERT INTO email_deliveries (idempotency_key, ...)
ON CONFLICT (idempotency_key) DO NOTHING
```

## Mock behavior

- Blocked when `NODE_ENV=production`
- Records status `previewed`, not `sent`
- Does **not** emit `result_email_sent`
- Placeholder copy allowed only for mock path

## PR 7B / follow-up

- Final subject, preview, HTML, and plain-text templates
- Verified Supabase `email_deliveries` migration + RLS
- Approved transactional email provider adapter
- Safe server-side trigger after explicit delivery request
- Marketing consent model (not present today)
