import { getPublishedLooks } from '@/lib/queries';
import LooksFeed from './LooksFeed';
import PageShell from '@/app/components/PageShell';

export const dynamic = 'force-dynamic';

export default async function LooksPage() {
  const looks = await getPublishedLooks();
  return (
    <PageShell>
      <LooksFeed looks={looks} />
    </PageShell>
  );
}
