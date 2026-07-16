'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, BadgeCheck, Users } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import { formatNumber } from '@/lib/format';
import type { BrandSummary } from '@/lib/queries';

export default function BrandsView({ brands }: { brands: BrandSummary[] }) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return brands;
    return brands.filter(
      (b) => b.name.toLowerCase().includes(query) || (b.description || '').toLowerCase().includes(query),
    );
  }, [brands, q]);

  return (
    <div>
      <header className="mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#DFBA73]/80">the houses</p>
        <h1 className="mt-3 text-5xl font-light tracking-wide font-display text-[#FAF9F6] md:text-6xl">Brands</h1>
        <p className="mt-3 max-w-md text-[14px] font-light text-[#7C7C83]">
          Independent labels shaping the Dobaeni aesthetic. Follow the ones you love.
        </p>
      </header>

      <div className="relative mb-8 max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525B]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search brands…"
          data-cursor="text"
          className="w-full rounded-full border border-white/[0.08] bg-white/[0.02] py-3 pl-11 pr-4 text-[13px] text-[#FAF9F6] outline-none placeholder:text-[#52525B] focus:border-[#DFBA73]/40"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.01] py-24 text-center text-[14px] text-[#7C7C83]">
          No brands match “{q}”.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
            >
              <Link href={`/brand/${b.slug}`} className="group block overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.01] transition-colors hover:border-white/15" data-cursor="hover">
                <div className="relative h-32 overflow-hidden bg-[#0E0E12]">
                  {b.banner ? (
                    <SafeImage src={b.banner} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#1a1a1f] to-[#0E0E12]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E12] to-transparent" />
                </div>
                <div className="px-5 pb-5">
                  <div className="-mt-8 flex items-end gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-[#0E0E12] bg-[#0E0E12]">
                      <SafeImage src={b.logo} alt={b.name} className="h-full w-full object-cover" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="text-[15px] font-light text-[#FAF9F6]">{b.name}</span>
                    {b.isVerified && <BadgeCheck size={14} className="text-[#DFBA73]" />}
                  </div>
                  {b.description && (
                    <p className="mt-1 line-clamp-2 text-[12px] text-[#7C7C83]">{b.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-[11px] text-[#52525B]">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {formatNumber(b.followerCount)} followers
                    </span>
                    <span>{b.productCount} products</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
