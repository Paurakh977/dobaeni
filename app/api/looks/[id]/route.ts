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

// ─── GET /api/looks/[id] — full look with hotspots (seller) ───────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const org = await getSellerOrg(session.user.id);
  if (!org) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const look = await db.shopTheLook.findUnique({
    where: { id },
    include: {
      hotspots: {
        orderBy: { position: 'asc' },
        include: { product: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } },
      },
    },
  });
  if (!look) return NextResponse.json({ error: 'Look not found' }, { status: 404 });
  if (look.organizationId !== org.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const hotspots = look.hotspots.map((h: any) => ({
    id: h.id,
    productId: h.productId,
    left: h.left,
    top: h.top,
    position: h.position ?? 0,
    label: h.label ?? null,
    product: {
      id: h.product?.id,
      name: h.product?.name ?? 'Product',
      slug: h.product?.slug ?? null,
      price: h.product?.price ?? 0,
      compareAtPrice: h.product?.compareAtPrice ?? null,
      currency: h.product?.currency || 'NPR',
      image: h.product?.images?.[0]?.url ?? null,
      stock: h.product?.stock ?? 0,
    },
  }));
  const totalPrice = hotspots.reduce((s: number, h: any) => s + h.product.price, 0);

  return NextResponse.json({
    look: {
      id: look.id,
      title: look.title,
      slug: look.slug,
      description: look.description,
      coverImage: look.coverImage,
      imageWidth: look.imageWidth,
      imageHeight: look.imageHeight,
      bundlePrice: look.bundlePrice,
      bundleDiscount: look.bundleDiscount,
      isPublished: Boolean(look.isPublished),
      isFeatured: Boolean(look.isFeatured),
      viewCount: look.viewCount || 0,
      likeCount: look.likeCount || 0,
      hotspotCount: hotspots.length,
      totalPrice,
      createdAt: look.createdAt.toISOString(),
      hotspots,
    },
  });
}

// ─── PATCH /api/looks/[id] — update look metadata ────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const org = await getSellerOrg(session.user.id);
  if (!org) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const look = await db.shopTheLook.findUnique({ where: { id } });
  if (!look) return NextResponse.json({ error: 'Look not found' }, { status: 404 });
  if (look.organizationId !== org.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.coverImage !== undefined) data.coverImage = body.coverImage;
  if (body.imageWidth !== undefined) data.imageWidth = body.imageWidth ? Number(body.imageWidth) : null;
  if (body.imageHeight !== undefined) data.imageHeight = body.imageHeight ? Number(body.imageHeight) : null;
  if (body.bundlePrice !== undefined) data.bundlePrice = body.bundlePrice != null ? Number(body.bundlePrice) : null;
  if (body.bundleDiscount !== undefined) data.bundleDiscount = body.bundleDiscount != null ? Number(body.bundleDiscount) : null;
  if (body.isPublished !== undefined) data.isPublished = Boolean(body.isPublished);
  if (body.isFeatured !== undefined) data.isFeatured = Boolean(body.isFeatured);

  const updated = await db.shopTheLook.update({ where: { id }, data });

  // If hotspots were supplied, replace them wholesale (seller editor sends full list).
  if (Array.isArray(body.hotspots)) {
    const owned = await db.product.findMany({
      where: { id: { in: Array.from(new Set(body.hotspots.map((h: any) => h?.productId).filter(Boolean))) as string[] }, organizationId: org.id },
      select: { id: true },
    });
    const ownedSet = new Set(owned.map((p) => p.id));
    const next = body.hotspots
      .filter((h: any) => h?.productId && ownedSet.has(h.productId))
      .map((h: any, i: number) => ({
        productId: h.productId,
        left: clampPct(h.left),
        top: clampPct(h.top),
        label: h.label ? String(h.label).slice(0, 60) : null,
        position: Number.isFinite(Number(h.position)) ? Number(h.position) : i,
      }));

    await db.$transaction([
      db.lookHotspot.deleteMany({ where: { lookId: id } }),
      ...(next.length ? [db.lookHotspot.createMany({ data: next.map((h: any) => ({ ...h, lookId: id })) })] : []),
    ]);
  }

  return NextResponse.json({ look: updated });
}

// ─── DELETE /api/looks/[id] ──────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const org = await getSellerOrg(session.user.id);
  if (!org) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const look = await db.shopTheLook.findUnique({ where: { id } });
  if (!look) return NextResponse.json({ error: 'Look not found' }, { status: 404 });
  if (look.organizationId !== org.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await db.shopTheLook.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
