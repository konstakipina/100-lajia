import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: competitions } = await supabase
    .from('competitions')
    .select('id, name, year')
    .eq('is_active', true)
    .limit(1);

  const comp = competitions?.[0];

  // Fetch user's team for active competition
  let teamName: string | null = null;
  let userSpeciesCount = 0;
  let teamSpeciesCount = 0;

  if (comp && user) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id, teams(name)')
      .eq('user_id', user.id)
      .eq('competition_id', comp.id)
      .limit(1)
      .maybeSingle();

    if (membership) {
      teamName = ((membership.teams as unknown) as Record<string, unknown>)?.name as string ?? null;

      // Fetch individual score
      const { data: indScore } = await supabase
        .from('v_individual_scores')
        .select('unique_species_count')
        .eq('competition_id', comp.id)
        .eq('user_id', user.id)
        .maybeSingle();

      userSpeciesCount = indScore?.unique_species_count ?? 0;

      // Fetch team score
      const { data: teamScore } = await supabase
        .from('v_team_scores')
        .select('unique_species_count')
        .eq('competition_id', comp.id)
        .eq('team_id', membership.team_id)
        .maybeSingle();

      teamSpeciesCount = teamScore?.unique_species_count ?? 0;
    }
  }

  return (
    <div>
      <div className="card">
        <h1>{comp ? `${comp.name} ${comp.year}` : 'Competition dashboard'}</h1>
        {teamName && (
          <p>
            Team: <strong>{teamName}</strong>
          </p>
        )}
        {comp && (
          <div className="row" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 8 }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{userSpeciesCount}</div>
              <div className="small">Your species</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{teamSpeciesCount}</div>
              <div className="small">Team species</div>
            </div>
          </div>
        )}
      </div>

      <div className="row">
        <Link className="btn btn-primary" href="/sightings/new">Log a sighting</Link>
        <Link className="btn btn-secondary" href="/sightings/latest">Latest sightings</Link>
        <Link className="btn btn-secondary" href="/leaderboard">Leaderboard</Link>
      </div>
    </div>
  );
}
