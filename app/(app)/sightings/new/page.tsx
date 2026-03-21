import { SightingForm } from '@/components/sighting-form';
import { createClient } from '@/lib/supabase/server';

export default async function NewSightingPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from('team_members')
    .select('team_id, competition_id, competitions!inner(is_active)')
    .eq('user_id', user!.id)
    .eq('competitions.is_active', true)
    .limit(1)
    .maybeSingle();

  return <SightingForm membership={membership ? { team_id: membership.team_id, competition_id: membership.competition_id } : null} userId={user!.id} />;
}
