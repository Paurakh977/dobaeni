import { getDiscoverProducts } from '@/lib/queries';
import { AESTHETICS } from '@/lib/format';
import DiscoverView from './DiscoverView';
import PageShell from '@/app/components/PageShell';

export const dynamic = 'force-dynamic';

export default async function DiscoverPage() {
  const products = await getDiscoverProducts();
  return (
    <PageShell padded={false}>
      <DiscoverView products={products} aesthetics={AESTHETICS} />
    </PageShell>
  );
}
