import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/get-session';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const addresses = await db.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json({ addresses });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const recipientName = (body.recipientName || '').toString().trim();
  const phone = (body.phone || '').toString().trim();
  const line1 = (body.line1 || '').toString().trim();
  const city = (body.city || '').toString().trim();
  if (!recipientName || !phone || !line1 || !city) {
    return NextResponse.json({ error: 'Recipient, phone, address and city are required' }, { status: 400 });
  }

  const count = await db.address.count({ where: { userId: session.user.id } });
  const address = await db.address.create({
    data: {
      userId: session.user.id,
      label: body.label || 'Home',
      recipientName,
      phone,
      line1,
      line2: body.line2 || null,
      city,
      state: body.state || null,
      postalCode: body.postalCode || null,
      country: body.country || 'Nepal',
      isDefault: count === 0 ? true : Boolean(body.isDefault),
    },
  });
  return NextResponse.json({ address });
}
