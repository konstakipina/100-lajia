import { redirect } from 'next/navigation';
import { getDemoUser } from '@/lib/demo-auth';
import { BottomNav } from '@/components/bottom-nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = getDemoUser();
  if (!user) redirect('/login');

  return (
    <div className="page-wrap">
      <div className="page-content">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
