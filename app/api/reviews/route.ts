import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/get-session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { productId, rating, title, comment, images } = body;

  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });
  const r = Number(rating);
  if (!r || r < 1 || r > 5) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, organizationId: true, ratingAvg: true, ratingCount: true },
  });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const review = await db.review.create({
    data: {
      productId,
      userId: session.user.id,
      rating: r,
      title: title || null,
      comment: comment || null,
      images: Array.isArray(images) ? JSON.stringify(images) : null,
      status: 'approved',
    },
  });

  // Recompute product rating aggregates.
  const agg = await db.review.aggregate({
    where: { productId, status: 'approved' },
    _avg: { rating: true },
    _count: true,
  });
  await db.product.update({
    where: { id: productId },
    data: {
      ratingAvg: agg._avg.rating ?? 0,
      ratingCount: agg._count,
    },
  });

  // Roll product ratings up to the parent organization so brand-level
  // rankings (e.g. Top Rated) reflect real review activity.
  const orgAgg = await db.review.aggregate({
    where: { product: { organizationId: product.organizationId }, status: 'approved' },
    _avg: { rating: true },
    _count: true,
  });
  await db.organization.update({
    where: { id: product.organizationId },
    data: {
      ratingAvg: orgAgg._avg.rating ?? 0,
      ratingCount: orgAgg._count,
    },
  });

  return NextResponse.json({ review });
}
