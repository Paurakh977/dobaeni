import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/get-session';
import { getBoardById } from '@/lib/queries';
import BoardDetail from './BoardDetail';
import PageShell from '@/app/components/PageShell';

export const dynamic = 'force-dynamic';

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect('/login');
  const board = await getBoardById(id, session.user.id);
  if (!board) notFound();

  return (
    <PageShell>
      <BoardDetail board={board} />
    </PageShell>
  );
}
