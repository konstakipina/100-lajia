import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDemoUser } from '@/lib/demo-auth';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = getDemoUser();

  if (!user) {
    redirect('/login');
  }

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
