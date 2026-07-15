import { redirect } from 'next/navigation';
import { getSession } from '@/lib/get-session';
import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'Dashboard — Dobaeni',
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = session.user as typeof session.user & {
    twoFactorEnabled?: boolean | null;
    image?: string | null;
  };

  return (
    <DashboardClient 
      user={user} 
      initialTwoFactorEnabled={Boolean(user.twoFactorEnabled)}
      emailVerified={user.emailVerified}
    />
  );
}
