import { NextRequest, NextResponse } from 'next/server';
import { authorizeApi } from '@/lib/admin-auth';
import { listBrands } from '@/lib/admin';

export const runtime = 'nodejs';

export async function GET() {
  const session = await authorizeApi('brand:read');
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const brands = await listBrands();
  return NextResponse.json({ brands });
}
