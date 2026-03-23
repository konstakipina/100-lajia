import { NextResponse } from 'next/server';
import { DEMO_USERS } from '@/lib/demo-auth';

export async function POST(request: Request) {
  const { userId } = await request.json();
  const user = DEMO_USERS.find((u) => u.id === userId);

  if (!user) {
    return NextResponse.json({ error: 'Unknown user' }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('demo_user_id', user.id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
