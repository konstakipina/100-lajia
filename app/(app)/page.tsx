import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="card">
      <h1>Competition dashboard</h1>
      <p>Quick actions:</p>
      <div className="row">
        <Link className="btn btn-primary" href="/sightings/new">Log a sighting</Link>
        <Link className="btn btn-secondary" href="/leaderboard">View leaderboard</Link>
      </div>
    </div>
  );
}
