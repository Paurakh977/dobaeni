'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Star,
  StarOff,
  Eye,
  EyeOff,
  Package,
  AlertTriangle,
  Search,
  X,
  Layers,
  Sparkles,
  Building2,
  Trash2
} from 'lucide-react';
import ConfirmDialog from '@/app/components/ConfirmDialog';

export type ProductRow = {
  id: string;
  name: string;
  slug: string | null;
  price: number;
  currency: string;
  isPublished: boolean;
  isFeatured: boolean;
  isActive: boolean;
  stock: number;
  organization: { id: string; name: string; slug: string | null; isPublished: boolean; status: string | null };
  image: string | null;
};

export default function ProductsTable({
  products,
  canModerate,
  canFeature,
}: {
  products: ProductRow[];
  canModerate: boolean;
  canFeature: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'hidden' | 'featured' | 'flagged'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function act(id: string, action: string, extra: Record<string, unknown> = {}) {
    setBusyId(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
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

  async function confirmDelete(id: string) {
    setDeleteBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      setDeleteId(null);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleteBusy(false);
    }
  }

  // Client-side search and status filter mapping
  const filteredProducts = products.filter((p) => {
    const brandUnlisted = !p.organization.isPublished;
    const brandSuspended = p.organization.status === 'suspended';
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.organization.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.price.toString().includes(searchQuery);

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'published') return p.isPublished;
    if (statusFilter === 'hidden') return !p.isPublished;
    if (statusFilter === 'featured') return p.isFeatured;
    if (statusFilter === 'flagged') return brandUnlisted || brandSuspended;

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
      {/* Dynamic Alerts */}
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

      {/* Filter and Search Control Panel */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C7C83]" />
          <input
            type="text"
            placeholder="Search products by name, brand, price..."
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
          {(['all', 'published', 'hidden', 'featured', 'flagged'] as const).map((filter) => (
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
                {filter === 'flagged' ? 'warning' : filter}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Products Table Frame */}
      <div className="w-full overflow-x-auto pb-4">
        <table className="w-full text-left text-[13px] border-separate border-spacing-y-3">
          <thead className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7C7C83]">
            <tr>
              <th className="px-6 py-1 font-medium">Product</th>
              <th className="px-6 py-1 font-medium">Brand & Organization</th>
              <th className="px-6 py-1 font-medium">Price</th>
              <th className="px-6 py-1 font-medium">Status Indicators</th>
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
              {filteredProducts.map((p) => {
                const isBusy = busyId === p.id;
                const brandUnlisted = !p.organization.isPublished;
                const brandSuspended = p.organization.status === 'suspended';

                return (
                  <motion.tr
                    key={p.id}
                    variants={rowVariants}
                    layout="position"
                    className="group bg-[#0A0A0D]/50 backdrop-blur-sm transition-all duration-300 hover:bg-[#0A0A0D]/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                  >
                    <td className="absolute inset-0 pointer-events-none rounded-2xl border border-white/[0.04] group-hover:border-[#DFBA73]/20 transition-colors duration-300" />

                    {/* Image & Title details */}
                    <td className="relative px-6 py-4 rounded-l-2xl">
                      <div className="flex items-center gap-4">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-white/10 to-transparent p-[1px]">
                          <div className="absolute inset-0 rounded-xl bg-[#1a1a1f] m-[1px]" />
                          {p.image ? (
                            <motion.img
                              src={p.image}
                              alt=""
                              whileHover={{ scale: 1.08 }}
                              className="relative z-10 h-full w-full rounded-xl object-cover transition-transform duration-300"
                            />
                          ) : (
                            <div className="relative z-10 flex h-full w-full items-center justify-center rounded-xl bg-[#1a1a1f] text-[#7C7C83]">
                              <Package size={16} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-medium text-[#FAF9F6] transition-colors group-hover:text-[#DFBA73]">
                            {p.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Brand details */}
                    <td className="relative px-6 py-4">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1 text-[13px] text-[#FAF9F6] font-medium">
                          <Building2 size={12} className="text-[#7C7C83]" />
                          {p.organization.name}
                        </span>
                        
                        {/* Dynamic warning states if BOTH apply */}
                        <div className="flex flex-col gap-0.5 mt-1 font-mono">
                          {brandUnlisted && (
                            <span className="text-[9px] text-amber-400/80 uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle size={9} /> Brand Unlisted
                            </span>
                          )}
                          {brandSuspended && (
                            <span className="text-[9px] text-red-400/80 uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle size={9} /> Brand Suspended
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Currency and Price */}
                    <td className="relative px-6 py-4">
                      <p className="text-[14px] font-medium text-[#DFBA73]">
                        <span className="text-[10px] text-[#7C7C83] font-mono mr-1">{p.currency}</span>
                        {p.price.toLocaleString()}
                      </p>
                    </td>

                    {/* Non-Exclusive Status Badges (Displays all applicable simultaneously) */}
                    <td className="relative px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                        {/* Published Status Badge */}
                        {p.isPublished ? (
                          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            published
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 rounded-full border border-zinc-500/20 bg-zinc-500/10 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                            hidden
                          </span>
                        )}

                        {/* Featured Status Badge */}
                        {p.isFeatured && (
                          <span className="flex items-center gap-1 rounded-full border border-[#DFBA73]/30 bg-[#DFBA73]/10 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-[#DFBA73] shadow-[0_0_8px_rgba(223,186,115,0.15)]">
                            <Star size={9} className="fill-[#DFBA73]" /> featured
                          </span>
                        )}

                        {/* Store Warning Indicator */}
                        {(brandUnlisted || brandSuspended) && (
                          <span className="flex items-center gap-1 rounded-full border border-red-500/25 bg-red-500/5 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.05)]">
                            <AlertTriangle size={9} /> parent warning
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action Button Interface */}
                    <td className="relative px-6 py-4 rounded-r-2xl">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 md:opacity-50 md:group-hover:opacity-100 transition-opacity duration-300">
                        {/* Publish/Hide Action Trigger */}
                        {canModerate && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => act(p.id, 'publish', { published: !p.isPublished })}
                            disabled={isBusy}
                            title={p.isPublished ? "Unpublish Product" : "Publish Product"}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 disabled:opacity-40 ${
                              p.isPublished
                                ? 'bg-zinc-500/5 border-zinc-500/10 text-[#8E8E93] hover:text-zinc-300 hover:bg-zinc-500/10'
                                : 'bg-emerald-500/5 border-emerald-500/10 text-[#8E8E93] hover:text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {isBusy ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : p.isPublished ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </motion.button>
                        )}

                        {/* Feature/Unfeature Action Trigger */}
                        {canFeature && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => act(p.id, 'feature', { featured: !p.isFeatured })}
                            disabled={isBusy}
                            title={p.isFeatured ? "Unfeature" : "Feature on Discover"}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 disabled:opacity-40 ${
                              p.isFeatured
                                ? 'bg-zinc-500/5 border-zinc-500/10 text-[#8E8E93] hover:text-zinc-300 hover:bg-zinc-500/10'
                                : 'bg-[#DFBA73]/5 border-[#DFBA73]/10 text-[#8E8E93] hover:text-[#DFBA73] hover:bg-[#DFBA73]/10'
                            }`}
                          >
                            {isBusy ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : p.isFeatured ? (
                              <StarOff size={14} />
                            ) : (
                              <Star size={14} />
                            )}
                          </motion.button>
                        )}

                        {/* Delete Action Trigger */}
                        {canModerate && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setDeleteId(p.id)}
                            disabled={isBusy}
                            title="Delete product"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-500/10 bg-zinc-500/5 text-[#8E8E93] transition-all duration-200 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
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
                    <p className="text-[14px] font-medium text-[#FAF9F6]">No products found</p>
                    <p className="text-[11px] text-[#8E8E93] max-w-[280px]">
                      We couldn't find any products matching your current filters or query.
                    </p>
                  </div>
                </td>
              </motion.tr>
            )}
          </motion.tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        danger
        title="Delete product?"
        description={
          deleteId
            ? `"${products.find((p) => p.id === deleteId)?.name ?? 'This product'}" will be permanently removed. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        busy={deleteBusy}
        onConfirm={() => deleteId && confirmDelete(deleteId)}
        onCancel={() => !deleteBusy && setDeleteId(null)}
      />
    </div>
  );
}