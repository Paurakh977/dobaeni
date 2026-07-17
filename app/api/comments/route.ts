import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/get-session';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId');
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

  const comments = await db.comment.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { user: { select: { name: true, image: true } } },
  });

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      user: { name: c.user.name, image: c.user.image },
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { productId, content } = body;
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

  const text = (content || '').trim();
  if (!text) return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
  if (text.length > 500) return NextResponse.json({ error: 'Comment too long' }, { status: 400 });

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const comment = await db.comment.create({
    data: { userId: session.user.id, productId, content: text },
    include: { user: { select: { name: true, image: true } } },
  });

  return NextResponse.json({
    comment: {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      user: { name: comment.user.name, image: comment.user.image },
    },
  });
}
