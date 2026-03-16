import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export async function upsertProfile(user: User) {
  const supabase = createClient();
  const metadata = user.user_metadata;

  const payload = {
    id: user.id,
    display_name: metadata?.full_name ?? metadata?.name ?? user.email,
    email: user.email,
    avatar_url: metadata?.avatar_url ?? null
  };

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });

  if (error) {
    throw error;
  }
}
