import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { getSession } from '@/lib/get-session';

export const runtime = 'nodejs';

function orderNumber() {
  return `DB-${Date.now().toString(36).toUpperCase().slice(-6)}-${randomUUID().slice(0, 4)}`;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const paymentMethod = (body.paymentMethod || 'cod') as string;
  const addressId = body.addressId || null;

  const cart = await db.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              organizationId: true,
              images: { orderBy: { position: 'asc' }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });
  }

  // Group cart items by seller organization (each becomes its own order).
  const byOrg = new Map<string, typeof cart.items>();
  for (const item of cart.items) {
    const orgId = item.product.organizationId;
    if (!byOrg.has(orgId)) byOrg.set(orgId, []);
    byOrg.get(orgId)!.push(item);
  }

  const created: { orderNumber: string; id: string }[] = [];

  for (const [orgId, items] of byOrg.entries()) {
    const subtotal = items.reduce((s, it) => s + it.priceSnapshot * it.quantity, 0);
    const shippingFee = subtotal >= 2000 ? 0 : 120;
    const total = subtotal + shippingFee;
    const num = orderNumber();

    const order = await db.order.create({
      data: {
        orderNumber: num,
        organizationId: orgId,
        buyerId: session.user.id,
        addressId,
        subtotal,
        shippingFee,
        tax: 0,
        discount: 0,
        totalAmount: total,
        currency: 'NPR',
        status: paymentMethod === 'cod' ? 'pending' : 'processing',
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
        items: {
          create: items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            price: it.priceSnapshot,
            size: it.size,
            color: it.color,
            productName: it.product.name,
            productImage: it.product.images[0]?.url ?? null,
          })),
        },
      },
    });

    // Update inventory + sold counts.
    for (const it of items) {
      await db.product.update({
        where: { id: it.productId },
        data: {
          stock: { decrement: it.quantity },
          soldCount: { increment: it.quantity },
        },
      });
    }

    // Notify the brand owner.
    const owner = await db.member.findFirst({ where: { organizationId: orgId, role: 'owner' } });
    if (owner) {
      await db.notification.create({
        data: {
          userId: owner.userId,
          type: 'order_update',
          title: 'New order received',
          body: `${num} · Rs. ${Math.round(total)}`,
          data: JSON.stringify({ orderId: order.id }),
        },
      });
    }

    created.push({ orderNumber: num, id: order.id });
  }

  // Empty the cart.
  await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  await db.cart.delete({ where: { id: cart.id } });

  return NextResponse.json({ orders: created });
}
