import { getDemoUser } from '@/lib/demo-auth';
import { createClient } from '@/lib/supabase/server';

export default async function ProfilePage() {
  const user = getDemoUser();
  const supabase = createClient();

  const { data: memberData } = await supabase
    .from('team_members')
    .select('team_id, role, teams(name), competitions(year, is_active)')
    .eq('user_id', user!.id);

  const memberships = (memberData ?? []).map((m: Record<string, unknown>) => ({
    team_id: m.team_id as string,
    role: m.role as string,
    team_name: (m.teams as Record<string, unknown>)?.name as string ?? 'Unknown',
    competition_year: (m.competitions as Record<string, unknown>)?.year as number ?? 0,
    is_active: (m.competitions as Record<string, unknown>)?.is_active as boolean ?? false,
  }));

  const active = memberships.filter((m) => m.is_active);
  const past = memberships.filter((m) => !m.is_active);

  return (
    <div>
      <div className="card">
        <h1 style={{ margin: 0 }}>{user!.display_name}</h1>
        <div className="small">{user!.email}</div>
      </div>

      {active.length > 0 && (
        <div className="card">
          <h2>Active competition</h2>
          {active.map((m) => (
            <div key={m.team_id}>
              <strong>{m.team_name}</strong>
              <div className="small">
                {m.competition_year} &middot; Role: {m.role}
              </div>
            </div>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="card">
          <h2>Past competitions</h2>
          {past.map((m) => (
            <div key={`${m.team_id}-${m.competition_year}`}>
              <strong>{m.team_name}</strong>
              <div className="small">{m.competition_year} &middot; Role: {m.role}</div>
            </div>
          ))}
        </div>
      )}

      <form action="/api/demo-logout" method="POST">
        <button className="btn btn-secondary" type="submit" style={{ marginTop: 8 }}>
          Switch user
        </button>
      </form>
    </div>
  );
}
