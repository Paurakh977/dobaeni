import { requirePermission } from '@/lib/admin-auth';
import { listUsers } from '@/lib/admin';
import UsersTable from './UsersTable';
import type { UserRow } from './UsersTable';
import { hasPermission } from '@/lib/rbac';
import { Users, ShieldCheck, Ban, UserCheck } from 'lucide-react';

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

  // Dynamic Metrics mapped instantly from Server Side data
  const totalUsers = rows.length;
  const sellerCount = rows.filter((u) => u.isSeller).length;
  const bannedCount = rows.filter((u) => u.banned).length;
  const staffCount = rows.filter((u) => u.role === 'admin' || u.role === 'moderator').length;

  return (
    <div className="space-y-8">
      {/* Title Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-3xl font-light font-display text-[#FAF9F6] tracking-tight">User Management</h1>
          <p className="mt-1.5 text-[14px] text-[#8E8E93] max-w-xl leading-relaxed">
            Ban or unban accounts, adjust platform roles, and securely impersonate users for troubleshooting.
          </p>
        </div>
      </div>

      {/* Summary Stat Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Directory */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.04] bg-[#0A0A0D]/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93]">All Accounts</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-500/10 text-zinc-400">
              <Users size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-light text-[#FAF9F6] font-display">{totalUsers}</h3>
            <p className="mt-1 text-[11px] text-[#7C7C83]">Active database profiles</p>
          </div>
        </div>

        {/* Card 2: Merchants */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.04] bg-[#0A0A0D]/40 p-5 backdrop-blur-md">
          <div className="absolute top-0 right-0 h-[2px] w-12 bg-[#DFBA73]/40 blur-[1px]" />
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93]">Sellers</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DFBA73]/10 text-[#DFBA73]">
              <UserCheck size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-light text-[#FAF9F6] font-display">{sellerCount}</h3>
            <p className="mt-1 text-[11px] text-[#7C7C83]">Onboarded business storefronts</p>
          </div>
        </div>

        {/* Card 3: Admins & Staff */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.04] bg-[#0A0A0D]/40 p-5 backdrop-blur-md">
          <div className="absolute top-0 right-0 h-[2px] w-12 bg-emerald-500/40 blur-[1px]" />
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93]">Staff</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-light text-[#FAF9F6] font-display">{staffCount}</h3>
            <p className="mt-1 text-[11px] text-[#7C7C83]">Administrators and moderators</p>
          </div>
        </div>

        {/* Card 4: Banned */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.04] bg-[#0A0A0D]/40 p-5 backdrop-blur-md">
          <div className="absolute top-0 right-0 h-[2px] w-12 bg-red-500/40 blur-[1px]" />
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93]">Banned</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
              <Ban size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-light text-[#FAF9F6] font-display">{bannedCount}</h3>
            <p className="mt-1 text-[11px] text-[#7C7C83]">Suspended platform accounts</p>
          </div>
        </div>
      </div>

      {/* Main Interactive Table Grid */}
      <div className="mt-6">
        <UsersTable
          users={rows}
          canImpersonate={hasPermission(session.user.role, 'user:impersonate')}
        />
      </div>
    </div>
  );
}