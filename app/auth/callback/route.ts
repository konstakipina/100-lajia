import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { upsertProfile } from '@/lib/auth/upsert-profile';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await upsertProfile(data.user);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
