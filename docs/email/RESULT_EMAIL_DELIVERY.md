# Result email delivery (PR 7B)

Implementation layer on top of PR 7A. **All production sending remains disabled by default.**

## Provider status

**Blocked pending transactional email-provider approval.**

Repository search found no explicitly approved transactional email provider (no Resend/SendGrid/Postmark package, env wiring, or project decision doc). PR 7B therefore ships:

- persistent Supabase ledger migration (repository only);
- atomic claim/reclaim RPCs with `claim_token` fencing;
- production-ready `result_ready` template;
- disabled lifecycle/marketing template foundation;
- consent/unsubscribe foundation;
- authenticated transactional request endpoint;
- no real provider adapter;
- no provider webhook handler.

When a provider is approved, add `src/lib/email/providers/<provider>-provider.ts` and wire `RESULT_EMAIL_PROVIDER` without changing the ledger contract.

## Access preflight (PR 7B)

| Capability | Status |
|------------|--------|
| Repository read/write | Available |
| Local tests/lint/build | Available |
| Supabase MCP | Unavailable |
| Supabase CLI | Not installed locally |
| Supabase remote read/write | Not attempted (no migration apply) |
| Repository migrations | Available (`0004_email_delivery_foundation.sql`) |
| Provider dashboard/API | Blocked — no approved provider |
| Provider credentials | Not configured |
| Vercel project/env | Not modified |
| DNS/domain settings | Not modified |

Remote Supabase compatibility was **not verified** in this PR.

## Feature flags

```env
RESULT_EMAIL_SENDING_ENABLED=false
RESULT_EMAIL_TRANSACTIONAL_TRIGGER_ENABLED=false
RESULT_EMAIL_MARKETING_ENABLED=false
RESULT_EMAIL_WEBHOOK_ENABLED=false
```

Missing means disabled. Transactional trigger and sending are separate.

## Persistent ledger

Migration `0004_email_delivery_foundation.sql` adds:

- `email_deliveries` with unique `idempotency_key`, lease timestamps, `claim_token`, attempt count, sanitized failure codes;
- `email_preferences` for marketing consent/unsubscribe foundation;
- `claim_email_delivery()` RPC returning `claimed | reclaimed | duplicate | in_progress`;
- `finalize_email_delivery()` RPC requiring matching `claim_token` and `status = pending`;
- RLS enabled with no anon/authenticated policies (service role only);
- public execute revoked; `service_role` granted.

Do **not** apply this migration remotely from PR 7B.

## Templates

| Key | Classification | Status |
|-----|----------------|--------|
| `result_ready` | transactional | Production-ready HTML + plain text |
| `result_follow_up` | marketing | Defined, not scheduled |
| `assessment_abandonment` | marketing | Defined, not scheduled |
| `checkout_abandonment` | marketing | Defined, not scheduled |
| `focusroute_value` | marketing | Defined, not scheduled |

Marketing templates include `{{unsubscribe_url}}` placeholder only. No marketing sends are activated.

## Request endpoint

`POST /api/result-email/request`

- Input: `{ resultId }` only
- Authenticated users only (guest delivery blocked — no secure guest-request token yet)
- Generic 202 response (no enumeration, no stored email in response)
- Rate limited by IP, result ID, and user ID
- Requires both `RESULT_EMAIL_SENDING_ENABLED` and `RESULT_EMAIL_TRANSACTIONAL_TRIGGER_ENABLED`
- Not wired to UI in this PR

## PR 7C audit scope

Security, consent, deliverability, copy, score explanation, subscription/pricing clarity, email rendering, unsubscribe, abuse controls, duplicate protection, webhook verification, monitoring, production enablement readiness.

See also: [RESULT_EMAIL_INFRASTRUCTURE.md](./RESULT_EMAIL_INFRASTRUCTURE.md)
