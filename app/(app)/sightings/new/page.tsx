import { SightingForm } from '@/components/sighting-form';
import { getDemoUser } from '@/lib/demo-auth';
import { createClient } from '@/lib/supabase/server';

export default async function NewSightingPage() {
  const user = getDemoUser();
  const supabase = createClient();

  const { data: membership } = await supabase
    .from('team_members')
    .select('team_id, competition_id, competitions!inner(is_active)')
    .eq('user_id', user!.id)
    .eq('competitions.is_active', true)
    .limit(1)
    .maybeSingle();

  let teammates: { user_id: string; display_name: string }[] = [];
  if (membership) {
    const { data: members } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', membership.team_id)
      .eq('competition_id', membership.competition_id);

    const memberIds = (members ?? []).map((m) => m.user_id);
    if (memberIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', memberIds);

      teammates = (profiles ?? []).map((p) => ({
        user_id: p.id,
        display_name: p.display_name,
      }));
    }
  }

  return (
    <SightingForm
      membership={membership ? { team_id: membership.team_id, competition_id: membership.competition_id } : null}
      userId={user!.id}
      teammates={teammates}
    />
  );
}
