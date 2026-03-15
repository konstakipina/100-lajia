# Bird Sightings Competition Tracker (100 Lajia) — MVP Implementation Plan

## 1. Solution architecture

- **Frontend:** Next.js (App Router) with mobile-first UI components.
- **Backend platform:** Supabase (Postgres, Auth, optional Storage).
- **Authentication:** Google OAuth via Supabase Auth.
- **Hosting:** Cloudflare Pages (or equivalent low-cost static/serverless hosting).
- **Core principle:** Keep backend logic in Postgres (constraints, triggers, views, RLS) to reduce app complexity and cost.

### Why this architecture

- Minimal custom backend required.
- Low operational overhead with managed Postgres/Auth.
- SQL-based rule enforcement gives deterministic scoring and easier auditing.
- Scales from MVP without major rewrites.

---

## 2. Database schema design

Detailed SQL is provided in:

- `supabase/migrations/0001_initial_competition_schema.sql`

### Tables

- `profiles` — app-level user profile linked to `auth.users`.
- `competitions` — annual competition definitions.
- `teams` — teams participating in competitions.
- `competition_teams` — registration of teams per competition.
- `team_members` — user membership in teams per competition.
- `species` — master species list (Finnish + optional European extension).
- `sightings` — immutable sighting log with scoring flags.

### Data integrity and business rules in DB

- Trigger validates team participation and membership for inserts.
- Trigger validates `seen_at` is within competition date range.
- Trigger computes:
  - `is_new_for_user_year`
  - `is_new_for_team_year`
- All sightings are stored; score uses only rows with relevant `is_new_*` flags.

### Read models (views)

- `v_individual_scores` — per-user unique species + total sightings.
- `v_team_scores` — per-team unique species + total sightings.
- `v_latest_sightings` — feed-oriented joined view with species/team metadata.

### Security

- Row Level Security (RLS) enabled on all key tables.
- Policies allow:
  - users to read/update own profile,
  - authenticated reads for competitions/species,
  - team-scoped reads for team/member/sighting data,
  - inserts only by members in their own team/competition context.

---

## 3. API structure (Supabase-first)

MVP should prefer Supabase data access from Next.js (server/client components as needed), with optional RPC for stricter write orchestration.

### Primary API operations

1. **Authentication/session**
   - Sign in with Google
   - Session handling in middleware and layout

2. **Species autosuggest**
   - Query `species` with ilike/trigram-backed filters against:
     - `common_name`, `scientific_name`, `finnish_name`, `english_name`
   - Return top N matches and image URL

3. **Create sighting**
   - Insert into `sightings`
   - DB trigger enforces rule correctness and computes uniqueness flags

4. **Leaderboards**
   - Team leaderboard from `v_team_scores`
   - Individual leaderboard from `v_individual_scores`

5. **Latest sightings feed**
   - Query `v_latest_sightings` by `competition_id`

### Optional RPC additions (if needed)

- `rpc.create_sighting(...)` to centralize insert payload handling and future validation extensions.

---

## 4. Frontend page-by-page structure (Next.js)

Suggested App Router structure:

```text
app/
  (public)/
    login/page.tsx
    auth/callback/route.ts
  (app)/
    layout.tsx
    page.tsx                        # Dashboard
    sightings/
      new/page.tsx                  # Fast entry form
      latest/page.tsx               # Latest sightings feed
    leaderboard/
      teams/page.tsx                # Team leaderboard
      individuals/page.tsx          # Individual leaderboard
    profile/page.tsx                # User profile/team context
  api/
    health/route.ts                 # Optional health check
components/
  auth/
  layout/
  sightings/
  leaderboard/
  species/
lib/
  supabase/
  auth/
  formatting/
```

### Page responsibilities

- **`/login`**
  - Google sign-in CTA
  - Redirect authenticated users to dashboard

- **`/` (dashboard)**
  - Current competition snapshot
  - Quick actions (new sighting, leaderboards, latest sightings)

- **`/sightings/new`**
  - Species autosuggest input
  - Species image preview
  - Timestamp default now (editable)
  - GPS capture (optional, editable)
  - “Log for teammate” selector
  - Save action + success/error feedback

- **`/leaderboard/teams`**
  - Unique species counts per team for selected competition year
  - Optional secondary stat: total sightings

- **`/leaderboard/individuals`**
  - Unique species counts per user
  - Optional secondary stat: total sightings

- **`/sightings/latest`**
  - Chronological feed grouped by team
  - “new for user/team” indicators

- **`/profile`**
  - Display name, avatar, team memberships, active competition context

### Mobile-first UX requirements

- Large touch targets and sticky save CTA.
- High-contrast text and compact forms.
- Minimize typing and reduce taps.
- Fast optimistic interaction where safe.

---

## 5. Authentication flow

1. User taps “Sign in with Google”.
2. Supabase Auth handles OAuth redirect and callback.
3. After first login, app upserts `profiles` from auth metadata:
   - `display_name`, `email`, `avatar_url`.
4. Protected routes enforce authenticated access.
5. RLS ensures team/competition data visibility boundaries.

---

## 6. Leaderboard calculation logic

## Rule implementation

- **Individual scoring**: first species sighting per user per competition year counts.
- **Team scoring**: first species sighting per team per competition year counts.
- Additional duplicate sightings are preserved but do not increase unique score.

### SQL behavior

- Insert trigger computes and stores both boolean flags on each sighting.
- Leaderboard views aggregate rows by competition and user/team.

### Ranking/tie-break recommendations

1. `unique_species_count` DESC
2. `total_sightings` DESC (optional)
3. stable alphabetical tie-break (team/user display name)

---

## 7. Deployment approach

### Supabase

- Use migration-driven schema management.
- Keep seed data scripts for species and baseline competition setup.

### Cloudflare Pages

- Deploy Next.js app on free/low-cost plan.
- Configure environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### CI/CD

- GitHub-triggered preview builds for pull requests.
- Main branch deploys to production.

### Cost-control checklist

- Keep image URLs external during MVP (avoid storage costs).
- Prefer SQL views and indexed queries over custom compute.
- Paginate latest feed and cap autosuggest results.

---

## 8. Phased implementation plan

### Phase 1 — Database foundation

- Apply initial migration.
- Validate constraints, triggers, and RLS policies.
- Seed initial species subset and one competition.

### Phase 2 — Authentication and user profile

- Google OAuth integration.
- Profile upsert flow after login.
- Basic auth protection in app routes.

### Phase 3 — Sighting entry workflow

- Build fast mobile sighting form.
- Add species autosuggest and image preview.
- Add timestamp + location capture/editing.

### Phase 4 — Standings and feed

- Build team/individual leaderboard pages.
- Build latest sightings page with grouping/sorting.

### Phase 5 — Stabilization

- Validate performance on mobile networks.
- Improve UX feedback and error handling.
- Prepare launch checklist and operational docs.
