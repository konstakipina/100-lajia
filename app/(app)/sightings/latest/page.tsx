import { createClient } from '@/lib/supabase/server';

type Sighting = {
  id: string;
  competition_year: number;
  common_name: string;
  scientific_name: string;
  finnish_name: string | null;
  english_name: string | null;
  sighted_for_user_id: string;
  entered_by_user_id: string;
  team_name: string;
  seen_at: string;
  location_label: string | null;
  notes: string | null;
  is_new_for_user_year: boolean;
  is_new_for_team_year: boolean;
};

export default async function LatestSightingsPage() {
  const supabase = createClient();

  const { data: competitions } = await supabase
    .from('competitions')
    .select('id, year')
    .eq('is_active', true)
    .limit(1);

  const compId = competitions?.[0]?.id;

  const { data: sightingsRaw } = compId
    ? await supabase
        .from('v_latest_sightings')
        .select(
          'id, competition_year, common_name, scientific_name, finnish_name, english_name, sighted_for_user_id, entered_by_user_id, team_name, seen_at, location_label, notes, is_new_for_user_year, is_new_for_team_year'
        )
        .eq('competition_id', compId)
        .order('seen_at', { ascending: false })
        .limit(50)
    : { data: [] };

  const sightings = (sightingsRaw ?? []) as Sighting[];

  const userIds = [
    ...new Set(sightings.flatMap((s) => [s.sighted_for_user_id, s.entered_by_user_id]))
  ];
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, display_name').in('id', userIds)
    : { data: [] };

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <h1>Latest sightings</h1>
      {sightings.length === 0 && <p className="small">No sightings yet.</p>}
      {sightings.map((s) => (
        <div key={s.id} className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong>{s.finnish_name || s.common_name}</strong>
            {s.is_new_for_team_year && <span className="badge badge-team">New for team</span>}
            {s.is_new_for_user_year && !s.is_new_for_team_year && (
              <span className="badge badge-user">New for user</span>
            )}
          </div>
          <div className="small">{s.scientific_name}</div>
          <div className="small" style={{ marginTop: 6 }}>
            {nameById.get(s.sighted_for_user_id) ?? 'Unknown'} · {s.team_name} · {formatDate(s.seen_at)}
            {s.location_label && ` · ${s.location_label}`}
          </div>
          {s.entered_by_user_id !== s.sighted_for_user_id && (
            <div className="small">
              Logged by {nameById.get(s.entered_by_user_id) ?? 'Unknown'}
            </div>
          )}
          {s.notes && <div className="small" style={{ marginTop: 4, fontStyle: 'italic' }}>{s.notes}</div>}
        </div>
      ))}
    </div>
  );
}
