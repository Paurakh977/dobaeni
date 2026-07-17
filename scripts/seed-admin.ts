// Creates platform admin + moderator accounts so the admin console is reachable.
// Run:  bun run scripts/seed-admin.ts
//
// Uses Better Auth's own password hashing so the generated credentials work with
// the normal sign-in flow. Prefer POST /api/admin/seed in a live environment; this
// script is for local / CI seeding without an HTTP round-trip.
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { hashPassword } from 'better-auth/crypto';
import { isAdminRole, type Role } from '@/lib/rbac';

type SeedAdmin = { email: string; password: string; name: string; role: Role };

const SEED_ADMINS: SeedAdmin[] = [
  { email: 'admin@dobaeni.com', password: 'DobaeniAdmin@123', name: 'Platform Admin', role: 'admin' },
  { email: 'moderator@dobaeni.com', password: 'DobaeniMod@123', name: 'Platform Moderator', role: 'moderator' },
];

async function main() {
  for (const a of SEED_ADMINS) {
    const existing = await db.user.findUnique({ where: { email: a.email } });
    if (existing) {
      if (existing.role !== a.role) {
        await db.user.update({ where: { id: existing.id }, data: { role: a.role } });
      }
      console.log(`[skip] ${a.email} already exists (role=${a.role})`);
      continue;
    }

    const userId = randomUUID();
    const hashed = await hashPassword(a.password);

    await db.user.create({
      data: {
        id: userId,
        name: a.name,
        email: a.email,
        emailVerified: true,
        role: a.role,
        interests: null,
        onboardingCompleted: true,
      },
    });

    await db.account.create({
      data: {
        id: randomUUID(),
        userId,
        accountId: a.email,
        providerId: 'credential',
        password: hashed,
      },
    });

    if (isAdminRole(a.role)) {
      await db.user.update({ where: { id: userId }, data: { role: a.role } });
    }

    console.log(`[ok] created ${a.role} -> ${a.email}`);
  }
  console.log('\nDone. Sign in with the credentials above at /login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
