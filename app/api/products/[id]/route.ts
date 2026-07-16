import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/get-session';
import { getSellerOrg } from '@/lib/queries';

export const runtime = 'nodejs';

function toJsonArray(v: unknown): string | null {
  if (Array.isArray(v) && v.length) return JSON.stringify(v);
  if (typeof v === 'string' && v.trim()) return v;
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const org = await getSellerOrg(session.user.id);
  if (!org) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  if (product.organizationId !== org.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.price !== undefined) data.price = Number(body.price);
  if (body.compareAtPrice !== undefined)
    data.compareAtPrice = body.compareAtPrice ? Number(body.compareAtPrice) : null;
  if (body.stock !== undefined) data.stock = Number(body.stock);
  if (body.currency !== undefined) data.currency = body.currency;
  if (body.sizes !== undefined) data.sizes = toJsonArray(body.sizes);
  if (body.colors !== undefined) data.colors = toJsonArray(body.colors);
  if (body.styleKeywords !== undefined) data.styleKeywords = toJsonArray(body.styleKeywords);
  if (body.occasion !== undefined) data.occasion = toJsonArray(body.occasion);
  if (body.material !== undefined) data.material = body.material;
  if (body.tags !== undefined) data.tags = toJsonArray(body.tags);
  if (body.gender !== undefined) data.gender = body.gender;
  if (body.isPublished !== undefined) data.isPublished = Boolean(body.isPublished);

  const updated = await db.product.update({ where: { id }, data });
  return NextResponse.json({ product: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const org = await getSellerOrg(session.user.id);
  if (!org) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  if (product.organizationId !== org.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await db.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
