# 100-lajia

Bird Sightings Competition Tracker (100 Lajia) MVP.

## Included in this repository

- MVP implementation plan: `docs/mvp-implementation-plan.md`
- Supabase SQL migration draft: `supabase/migrations/0001_initial_competition_schema.sql`
- Supabase verification guide: `docs/supabase-verification.md`
- Supabase verification SQL script: `supabase/tests/verify_mvp_schema.sql`
- Next.js app scaffold with Supabase Auth + sighting entry flow

## Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Run

```bash
npm install
npm run dev
```
