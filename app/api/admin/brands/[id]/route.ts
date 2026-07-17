import { NextRequest, NextResponse } from 'next/server';
import { authorizeApi } from '@/lib/admin-auth';
import {
  setBrandVerification,
  setBrandPublished,
  setBrandSuspended,
  setBrandAnalyticsLocked,
} from '@/lib/admin';

export const runtime = 'nodejs';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  const permission =
    action === 'verify' ? 'brand:verify'
    : action === 'publish' ? 'brand:publish'
    : action === 'suspend' ? 'brand:suspend'
    : action === 'lock-analytics' ? 'brand:lock-analytics'
    : null;
  if (!permission) return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  const session = await authorizeApi(permission);
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    if (action === 'verify') {
      await setBrandVerification(id, body.verified !== false);
    } else if (action === 'publish') {
      await setBrandPublished(id, body.published !== false);
    } else if (action === 'suspend') {
      await setBrandSuspended(id, body.suspended === true);
    } else if (action === 'lock-analytics') {
      await setBrandAnalyticsLocked(id, body.locked === true);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
