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

  // Caller must be a member of this organization.
  const member = await db.member.findFirst({
    where: { userId: session.user.id, organizationId: id },
  });
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  const strFields = [
    'banner', 'description', 'contactEmail', 'contactPhone', 'legalName',
    'address', 'city', 'country', 'businessType', 'websiteUrl', 'socialLinks',
    'shippingPolicy', 'returnPolicy', 'logo', 'isPublished',
  ];
  for (const f of strFields) {
    if (body[f] !== undefined) data[f] = body[f];
  }
  if (body.establishedYear !== undefined)
    data.establishedYear = body.establishedYear ? Number(body.establishedYear) : null;
  if (body.latitude !== undefined) data.latitude = body.latitude ? Number(body.latitude) : null;
  if (body.longitude !== undefined) data.longitude = body.longitude ? Number(body.longitude) : null;

  const org = await db.organization.update({ where: { id }, data });
  return NextResponse.json({ organization: org });
}
