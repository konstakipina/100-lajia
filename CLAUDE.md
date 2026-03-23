# CLAUDE.md — 100 Lajia

## ENFORCEMENT RULES

### Design
- The prototype design is FROZEN. Do not modify any visual element.
- When adding new features, match the existing design language exactly.
- If you're unsure whether a change affects design: it does. Ask first.
- Do not refactor component structure unless explicitly asked.
- Do not change inline styles, color values, spacing, or typography.
- When in doubt about any visual detail, refer to PROTOTYPE.html.

### Database Safety
- NEVER write or run migration SQL. Migrations are human-reviewed and manually applied.
- NEVER use raw database queries from the app. All DB access goes through Edge Functions.
- You may create new Edge Functions or modify existing ones.
- You may suggest new migrations in comments or documentation, but never create .sql files.

### General
- Do not "improve" code style, naming, or structure unless explicitly asked.
- Preserve all existing patterns. New code should match existing conventions.
- All styling uses inline React style objects matching the CSS custom properties from the prototype.
- Do not introduce a CSS-in-JS library or change the styling approach.

## TODOs FOR CLAUDE CODE

These are known gaps left intentionally in the scaffold:

1. **Team score distinct count**: The `teams` Edge Function currently counts rows, not distinct species. Create an RPC function `get_team_score(team_uuid)` that returns `COUNT(DISTINCT species_id)` and call it from the Edge Function.
2. **Auth middleware**: Add Next.js middleware to protect `/` routes (redirect to `/login` if no session) and `/admin/*` routes (check admin role).
3. **Admin pages**: Build `/admin/species` and `/admin/teams` pages using the same design tokens and component patterns. These have no prototype — use the existing design language.
4. **Error states & loading**: Add loading indicators and error handling to all pages.
5. **"Not assigned" state**: If a logged-in user has no team, show a friendly message instead of the sighting form.

## PROJECT PLAN

# 100 Lajia — Project Plan

## Stack
- Framework: Next.js (App Router)
- Database: Supabase (Postgres + RLS)
- Auth: Google OAuth → Supabase Auth
- Access Control: Role-based (roles: `admin`, `player`)
- Hosting: Vercel
- Language: TypeScript throughout

## Frozen Design

The artifact prototype is the single source of truth for all visual design.
Claude Code must not modify colors, spacing, typography, layout, component
structure, animations, or interaction patterns unless explicitly approved.

### Design Tokens (extracted)

**Colors:**
- `--p: #F6F2EA` (page background)
- `--card: #FAF7F0` (card/surface)
- `--border: #D8D2C2` (borders)
- `--bf: #E8E2D4` (subtle borders/dividers)
- `--ink: #2A2018` (primary text)
- `--inkm: #6B6050` (medium text)
- `--inkl: #A89880` (light text/labels)
- `--acc: #3B6D11` (green accent — new species)
- `--accl: #EAF3DE` (accent light bg)
- `--acct: #27500A` (accent text)
- `--accb: #C0DD97` (accent border)
- Team color palettes: Pöllöt `#FAEEDA/#BA7517`, Tiainen FC `#E6F1FB/#185FA5`, Haukan Kynsi `#E1F5EE/#0F6E56`, Varpuset Lahti `#FAECE7/#993C1D`

**Typography:**
- Display/headings: `Caveat` (cursive), 400/500 weight
- Scientific names/accents: `Crimson Pro` italic, 400 weight
- UI text: `system-ui, sans-serif`
- Size scale: 10px (labels/uppercase), 11-13px (body/meta), 15px (buttons), 18px (list items), 22px (search input), 26px (section titles), 52px (logo)

**Spacing:**
- Page padding: 20px horizontal
- Content gap: 18px vertical
- Card padding: 14px
- Nav padding: 10px 20px 28px
- Topbar padding: 16px 20px 14px

**Borders:**
- Radius: 10px (cards, buttons, inputs), 99px (filter pills), 50% (avatars/dots)
- Width: 0.5px (all borders/dividers)

**Other:**
- Max-width: 420px (mobile-first single column)
- Notification bar: green accent bg, auto-dismiss 3.5s
- Filter pills: dark fill when active
- Leaderboard avatars: 30×30px circles with team colors

### Component Inventory

- **LoginPage**: Google OAuth button, logo with "100 lajia / Havaintopäiväkirja" branding, season label
  - States: default only
- **TopBar**: Eyebrow label, Caveat title, meta line
  - States: varies per page (different titles/meta)
- **NotificationBar**: Green banner for save confirmations ("Uusi laji!" / "Tallennettu")
  - States: hidden (default), visible (auto-dismiss 3.5s)
- **SpeciesSearch**: Text input with dropdown results, max 7 hits
  - States: empty, typing (dropdown visible), selected (card appears below)
- **SelectedSpeciesCard**: Shows picked species name + sci name, asterisk if new
  - States: hidden, visible, new-species indicator
- **SightingForm**: Ruled-row card with date, location (text + coords), observer select
  - States: hidden, visible (after species selected)
- **SaveButton**: Full-width dark button
  - States: hidden, visible
- **FeedItem**: Numbered row with species name, sci name, star if new, meta line
  - States: default (with/without star)
- **FilterBar**: Horizontal pill buttons for team + observer filtering
  - States: pills toggle active/inactive; observer row hidden when "Kaikki" team selected
- **LeaderboardRow**: Rank number, colored avatar circle, name/sub, score
  - States: gold/silver/bronze rank coloring for top 3
- **BottomNav**: 3-item navigation with label + sublabel, arrow, active state
  - States: active item highlighted

## Scoring Rules

- **Individual score**: Count of unique species observed by that person
- **Team score**: Count of unique species observed by ANY member of the team (first sighting of a species by any member counts; duplicates by other members do not add to team score)
- The `*` star indicator marks a species that is new for that individual user

## Core Features

1. **Google Login**: User taps "Kirjaudu Google-tilillä" → Google OAuth via Supabase Auth → redirected to Omat havainnot. If user has no profile, one is created with default `player` role. If user is not assigned to a team, they see a "not yet assigned" message.
2. **Species Search**: User types in search input → real-time filter against species table (Finnish name OR scientific name, case-insensitive) → dropdown shows max 7 matches → tap selects species and reveals form.
3. **Log Sighting**: After selecting species, user fills date (defaults to today), location (text input, defaults to last used or empty), observer (dropdown of own team members). Tap "Tallenna" → sighting saved → notification bar shows "Uusi laji!" (if new for user) or "Tallennettu" → form resets → personal feed updates.
4. **Personal Feed (Omat havainnot)**: Shows all sightings by the logged-in user, newest first, numbered. Header shows total sighting count + unique species count. Each entry shows species name, sci name, star if it was a new species at time of logging, date, location.
5. **Logbook (Havaintokirja)**: Shows ALL sightings across all teams, newest first. Filterable by team (pill buttons) → selecting a team reveals observer sub-filter (pill buttons for that team's members). "Kaikki" resets. Header shows filtered count + date.
6. **Standings (Kilpailutilanne)**: Two leaderboards — Teams (sorted by team score desc) and Individuals (sorted by individual score desc). Top 3 get gold/silver/bronze rank styling. Team rows show initials avatar, team name, member count, score + "lj" unit. Individual rows show initials avatar, name, team name, score + "lj" unit.
7. **Admin: Manage Species**: Admin can add/edit/remove species from the master list (Finnish name + scientific name). No UI in prototype — build a simple `/admin/species` page matching the existing design language.
8. **Admin: Manage Teams & Assignments**: Admin can create teams (name, color bg/fg, initials) and assign users to teams. No UI in prototype — build a simple `/admin/teams` page matching the existing design language.

## Auth & Access Control

- Google OAuth flow: Supabase Auth with Google provider → on first login, create `profiles` row + default `player` role
- Roles:
  - `player`: Can log sightings (for self or teammates via observer dropdown), view all pages
  - `admin`: All player permissions + manage species list + manage teams/assignments
- Protected routes:
  - `/` (main app): requires authenticated `player` or `admin`
  - `/admin/*`: requires `admin` role
  - `/login`: public
- Default role for new users: `player`

## Database Schema

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | = auth.users.id |
| email | text | from Google |
| display_name | text | from Google |
| avatar_url | text | from Google (nullable) |
| created_at | timestamptz | default now() |

RLS: Users can read all profiles. Users can update own profile only.

### `user_roles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| user_id | uuid FK → profiles.id | |
| role | text | 'player' or 'admin' |
| granted_by | uuid FK → profiles.id | nullable |
| created_at | timestamptz | default now() |

RLS: All authenticated users can read. Only admins can insert/update/delete.

### `teams`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| name | text | e.g. "Pöllöt" |
| initials | text | e.g. "PÖ" (2 chars) |
| color_bg | text | hex, e.g. "#FAEEDA" |
| color_fg | text | hex, e.g. "#BA7517" |
| created_at | timestamptz | default now() |

RLS: All authenticated can read. Only admins can insert/update/delete.

### `team_members`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| team_id | uuid FK → teams.id | |
| user_id | uuid FK → profiles.id | unique |
| created_at | timestamptz | default now() |

RLS: All authenticated can read. Only admins can insert/update/delete.

### `species`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| name_fi | text | Finnish name |
| name_sci | text | Scientific name |
| created_at | timestamptz | default now() |

RLS: All authenticated can read. Only admins can insert/update/delete.

### `sightings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| species_id | uuid FK → species.id | |
| observer_id | uuid FK → profiles.id | who saw it |
| logged_by | uuid FK → profiles.id | who entered it (may differ) |
| team_id | uuid FK → teams.id | denormalized for query perf |
| date | date | observation date |
| location_name | text | e.g. "Liminganlahti" |
| location_lat | float8 | nullable |
| location_lon | float8 | nullable |
| is_new_for_user | boolean | was this species new for observer at time of save |
| created_at | timestamptz | default now() |

RLS: All authenticated can read all sightings. Players can insert sightings where `logged_by` = own id. Admins can insert/update/delete any.

**Computed scores (via views or Edge Function logic):**
- Individual score: `SELECT COUNT(DISTINCT species_id) FROM sightings WHERE observer_id = ?`
- Team score: `SELECT COUNT(DISTINCT species_id) FROM sightings WHERE team_id = ?`

## Edge Functions

All runtime DB access goes through Supabase Edge Functions. The app never makes raw queries.

### `species`
- **Operations**: list (all), create, update, delete
- **Auth**: list = any authenticated; create/update/delete = admin only
- **Intent**: CRUD for the master species list. List supports search query param for filtered results.

### `sightings`
- **Operations**: list (with filters), create
- **Auth**: list = any authenticated; create = any authenticated (validated: observer must be on same team as logged_by user)
- **Auth validation on create**: verify logged_by matches auth token, verify observer_id is on same team as logged_by
- **Intent**: Log observations and retrieve feeds. List accepts query params: `user_id`, `team_id`, `observer_id` for filtering. On create, compute `is_new_for_user` by checking if observer has prior sighting of same species.

### `teams`
- **Operations**: list (with members + scores), create, update, delete, assign-member, remove-member
- **Auth**: list = any authenticated; all mutations = admin only
- **Intent**: Team management. List response includes nested members array and computed team score.

### `standings`
- **Operations**: get (returns both team and individual leaderboards)
- **Auth**: any authenticated
- **Intent**: Single endpoint that returns sorted team scores and individual scores. Team score = COUNT(DISTINCT species_id) per team. Individual score = COUNT(DISTINCT species_id) per user.

### `profiles`
- **Operations**: get-me (own profile + team info), list (all, for admin)
- **Auth**: get-me = any authenticated; list = admin only
- **Intent**: Profile retrieval. get-me returns profile + team + role for the authenticated user.

## What Claude Code MUST NOT Change
- All visual design (see Frozen Design above)
- Component structure and hierarchy
- Interaction patterns (notification dismiss timing, dropdown behavior, filter toggling, form show/hide)
- Layout and spacing relationships
- Color palette and typography
- Database schema (migrations are reviewed and run manually, never by Claude Code)
- Scoring logic (unique species per user for individual, unique species per team for team)

## What Claude Code SHOULD Build
- Edge Function implementation (boilerplate provided, logic needs wiring)
- Auth integration (Supabase Auth + Google OAuth)
- Role-based route protection (middleware for `/admin/*`)
- Data fetching from Edge Functions (typed API client)
- Real-time or polling for logbook/standings updates (nice-to-have, not required for v1)
- Admin pages (`/admin/species`, `/admin/teams`) matching existing design language
- Deployment config (Vercel + Supabase env vars)
- `is_new_for_user` computation on sighting creation
