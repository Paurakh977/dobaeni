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

function toJsonArray(v: unknown): string | null {
  if (Array.isArray(v) && v.length) return JSON.stringify(v);
  if (typeof v === 'string' && v.trim()) return v;
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const org = await getSellerOrg(session.user.id);
  if (!org) return NextResponse.json({ error: 'No brand associated with this account' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name = (body.name || '').toString().trim();
  const price = Number(body.price);
  if (!name) return NextResponse.json({ error: 'Product name required' }, { status: 400 });
  if (!price || price <= 0) return NextResponse.json({ error: 'Valid price required' }, { status: 400 });

  const images: string[] = Array.isArray(body.images) ? body.images.filter(Boolean) : [];
  const slug = `${slugify(name) || 'product'}-${randomUUID().slice(0, 4)}`;

  const product = await db.product.create({
    data: {
      organizationId: org.id,
      name,
      slug,
      description: body.description || null,
      price,
      compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null,
      currency: body.currency || 'NPR',
      stock: Number(body.stock) || 0,
      sizes: toJsonArray(body.sizes),
      colors: toJsonArray(body.colors),
      styleKeywords: toJsonArray(body.styleKeywords),
      gender: body.gender || null,
      occasion: toJsonArray(body.occasion),
      material: body.material || null,
      tags: toJsonArray(body.tags),
      isPublished: body.isPublished !== false,
      images: {
        create: images.map((url, i) => ({ url, position: i })),
      },
    },
    include: { images: true },
  });

  return NextResponse.json({ product });
}
