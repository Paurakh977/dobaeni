import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isAdminRole, type Role } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SeedAdmin = { email: string; password: string; name: string; role: Role };

const SEED_ADMINS: SeedAdmin[] = [
  { email: 'admin@dobaeni.com', password: 'DobaeniAdmin@123', name: 'Platform Admin', role: 'admin' },
  { email: 'moderator@dobaeni.com', password: 'DobaeniMod@123', name: 'Platform Moderator', role: 'moderator' },
];

export async function POST(_req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && _req.nextUrl.searchParams.get('confirm') !== '1') {
    return NextResponse.json(
      { error: 'Refusing to seed in production. Append ?confirm=1 to override.' },
      { status: 403 },
    );
  }

  const results: unknown[] = [];

  for (const a of SEED_ADMINS) {
    try {
      const existing = await db.user.findUnique({ where: { email: a.email } });
      if (existing) {
        // Ensure the role is correct even if the user already exists.
        if (existing.role !== a.role) {
          await db.user.update({ where: { id: existing.id }, data: { role: a.role } });
        }
        results.push({ email: a.email, skipped: true, reason: 'user already exists', role: a.role });
        continue;
      }

      const user = await auth.api.signUpEmail({
        body: {
          email: a.email,
          password: a.password,
          name: a.name,
          role: a.role,
        },
      });

      // signUpEmail honours defaultRole; force the intended admin role.
      if (isAdminRole(a.role)) {
        await db.user.update({ where: { id: user.user.id }, data: { role: a.role, emailVerified: true } });
      }

      results.push({ email: a.email, id: user.user.id, role: a.role, created: true });
    } catch (err) {
      results.push({
        email: a.email,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    message: `Seeded ${SEED_ADMINS.length} admin accounts.`,
    results,
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
