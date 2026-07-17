'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Loader2, Ban, ShieldX, RefreshCw, Eye } from 'lucide-react';

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

  return (
    <div>
      {msg && (
        <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-[12px] text-red-400">
          {msg}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-white/[0.02] text-[10px] font-mono uppercase tracking-widest text-[#7C7C83]">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/[0.04]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#1a1a1f]">
                      {u.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.image} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[#FAF9F6]">{u.name || u.email}</p>
                      <p className="truncate text-[11px] text-[#52525B]">{u.email}</p>
                    </div>
                    {u.isSeller && (
                      <span className="rounded-full bg-[#DFBA73]/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-[#DFBA73]">
                        seller
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role ?? 'buyer'}
                    disabled={busyId === u.id}
                    onChange={(e) => act(u.id, 'set-role', { role: e.target.value })}
                    className="rounded-lg border border-white/[0.08] bg-[#0E0E12] px-2 py-1 text-[12px] text-[#FAF9F6] outline-none focus:border-[#DFBA73]/40"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r} className="bg-[#121215]">{r}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {u.banned ? (
                    <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-red-400">
                      banned
                    </span>
                  ) : u.emailVerified ? (
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                      active
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                      unverified
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[12px] text-[#8E8E93]">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {u.banned ? (
                      <button
                        onClick={() => act(u.id, 'unban')}
                        disabled={busyId === u.id}
                        title="Unban"
                        className="rounded-lg p-2 text-[#8E8E93] transition-colors hover:text-emerald-400 disabled:opacity-40"
                      >
                        {busyId === u.id ? <Loader2 size={15} className="animate-spin" /> : <ShieldX size={15} />}
                      </button>
                    ) : (
                      <button
                        onClick={() => act(u.id, 'ban', { reason: 'Violation of Dobaeni terms' })}
                        disabled={busyId === u.id}
                        title="Ban"
                        className="rounded-lg p-2 text-[#8E8E93] transition-colors hover:text-red-400 disabled:opacity-40"
                      >
                        {busyId === u.id ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />}
                      </button>
                    )}
                    {canImpersonate && (
                      <button
                        onClick={() => impersonate(u.id)}
                        disabled={busyId === u.id}
                        title="Impersonate"
                        className="rounded-lg p-2 text-[#8E8E93] transition-colors hover:text-[#DFBA73] disabled:opacity-40"
                      >
                        {busyId === u.id ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#52525B]">
        <RefreshCw size={12} /> Changes apply instantly. Banned users are logged out and cannot sign in.
      </p>
    </div>
  );
}
