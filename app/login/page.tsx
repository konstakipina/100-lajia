'use client';

import { useRouter } from 'next/navigation';

const DEMO_USERS = [
  { id: '00000000-0000-0000-0000-000000000001', display_name: 'Saara' },
  { id: '00000000-0000-0000-0000-000000000002', display_name: 'Konsta' },
];

export default function LoginPage() {
  const router = useRouter();

  const pick = async (id: string) => {
    await fetch('/api/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id }),
    });
    router.push('/');
  };

  return (
    <main className="container" style={{ paddingTop: 48 }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 4px' }}>100 Lajia</h1>
        <p className="small" style={{ margin: 0 }}>Bird sighting competition tracker</p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>Who are you?</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DEMO_USERS.map((u) => (
            <button
              key={u.id}
              className="btn btn-primary user-btn"
              onClick={() => pick(u.id)}
            >
              <span className="user-avatar">{u.display_name[0]}</span>
              <span>{u.display_name}</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
