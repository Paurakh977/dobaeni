'use client';

import { BadgeCheck, Globe, MapPin } from 'lucide-react';
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
    <div>
      {/* Banner */}
      <div className="relative -mx-6 -mt-28 h-56 overflow-hidden md:-mx-12">
        {brand.banner ? (
          <SafeImage src={brand.banner} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1a1a1f] via-[#0E0E12] to-[#08080a]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/40 to-transparent" />
      </div>

      <div className="relative -mt-16 flex flex-col gap-5 px-1 md:flex-row md:items-end md:justify-between">
        <div className="flex items-end gap-4">
          <div className="h-24 w-24 overflow-hidden rounded-3xl border-2 border-[#08080a] bg-[#0E0E12] shadow-xl">
            <SafeImage src={brand.logo} alt={brand.name} className="h-full w-full object-cover" />
          </div>
          <div className="pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-light tracking-wide font-display text-[#FAF9F6]">{brand.name}</h1>
              {brand.isVerified && <BadgeCheck size={18} className="text-[#DFBA73]" />}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[#7C7C83]">
              <span className="text-[#DFBA73]">{formatNumber(brand.followerCount)} followers</span>
              {brand.city && (
                <span className="flex items-center gap-1"><MapPin size={12} /> {brand.city}</span>
              )}
              {brand.businessType && <span>· {brand.businessType}</span>}
              {brand.websiteUrl && (
                <a href={brand.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#DFBA73]">
                  <Globe size={12} /> Site
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {tier && (
            <span className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-wider ${tier.className}`}>
              {tier.label}
            </span>
          )}
          <FollowButton
            orgId={brand.id}
            initialFollowing={initialFollowing}
            initialCount={initialFollowerCount}
          />
        </div>
      </div>

      {brand.description && (
        <p className="mt-6 max-w-2xl text-[14px] font-light leading-relaxed text-[#9A9AA0]">{brand.description}</p>
      )}

      <div className="mt-12">
        <h2 className="mb-6 text-[13px] font-mono uppercase tracking-widest text-[#7C7C83]">
          Collection · {brand.products.length} pieces
        </h2>
        {brand.products.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.01] py-20 text-center text-[14px] text-[#7C7C83]">
            This brand hasn't listed any pieces yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {brand.products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
