import { TopBar } from '@/components/top-bar';
import { createServiceClient } from '@/lib/supabase/server';

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
  is_new_for_user_year: boolean;
  is_new_for_team_year: boolean;
};

export default async function LogbookPage() {
  const supabase = createServiceClient();

  const { data: competitions } = await supabase
    .from('competitions')
    .select('id, year')
    .eq('is_active', true)
    .limit(1);

  const comp = competitions?.[0];

  const { data: sightingsRaw } = comp
    ? await supabase
        .from('v_latest_sightings')
        .select(
          'id, competition_year, common_name, scientific_name, finnish_name, english_name, sighted_for_user_id, entered_by_user_id, team_name, seen_at, location_label, is_new_for_user_year, is_new_for_team_year'
        )
        .eq('competition_id', comp.id)
        .order('seen_at', { ascending: false })
        .limit(50)
    : { data: [] };

  const sightings = (sightingsRaw ?? []) as Sighting[];

  const userIds = [...new Set(sightings.flatMap((s) => [s.sighted_for_user_id, s.entered_by_user_id]))];
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, display_name').in('id', userIds)
    : { data: [] };

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
  };

  // Group by date
  const grouped: { date: string; items: Sighting[] }[] = [];
  for (const s of sightings) {
    const dateKey = new Date(s.seen_at).toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' });
    const last = grouped[grouped.length - 1];
    if (last && last.date === dateKey) {
      last.items.push(s);
    } else {
      grouped.push({ date: dateKey, items: [s] });
    }
  }

  return (
    <>
      <TopBar
        title="Päiväkirja"
        eyebrow={comp ? `100 lajia · ${comp.year}` : '100 lajia'}
        meta={sightings.length > 0 ? `${sightings.length} havaintoa` : undefined}
      />
      <div style={{ padding: '0 18px' }}>
        {sightings.length === 0 && (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <span className="text-value" style={{ color: 'var(--ink-light)' }}>Ei havaintoja vielä.</span>
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.date}>
            <div className="feed-date-header">{group.date}</div>
            {group.items.map((s) => (
              <div key={s.id} className="feed-item">
                <div className="feed-thumb" />
                <div>
                  <div className="feed-species">
                    <span>{s.finnish_name || s.common_name}</span>
                    {(s.is_new_for_team_year || s.is_new_for_user_year) && (
                      <span className="feed-new-marker">*</span>
                    )}
                  </div>
                  <div className="feed-scientific">{s.scientific_name}</div>
                  <div className="feed-meta">
                    {nameById.get(s.sighted_for_user_id) ?? 'Tuntematon'} · {s.team_name} · {formatTime(s.seen_at)}
                    {s.location_label && ` · ${s.location_label}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
