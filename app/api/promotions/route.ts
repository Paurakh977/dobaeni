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

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const org = await getSellerOrg(session.user.id);
  if (!org) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const title = (body.title || '').toString().trim();
  if (!title) return NextResponse.json({ error: 'Campaign title required' }, { status: 400 });

  const promotion = await db.promotion.create({
    data: {
      organizationId: org.id,
      productId: body.productId || null,
      title,
      type: body.type || 'homepage',
      status: body.status || 'active',
      budget: body.budget ? Number(body.budget) : null,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      targetStyles: toJsonArray(body.targetStyles),
      isActive: body.status ? body.status === 'active' : true,
    },
  });

  return NextResponse.json({ promotion });
}
