import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/get-session';
import { getProductBySlug, getFollowState } from '@/lib/queries';
import ProductDetail from './ProductDetail';
import PageShell from '@/app/components/PageShell';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // Record an aggregate view (cheap, no per-user rows for MVP).
  void db.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const session = await getSession();
  const follow = session
    ? await getFollowState(session.user.id, product.organization.id)
    : { isFollowing: false, followerCount: product.organization.followerCount };

  return (
    <PageShell>
      <ProductDetail product={product} initialFollowing={follow.isFollowing} initialFollowerCount={follow.followerCount} />
    </PageShell>
  );
}
