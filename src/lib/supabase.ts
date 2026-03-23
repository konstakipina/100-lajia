import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 * Used for auth operations (login, logout, session).
 * NOT for direct DB queries — all data access goes through Edge Functions.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
