-- Verification script for:
-- supabase/migrations/0001_initial_competition_schema.sql
--
-- IMPORTANT:
-- 1) Replace v_user_1 and v_user_2 with REAL auth.users UUIDs before running.
-- 2) Run in Supabase SQL editor as a privileged role.
-- 3) Script rolls back at end (no permanent test data).

begin;

-- ---------
-- Structural checks
-- ---------
do $$
declare
  v_missing int;
begin
  select count(*) into v_missing
  from (
    select 'profiles' as t union all
    select 'competitions' union all
    select 'teams' union all
    select 'competition_teams' union all
    select 'team_members' union all
    select 'species' union all
    select 'sightings'
  ) expected
  where not exists (
    select 1
    from pg_tables pt
    where pt.schemaname = 'public'
      and pt.tablename = expected.t
  );

  if v_missing <> 0 then
    raise exception 'Missing % required public tables', v_missing;
  end if;

  if not exists (select 1 from pg_proc where proname = 'apply_sighting_rules') then
    raise exception 'Function apply_sighting_rules is missing';
  end if;

  if not exists (
    select 1
    from pg_trigger tg
    join pg_class c on c.oid = tg.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'sightings'
      and tg.tgname = 'apply_sighting_rules_before_insert'
  ) then
    raise exception 'Trigger apply_sighting_rules_before_insert is missing';
  end if;

  if not exists (select 1 from pg_views where schemaname='public' and viewname='v_individual_scores')
     or not exists (select 1 from pg_views where schemaname='public' and viewname='v_team_scores')
     or not exists (select 1 from pg_views where schemaname='public' and viewname='v_latest_sightings') then
    raise exception 'One or more expected views are missing';
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='sightings' and policyname='sightings_insert_member'
  ) then
    raise exception 'RLS policy sightings_insert_member is missing';
  end if;

  raise notice 'Structural checks: OK';
end $$;

-- ---------
-- Behavioral checks
-- ---------
do $$
declare
  -- TODO: replace these with real auth.users IDs
  v_user_1 uuid := '00000000-0000-0000-0000-000000000001';
  v_user_2 uuid := '00000000-0000-0000-0000-000000000002';

  v_comp uuid;
  v_team uuid;
  v_species bigint;
  v_s1 uuid;
  v_s2 uuid;
  v_is_new_user boolean;
  v_is_new_team boolean;
  v_expected_error boolean := false;
begin
  if v_user_1::text like '00000000-0000-0000-0000-%' or v_user_2::text like '00000000-0000-0000-0000-%' then
    raise exception 'Test user UUIDs are placeholders. Replace v_user_1/v_user_2 with real auth.users IDs first.';
  end if;

  if not exists (select 1 from auth.users where id = v_user_1) then
    raise exception 'v_user_1 (%) not found in auth.users', v_user_1;
  end if;

  if not exists (select 1 from auth.users where id = v_user_2) then
    raise exception 'v_user_2 (%) not found in auth.users', v_user_2;
  end if;

  insert into public.profiles (id, display_name, email)
  values
    (v_user_1, 'Verifier User 1', 'verifier1@example.com'),
    (v_user_2, 'Verifier User 2', 'verifier2@example.com')
  on conflict (id) do update
  set display_name = excluded.display_name,
      email = excluded.email;

  insert into public.competitions (name, year, start_date, end_date, is_active)
  values ('Verification Competition', 2099, date '2099-01-01', date '2099-12-31', true)
  returning id into v_comp;

  insert into public.teams (name)
  values ('Verification Team')
  returning id into v_team;

  insert into public.competition_teams (competition_id, team_id)
  values (v_comp, v_team);

  insert into public.team_members (competition_id, team_id, user_id, role)
  values
    (v_comp, v_team, v_user_1, 'captain'),
    (v_comp, v_team, v_user_2, 'member');

  insert into public.species (common_name, scientific_name, finnish_name, english_name)
  values ('Test Bird', 'Avis testus', 'Testilintu', 'Test Bird')
  returning id into v_species;

  -- First sighting should count for both user and team
  insert into public.sightings (
    competition_id, species_id, entered_by_user_id, sighted_for_user_id, team_id, seen_at
  )
  values (
    v_comp, v_species, v_user_1, v_user_1, v_team, '2099-06-01T10:00:00Z'
  )
  returning id into v_s1;

  select is_new_for_user_year, is_new_for_team_year
  into v_is_new_user, v_is_new_team
  from public.sightings
  where id = v_s1;

  if v_is_new_user is distinct from true or v_is_new_team is distinct from true then
    raise exception 'First sighting flags incorrect. got user=% team=%', v_is_new_user, v_is_new_team;
  end if;

  -- Duplicate species for same user/team should not count
  insert into public.sightings (
    competition_id, species_id, entered_by_user_id, sighted_for_user_id, team_id, seen_at
  )
  values (
    v_comp, v_species, v_user_2, v_user_1, v_team, '2099-06-01T11:00:00Z'
  )
  returning id into v_s2;

  select is_new_for_user_year, is_new_for_team_year
  into v_is_new_user, v_is_new_team
  from public.sightings
  where id = v_s2;

  if v_is_new_user is distinct from false or v_is_new_team is distinct from false then
    raise exception 'Duplicate sighting flags incorrect. got user=% team=%', v_is_new_user, v_is_new_team;
  end if;

  -- Out-of-range timestamp should fail
  begin
    insert into public.sightings (
      competition_id, species_id, entered_by_user_id, sighted_for_user_id, team_id, seen_at
    )
    values (
      v_comp, v_species, v_user_1, v_user_1, v_team, '2100-01-01T00:00:00Z'
    );
  exception when others then
    v_expected_error := true;
  end;

  if not v_expected_error then
    raise exception 'Expected out-of-range timestamp insert to fail, but it succeeded';
  end if;

  raise notice 'Behavioral checks: OK';
end $$;

-- Optional read check against leaderboard views
select competition_id, user_id, unique_species_count, total_sightings
from public.v_individual_scores
where competition_id in (select id from public.competitions where year = 2099)
order by user_id;

select competition_id, team_id, unique_species_count, total_sightings
from public.v_team_scores
where competition_id in (select id from public.competitions where year = 2099)
order by team_id;

rollback;
