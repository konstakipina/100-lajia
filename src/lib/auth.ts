import { createClient } from "./supabase";

/**
 * Initiate Google OAuth login via Supabase Auth.
 * Redirects the browser to Google's consent screen.
 */
export async function loginWithGoogle() {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });
  if (error) throw error;
}

/**
 * Sign out the current user.
 */
export async function logout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  window.location.href = "/login";
}

/**
 * Get the current session's access token for Edge Function calls.
 * Returns null if not authenticated.
 */
export async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
