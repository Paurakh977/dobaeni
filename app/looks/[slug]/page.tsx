import { notFound } from 'next/navigation';
import { getLookBySlug } from '@/lib/queries';
import LookViewer from '@/app/components/look/LookViewer';
import PageShell from '@/app/components/PageShell';

export const dynamic = 'force-dynamic';

export default async function LookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const look = await getLookBySlug(slug);
  if (!look) notFound();

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <LookViewer look={look} />
      </main>
    </PageShell>
  );
}