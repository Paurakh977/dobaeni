import { redirect } from 'next/navigation';
import { getSession } from '@/lib/get-session';
import { getBoards } from '@/lib/queries';
import BoardsView from './BoardsView';
import PageShell from '@/app/components/PageShell';

export const dynamic = 'force-dynamic';

export default async function BoardsPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const boards = await getBoards(session.user.id);
  return (
    <PageShell>
      <BoardsView initialBoards={boards} />
    </PageShell>
  );
}
