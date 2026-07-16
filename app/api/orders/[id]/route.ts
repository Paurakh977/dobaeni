import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/get-session';

export const runtime = 'nodejs';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const order = await db.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  // Seller must be a member of the order's organization.
  const member = await db.member.findFirst({
    where: { userId: session.user.id, organizationId: order.organizationId },
  });
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { status, trackingNumber, courierName, estimatedDelivery, cancelReason } = body;

  const data: any = {};
  if (status) data.status = status;
  if (trackingNumber !== undefined) data.trackingNumber = trackingNumber;
  if (courierName !== undefined) data.courierName = courierName;
  if (estimatedDelivery !== undefined)
    data.estimatedDelivery = estimatedDelivery ? new Date(estimatedDelivery) : null;
  if (status === 'delivered') data.deliveredAt = new Date();
  if (status === 'cancelled') {
    data.cancelReason = cancelReason || null;
    data.paymentStatus = 'refunded';
  }

  const updated = await db.order.update({ where: { id }, data });

  // Notify the buyer of the update.
  await db.notification.create({
    data: {
      userId: order.buyerId,
      type: 'order_update',
      title: 'Order update',
      body: `Order ${order.orderNumber} is now ${status ?? order.status}.`,
      data: JSON.stringify({ orderId: order.id }),
    },
  });

  return NextResponse.json({ order: updated });
}
