import { NextRequest, NextResponse } from 'next/server';
import { authorizeApi } from '@/lib/admin-auth';
import { listProducts } from '@/lib/admin';

export const runtime = 'nodejs';

export async function GET() {
  const session = await authorizeApi('product:read');
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const products = await listProducts();
  return NextResponse.json({ products });
}
