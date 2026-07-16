// Wipes ALL seed sellers + their orgs/products so /api/seed recreates them cleanly
// (the fixed route assigns strictly-unique, non-wrapping images).
// Run:  bun run scripts/clean-seed.ts
import { db } from '@/lib/db';

const EMAIL_SUFFIX = '@dobaeni.seed';

async function main() {
  const users = await db.user.findMany({
    where: { email: { endsWith: EMAIL_SUFFIX } },
    select: { id: true, email: true },
  });
  console.log(`Found ${users.length} seed users.`);

  // Users cascade to accounts / members / buyerProfile / etc.
  for (const u of users) {
    await db.user.delete({ where: { id: u.id } });
    console.log(`  deleted user ${u.email}`);
  }

  // Orphaned orgs (their owner member was just deleted) — remove leftovers.
  const orphans = await db.organization.findMany({
    where: { members: { none: {} } },
    select: { id: true, slug: true },
  });
  for (const o of orphans) {
    await db.organization.delete({ where: { id: o.id } });
    console.log(`  deleted orphaned org ${o.slug}`);
  }

  const counts = {
    users: await db.user.count({ where: { email: { endsWith: EMAIL_SUFFIX } } }),
    orgs: (await db.organization.findMany({ where: { members: { none: {} } }, select: { id: true } })).length,
  };
  console.log('Remaining seed rows:', counts);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
