import { TopBar } from '@/components/top-bar';
import { FieldLogForm } from '@/components/field-log-form';
import { getDemoUser } from '@/lib/demo-auth';
import { createServiceClient } from '@/lib/supabase/server';

export default async function FieldLogPage() {
  const user = getDemoUser()!;
  const supabase = createServiceClient();

  let comp: { id: string; name: string; year: number } | undefined;
  let membership: { team_id: string; competition_id: string } | null = null;
  let teammates: { user_id: string; display_name: string }[] = [];
  let teamName: string | null = null;

  if (supabase) {
    const { data: competitions } = await supabase
      .from('competitions')
      .select('id, name, year')
      .eq('is_active', true)
      .limit(1);

    comp = competitions?.[0];

    if (comp) {
      const { data: memberData } = await supabase
        .from('team_members')
        .select('team_id, competition_id, teams(name)')
        .eq('user_id', user.id)
        .eq('competition_id', comp.id)
        .limit(1)
        .maybeSingle();

      if (memberData) {
        membership = { team_id: memberData.team_id, competition_id: memberData.competition_id };
        teamName = ((memberData.teams as unknown) as Record<string, unknown>)?.name as string ?? null;

        const { data: members } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', memberData.team_id)
          .eq('competition_id', comp.id);

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
    }
  }

  const eyebrow = comp ? `100 lajia · ${comp.year}` : '100 lajia';
  const meta = teamName ? `${teamName} · ${user.display_name}` : user.display_name;

  return (
    <>
      <TopBar title="Havaintokirja" eyebrow={eyebrow} meta={meta} />
      <FieldLogForm membership={membership} userId={user.id} teammates={teammates} />
    </>
  );
}
