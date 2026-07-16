import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/get-session';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const productId = req.nextUrl.searchParams.get('productId');
  const boards = await db.board.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { savedItems: true } } },
  });

  let boardsOut = boards.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.description,
    coverImage: b.coverImage,
    type: b.type || 'collection',
    itemCount: b._count.savedItems,
    hasItem: false,
  }));

  if (productId) {
    const saved = await db.savedItem.findMany({
      where: { productId, boardId: { in: boards.map((b) => b.id) } },
      select: { boardId: true },
    });
    const savedSet = new Set(saved.map((s) => s.boardId));
    boardsOut = boardsOut.map((b) => ({ ...b, hasItem: savedSet.has(b.id) }));
  }

  return NextResponse.json({ boards: boardsOut });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = (body.name || '').toString().trim();
  if (!name) return NextResponse.json({ error: 'Board name required' }, { status: 400 });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
    '-' + Math.random().toString(36).slice(2, 6);

  const board = await db.board.create({
    data: {
      userId: session.user.id,
      name,
      slug,
      description: body.description || null,
      type: body.type === 'wishlist' ? 'wishlist' : 'collection',
    },
  });

  return NextResponse.json({ board });
}
