'use client';

import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const signIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  return (
    <main className="container">
      <div className="card">
        <h1>100 Lajia Tracker</h1>
        <p>Sign in with Google to continue.</p>
        <button className="btn btn-primary" onClick={signIn}>Continue with Google</button>
      </div>
    </main>
  );
}
