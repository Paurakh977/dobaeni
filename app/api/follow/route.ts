import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/get-session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { orgId } = body;
  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 });

  const org = await db.organization.findUnique({ where: { id: orgId } });
  if (!org) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

  const existing = await db.follow.findUnique({
    where: { followerId_organizationId: { followerId: session.user.id, organizationId: orgId } },
  });
  if (existing) return NextResponse.json({ ok: true, alreadyFollowing: true });

  await db.follow.create({ data: { followerId: session.user.id, organizationId: orgId } });
  await db.organization.update({
    where: { id: orgId },
    data: { followerCount: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = req.nextUrl.searchParams.get('orgId');
  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 });

  await db.follow.deleteMany({
    where: { followerId: session.user.id, organizationId: orgId },
  });
  await db.organization.update({
    where: { id: orgId },
    data: { followerCount: { decrement: 1 } },
  });

  return NextResponse.json({ ok: true });
}
