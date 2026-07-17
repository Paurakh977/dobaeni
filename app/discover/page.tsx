import { getDiscoverProducts } from '@/lib/queries';
import { AESTHETICS } from '@/lib/format';
import DiscoverView from './DiscoverView';
import PageShell from '@/app/components/PageShell';
import { getSession } from '@/lib/get-session';

export const dynamic = 'force-dynamic';

export default async function DiscoverPage() {
  const session = await getSession();
  const products = await getDiscoverProducts({}, session?.user.id);
  return (
    <PageShell padded={false}>
      <DiscoverView products={products} aesthetics={AESTHETICS} />
    </PageShell>
  );
}
