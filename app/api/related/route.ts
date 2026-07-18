import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { getSimilarProducts } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  if (!productId) return NextResponse.json({ products: [] });

  const exclude = (searchParams.get('exclude') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const limit = Math.min(Number(searchParams.get('limit') || '16') || 16, 40);

  const session = await getSession();
  const products = await getSimilarProducts(
    productId,
    exclude,
    limit,
    session?.user.id,
  );

  return NextResponse.json({ products });
}
