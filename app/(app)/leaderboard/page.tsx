import { createClient } from '@/lib/supabase/server';

type TeamScore = {
  team_id: string;
  unique_species_count: number;
  total_sightings: number;
};

type IndividualScore = {
  user_id: string;
  unique_species_count: number;
  total_sightings: number;
};

export default async function LeaderboardPage() {
  const supabase = createClient();

  const { data: competitions } = await supabase
    .from('competitions')
    .select('id, year')
    .eq('is_active', true)
    .limit(1);

  const compId = competitions?.[0]?.id;

  const { data: teamScoresRaw } = compId
    ? await supabase
        .from('v_team_scores')
        .select('team_id, unique_species_count, total_sightings')
        .eq('competition_id', compId)
        .order('unique_species_count', { ascending: false })
    : { data: [] };

  const { data: individualScoresRaw } = compId
    ? await supabase
        .from('v_individual_scores')
        .select('user_id, unique_species_count, total_sightings')
        .eq('competition_id', compId)
        .order('unique_species_count', { ascending: false })
    : { data: [] };

  const teamScores = (teamScoresRaw ?? []) as TeamScore[];
  const individualScores = (individualScoresRaw ?? []) as IndividualScore[];

  const teamIds = [...new Set(teamScores.map((s) => s.team_id))];
  const userIds = [...new Set(individualScores.map((s) => s.user_id))];

  const { data: teams } = teamIds.length
    ? await supabase.from('teams').select('id, name').in('id', teamIds)
    : { data: [] };
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, display_name').in('id', userIds)
    : { data: [] };

  const teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name]));
  const userNameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  return (
    <div className="row">
      <section className="card">
        <h1>Team leaderboard</h1>
        {teamScores.map((row) => (
          <div key={row.team_id} className="card">
            <strong>{teamNameById.get(row.team_id) ?? row.team_id}</strong>
            <div className="small">Unique species: {row.unique_species_count} · Total sightings: {row.total_sightings}</div>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Individual leaderboard</h2>
        {individualScores.map((row) => (
          <div key={row.user_id} className="card">
            <strong>{userNameById.get(row.user_id) ?? row.user_id}</strong>
            <div className="small">Unique species: {row.unique_species_count} · Total sightings: {row.total_sightings}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
