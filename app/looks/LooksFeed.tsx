'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Search, X } from 'lucide-react';
import LookCard from '@/app/components/look/LookCard';
import type { LookSummary } from '@/lib/types';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, filter: 'blur(3px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function LooksFeed({ looks }: { looks: LookSummary[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return looks;
    return looks.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.description ?? '').toLowerCase().includes(q),
    );
  }, [looks, query]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10">
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-4 border-b border-white/[0.05] pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-[0.3em] text-[#DFBA73]">
              <Sparkles size={11} /> Curated Styling
            </p>
            <h1 className="text-3xl font-light tracking-tight text-[#FAF9F6] md:text-4xl font-display">
              Shop the Look
            </h1>
            <p className="max-w-xl text-[13px] font-light leading-relaxed text-[#9A9AA0]">
              Explore styled sets from independent brands. Tap the points on any look to shop the exact pieces.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search size={13} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#52525B]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search looks…"
              className="w-full rounded-full border border-white/[0.07] bg-[#0A0A0D] py-2.5 pl-10 pr-9 text-[12px] text-[#FAF9F6] outline-none placeholder:text-[#3D3D45] focus:border-[#DFBA73]/40 transition-all focus:shadow-[0_0_14px_rgba(223,186,115,0.08)]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525B] hover:text-[#FAF9F6] transition-colors"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#8E8E93]">
          {filtered.length} styled {filtered.length === 1 ? 'set' : 'sets'}
        </p>
      </motion.div>

      {/* Grid */}
      {looks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/[0.06] bg-[#121215]/20 py-24 text-center text-[13px] text-[#8E8E93]">
          No looks have been published yet. Check back soon.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/[0.06] bg-[#121215]/20 py-24 text-center text-[13px] text-[#8E8E93]">
          No looks match your search.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((look, i) => (
            <LookCard key={look.id} look={look} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
