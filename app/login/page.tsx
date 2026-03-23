'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    const supabase = createClient();

    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: displayName || email.split('@')[0] },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Try to sign in immediately (works if email confirmation is disabled)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setSuccessMessage('Account created! Check your email to confirm, then sign in.');
        setIsSignUp(false);
        setLoading(false);
        return;
      }

      window.location.href = '/';
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      window.location.href = '/';
    }
  };

  return (
    <main className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-icon">🐦</div>
          <h1>100 Lajia</h1>
          <p className="login-subtitle">Bird sighting competition tracker</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2>{isSignUp ? 'Create account' : 'Sign in'}</h2>

          {isSignUp && (
            <div>
              <label className="label" htmlFor="displayName">Display name</label>
              <input
                id="displayName"
                className="input"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>

          {error && <div className="message message-error">{error}</div>}
          {successMessage && <div className="message message-success">{successMessage}</div>}

          <button className="btn btn-primary login-btn" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>

          <div className="login-toggle">
            {isSignUp ? (
              <span>
                Already have an account?{' '}
                <button type="button" className="link-btn" onClick={() => { setIsSignUp(false); setError(''); }}>
                  Sign in
                </button>
              </span>
            ) : (
              <span>
                No account yet?{' '}
                <button type="button" className="link-btn" onClick={() => { setIsSignUp(true); setError(''); }}>
                  Create one
                </button>
              </span>
            )}
          </div>
        </form>

        <p className="login-footer">
          Track your team&apos;s bird sightings and compete to reach 100 species!
        </p>
      </div>
    </main>
  );
}
