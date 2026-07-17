import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/get-session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { productId } = body;
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, likeCount: true },
  });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const existing = await db.like.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  });
  if (existing) {
    return NextResponse.json({ ok: true, alreadyLiked: true, likeCount: product.likeCount || 0 });
  }

  await db.like.create({ data: { userId: session.user.id, productId } });
  const updated = await db.product.update({
    where: { id: productId },
    data: { likeCount: { increment: 1 } },
    select: { likeCount: true },
  });

  return NextResponse.json({ ok: true, likeCount: updated.likeCount || 0 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const productId = req.nextUrl.searchParams.get('productId');
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

  await db.like.deleteMany({ where: { userId: session.user.id, productId } });
  const updated = await db.product.update({
    where: { id: productId },
    data: { likeCount: { decrement: 1 } },
    select: { likeCount: true },
  });

  return NextResponse.json({ ok: true, likeCount: Math.max(0, updated.likeCount || 0) });
}
