import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { getSellerOrg, getSellerAnalytics } from '@/lib/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const org = await getSellerOrg(session.user.id);
  if (!org) return NextResponse.json({ error: 'No brand' }, { status: 404 });

  const rangeParam = Number(req.nextUrl.searchParams.get('range') || 30);
  const range = [7, 30, 90].includes(rangeParam) ? rangeParam : 30;

  const analytics = await getSellerAnalytics(org.id, range);
  return NextResponse.json({ analytics });
}
