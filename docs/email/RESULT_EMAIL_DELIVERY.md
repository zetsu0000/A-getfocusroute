# Result email delivery (PR 7B)

Implementation layer on top of PR 7A. **All production sending remains disabled by default.**

## Provider status

**Blocked pending transactional email-provider approval.**

Repository search found no explicitly approved transactional email provider (no Resend/SendGrid/Postmark package, env wiring, or project decision doc). PR 7B therefore ships:

- persistent Supabase ledger migration (repository only);
- atomic claim/reclaim RPCs with `claim_token` fencing;
- production-ready `result_ready` template;
- disabled lifecycle/marketing template foundation;
- canonical email-hash consent/unsubscribe foundation;
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
| Supabase CLI | Via `npx supabase@latest` when needed |
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

## Secrets

Two separate secrets are required (no shared fallback):

```env
EMAIL_PREFERENCE_HASH_SECRET=
EMAIL_UNSUBSCRIBE_TOKEN_SECRET=
```

- `EMAIL_PREFERENCE_HASH_SECRET` — deterministic recipient hashing for `email_preferences.email_hash` only.
- `EMAIL_UNSUBSCRIBE_TOKEN_SECRET` — signing/verification of unsubscribe tokens only.

Missing either secret fails closed. Neither secret belongs in logs, responses, or analytics.

**Rotation:** rotating the hash secret changes stored `email_hash` values and requires a deliberate data migration plan. Rotating the token secret invalidates previously issued unsubscribe links; plan intentional rotation with user-visible fallback (support contact) if needed.

## Rate limiting (`POST /api/result-email/request`)

Two explicit policies replace the former single policy that ran twice:

| Policy | When | Buckets |
|--------|------|---------|
| `resultEmailRequestPreAuth` | Before authentication | `network` (10 / 10 min), `resultRequest` (3 / hour) |
| `resultEmailRequestAuthenticated` | After authenticated user exists | `userAccount` (5 / 24 h per account, not per IP) |

Sequence:

1. Parse and validate `resultId`
2. Pre-auth network/result rate limit (once)
3. Authenticate
4. Unauthenticated → generic 202
5. Authenticated user rate limit (once; user bucket only)
6. Load result, verify ownership, feature flags, request email

Buckets requiring real identifiers are skipped when absent — no `missing-user` or `missing-result` synthetic identities. Unauthenticated requests never execute a user bucket. Network/result buckets are not consumed twice. The authenticated `userAccount` bucket keys only on `userId` (HMAC-protected); IP/network are not part of the identity.

## Persistent ledger

Migration `0004_email_delivery_foundation.sql` adds:

- `email_deliveries` with unique `idempotency_key`, lease timestamps, `claim_token`, attempt count, sanitized failure codes;
- `email_preferences` keyed by canonical `email_hash` (unique index); optional `user_id`/`result_id` linkage uses `ON DELETE SET NULL` so global suppression survives user/result deletion;
- explicit table privileges: `revoke all` from `public`, `anon`, `authenticated`; `grant select, insert, update` to `service_role` only;
- `claim_email_delivery()` RPC returning `claimed | reclaimed | duplicate | in_progress`;
- `finalize_email_delivery()` RPC requiring matching `claim_token` and `status = pending`;
- RLS enabled with no anon/authenticated policies (service role only);
- RPC execute revoked from `public`, `anon`, `authenticated`; granted to `service_role` only;

Do **not** apply this migration remotely from PR 7B.

### Local migration validation

Run against a disposable Docker Postgres instance (migrations `0001`–`0004` only):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/validate-email-migration.ps1
```

The script:

1. Starts ephemeral Postgres 16 (`focusroute-email-migration-test`)
2. Bootstraps minimal `auth` schema and Supabase-like roles (`anon`, `authenticated`, `service_role`) with schema usage only — table/RPC privileges come from migration `0004`
3. Applies migrations `0001`–`0004`
4. Executes `scripts/validate-email-migration.sql` including:
   - FK `ON DELETE SET NULL` catalog checks and live user/result deletion survival for unsubscribed rows
   - `SET ROLE anon` / `authenticated` / `service_role` permission probes (denied vs allowed operations)
   - claim/reclaim, stale-token fencing, consent/unsubscribe upserts

This is **disposable local Postgres role validation**, not a claim of hosted Supabase parity. Remote Supabase was not inspected or modified.

Document the script output in PR notes after each validation run. `psql` is not required locally — validation SQL runs via `docker exec`.

## Email preferences (canonical recipient identity)

`email_hash` is the single canonical consent/suppression identity. At most one `email_preferences` row exists per hash. `user_id` and `result_id` are optional linkage/context fields only — not competing consent keys. Both FKs use `ON DELETE SET NULL`; deleting a linked user or quiz result clears the linkage but preserves the row and `marketing_status` (including global unsubscribe).

Marketing send decisions use:

```ts
getMarketingStatusForRecipient({ email, userId?, resultId? })
```

Rules:

- normalized email is required for a real send decision;
- query by `email_hash`;
- `unsubscribed` and `unknown` block marketing;
- only `consented` permits marketing;
- a user/result-specific row cannot override an unsubscribed hash.

`recordMarketingConsent()` upserts on `email_hash` and requires explicit consent source, version, and timestamp. Consent is never inferred from quiz completion, account creation, transactional requests, checkout, or purchases.

`recordMarketingUnsubscribe()` upserts on `email_hash`, is idempotent, and applies globally. All Supabase writes inspect `error` and surface sanitized internal failures (`email_preferences_write_failed`, `email_preferences_read_failed`).

## Unsubscribe flow

Unsubscribe links carry a **signed PII-safe unsubscribe token** (not raw email). Payload:

```ts
{ version: 1; emailHash: string }
```

Tokens are versioned and **do not expire by default**. Security relies on signature verification, hash-based identity, and idempotent suppression-only POST.

| Method | Behavior |
|--------|----------|
| `GET /api/email/unsubscribe?token=…` | Verify token; render confirmation page with POST form; **no database mutation** (safe for link scanners) |
| `POST /api/email/unsubscribe` | Verify token from form body; call `recordMarketingUnsubscribe(emailHash)`; generic confirmation; idempotent |

RFC one-click unsubscribe (`List-Unsubscribe-Post`) is a future provider-specific requirement — not claimed in PR 7B.

## Analytics

Registered delivery events in PR 7B:

- `result_email_requested`
- `result_email_sent` (future provider accepted the message)
- `result_email_failed`

`result_email_delivered` and `result_email_bounced` were removed — no approved provider webhook exists yet. Do not add delivered/bounced/complained/opened until a verified provider webhook is wired.

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
- Split pre-auth and authenticated rate limits (see above)
- Requires both `RESULT_EMAIL_SENDING_ENABLED` and `RESULT_EMAIL_TRANSACTIONAL_TRIGGER_ENABLED`
- Not wired to UI in this PR

## PR 7C audit scope

Security, consent, deliverability, copy, score explanation, subscription/pricing clarity, email rendering, unsubscribe, abuse controls, duplicate protection, webhook verification, monitoring, production enablement readiness. **PR 7C remains mandatory before merge/production enablement.**

See also: [RESULT_EMAIL_INFRASTRUCTURE.md](./RESULT_EMAIL_INFRASTRUCTURE.md)
