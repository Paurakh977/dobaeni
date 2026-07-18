'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BadgeCheck, MapPin, Star, ShoppingBag, Check } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import { formatNumber, TIER_BADGE } from '@/lib/format';
import type { FavBrand } from '@/lib/queries';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function FavBrandsTab({ brands }: { brands: FavBrand[] }) {
  if (brands.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-[#DFBA73]/70 mb-2">Dashboard / Fav Brands</p>
          <h1 className="text-3xl font-light tracking-wide">Favourite Brands</h1>
        </div>
        <div className="flex h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.05] bg-[#0E0E12]/30">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.02] border border-white/[0.04] mb-4">
            <Star className="w-6 h-6 text-[#52525B]" />
          </div>
          <p className="text-[14px] text-[#7C7C83] font-light">No favourite brands yet.</p>
          <p className="mt-1 text-[12px] text-[#52525B] font-light">Brands you buy from or follow will appear here.</p>
          <Link href="/brands" className="mt-4 rounded-full bg-[#DFBA73] px-5 py-2 text-[11px] font-mono uppercase tracking-widest text-[#08080a] transition-all hover:bg-[#F0E2C3] active:scale-95">
            Explore Brands
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item}>
        <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-[#DFBA73]/70 mb-2">Dashboard / Fav Brands</p>
        <h1 className="text-3xl font-light tracking-wide">Favourite Brands</h1>
        <p className="mt-2 text-[13px] font-light text-[#52525B]">
          {brands.length} {brands.length === 1 ? 'brand' : 'brands'} you&apos;ve bought from or follow.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => {
          const tier = TIER_BADGE[b.tier];
          return (
            <motion.div key={b.id} variants={item}>
              <Link
                href={b.slug ? `/brand/${b.slug}` : '#'}
                data-cursor="hover"
                className="group relative block overflow-hidden rounded-3xl border border-white/[0.06] bg-[#0E0E12]/60 transition-all duration-500 hover:border-[#DFBA73]/25 hover:shadow-[0_0_40px_rgba(223,186,115,0.06)]"
              >
                {/* Banner */}
                <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-[#1a1a1f] via-[#0E0E12] to-[#08080a]">
                  {b.banner ? (
                    <SafeImage src={b.banner} alt="" className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105" />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E12] via-[#0E0E12]/40 to-transparent" />
                  {/* Top gold accent */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#DFBA73]/50 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />
                </div>

                {/* Body */}
                <div className="relative px-5 pb-5">
                  {/* Logo overlapping banner */}
                  <div className="-mt-9 mb-3 h-16 w-16 overflow-hidden rounded-2xl border-2 border-[#0E0E12] bg-[#0E0E12] shadow-xl">
                    <SafeImage src={b.logo} alt={b.name} className="h-full w-full object-cover" />
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <h3 className="truncate text-[15px] font-light text-[#FAF9F6] transition-colors duration-300 group-hover:text-[#DFBA73]">
                        {b.name}
                      </h3>
                      {b.isVerified && <BadgeCheck size={14} className="shrink-0 text-[#DFBA73]" />}
                    </div>
                    {tier && (
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider ${tier.className}`}>
                        {tier.label}
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#8E8E93]">
                    <span className="text-[#DFBA73] font-bold">{formatNumber(b.followerCount)} followers</span>
                    {b.city && (
                      <span className="flex items-center gap-1"><MapPin size={10} />{b.city}</span>
                    )}
                    {b.businessType && <span>· {b.businessType}</span>}
                  </div>

                  {/* Preview strip */}
                  {b.previewImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {b.previewImages.slice(0, 4).map((src, i) => (
                        <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-white/[0.05] bg-[#0A0A0D]">
                          <SafeImage src={src} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer stats */}
                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.04] pt-4">
                    <div className="flex items-center gap-3 text-[11px] text-[#52525B]">
                      <span className="flex items-center gap-1"><ShoppingBag size={11} className="text-[#DFBA73]" />{b.productCount} items</span>
                      {b.ratingAvg > 0 && (
                        <span className="flex items-center gap-1"><Star size={11} className="text-[#DFBA73]" />{b.ratingAvg.toFixed(1)}</span>
                      )}
                    </div>
                    {b.isFollowing ? (
                      <span className="flex items-center gap-1 rounded-full border border-[#DFBA73]/30 bg-[#DFBA73]/10 px-2.5 py-1 text-[8px] font-mono uppercase tracking-wider text-[#DFBA73]">
                        <Check size={9} /> Following
                      </span>
                    ) : b.orderCount > 0 ? (
                      <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[8px] font-mono uppercase tracking-wider text-[#8E8E93]">
                        {b.orderCount} {b.orderCount === 1 ? 'order' : 'orders'}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
