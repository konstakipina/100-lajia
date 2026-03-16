# Supabase Verification Guide (100 Lajia MVP)

Use this guide to verify the migration and core competition logic in a Supabase **dev** project.

## 1) Apply migration

1. Open Supabase project.
2. Go to **SQL Editor**.
3. Run `supabase/migrations/0001_initial_competition_schema.sql`.
4. Confirm it completes without errors.

## 2) Preflight checks

Run:

```sql
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles','competitions','teams','competition_teams','team_members','species','sightings'
  )
order by tablename;
```

Expected: 7 rows.

## 3) Prepare test users

The verification script needs at least **2 real auth users** in `auth.users`.

- Create/login two test users in your app (or Auth UI).
- Copy their UUIDs from:

```sql
select id, email from auth.users order by created_at desc limit 10;
```

## 4) Run end-to-end verification script

1. Open `supabase/tests/verify_mvp_schema.sql`.
2. Replace the placeholder UUID constants in the top DO block:
   - `v_user_1`
   - `v_user_2`
3. Run the script in SQL Editor.

What it validates:

- core tables, views, functions, triggers, and RLS are present
- sighting insert in valid competition/team works
- first sighting sets both uniqueness flags to `true`
- duplicate sighting for same user/team sets both uniqueness flags to `false`
- out-of-range `seen_at` fails with the expected business-rule exception

The script runs in a transaction and ends with `rollback`, so it does not keep test data.

## 5) Optional app-level smoke checks

After DB verification, validate from UI/API:

1. Sign in with Google.
2. Search species autosuggest.
3. Create a sighting.
4. Confirm leaderboard increments only on first unique species.
5. Confirm latest sightings feed includes duplicate sightings but score does not change.

## Troubleshooting

- **"Test user UUIDs are placeholders"**: replace with real `auth.users.id` values.
- **FK error on profiles insert**: UUID is not present in `auth.users`.
- **RLS select empty**: logged-in user is not a `team_members` member for the tested competition/team.
