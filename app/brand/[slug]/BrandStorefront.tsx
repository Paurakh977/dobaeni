'use client';

import { BadgeCheck, Globe, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import SafeImage from '@/app/components/SafeImage';
import FollowButton from '@/app/components/FollowButton';
import ProductCard from '@/app/components/ProductCard';
import { TIER_BADGE, formatNumber } from '@/lib/format';
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
        <h2 className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#8E8E93]">
          Collection · {brand.products.length} pieces
        </h2>
        {brand.products.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.06] bg-[#121215]/20 py-20 text-center text-[13px] text-[#8E8E93] border-dashed">
            This brand hasn't listed any pieces yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {brand.products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
