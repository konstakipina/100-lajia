-- 100 Lajia MVP initial schema
-- Target: Supabase Postgres

begin;

create extension if not exists pg_trgm;
create extension if not exists btree_gist;

-- ----------
-- Profiles
-- ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text not null unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------
-- Competitions
-- ----------
create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  year int not null unique,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competitions_dates_check check (start_date <= end_date)
);

-- ----------
-- Teams and memberships
-- ----------
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_name_unique unique (name)
);

create table if not exists public.competition_teams (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint competition_teams_unique unique (competition_id, team_id)
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_members_role_check check (role in ('member','captain','admin')),
  constraint team_members_unique unique (competition_id, team_id, user_id)
);

-- ----------
-- Species
-- ----------
create table if not exists public.species (
  id bigserial primary key,
  common_name text not null,
  scientific_name text not null,
  finnish_name text,
  english_name text,
  image_url text,
  is_finland_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint species_names_unique unique (scientific_name)
);

create index if not exists species_common_name_trgm_idx on public.species using gin (common_name gin_trgm_ops);
create index if not exists species_scientific_name_trgm_idx on public.species using gin (scientific_name gin_trgm_ops);
create index if not exists species_finnish_name_trgm_idx on public.species using gin (finnish_name gin_trgm_ops);
create index if not exists species_english_name_trgm_idx on public.species using gin (english_name gin_trgm_ops);

-- ----------
-- Sightings
-- ----------
create table if not exists public.sightings (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  species_id bigint not null references public.species(id),
  entered_by_user_id uuid not null references public.profiles(id),
  sighted_for_user_id uuid not null references public.profiles(id),
  team_id uuid not null references public.teams(id),
  seen_at timestamptz not null,
  latitude numeric(9,6),
  longitude numeric(9,6),
  location_label text,
  notes text,
  is_new_for_user_year boolean not null default false,
  is_new_for_team_year boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sightings_latitude_check check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint sightings_longitude_check check (longitude is null or (longitude >= -180 and longitude <= 180))
);

create index if not exists sightings_comp_seen_at_idx on public.sightings (competition_id, seen_at desc);
create index if not exists sightings_team_comp_idx on public.sightings (team_id, competition_id);
create index if not exists sightings_user_comp_idx on public.sightings (sighted_for_user_id, competition_id);
create index if not exists sightings_species_comp_idx on public.sightings (species_id, competition_id);

-- ----------
-- Utility trigger for updated_at
-- ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_competitions_updated_at
before update on public.competitions
for each row execute function public.set_updated_at();

create trigger set_teams_updated_at
before update on public.teams
for each row execute function public.set_updated_at();

create trigger set_team_members_updated_at
before update on public.team_members
for each row execute function public.set_updated_at();

create trigger set_species_updated_at
before update on public.species
for each row execute function public.set_updated_at();

create trigger set_sightings_updated_at
before update on public.sightings
for each row execute function public.set_updated_at();

-- ----------
-- Sighting business rule checks and scoring flags
-- ----------
create or replace function public.apply_sighting_rules()
returns trigger
language plpgsql
as $$
declare
  v_start_date date;
  v_end_date date;
  v_member_exists boolean;
begin
  -- Ensure team is participating in selected competition
  if not exists (
    select 1
    from public.competition_teams ct
    where ct.competition_id = new.competition_id
      and ct.team_id = new.team_id
  ) then
    raise exception 'Team % is not registered in competition %', new.team_id, new.competition_id;
  end if;

  -- Ensure sighted_for_user belongs to the team in this competition
  select exists (
    select 1
    from public.team_members tm
    where tm.competition_id = new.competition_id
      and tm.team_id = new.team_id
      and tm.user_id = new.sighted_for_user_id
  ) into v_member_exists;

  if not v_member_exists then
    raise exception 'User % is not a member of team % for competition %', new.sighted_for_user_id, new.team_id, new.competition_id;
  end if;

  -- Ensure entered_by_user is also part of the team (or can be tightened later to captains/admin)
  select exists (
    select 1
    from public.team_members tm
    where tm.competition_id = new.competition_id
      and tm.team_id = new.team_id
      and tm.user_id = new.entered_by_user_id
  ) into v_member_exists;

  if not v_member_exists then
    raise exception 'Entering user % is not a member of team % for competition %', new.entered_by_user_id, new.team_id, new.competition_id;
  end if;

  -- Ensure sighting timestamp is inside competition date range
  select c.start_date, c.end_date
  into v_start_date, v_end_date
  from public.competitions c
  where c.id = new.competition_id;

  if new.seen_at::date < v_start_date or new.seen_at::date > v_end_date then
    raise exception 'Sighting timestamp % is outside competition date range %..%', new.seen_at, v_start_date, v_end_date;
  end if;

  -- Compute uniqueness flags for the competition year
  new.is_new_for_user_year := not exists (
    select 1
    from public.sightings s
    where s.competition_id = new.competition_id
      and s.sighted_for_user_id = new.sighted_for_user_id
      and s.species_id = new.species_id
  );

  new.is_new_for_team_year := not exists (
    select 1
    from public.sightings s
    where s.competition_id = new.competition_id
      and s.team_id = new.team_id
      and s.species_id = new.species_id
  );

  return new;
end;
$$;

create trigger apply_sighting_rules_before_insert
before insert on public.sightings
for each row execute function public.apply_sighting_rules();

-- ----------
-- Leaderboard views
-- ----------
create or replace view public.v_individual_scores as
select
  s.competition_id,
  s.sighted_for_user_id as user_id,
  count(*) filter (where s.is_new_for_user_year) as unique_species_count,
  count(*) as total_sightings,
  min(s.seen_at) as first_logged_at,
  max(s.seen_at) as latest_logged_at
from public.sightings s
group by s.competition_id, s.sighted_for_user_id;

create or replace view public.v_team_scores as
select
  s.competition_id,
  s.team_id,
  count(*) filter (where s.is_new_for_team_year) as unique_species_count,
  count(*) as total_sightings,
  min(s.seen_at) as first_logged_at,
  max(s.seen_at) as latest_logged_at
from public.sightings s
group by s.competition_id, s.team_id;

create or replace view public.v_latest_sightings as
select
  s.id,
  s.competition_id,
  c.year as competition_year,
  s.species_id,
  sp.common_name,
  sp.scientific_name,
  sp.finnish_name,
  sp.english_name,
  s.entered_by_user_id,
  s.sighted_for_user_id,
  s.team_id,
  t.name as team_name,
  s.seen_at,
  s.latitude,
  s.longitude,
  s.location_label,
  s.notes,
  s.is_new_for_user_year,
  s.is_new_for_team_year,
  s.created_at
from public.sightings s
join public.competitions c on c.id = s.competition_id
join public.teams t on t.id = s.team_id
join public.species sp on sp.id = s.species_id;

-- ----------
-- RLS
-- ----------
alter table public.profiles enable row level security;
alter table public.competitions enable row level security;
alter table public.teams enable row level security;
alter table public.competition_teams enable row level security;
alter table public.team_members enable row level security;
alter table public.species enable row level security;
alter table public.sightings enable row level security;

-- Profiles: user can read/update own row
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Competitions and species: readable by authenticated users
create policy "competitions_select_authenticated"
  on public.competitions for select
  to authenticated
  using (true);

create policy "species_select_authenticated"
  on public.species for select
  to authenticated
  using (true);

-- Teams/membership visibility limited to teams user belongs to in any competition
create policy "teams_select_member"
  on public.teams for select
  to authenticated
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = teams.id
        and tm.user_id = auth.uid()
    )
  );

create policy "team_members_select_member"
  on public.team_members for select
  to authenticated
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_members.team_id
        and tm.competition_id = team_members.competition_id
        and tm.user_id = auth.uid()
    )
  );

create policy "competition_teams_select_member"
  on public.competition_teams for select
  to authenticated
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = competition_teams.team_id
        and tm.competition_id = competition_teams.competition_id
        and tm.user_id = auth.uid()
    )
  );

-- Sightings: members can read team sightings for competitions they are in
create policy "sightings_select_member"
  on public.sightings for select
  to authenticated
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = sightings.team_id
        and tm.competition_id = sightings.competition_id
        and tm.user_id = auth.uid()
    )
  );

-- Insert sightings by team members only, for same team and competition
create policy "sightings_insert_member"
  on public.sightings for insert
  to authenticated
  with check (
    entered_by_user_id = auth.uid()
    and exists (
      select 1 from public.team_members tm
      where tm.team_id = sightings.team_id
        and tm.competition_id = sightings.competition_id
        and tm.user_id = auth.uid()
    )
  );

-- No delete/update policy in MVP (immutable event log)

commit;
