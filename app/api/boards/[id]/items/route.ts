import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/get-session';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { productId } = body;
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

  const board = await db.board.findFirst({ where: { id, userId: session.user.id } });
  if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 });

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  // Idempotent — do not duplicate the same product on a board.
  await db.savedItem.upsert({
    where: { boardId_productId: { boardId: id, productId } },
    create: { boardId: id, productId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const productId = req.nextUrl.searchParams.get('productId');
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

  const board = await db.board.findFirst({ where: { id, userId: session.user.id } });
  if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 });

  await db.savedItem.deleteMany({ where: { boardId: id, productId } });
  return NextResponse.json({ ok: true });
}
