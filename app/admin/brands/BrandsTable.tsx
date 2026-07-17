'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, EyeOff, Lock, BadgeCheck, BadgeX } from 'lucide-react';

export type BrandRow = {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
  isVerified: boolean;
  verificationStatus: string | null;
  isPublished: boolean;
  status: string | null;
  analyticsLocked: boolean;
  businessType: string | null;
  city: string | null;
  productCount: number;
  ownerEmail: string | null;
  createdAt: string;
};

export default function BrandsTable({
  brands,
  canVerify,
  canPublish,
  canSuspend,
  canLockAnalytics,
}: {
  brands: BrandRow[];
  canVerify: boolean;
  canPublish: boolean;
  canSuspend: boolean;
  canLockAnalytics: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function act(id: string, action: string, extra: Record<string, unknown> = {}) {
    setBusyId(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/brands/${id}`, {
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

  const isSuspended = (b: BrandRow) => b.status === 'suspended';

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
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr key={b.id} className="border-t border-white/[0.04]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-[#1a1a1f]">
                      {b.logo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.logo} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[#FAF9F6]">{b.name}</p>
                        {b.isVerified && (
                          <span className="rounded-full bg-[#DFBA73]/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-[#DFBA73]">
                            verified
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[11px] text-[#52525B]">
                        {b.city || '—'}
                        {b.businessType ? ` · ${b.businessType}` : ''}
                        {b.ownerEmail ? ` · ${b.ownerEmail}` : ''}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {isSuspended(b) ? (
                      <span className="w-fit rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-red-400">
                        suspended
                      </span>
                    ) : b.isPublished ? (
                      <span className="w-fit rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                        live
                      </span>
                    ) : (
                      <span className="w-fit rounded-full bg-zinc-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                        unlisted
                      </span>
                    )}
                    {b.analyticsLocked && (
                      <span className="w-fit rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-amber-400">
                        analytics locked
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-[12px] text-[#8E8E93]">{b.productCount}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {canVerify &&
                      (b.isVerified ? (
                        <button
                          onClick={() => act(b.id, 'verify', { verified: false })}
                          disabled={busyId === b.id}
                          title="Unverify"
                          className="rounded-lg p-2 text-[#8E8E93] transition-colors hover:text-[#DFBA73] disabled:opacity-40"
                        >
                          {busyId === b.id ? <Loader2 size={15} className="animate-spin" /> : <BadgeX size={15} />}
                        </button>
                      ) : (
                        <button
                          onClick={() => act(b.id, 'verify', { verified: true })}
                          disabled={busyId === b.id}
                          title="Verify"
                          className="rounded-lg p-2 text-[#8E8E93] transition-colors hover:text-[#DFBA73] disabled:opacity-40"
                        >
                          {busyId === b.id ? <Loader2 size={15} className="animate-spin" /> : <BadgeCheck size={15} />}
                        </button>
                      ))}
                    {canPublish &&
                      (b.isPublished ? (
                        <button
                          onClick={() => act(b.id, 'publish', { published: false })}
                          disabled={busyId === b.id}
                          title="Unlist from discover"
                          className="rounded-lg p-2 text-[#8E8E93] transition-colors hover:text-zinc-300 disabled:opacity-40"
                        >
                          {busyId === b.id ? <Loader2 size={15} className="animate-spin" /> : <EyeOff size={15} />}
                        </button>
                      ) : (
                        <button
                          onClick={() => act(b.id, 'publish', { published: true })}
                          disabled={busyId === b.id}
                          title="List on discover"
                          className="rounded-lg p-2 text-[#8E8E93] transition-colors hover:text-emerald-400 disabled:opacity-40"
                        >
                          {busyId === b.id ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                        </button>
                      ))}
                    {canSuspend &&
                      (isSuspended(b) ? (
                        <button
                          onClick={() => act(b.id, 'suspend', { suspended: false })}
                          disabled={busyId === b.id}
                          title="Reactivate brand"
                          className="rounded-lg p-2 text-[#8E8E93] transition-colors hover:text-emerald-400 disabled:opacity-40"
                        >
                          {busyId === b.id ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                        </button>
                      ) : (
                        <button
                          onClick={() => act(b.id, 'suspend', { suspended: true })}
                          disabled={busyId === b.id}
                          title="Suspend brand"
                          className="rounded-lg p-2 text-[#8E8E93] transition-colors hover:text-red-400 disabled:opacity-40"
                        >
                          {busyId === b.id ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
                        </button>
                      ))}
                    {canLockAnalytics &&
                      (b.analyticsLocked ? (
                        <button
                          onClick={() => act(b.id, 'lock-analytics', { locked: false })}
                          disabled={busyId === b.id}
                          title="Unlock analytics"
                          className="rounded-lg p-2 text-[#8E8E93] transition-colors hover:text-emerald-400 disabled:opacity-40"
                        >
                          {busyId === b.id ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} className="text-amber-400" />}
                        </button>
                      ) : (
                        <button
                          onClick={() => act(b.id, 'lock-analytics', { locked: true })}
                          disabled={busyId === b.id}
                          title="Lock analytics"
                          className="rounded-lg p-2 text-[#8E8E93] transition-colors hover:text-amber-400 disabled:opacity-40"
                        >
                          {busyId === b.id ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
                        </button>
                      ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-[#52525B]">
        Suspending a brand hides it from discover and storefront; unlisting keeps it searchable but removes it from the
        discover page. Analytics lock hides the seller's dashboard metrics.
      </p>
    </div>
  );
}
