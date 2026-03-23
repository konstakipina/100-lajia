'use client';

import { useRouter } from 'next/navigation';

const DEMO_USERS = [
  { id: '00000000-0000-0000-0000-000000000001', display_name: 'Saara', color: '#4A6741' },
  { id: '00000000-0000-0000-0000-000000000002', display_name: 'Konsta', color: '#5B4A8A' },
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
    <div className="page-wrap">
      <div className="topbar" style={{ textAlign: 'center', padding: '48px 18px 24px' }}>
        <div className="topbar-eyebrow">100 lajia</div>
        <div className="topbar-title" style={{ fontSize: 32 }}>Kenttäpäiväkirja</div>
        <div className="topbar-meta" style={{ marginTop: 6 }}>Lintuhavaintokilpailun seuranta</div>
      </div>

      <div style={{ padding: '0 18px' }}>
        <div className="text-label" style={{ marginBottom: 10 }}>Kuka olet?</div>
        <div className="picker-card">
          {DEMO_USERS.map((u) => (
            <button key={u.id} className="picker-item" onClick={() => pick(u.id)}>
              <span className="picker-avatar" style={{ background: u.color }}>
                {u.display_name[0]}
              </span>
              <span>{u.display_name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
