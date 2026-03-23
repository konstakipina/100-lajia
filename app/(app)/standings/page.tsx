import { TopBar } from '@/components/top-bar';
import { createServiceClient } from '@/lib/supabase/server';

const TEAM_COLORS = ['#6B6050', '#8B6914', '#4A6741', '#5B4A8A', '#8A4A4A', '#4A6B8A'];

function rankClass(i: number) {
  if (i === 0) return 'lb-rank gold';
  if (i === 1) return 'lb-rank silver';
  if (i === 2) return 'lb-rank bronze';
  return 'lb-rank';
}

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default async function StandingsPage() {
  const supabase = createServiceClient();

  const { data: competitions } = await supabase
    .from('competitions')
    .select('id, name, year')
    .eq('is_active', true)
    .limit(1);

  const comp = competitions?.[0];

  const { data: teamScoresRaw } = comp
    ? await supabase
        .from('v_team_scores')
        .select('team_id, unique_species_count, total_sightings')
        .eq('competition_id', comp.id)
        .order('unique_species_count', { ascending: false })
    : { data: [] };

  const { data: individualScoresRaw } = comp
    ? await supabase
        .from('v_individual_scores')
        .select('user_id, unique_species_count, total_sightings')
        .eq('competition_id', comp.id)
        .order('unique_species_count', { ascending: false })
    : { data: [] };

  const teamScores = teamScoresRaw ?? [];
  const individualScores = individualScoresRaw ?? [];

  const teamIds = [...new Set(teamScores.map((s) => s.team_id))];
  const userIds = [...new Set(individualScores.map((s) => s.user_id))];

  const { data: teams } = teamIds.length
    ? await supabase.from('teams').select('id, name').in('id', teamIds)
    : { data: [] };
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, display_name').in('id', userIds)
    : { data: [] };

  // Map user_id -> team_name for individual section
  const { data: memberData } = comp && userIds.length
    ? await supabase.from('team_members').select('user_id, team_id').eq('competition_id', comp.id).in('user_id', userIds)
    : { data: [] };

  const teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name]));
  const userNameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
  const userTeamMap = new Map((memberData ?? []).map((m) => [m.user_id, teamNameById.get(m.team_id) ?? '']));

  // Team member counts
  const { data: allMembers } = comp
    ? await supabase.from('team_members').select('team_id').eq('competition_id', comp.id)
    : { data: [] };
  const teamMemberCount = new Map<string, number>();
  for (const m of allMembers ?? []) {
    teamMemberCount.set(m.team_id, (teamMemberCount.get(m.team_id) ?? 0) + 1);
  }

  return (
    <>
      <TopBar
        title="Tilanne"
        eyebrow={comp ? `100 lajia · ${comp.year}` : '100 lajia'}
      />
      <div style={{ padding: '0 18px' }}>
        {/* Teams */}
        <div className="lb-section-label">Joukkueet</div>
        {teamScores.length === 0 && (
          <div style={{ padding: '12px 0' }}>
            <span className="text-meta">Ei joukkuetuloksia vielä.</span>
          </div>
        )}
        {teamScores.map((row, i) => {
          const name = teamNameById.get(row.team_id) ?? row.team_id;
          const color = TEAM_COLORS[i % TEAM_COLORS.length];
          const members = teamMemberCount.get(row.team_id) ?? 0;
          return (
            <div key={row.team_id} className="lb-row">
              <span className={rankClass(i)}>{i + 1}</span>
              <span className="lb-avatar" style={{ background: color }}>{initials(name)}</span>
              <div style={{ flex: 1 }}>
                <div className="lb-name">{name}</div>
                <div className="lb-subtitle">{members} jäsentä</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="lb-score">{row.unique_species_count}</span>
                <span className="lb-score-unit"> lj</span>
              </div>
            </div>
          );
        })}

        <hr className="divider" />

        {/* Individuals */}
        <div className="lb-section-label">Yksilöt</div>
        {individualScores.length === 0 && (
          <div style={{ padding: '12px 0' }}>
            <span className="text-meta">Ei yksilötuloksia vielä.</span>
          </div>
        )}
        {individualScores.map((row, i) => {
          const name = userNameById.get(row.user_id) ?? row.user_id;
          const teamName = userTeamMap.get(row.user_id) ?? '';
          const color = TEAM_COLORS[(i + 2) % TEAM_COLORS.length];
          return (
            <div key={row.user_id} className="lb-row">
              <span className={rankClass(i)}>{i + 1}</span>
              <span className="lb-avatar" style={{ background: color }}>{initials(name)}</span>
              <div style={{ flex: 1 }}>
                <div className="lb-name">{name}</div>
                {teamName && <div className="lb-subtitle">{teamName}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="lb-score">{row.unique_species_count}</span>
                <span className="lb-score-unit"> lj</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
