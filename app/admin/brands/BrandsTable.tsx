'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  ShieldCheck,
  EyeOff,
  Lock,
  Unlock,
  BadgeCheck,
  BadgeX,
  Search,
  X,
  Building2,
  MapPin,
  Mail,
  Layers,
  AlertTriangle
} from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'live' | 'unlisted' | 'suspended'>('all');

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

  // Updated filter logic: allows overlapping states to show correctly in each category
  const filteredBrands = brands.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.ownerEmail?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (b.city?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (b.businessType?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'verified') return b.isVerified;
    if (statusFilter === 'live') return b.isPublished;
    if (statusFilter === 'unlisted') return !b.isPublished;
    if (statusFilter === 'suspended') return isSuspended(b);
    
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
      {/* Alert message display */}
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
              <AlertTriangle size={15} />
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

      {/* Control panel: Search & Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C7C83]" />
          <input
            type="text"
            placeholder="Search brands by name, location, email..."
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
          {(['all', 'verified', 'live', 'unlisted', 'suspended'] as const).map((filter) => (
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

      {/* Main Table */}
      <div className="w-full overflow-x-auto pb-4">
        <table className="w-full text-left text-[13px] border-separate border-spacing-y-3">
          <thead className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7C7C83]">
            <tr>
              <th className="px-6 py-1 font-medium">Brand</th>
              <th className="px-6 py-1 font-medium">Status Indicators</th>
              <th className="px-6 py-1 font-medium">Products</th>
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
              {filteredBrands.map((b) => {
                const isBusy = busyId === b.id;
                return (
                  <motion.tr
                    key={b.id}
                    variants={rowVariants}
                    layout="position"
                    className="group bg-[#0A0A0D]/50 backdrop-blur-sm transition-all duration-300 hover:bg-[#0A0A0D]/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                  >
                    <td className="absolute inset-0 pointer-events-none rounded-2xl border border-white/[0.04] group-hover:border-[#DFBA73]/20 transition-colors duration-300" />

                    {/* Brand Details */}
                    <td className="relative px-6 py-4 rounded-l-2xl">
                      <div className="flex items-center gap-4">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-white/10 to-transparent p-[1px]">
                          <div className="absolute inset-0 rounded-xl bg-[#1a1a1f] m-[1px]" />
                          {b.logo ? (
                            <motion.img
                              src={b.logo}
                              alt=""
                              whileHover={{ scale: 1.08 }}
                              className="relative z-10 h-full w-full rounded-xl object-cover transition-transform duration-300"
                            />
                          ) : (
                            <div className="relative z-10 flex h-full w-full items-center justify-center rounded-xl bg-[#1a1a1f] text-[12px] font-mono text-[#7C7C83]">
                              {b.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-medium text-[#FAF9F6] transition-colors group-hover:text-[#DFBA73]">
                            {b.name}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#8E8E93] mt-1.5 font-sans">
                            {b.city && (
                              <span className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.04] px-1.5 py-0.5 rounded">
                                <MapPin size={10} className="text-[#8E8E93]/70" />
                                {b.city}
                              </span>
                            )}
                            {b.businessType && (
                              <span className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.04] px-1.5 py-0.5 rounded">
                                <Building2 size={10} className="text-[#8E8E93]/70" />
                                {b.businessType}
                              </span>
                            )}
                            {b.ownerEmail && (
                              <span className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.04] px-1.5 py-0.5 rounded">
                                <Mail size={10} className="text-[#8E8E93]/70" />
                                <span className="max-w-[120px] truncate">{b.ownerEmail}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status Indicators: Displays multiple statuses side-by-side if they co-exist */}
                    <td className="relative px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                        {/* Verified vs Unverified Status */}
                        {b.isVerified ? (
                          <span className="flex items-center gap-1 rounded-full border border-[#DFBA73]/30 bg-[#DFBA73]/10 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-[#DFBA73] shadow-[0_0_8px_rgba(223,186,115,0.1)]">
                            <BadgeCheck size={10} /> verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full border border-zinc-500/15 bg-zinc-500/5 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                            <BadgeX size={10} className="text-zinc-500" /> unverified
                          </span>
                        )}

                        {/* Live vs Unlisted Status */}
                        {b.isPublished ? (
                          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            live
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 rounded-full border border-zinc-500/20 bg-zinc-500/10 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                            unlisted
                          </span>
                        )}

                        {/* Suspended Status Badge */}
                        {isSuspended(b) && (
                          <span className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-red-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                            suspended
                          </span>
                        )}

                        {/* Analytics Locked Badge */}
                        {b.analyticsLocked && (
                          <span className="flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-amber-400">
                            <Lock size={9} /> locked
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Products Count Column */}
                    <td className="relative px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[13px] font-mono text-[#FAF9F6]">
                        <Layers size={12} className="text-[#7C7C83]" />
                        <span>{b.productCount}</span>
                        <span className="text-[10px] text-[#7C7C83]">items</span>
                      </div>
                    </td>

                    {/* Actions Panel */}
                    <td className="relative px-6 py-4 rounded-r-2xl">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 md:opacity-50 md:group-hover:opacity-100 transition-opacity duration-300">
                        {/* Verify Action Toggle */}
                        {canVerify && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => act(b.id, 'verify', { verified: !b.isVerified })}
                            disabled={isBusy}
                            title={b.isVerified ? "Unverify Brand" : "Verify Brand"}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 disabled:opacity-40 ${
                              b.isVerified
                                ? 'bg-red-500/5 border-red-500/10 text-[#8E8E93] hover:text-red-400 hover:bg-red-500/10'
                                : 'bg-[#DFBA73]/5 border-[#DFBA73]/10 text-[#8E8E93] hover:text-[#DFBA73] hover:bg-[#DFBA73]/10'
                            }`}
                          >
                            {isBusy ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : b.isVerified ? (
                              <BadgeX size={14} />
                            ) : (
                              <BadgeCheck size={14} />
                            )}
                          </motion.button>
                        )}

                        {/* Publish Action Toggle */}
                        {canPublish && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => act(b.id, 'publish', { published: !b.isPublished })}
                            disabled={isBusy}
                            title={b.isPublished ? "Unlist from Discover" : "List on Discover"}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 disabled:opacity-40 ${
                              b.isPublished
                                ? 'bg-zinc-500/5 border-zinc-500/10 text-[#8E8E93] hover:text-zinc-300 hover:bg-zinc-500/10'
                                : 'bg-emerald-500/5 border-emerald-500/10 text-[#8E8E93] hover:text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {isBusy ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : b.isPublished ? (
                              <EyeOff size={14} />
                            ) : (
                              <ShieldCheck size={14} />
                            )}
                          </motion.button>
                        )}

                        {/* Suspension Action Toggle */}
                        {canSuspend && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => act(b.id, 'suspend', { suspended: !isSuspended(b) })}
                            disabled={isBusy}
                            title={isSuspended(b) ? "Reactivate Brand" : "Suspend Brand"}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 disabled:opacity-40 ${
                              isSuspended(b)
                                ? 'bg-emerald-500/5 border-emerald-500/10 text-[#8E8E93] hover:text-emerald-400 hover:bg-emerald-500/10'
                                : 'bg-red-500/5 border-red-500/10 text-[#8E8E93] hover:text-red-400 hover:bg-red-500/10'
                            }`}
                          >
                            {isBusy ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : isSuspended(b) ? (
                              <ShieldCheck size={14} />
                            ) : (
                              <Lock size={14} />
                            )}
                          </motion.button>
                        )}

                        {/* Lock Analytics Action Toggle */}
                        {canLockAnalytics && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => act(b.id, 'lock-analytics', { locked: !b.analyticsLocked })}
                            disabled={isBusy}
                            title={b.analyticsLocked ? "Unlock Analytics Dashboard" : "Lock Analytics Dashboard"}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 disabled:opacity-40 ${
                              b.analyticsLocked
                                ? 'bg-emerald-500/5 border-emerald-500/10 text-[#8E8E93] hover:text-emerald-400 hover:bg-emerald-500/10'
                                : 'bg-amber-500/5 border-amber-500/10 text-[#8E8E93] hover:text-amber-400 hover:bg-amber-500/10'
                            }`}
                          >
                            {isBusy ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : b.analyticsLocked ? (
                              <Unlock size={14} />
                            ) : (
                              <Lock size={14} />
                            )}
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>

            {/* Empty State */}
            {filteredBrands.length === 0 && (
              <motion.tr
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative"
              >
                <td colSpan={4} className="text-center py-16 px-4">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.02] border border-white/[0.05] text-[#7C7C83]">
                      <Search size={20} />
                    </div>
                    <p className="text-[14px] font-medium text-[#FAF9F6]">No brands found</p>
                    <p className="text-[11px] text-[#8E8E93] max-w-[280px]">
                      We couldn't find any brands matching "{searchQuery}". Try modifying your search criteria.
                    </p>
                  </div>
                </td>
              </motion.tr>
            )}
          </motion.tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-white/[0.04] bg-[#0A0A0D]/40 p-4 backdrop-blur-md">
        <p className="text-[11px] text-[#8E8E93] leading-relaxed">
          Suspending a brand hides it from discover and storefront; unlisting keeps it searchable but removes it from the discover page. Analytics lock hides the seller's dashboard metrics.
        </p>
      </div>
    </div>
  );
}