'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Ban,
  ShieldX,
  RefreshCw,
  Eye,
  Search,
  X,
  AlertOctagon,
  BadgeCheck,
  BadgeX,
  Mail,
  Calendar
} from 'lucide-react';

export type UserRow = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string | null;
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  emailVerified: boolean;
  createdAt: string;
  isSeller: boolean;
};

const ROLES = ['buyer', 'seller', 'moderator', 'admin'];

export default function UsersTable({ users, canImpersonate }: { users: UserRow[]; canImpersonate: boolean }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sellers' | 'banned' | 'unverified' | 'staff'>('all');

  async function act(id: string, action: string, extra: Record<string, unknown> = {}) {
    setBusyId(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  async function impersonate(id: string) {
    setBusyId(id);
    setMsg(null);
    try {
      const { error } = await authClient.admin.impersonateUser({ userId: id });
      if (error) throw new Error(error.message);
      router.push('/dashboard');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Impersonation failed');
    } finally {
      setBusyId(null);
    }
  }

  // Client-side quick filter logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.role?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'sellers') return u.isSeller;
    if (statusFilter === 'banned') return u.banned;
    if (statusFilter === 'unverified') return !u.emailVerified;
    if (statusFilter === 'staff') return u.role === 'admin' || u.role === 'moderator';

    return true;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 25 } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } }
  };

  return (
    <div className="space-y-6">
      {/* Alert Messaging */}
      <AnimatePresence mode="wait">
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3.5 text-[13px] text-red-400 backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <AlertOctagon size={15} />
              <span>{msg}</span>
            </div>
            <button
              onClick={() => setMsg(null)}
              className="text-red-400/60 hover:text-red-400 transition-colors"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Panel: Search & Advanced Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C7C83]" />
          <input
            type="text"
            placeholder="Search accounts by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A0A0D]/60 border border-white/[0.06] rounded-xl pl-10 pr-10 py-2.5 text-[13px] text-[#FAF9F6] placeholder-[#7C7C83] focus:outline-none focus:border-[#DFBA73]/40 focus:ring-1 focus:ring-[#DFBA73]/40 transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C7C83] hover:text-[#FAF9F6] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1 bg-[#0A0A0D]/60 border border-white/[0.06] p-1 rounded-xl shrink-0">
          {(['all', 'sellers', 'banned', 'unverified', 'staff'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className="relative px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-lg transition-all duration-200"
            >
              {statusFilter === filter && (
                <motion.div
                  layoutId="activeFilterTab"
                  className="absolute inset-0 bg-[#DFBA73] rounded-lg"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span
                className={`relative z-10 transition-colors duration-200 ${
                  statusFilter === filter ? 'text-[#0A0A0D] font-semibold' : 'text-[#8E8E93] hover:text-[#FAF9F6]'
                }`}
              >
                {filter}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Segment */}
      <div className="w-full overflow-x-auto pb-4">
        <table className="w-full text-left text-[13px] border-separate border-spacing-y-3">
          <thead className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7C7C83]">
            <tr>
              <th className="px-6 py-1 font-medium">User Details</th>
              <th className="px-6 py-1 font-medium">Platform Role</th>
              <th className="px-6 py-1 font-medium">Account Status</th>
              <th className="px-6 py-1 font-medium">Joined Date</th>
              <th className="px-6 py-1 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <motion.tbody
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="[&>tr]:relative"
          >
            <AnimatePresence mode="popLayout">
              {filteredUsers.map((u) => {
                const isBusy = busyId === u.id;
                return (
                  <motion.tr
                    key={u.id}
                    variants={rowVariants}
                    layout="position"
                    className="group bg-[#0A0A0D]/50 backdrop-blur-sm transition-all duration-300 hover:bg-[#0A0A0D]/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                  >
                    <td className="absolute inset-0 pointer-events-none rounded-2xl border border-white/[0.04] group-hover:border-[#DFBA73]/20 transition-colors duration-300" />
                    
                    {/* User profile layout */}
                    <td className="relative px-6 py-4 rounded-l-2xl">
                      <div className="flex items-center gap-4">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-white/10 to-transparent p-[1px]">
                          <div className="absolute inset-0 rounded-full bg-[#1a1a1f] m-[1px]" />
                          {u.image ? (
                            <motion.img
                              src={u.image}
                              alt=""
                              whileHover={{ scale: 1.08 }}
                              className="relative z-10 h-full w-full rounded-full object-cover transition-transform duration-300"
                            />
                          ) : (
                            <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full bg-[#1a1a1f] text-[10px] font-mono text-[#7C7C83]">
                              {u.name?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-medium text-[#FAF9F6] transition-colors group-hover:text-[#DFBA73]">
                            {u.name || 'Unnamed User'}
                          </p>
                          <span className="flex items-center gap-1 mt-1 text-[11px] text-[#8E8E93] font-sans">
                            <Mail size={10} className="text-[#8E8E93]/70" />
                            <span className="truncate max-w-[160px]">{u.email}</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Custom Styled Role selection */}
                    <td className="relative px-6 py-4">
                      <select
                        value={u.role ?? 'buyer'}
                        disabled={isBusy}
                        onChange={(e) => act(u.id, 'set-role', { role: e.target.value })}
                        className="cursor-pointer appearance-none rounded-xl border border-white/[0.08] bg-[#0E0E12] px-3.5 py-1.5 text-[12px] text-[#FAF9F6] outline-none transition-all focus:border-[#DFBA73]/50 focus:ring-1 focus:ring-[#DFBA73]/50 hover:border-white/[0.15] hover:bg-white/[0.02]"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r} className="bg-[#121215]">{r}</option>
                        ))}
                      </select>
                    </td>

                    {/* Account Status column: Supports parallel render states */}
                    <td className="relative px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                        {/* Active vs Unverified status */}
                        {u.emailVerified ? (
                          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 rounded-full border border-zinc-500/20 bg-zinc-500/10 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                            unverified
                          </span>
                        )}

                        {/* Ban status display */}
                        {u.banned && (
                          <span className="flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-red-400 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            banned
                          </span>
                        )}

                        {/* Seller profile indicator */}
                        {u.isSeller && (
                          <span className="flex items-center gap-1 rounded-full border border-[#DFBA73]/30 bg-[#DFBA73]/10 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-[#DFBA73] shadow-[0_0_8px_rgba(223,186,115,0.1)]">
                            seller
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="relative px-6 py-4">
                      <span className="flex items-center gap-1 text-[12px] text-[#8E8E93] font-mono">
                        <Calendar size={11} className="text-[#8E8E93]/70" />
                        {new Date(u.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </td>

                    {/* Actions cell */}
                    <td className="relative px-6 py-4 rounded-r-2xl">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 md:opacity-50 md:group-hover:opacity-100 transition-opacity duration-300">
                        {/* Ban Action Toggle */}
                        {u.banned ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => act(u.id, 'unban')}
                            disabled={isBusy}
                            title="Unban Account"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/10 bg-emerald-500/5 text-[#8E8E93] hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200"
                          >
                            {isBusy ? <Loader2 size={14} className="animate-spin" /> : <ShieldX size={14} />}
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => act(u.id, 'ban', { reason: 'Violation of Dobaeni terms' })}
                            disabled={isBusy}
                            title="Ban Account"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/10 bg-red-500/5 text-[#8E8E93] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                          >
                            {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                          </motion.button>
                        )}

                        {/* Impersonation toggle */}
                        {canImpersonate && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => impersonate(u.id)}
                            disabled={isBusy}
                            title="Impersonate Account session"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DFBA73]/10 bg-[#DFBA73]/5 text-[#8E8E93] hover:text-[#DFBA73] hover:bg-[#DFBA73]/10 transition-all duration-200"
                          >
                            {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>

            {/* Empty filter result display */}
            {filteredUsers.length === 0 && (
              <motion.tr
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative"
              >
                <td colSpan={5} className="text-center py-16 px-4">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.02] border border-white/[0.05] text-[#7C7C83]">
                      <Search size={20} />
                    </div>
                    <p className="text-[14px] font-medium text-[#FAF9F6]">No users found</p>
                    <p className="text-[11px] text-[#8E8E93] max-w-[280px]">
                      We couldn't find any users matching your filter or query.
                    </p>
                  </div>
                </td>
              </motion.tr>
            )}
          </motion.tbody>
        </table>
      </div>

      {/* Description Panel Footer */}
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/[0.04] bg-[#0A0A0D]/40 p-4 backdrop-blur-md">
        <p className="flex items-center gap-2 text-[11px] text-[#8E8E93]">
          <RefreshCw size={14} className="text-[#DFBA73]" /> 
          Changes apply instantly. Banned users are logged out and cannot sign in.
        </p>
      </div>
    </div>
  );
}