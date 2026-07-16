import { redirect } from 'next/navigation';
import { getSession } from '@/lib/get-session';
import { getCart } from '@/lib/queries';
import { db } from '@/lib/db';
import CheckoutView from './CheckoutView';
import PageShell from '@/app/components/PageShell';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const cart = await getCart(session.user.id);
  if (cart.items.length === 0) redirect('/cart');

  const addresses = await db.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return (
    <PageShell>
      <CheckoutView cart={cart} addresses={addresses} />
    </PageShell>
  );
}
