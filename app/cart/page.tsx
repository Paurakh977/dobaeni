import { redirect } from 'next/navigation';
import { getSession } from '@/lib/get-session';
import { getCart } from '@/lib/queries';
import CartView from './CartView';
import PageShell from '@/app/components/PageShell';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const cart = await getCart(session.user.id);
  return (
    <PageShell>
      <CartView initialCart={cart} />
    </PageShell>
  );
}
