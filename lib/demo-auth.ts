import { cookies } from 'next/headers';

export type DemoUser = {
  id: string;
  display_name: string;
  email: string;
};

export const DEMO_USERS: DemoUser[] = [
  { id: '00000000-0000-0000-0000-000000000001', display_name: 'Saara', email: 'saara@demo.local' },
  { id: '00000000-0000-0000-0000-000000000002', display_name: 'Konsta', email: 'konsta@demo.local' },
];

const COOKIE_NAME = 'demo_user_id';

/** Get the currently selected demo user from cookies (server-side). */
export function getDemoUser(): DemoUser | null {
  const cookieStore = cookies();
  const id = cookieStore.get(COOKIE_NAME)?.value;
  if (!id) return null;
  return DEMO_USERS.find((u) => u.id === id) ?? null;
}
