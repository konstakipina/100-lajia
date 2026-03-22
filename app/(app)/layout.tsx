import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { upsertProfile } from '@/lib/auth/upsert-profile';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/login');
  }

  await upsertProfile(data.user);

  return (
    <main className="container">
      <div className="nav">
        <Link className="btn btn-secondary" href="/">Dashboard</Link>
        <Link className="btn btn-secondary" href="/sightings/new">New sighting</Link>
        <Link className="btn btn-secondary" href="/sightings/latest">Feed</Link>
        <Link className="btn btn-secondary" href="/leaderboard">Leaderboard</Link>
        <Link className="btn btn-secondary" href="/profile">Profile</Link>
      </div>
      {children}
    </main>
  );
}
