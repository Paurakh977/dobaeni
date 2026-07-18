import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/get-session';
import { getOrderById } from '@/lib/queries';
import OrderDetail from './OrderDetail';
import PageShell from '@/app/components/PageShell';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const order = await getOrderById(id, session.user.id);
  if (!order) notFound();

  return (
    <PageShell>
      <OrderDetail order={order} />
    </PageShell>
  );
}
