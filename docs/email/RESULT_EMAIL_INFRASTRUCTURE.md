# Result email infrastructure (PR 7A)

Safe, server-only foundation for transactional result emails. **Production delivery is disabled by default.**

## Audit outcome

- **Email provider:** none installed (Outcome C)
- **Supabase remote:** not verified in this PR (MCP unavailable); schema inferred from repository migrations only
- **Idempotency storage:** no existing delivery table; process-local `InMemoryEmailDeliveryLedger` until a verified migration is approved
- **Production trigger:** not connected — callable service only

## Components

| Module | Purpose |
|--------|---------|
| `result-email-payload.ts` | Canonical typed payload from persisted `quiz_results` rows |
| `result-email-service.ts` | Server-only send orchestration with feature flag + idempotency |
| `providers/mock-provider.ts` | Test/local adapter (`RESULT_EMAIL_PROVIDER=mock`) |
| `delivery-ledger.ts` | Duplicate protection interface (in-memory default) |
| `result-email-analytics.ts` | First-party operational events only |

## Feature flag

```env
RESULT_EMAIL_SENDING_ENABLED=false   # missing or false => no real send
RESULT_EMAIL_PROVIDER=mock           # only for local/test when explicitly enabled
RESULT_EMAIL_TEMPLATE_VERSION=1
RESULT_EMAIL_SITE_ORIGIN=            # optional; defaults to https://getfocusroute.com
```

## Trusted email sources

1. Authenticated Supabase user email matched to the quiz row
2. Persisted `quiz_results.email` for the same `resultId`

Do **not** source email from analytics, URL params, or client storage alone.

## Secure links

Emails link only to authenticated dashboard routes:

- Result: `/dashboard/profile`
- Dashboard: `/dashboard`

No signed tokens, query-string PII, or raw answers in URLs.

## Score source

Payload score uses `resolveResultScoreData()` only. Unavailable scores remain `null`.

## PR 7B / follow-up

- Final subject, preview, HTML, and plain-text templates
- Verified Supabase `email_deliveries` migration + RLS
- Approved transactional email provider adapter
- Safe server-side trigger after quiz result persistence
- Marketing consent model (not present today)
