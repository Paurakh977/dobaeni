import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { getSession } from '@/lib/get-session';
import { getSellerOrg } from '@/lib/queries';

export const runtime = 'nodejs';

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function clampPct(n: unknown): number {
  const v = Number(n);
  if (Number.isNaN(v)) return 50;
  return Math.min(100, Math.max(0, Math.round(v * 100) / 100));
}

// ─── GET /api/looks — list the seller's looks ────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const org = await getSellerOrg(session.user.id);
  if (!org) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Optional ?published filter for the storefront, but this route is seller-side.
  const looks = await db.shopTheLook.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { hotspots: true } },
      hotspots: { select: { product: { select: { price: true } } } },
    },
  });

  return NextResponse.json({
    looks: looks.map((l: any) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      description: l.description,
      coverImage: l.coverImage,
      imageWidth: l.imageWidth,
      imageHeight: l.imageHeight,
      bundlePrice: l.bundlePrice,
      bundleDiscount: l.bundleDiscount,
      isPublished: Boolean(l.isPublished),
      isFeatured: Boolean(l.isFeatured),
      viewCount: l.viewCount || 0,
      likeCount: l.likeCount || 0,
      hotspotCount: l._count.hotspots,
      totalPrice: (l.hotspots || []).reduce((s: number, h: any) => s + (h.product?.price ?? 0), 0),
      createdAt: l.createdAt.toISOString(),
    })),
  });
}

// ─── POST /api/looks — create a new look ────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const org = await getSellerOrg(session.user.id);
  if (!org) return NextResponse.json({ error: 'No brand associated with this account' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const title = (body.title || '').toString().trim();
  const coverImage = (body.coverImage || '').toString().trim();

  if (!title) return NextResponse.json({ error: 'Look title required' }, { status: 400 });
  if (!coverImage) return NextResponse.json({ error: 'Cover image required' }, { status: 400 });

  // Validate hotspots (each must reference one of the seller's products).
  const rawHotspots = Array.isArray(body.hotspots) ? body.hotspots : [];
  const validHotspots: { productId: string; left: number; top: number; label: string | null; position: number }[] = [];

  if (rawHotspots.length > 0) {
    const productIds = Array.from(
      new Set(rawHotspots.map((h: any) => h?.productId).filter(Boolean)),
    ) as string[];
    if (productIds.length) {
      const owned = await db.product.findMany({
        where: { id: { in: productIds }, organizationId: org.id },
        select: { id: true },
      });
      const ownedSet = new Set(owned.map((p) => p.id));
      rawHotspots.forEach((h: any, i: number) => {
        if (h?.productId && ownedSet.has(h.productId)) {
          validHotspots.push({
            productId: h.productId,
            left: clampPct(h.left),
            top: clampPct(h.top),
            label: h.label ? String(h.label).slice(0, 60) : null,
            position: Number.isFinite(Number(h.position)) ? Number(h.position) : i,
          });
        }
      });
    }
  }

  const slug = `${slugify(title) || 'look'}-${randomUUID().slice(0, 4)}`;

  const look = await db.shopTheLook.create({
    data: {
      organizationId: org.id,
      title,
      slug,
      description: body.description || null,
      coverImage,
      imageWidth: body.imageWidth ? Number(body.imageWidth) : null,
      imageHeight: body.imageHeight ? Number(body.imageHeight) : null,
      bundlePrice: body.bundlePrice != null ? Number(body.bundlePrice) : null,
      bundleDiscount: body.bundleDiscount != null ? Number(body.bundleDiscount) : null,
      isPublished: body.isPublished !== false,
      isFeatured: Boolean(body.isFeatured),
      hotspots: validHotspots.length ? { create: validHotspots } : undefined,
    },
    include: {
      hotspots: {
        orderBy: { position: 'asc' },
        include: { product: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } },
      },
    },
  });

  return NextResponse.json({ look });
}
