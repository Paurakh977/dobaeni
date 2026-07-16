import { getBrands } from '@/lib/queries';
import BrandsView from './BrandsView';
import PageShell from '@/app/components/PageShell';

export const dynamic = 'force-dynamic';

export default async function BrandsPage() {
  const brands = await getBrands();
  return (
    <PageShell>
      <BrandsView brands={brands} />
    </PageShell>
  );
}
