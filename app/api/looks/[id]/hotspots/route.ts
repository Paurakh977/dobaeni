import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/get-session';
import { getSellerOrg } from '@/lib/queries';

export const runtime = 'nodejs';

function clampPct(n: unknown): number {
  const v = Number(n);
  if (Number.isNaN(v)) return 50;
  return Math.min(100, Math.max(0, Math.round(v * 100) / 100));
}

async function authorize(lookId: string, userId: string) {
  const org = await getSellerOrg(userId);
  if (!org) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  const look = await db.shopTheLook.findUnique({ where: { id: lookId } });
  if (!look) return { error: NextResponse.json({ error: 'Look not found' }, { status: 404 }) };
  if (look.organizationId !== org.id)
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { org: org.id, lookId };
}

// ─── POST /api/looks/[id]/hotspots — add a hotspot ───────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const auth = await authorize(id, session.user.id);
  if ('error' in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  const productId = (body.productId || '').toString();
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

  const product = await db.product.findFirst({
    where: { id: productId, organizationId: auth.org },
  });
  if (!product) return NextResponse.json({ error: 'Product not found in your catalog' }, { status: 404 });

  // One hotspot per product per look.
  const existing = await db.lookHotspot.findUnique({
    where: { lookId_productId: { lookId: id, productId } },
  });
  if (existing) return NextResponse.json({ error: 'That product is already tagged in this look' }, { status: 409 });

  const count = await db.lookHotspot.count({ where: { lookId: id } });
  const hotspot = await db.lookHotspot.create({
    data: {
      lookId: id,
      productId,
      left: clampPct(body.left),
      top: clampPct(body.top),
      label: body.label ? String(body.label).slice(0, 60) : null,
      position: count,
    },
    include: { product: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } },
  });

  return NextResponse.json({ hotspot });
}
