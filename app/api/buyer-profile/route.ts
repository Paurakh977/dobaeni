import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/get-session';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  const fields = [
    'gender', 'ageRange', 'dateOfBirth', 'phone', 'city', 'country', 'bio',
    'avatarUrl', 'sizePrefs', 'budgetRange', 'preferredCategories',
    'preferredOccasions', 'styleIntensity', 'preferredGenders',
  ];
  for (const f of fields) {
    if (body[f] !== undefined) data[f] = body[f];
  }

  const profile = await db.buyerProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });

  return NextResponse.json({ profile });
}
