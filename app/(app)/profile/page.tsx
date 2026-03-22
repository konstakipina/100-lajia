'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Profile = {
  display_name: string;
  email: string;
  avatar_url: string | null;
};

type TeamMembership = {
  team_id: string;
  role: string;
  team_name: string;
  competition_year: number;
  is_active: boolean;
};

export default function ProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, email, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileData) setProfile(profileData);

      const { data: memberData } = await supabase
        .from('team_members')
        .select('team_id, role, teams(name), competitions(year, is_active)')
        .eq('user_id', user.id);

      if (memberData) {
        setMemberships(
          memberData.map((m: Record<string, unknown>) => ({
            team_id: m.team_id as string,
            role: m.role as string,
            team_name: (m.teams as Record<string, unknown>)?.name as string ?? 'Unknown',
            competition_year: (m.competitions as Record<string, unknown>)?.year as number ?? 0,
            is_active: (m.competitions as Record<string, unknown>)?.is_active as boolean ?? false,
          }))
        );
      }

      setLoading(false);
    }
    load();
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) return <div className="card"><p>Loading profile...</p></div>;

  const active = memberships.filter((m) => m.is_active);

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {profile?.avatar_url && (
            <Image
              src={profile.avatar_url}
              alt="Avatar"
              width={48}
              height={48}
              style={{ borderRadius: '50%' }}
            />
          )}
          <div>
            <h1 style={{ margin: 0 }}>{profile?.display_name ?? 'Unknown'}</h1>
            <div className="small">{profile?.email}</div>
          </div>
        </div>
      </div>

      {active.length > 0 && (
        <div className="card">
          <h2>Active competition</h2>
          {active.map((m) => (
            <div key={m.team_id}>
              <strong>{m.team_name}</strong>
              <div className="small">
                {m.competition_year} · Role: {m.role}
              </div>
            </div>
          ))}
        </div>
      )}

      {memberships.filter((m) => !m.is_active).length > 0 && (
        <div className="card">
          <h2>Past competitions</h2>
          {memberships.filter((m) => !m.is_active).map((m) => (
            <div key={`${m.team_id}-${m.competition_year}`}>
              <strong>{m.team_name}</strong>
              <div className="small">{m.competition_year} · Role: {m.role}</div>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-secondary" onClick={signOut} style={{ marginTop: 8 }}>
        Sign out
      </button>
    </div>
  );
}
