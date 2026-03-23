-- 100 Lajia — Initial Schema
-- Run manually after creating Supabase project.
-- NEVER let Claude Code create or run migrations.

-- ── Profiles ──
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Anyone authenticated can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  -- Default role: player
  insert into public.user_roles (user_id, role)
  values (new.id, 'player');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── User Roles ──
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('player', 'admin')),
  granted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create policy "Anyone authenticated can read roles"
  on public.user_roles for select
  to authenticated
  using (true);

create policy "Only admins can manage roles"
  on public.user_roles for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Helper function to check admin status
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer stable;

-- ── Teams ──
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  initials text not null,
  color_bg text not null,
  color_fg text not null,
  created_at timestamptz not null default now()
);

alter table public.teams enable row level security;

create policy "Anyone authenticated can read teams"
  on public.teams for select
  to authenticated
  using (true);

create policy "Only admins can manage teams"
  on public.teams for all
  to authenticated
  using (public.is_admin());

-- ── Team Members ──
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id) -- one team per user
);

alter table public.team_members enable row level security;

create policy "Anyone authenticated can read team members"
  on public.team_members for select
  to authenticated
  using (true);

create policy "Only admins can manage team members"
  on public.team_members for all
  to authenticated
  using (public.is_admin());

-- ── Species ──
create table public.species (
  id uuid primary key default gen_random_uuid(),
  name_fi text not null,
  name_sci text not null,
  created_at timestamptz not null default now()
);

alter table public.species enable row level security;

create policy "Anyone authenticated can read species"
  on public.species for select
  to authenticated
  using (true);

create policy "Only admins can manage species"
  on public.species for all
  to authenticated
  using (public.is_admin());

-- ── Sightings ──
create table public.sightings (
  id uuid primary key default gen_random_uuid(),
  species_id uuid not null references public.species(id),
  observer_id uuid not null references public.profiles(id),
  logged_by uuid not null references public.profiles(id),
  team_id uuid not null references public.teams(id),
  date date not null,
  location_name text not null default '',
  location_lat float8,
  location_lon float8,
  is_new_for_user boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.sightings enable row level security;

create policy "Anyone authenticated can read sightings"
  on public.sightings for select
  to authenticated
  using (true);

create policy "Authenticated users can insert sightings"
  on public.sightings for insert
  to authenticated
  with check (logged_by = auth.uid());

create policy "Only admins can update/delete sightings"
  on public.sightings for update
  to authenticated
  using (public.is_admin());

create policy "Only admins can delete sightings"
  on public.sightings for delete
  to authenticated
  using (public.is_admin());

-- ── Indexes ──
create index idx_sightings_observer on public.sightings(observer_id);
create index idx_sightings_team on public.sightings(team_id);
create index idx_sightings_species on public.sightings(species_id);
create index idx_team_members_team on public.team_members(team_id);
create index idx_team_members_user on public.team_members(user_id);
