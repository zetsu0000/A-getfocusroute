# FocusRoute Brain OS™

FocusRoute is a Next.js funnel product that maps self-reported focus and execution patterns, reveals a partial ADHD Signature™, and converts it into a paid Profile-to-Protocol™ experience with Stripe checkout.

## Funnel Flow

The primary journey is:

`Landing -> Quiz -> Loading -> Email -> Name -> Partial Profile Reveal -> Paywall -> Upsell -> Subscription -> Success`

Key positioning terms used throughout the product:

- FocusRoute Brain Profile™
- FocusRoute Brain OS™
- Cognitive Mapping Assessment™
- ADHD Signature™
- Executive Function Radar™
- Profile-to-Protocol™ Engine
- 28-Day Protocol™
- "This Is Me" 7-Day Guarantee

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Supabase Auth + Postgres (`@supabase/ssr`, `@supabase/supabase-js`)
- Framer Motion
- Zustand for funnel state
- Stripe Elements for payment and subscription flows

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env.local` (see `.env.example`):

**Supabase (required for login + dashboard)**

Production project: **focusroute** · ref **`xhzpmeplpsgnhfzgleaz`** · URL **`https://xhzpmeplpsgnhfzgleaz.supabase.co`** (region `us-west-2`).

- `NEXT_PUBLIC_SUPABASE_URL` — must equal the project URL above for FocusRoute
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key from the dashboard (never commit real values)
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (server-only; never `NEXT_PUBLIC_*`; never import `@/lib/supabase/admin` from Client Components)
- Recommended: `NEXT_PUBLIC_SUPABASE_PROJECT_REF=xhzpmeplpsgnhfzgleaz` — runtime validates hostname matches this ref when set

**Stripe**

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_PRICE_ASSESSMENT`
- `NEXT_PUBLIC_PRICE_ROADMAP`
- `NEXT_PUBLIC_PRICE_MONTHLY`
- `NEXT_PUBLIC_PRICE_ANNUAL`

**Vercel / production:** add the same variables in the project’s Environment Variables UI (no secrets in the repo).

Optional UI pricing overrides:

- `NEXT_PUBLIC_UI_PAYWALL_USD`
- `NEXT_PUBLIC_UI_PAYWALL_ANCHOR_USD`
- `NEXT_PUBLIC_UI_UPSELL_USD`
- `NEXT_PUBLIC_UI_UPSELL_ANCHOR_USD`
- `NEXT_PUBLIC_UI_MEMBERSHIP_MONTHLY_USD`
- `NEXT_PUBLIC_UI_MEMBERSHIP_ANNUAL_USD`

3. Start development:

```bash
npm run dev
```

Open `http://localhost:3000`.

If Next warns about multiple lockfiles or env vars look “missing” during build, run commands from this repo root (`mental/`); `next.config.ts` pins Turbopack to this folder.

## Validation Commands

Use these checks before shipping:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Compliance Notes

- Copy must remain in English.
- Product messaging is educational profiling only.
- Do not claim diagnosis, cure, treatment, or guaranteed medical outcomes.
- Keep explicit disclaimers where relevant: FocusRoute is not a medical diagnosis.

## Stripe and Flow Safety

- Keep the funnel step sequence intact.
- Do not break `setStep(...)` transitions in quiz screens.
- Do not alter Stripe API endpoints or price-id wiring unless intentionally migrating billing behavior.
