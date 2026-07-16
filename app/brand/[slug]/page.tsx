import { notFound } from 'next/navigation';
import { getSession } from '@/lib/get-session';
import { getBrandBySlug, getFollowState } from '@/lib/queries';
import BrandStorefront from './BrandStorefront';
import PageShell from '@/app/components/PageShell';

export const dynamic = 'force-dynamic';

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const session = await getSession();
  const follow = session
    ? await getFollowState(session.user.id, brand.id)
    : { isFollowing: false, followerCount: brand.followerCount };

  return (
    <PageShell>
      <BrandStorefront brand={brand} initialFollowing={follow.isFollowing} initialFollowerCount={follow.followerCount} />
    </PageShell>
  );
}
