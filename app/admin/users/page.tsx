import { requirePermission } from '@/lib/admin-auth';
import { listUsers } from '@/lib/admin';
import UsersTable from './UsersTable';
import type { UserRow } from './UsersTable';
import { hasPermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await requirePermission('user:read');
  const users = await listUsers();

  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    role: u.role,
    banned: u.banned,
    banReason: u.banReason,
    banExpires: u.banExpires ? u.banExpires.toISOString() : null,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt.toISOString(),
    isSeller: u.isSeller,
  }));

  return (
    <div>
      <h1 className="text-2xl font-light font-display text-[#FAF9F6]">Users</h1>
      <p className="mt-1 text-[13px] text-[#7C7C83]">
        Ban or unban accounts, adjust platform roles, and impersonate users for support.
      </p>

      <p className="mt-4 text-[11px] font-mono uppercase tracking-widest text-[#52525B]">
        {rows.length} total
      </p>

      <div className="mt-4">
        <UsersTable
          users={rows}
          canImpersonate={hasPermission(session.user.role, 'user:impersonate')}
        />
      </div>
    </div>
  );
}
