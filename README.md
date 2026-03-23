# 100 Lajia — Havaintopäiväkirja

A bird observation competition app for teams. Players log species sightings, compete individually and as teams to observe the most unique species.

## Setup

### Prerequisites
- Node.js 18+
- Supabase account (free tier works)
- Google Cloud project with OAuth credentials
- Vercel account (for deployment)

### 1. Supabase Project

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **Authentication → Providers → Google** and enable it with your Google OAuth client ID/secret
3. Run the migration manually in the SQL Editor:
   - Open `supabase/migrations/001_initial.sql`
   - Paste and run it in the Supabase SQL Editor
4. Deploy Edge Functions:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   supabase functions deploy species
   supabase functions deploy sightings
   supabase functions deploy teams
   supabase functions deploy standings
   supabase functions deploy profiles
   ```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

### 3. Local Development

```bash
npm install
npm run dev
```

### 4. Deploy to Vercel

```bash
npx vercel
```

Set the same environment variables in Vercel's project settings.

### 5. Seed Data

After first deploy, log in as the first user. Then manually set yourself as admin:

```sql
UPDATE user_roles SET role = 'admin' WHERE user_id = 'YOUR_USER_ID';
```

Then use the admin pages (`/admin/species`, `/admin/teams`) to set up the species list and teams.

## Architecture

- **Frontend**: Next.js App Router, React, Tailwind CSS
- **Backend**: Supabase Edge Functions (Deno) — all DB access goes through these
- **Database**: Supabase Postgres with Row Level Security
- **Auth**: Google OAuth via Supabase Auth

See `CLAUDE.md` for detailed project plan and enforcement rules.
