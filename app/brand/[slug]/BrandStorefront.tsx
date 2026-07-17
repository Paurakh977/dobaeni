'use client';

import { useState, useMemo, useEffect } from 'react';
import { BadgeCheck, Globe, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeImage from '@/app/components/SafeImage';
import FollowButton from '@/app/components/FollowButton';
import ProductCard from '@/app/components/ProductCard';
import { TIER_BADGE, formatNumber, AESTHETICS } from '@/lib/format';
import type { ProductCardData } from '@/lib/types';

type Brand = {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
  banner: string | null;
  isVerified: boolean;
  tier: string;
  city: string | null;
  followerCount: number;
  description: string | null;
  contactEmail: string | null;
  businessType: string | null;
  websiteUrl: string | null;
  products: ProductCardData[];
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
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

export default function BrandStorefront({
  brand,
  initialFollowing,
  initialFollowerCount,
}: {
  brand: Brand;
  initialFollowing: boolean;
  initialFollowerCount: number;
}) {
  const tier = TIER_BADGE[brand.tier];

  /* Reset scroll to top when the storefront mounts (route change) */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [brand.id]);

  /* Search + filter state */
  const [query, setQuery]           = useState('');
  const [category, setCategory]     = useState<string | null>(null);
  const [aesthetic, setAesthetic]   = useState<string | null>(null);
  const [maxPrice, setMaxPrice]     = useState<number | null>(null);

  const categories = Array.from(new Set(brand.products.map((p) => p.category).filter(Boolean))) as string[];
  const priceCeil = useMemo(
    () => brand.products.reduce((m, p) => Math.max(m, p.price), 0),
    [brand.products],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return brand.products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !(p.category ?? '').toLowerCase().includes(q)) return false;
      if (category && p.category !== category) return false;
      if (aesthetic && !(p.styleKeywords || []).includes(aesthetic)) return false;
      if (maxPrice != null && p.price > maxPrice) return false;
      return true;
    });
  }, [brand.products, query, category, aesthetic, maxPrice]);

  const hasFilters = !!query || !!category || !!aesthetic || maxPrice != null;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-12">
      {/* Banner */}
      <div className="relative -mx-6 -mt-28 h-64 overflow-hidden md:-mx-12">
        <motion.div
          initial={{ scale: 1.12, filter: 'blur(3px)' }}
          animate={{ scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-full w-full"
        >
          {brand.banner ? (
            <SafeImage src={brand.banner} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#1a1a1f] via-[#0E0E12] to-[#08080a]" />
          )}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/35 to-transparent" />
      </div>

      <motion.div variants={itemVariants} className="relative -mt-20 flex flex-col gap-6 px-1 md:flex-row md:items-end md:justify-between border-b border-white/[0.04] pb-6">
        <div className="flex flex-wrap items-end gap-5">
          <div className="h-24 w-24 overflow-hidden rounded-3xl border-2 border-[#08080a] bg-[#0E0E12] shadow-xl relative z-10">
            <SafeImage src={brand.logo} alt={brand.name} className="h-full w-full object-cover" />
          </div>
          <div className="pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-light tracking-wide font-display text-[#FAF9F6]">{brand.name}</h1>
              {brand.isVerified && <BadgeCheck size={18} className="text-[#DFBA73]" />}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#8E8E93] font-mono uppercase tracking-wider">
              <span className="text-[#DFBA73] font-bold">{formatNumber(brand.followerCount)} followers</span>
              {brand.city && (
                <span className="flex items-center gap-1"><MapPin size={11} className="text-[#8E8E93]" /> {brand.city}</span>
              )}
              {brand.businessType && <span>· {brand.businessType}</span>}
              {brand.websiteUrl && (
                <a href={brand.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#8E8E93] hover:text-[#DFBA73] transition-colors">
                  <Globe size={11} /> Site
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {tier && (
            <span className={`rounded-full border px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider ${tier.className}`}>
              {tier.label}
            </span>
          )}
          <FollowButton
            orgId={brand.id}
            initialFollowing={initialFollowing}
            initialCount={initialFollowerCount}
          />
        </div>
      </motion.div>

      {brand.description && (
        <motion.p variants={itemVariants} className="max-w-2xl text-[14px] font-light leading-relaxed text-[#9A9AA0]">
          {brand.description}
        </motion.p>
      )}

      <motion.div variants={itemVariants} className="space-y-6 pt-4">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#8E8E93]">
              Collection · {filtered.length} pieces
            </h2>
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search size={13} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#52525B]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the collection…"
                className="w-full rounded-full border border-white/[0.07] bg-[#0A0A0D] py-2.5 pl-10 pr-4 text-[12px] text-[#FAF9F6] outline-none placeholder:text-[#3D3D45] focus:border-[#DFBA73]/40 transition-all focus:shadow-[0_0_14px_rgba(223,186,115,0.08)]"
              />
            </div>
          </div>

          {/* Filter chips */}
          {brand.products.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((c) => (
                <BrandFilterChip key={c} active={category === c} label={c} onClick={() => setCategory(category === c ? null : c)} />
              ))}
              {aesthetic && <BrandFilterChip active label={aesthetic} onClick={() => setAesthetic(null)} onRemove={() => setAesthetic(null)} />}
              {!aesthetic && (
                <div className="relative">
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) setAesthetic(e.target.value); }}
                    className="appearance-none rounded-full border border-dashed border-white/[0.08] bg-white/[0.02] py-1.5 pl-3 pr-7 text-[10px] font-mono uppercase tracking-wider text-[#7C7C83] outline-none hover:text-[#FAF9F6] hover:border-[#DFBA73]/30 transition-all cursor-pointer"
                  >
                    <option value="" className="bg-[#0E0E12]">+ Aesthetic</option>
                    {AESTHETICS.map((a) => (
                      <option key={a} value={a} className="bg-[#0E0E12]">{a}</option>
                    ))}
                  </select>
                  <SlidersHorizontal size={10} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#52525B]" />
                </div>
              )}
              {/* Price cap */}
              <div className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] py-1.5 pl-3 pr-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7C7C83]">Max</span>
                <input
                  type="range"
                  min={0}
                  max={priceCeil}
                  step={Math.max(1, Math.round(priceCeil / 50))}
                  value={maxPrice ?? priceCeil}
                  onChange={(e) => setMaxPrice(Number(e.target.value) >= priceCeil ? null : Number(e.target.value))}
                  className="accent-[#DFBA73] h-1 w-24 cursor-pointer"
                />
                <span className="text-[10px] font-mono text-[#DFBA73] tabular-nums w-16 text-right">
                  {maxPrice != null ? `NPR ${maxPrice}` : 'Any'}
                </span>
              </div>
              {hasFilters && (
                <button
                  onClick={() => { setQuery(''); setCategory(null); setAesthetic(null); setMaxPrice(null); }}
                  className="flex items-center gap-1 rounded-full border border-white/[0.07] px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#52525B] transition-all hover:text-[#FAF9F6] hover:border-white/20 active:scale-95"
                >
                  <X size={10} /> Clear
                </button>
              )}
            </div>
          )}
        </div>

        {brand.products.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.06] bg-[#121215]/20 py-20 text-center text-[13px] text-[#8E8E93] border-dashed">
            This brand hasn't listed any pieces yet.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.06] bg-[#121215]/20 py-20 text-center text-[13px] text-[#8E8E93] border-dashed">
            No pieces match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─── BrandFilterChip ────────────────────────────────────────────────── */
function BrandFilterChip({ active, label, onClick, onRemove }: { active: boolean; label: string; onClick: () => void; onRemove?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all active:scale-95 ${active ? 'border-[#DFBA73]/40 bg-[#DFBA73]/12 text-[#DFBA73]' : 'border-white/[0.07] text-[#7C7C83] hover:text-[#FAF9F6] hover:border-white/20'}`}
    >
      {label}
      {active && onRemove && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 -mr-1 rounded-full p-0.5 text-[#DFBA73]/60 hover:text-[#DFBA73] hover:bg-white/10"
        >
          <X size={9} />
        </span>
      )}
    </button>
  );
}
