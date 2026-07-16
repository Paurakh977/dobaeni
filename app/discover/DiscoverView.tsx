'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '@/app/components/ProductCard';
import type { ProductCardData } from '@/lib/types';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most loved' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

export default function DiscoverView({
  products,
  aesthetics,
}: {
  products: ProductCardData[];
  aesthetics: string[];
}) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('newest');
  const [aesthetic, setAesthetic] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = products;
    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.organization.name.toLowerCase().includes(query) ||
          p.styleKeywords.some((k) => k.toLowerCase().includes(query)),
      );
    }
    if (aesthetic) {
      list = list.filter((p) =>
        p.styleKeywords.some((k) => k.toLowerCase() === aesthetic.toLowerCase()),
      );
    }
    const sorted = [...list];
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    else if (sort === 'popular') sorted.sort((a, b) => b.soldCount - a.soldCount);
    return sorted;
  }, [products, q, sort, aesthetic]);

  return (
    <div>
      <header className="mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#DFBA73]/80">
          the feed
        </p>
        <h1 className="mt-3 text-5xl font-light tracking-wide font-display text-[#FAF9F6] md:text-6xl">
          Discover
        </h1>
        <p className="mt-3 max-w-md text-[14px] font-light text-[#7C7C83]">
          A living moodboard of independent brands. Find your next obsession.
        </p>
      </header>

      <div className="sticky top-0 z-20 -mx-6 mb-8 border-b border-white/[0.06] bg-[#08080a]/80 px-6 py-4 backdrop-blur-xl md:-mx-12 md:px-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525B]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, brands, aesthetics…"
              data-cursor="text"
              className="w-full rounded-full border border-white/[0.08] bg-white/[0.02] py-3 pl-11 pr-10 text-[13px] text-[#FAF9F6] outline-none transition-all placeholder:text-[#52525B] focus:border-[#DFBA73]/40"
            />
            {q && (
              <button
                onClick={() => setQ('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#52525B] hover:text-[#FAF9F6]"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-[#52525B]" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-[12px] font-mono uppercase tracking-wider text-[#FAF9F6] outline-none focus:border-[#DFBA73]/40"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value} className="bg-[#121215]">
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setAesthetic(null)}
            className={`rounded-full border px-4 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-all ${
              aesthetic === null
                ? 'border-[#DFBA73] bg-[#DFBA73] text-[#08080a]'
                : 'border-white/[0.08] text-[#8E8E93] hover:text-[#FAF9F6]'
            }`}
          >
            All
          </button>
          {aesthetics.map((a) => (
            <button
              key={a}
              onClick={() => setAesthetic(aesthetic === a ? null : a)}
              className={`rounded-full border px-4 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-all ${
                aesthetic === a
                  ? 'border-[#DFBA73] bg-[#DFBA73] text-[#08080a]'
                  : 'border-white/[0.08] text-[#8E8E93] hover:text-[#FAF9F6]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.01] py-24 text-center">
          <p className="text-[14px] text-[#7C7C83]">No pieces match your eye yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
