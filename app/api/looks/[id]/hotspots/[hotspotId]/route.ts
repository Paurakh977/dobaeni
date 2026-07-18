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

// ─── PATCH /api/looks/[id]/hotspots/[hotspotId] — move / rename ──────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; hotspotId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, hotspotId } = await params;
  const auth = await authorize(id, session.user.id);
  if ('error' in auth) return auth.error;

  const hotspot = await db.lookHotspot.findUnique({ where: { id: hotspotId } });
  if (!hotspot || hotspot.lookId !== id)
    return NextResponse.json({ error: 'Hotspot not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (body.left !== undefined) data.left = clampPct(body.left);
  if (body.top !== undefined) data.top = clampPct(body.top);
  if (body.label !== undefined) data.label = body.label ? String(body.label).slice(0, 60) : null;
  if (body.position !== undefined) data.position = Number(body.position);

  const updated = await db.lookHotspot.update({ where: { id: hotspotId }, data });
  return NextResponse.json({ hotspot: updated });
}

// ─── DELETE /api/looks/[id]/hotspots/[hotspotId] ─────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; hotspotId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, hotspotId } = await params;
  const auth = await authorize(id, session.user.id);
  if ('error' in auth) return auth.error;

  const hotspot = await db.lookHotspot.findUnique({ where: { id: hotspotId } });
  if (!hotspot || hotspot.lookId !== id)
    return NextResponse.json({ error: 'Hotspot not found' }, { status: 404 });

  await db.lookHotspot.delete({ where: { id: hotspotId } });
  return NextResponse.json({ ok: true });
}
