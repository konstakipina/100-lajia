import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const demoUserId = cookieStore.get('demo_user_id')?.value;
  if (!demoUserId) {
    return NextResponse.json({ error: 'Ei kirjautunut sisään' }, { status: 401 });
  }

  const payload = await req.json();
  if (payload.entered_by_user_id !== demoUserId) {
    return NextResponse.json({ error: 'Ei oikeuksia' }, { status: 403 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Tietokantayhteys puuttuu' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('sightings')
    .insert(payload)
    .select('is_new_for_user_year, is_new_for_team_year')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}
