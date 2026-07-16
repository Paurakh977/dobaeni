import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/get-session';
import { getCart } from '@/lib/queries';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const cart = await getCart(session.user.id);
  return NextResponse.json(cart);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { productId, size = null, color = null, quantity = 1 } = body;

  if (!productId) {
    return NextResponse.json({ error: 'Product required' }, { status: 400 });
  }

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    return NextResponse.json({ error: 'Product not available' }, { status: 404 });
  }
  if (product.stock <= 0) {
    return NextResponse.json({ error: 'Out of stock' }, { status: 400 });
  }

  const cart = await db.cart.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  const qty = Math.max(1, Math.min(quantity, product.stock));

  const existing = await db.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
      size: size ?? null,
      color: color ?? null,
    },
  });

  if (existing) {
    await db.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: { increment: qty },
        priceSnapshot: product.price,
      },
    });
  } else {
    await db.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        size,
        color,
        quantity: qty,
        priceSnapshot: product.price,
      },
    });
  }

  const updated = await getCart(session.user.id);
  return NextResponse.json(updated);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { itemId, quantity } = body;
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });

  const cart = await db.cart.findUnique({ where: { userId: session.user.id } });
  if (!cart) return NextResponse.json({ error: 'No cart' }, { status: 404 });

  const item = await db.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

  const newQty = Math.max(1, Math.min(quantity, item.productId ? 9999 : 1));
  const product = await db.product.findUnique({ where: { id: item.productId } });
  const max = product?.stock ?? 1;
  await db.cartItem.update({
    where: { id: itemId },
    data: { quantity: Math.min(newQty, max) },
  });

  return NextResponse.json(await getCart(session.user.id));
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const itemId = req.nextUrl.searchParams.get('itemId');
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });

  const cart = await db.cart.findUnique({ where: { userId: session.user.id } });
  if (!cart) return NextResponse.json({ error: 'No cart' }, { status: 404 });

  await db.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  return NextResponse.json(await getCart(session.user.id));
}
