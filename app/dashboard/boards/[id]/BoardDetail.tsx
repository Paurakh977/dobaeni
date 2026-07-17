'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bookmark, ArrowLeft, Layers } from 'lucide-react';
import Link from 'next/link';
import ProductCard from '@/app/components/ProductCard';
import type { BoardDetail as BoardDetailType } from '@/lib/queries';

/* ─── Animation variants ─────────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const },
  },
};

/* ─── Board type metadata ────────────────────────────────────────────── */
const BOARD_META: Record<string, { accent: string; badgeCls: string }> = {
  collection: { accent: "from-[#DFBA73]/40 to-[#C9A24B]/20",  badgeCls: "bg-[#DFBA73]/10 text-[#DFBA73] border-[#DFBA73]/20" },
  wishlist:   { accent: "from-pink-400/40 to-rose-400/20",     badgeCls: "bg-pink-500/10 text-pink-300 border-pink-500/20" },
  inspo:      { accent: "from-violet-400/40 to-indigo-400/20", badgeCls: "bg-violet-500/10 text-violet-300 border-violet-500/20" },
};

export default function BoardDetail({ board }: { board: BoardDetailType }) {
  const [items, setItems] = useState(board.items);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function remove(savedItemId: string, productId: string) {
    setBusyId(savedItemId);
    try {
      await fetch(`/api/boards/${board.id}/items?productId=${productId}`, { method: 'DELETE' });
      setItems((it) => it.filter((x) => x.id !== savedItemId));
    } finally {
      setBusyId(null);
    }
  }

  const meta = BOARD_META[(board as any).type ?? 'collection'] ?? BOARD_META.collection;
  const typeLabel = ((board as any).type ?? 'Collection');

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10">

      {/* ── Hero header ─────────────────────────────────────────────── */}
      <motion.header variants={itemVariants} className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#0E0E12] via-[#121215] to-[#0A0A0D] p-8 md:p-10">
        {/* Ambient orbs */}
        <div className={`pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br ${meta.accent} blur-[100px] opacity-60`} />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-[#6B3FA0]/[0.04] blur-[80px]" />

        {/* Top accent line */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${meta.accent}`} />

        <div className="relative">
          {/* Back + breadcrumb */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/dashboard/boards"
              className="group flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#52525B] transition-colors hover:text-[#FAF9F6]"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              Boards
            </Link>
            <span className="text-[#3D3D45]">/</span>
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#DFBA73]/70 truncate max-w-[200px]">
              {board.name}
            </span>
          </div>

          {/* Board info */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <p className="text-[10px] font-mono uppercase tracking-[0.45em] text-[#DFBA73]/70">Your Board</p>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider capitalize ${meta.badgeCls}`}>
                  {typeLabel}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-light tracking-wide font-display text-[#FAF9F6] leading-none">
                {board.name}
              </h1>
              {board.description && (
                <p className="mt-3 max-w-lg text-[14px] font-light leading-relaxed text-[#52525B]">
                  {board.description}
                </p>
              )}
            </div>

            {/* Item count badge */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm px-4 py-3">
                <Layers className="w-4 h-4 text-[#DFBA73]/60" />
                <div>
                  <p className="text-[18px] font-light text-[#FAF9F6] tabular-nums leading-none">{items.length}</p>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-[#52525B] mt-0.5">
                    {items.length === 1 ? 'Item' : 'Items'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ── Content ──────────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.06] bg-[#0E0E12]/20 py-28 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.02] border border-white/[0.04] mb-5">
            <Bookmark size={26} className="text-[#52525B]" />
          </div>
          <p className="text-[15px] text-[#8E8E93] font-light">This board is empty</p>
          <p className="mt-2 max-w-sm text-[13px] text-[#52525B] font-light leading-relaxed px-4">
            Save pieces from the discover catalog to build your aesthetic collection.
          </p>
          <Link
            href="/discover"
            className="mt-6 rounded-full bg-[#DFBA73] px-6 py-2.5 text-[11px] font-mono uppercase tracking-widest text-[#08080a] transition-all hover:bg-[#F0E2C3] hover:shadow-[0_0_20px_rgba(223,186,115,0.25)] active:scale-95"
          >
            Discover
          </Link>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} layout>
          <AnimatePresence mode="popLayout">
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
              {items.map((it, i) => (
                <motion.div
                  key={it.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 18 }}
                  animate={{ opacity: 1, scale: 1,    y: 0 }}
                  exit={{   opacity: 0, scale: 0.9,   y: 10, filter: 'blur(4px)' }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.04 }}
                  className="group relative break-inside-avoid mb-4"
                >
                  <ProductCard product={it.product} index={i} />

                  {/* Premium remove button */}
                  <button
                    onClick={() => remove(it.id, it.product.id)}
                    disabled={busyId === it.id}
                    aria-label="Remove from board"
                    className="absolute right-2.5 top-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white opacity-0 backdrop-blur-md transition-all duration-200 group-hover:opacity-100 hover:border-red-400/40 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-40 hover:scale-110 active:scale-95"
                  >
                    {busyId === it.id ? (
                      <span className="h-2.5 w-2.5 rounded-full border border-current border-t-transparent animate-spin" />
                    ) : (
                      <X size={11} />
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
