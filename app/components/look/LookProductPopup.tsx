'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import { formatPrice } from '@/lib/format';
import type { LookHotspotData } from '@/lib/types';

type Props = {
  hotspot: LookHotspotData;
  onClose: () => void;
};

export default function LookProductPopup({ hotspot, onClose }: Props) {
  const p = hotspot.product;

  return (
    <div className="relative w-44 overflow-hidden rounded-xl border border-white/10 bg-[#0B0B0F]/95 p-2.5 shadow-[0_24px_50px_rgba(0,0,0,0.85)] hover:border-white/20 transition-all duration-300">
      
      {/* Explicit "Cross Out" (Close) Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation(); // Prevents event bubbling
          e.preventDefault();
          onClose();
        }}
        className="absolute right-2 top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-white/40 hover:text-[#FAF9F6] hover:bg-white/5 transition-all focus:outline-none cursor-pointer"
        aria-label="Dismiss product view"
      >
        <X size={9} className="stroke-[2.5]" />
      </button>

      {/* Clickable Product Card Content */}
      <Link
        href={p.slug ? `/product/${p.slug}` : '#'}
        className="block group focus:outline-none"
      >
        {/* Product Image container */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-white/[0.02]">
          <SafeImage
            src={p.image ?? ''}
            alt={p.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>

        {/* Product Text Details */}
        <div className="mt-3.5 pb-1 text-center space-y-1">
          <h4 className="truncate text-[10px] font-light tracking-[0.2em] uppercase text-[#FAF9F6] group-hover:text-[#DFBA73] transition-colors duration-300 leading-tight">
            {p.name}
          </h4>
          <p className="text-[11px] font-mono font-medium text-[#DFBA73] tracking-wider">
            {formatPrice(p.price, p.currency)}
          </p>
        </div>
      </Link>
    </div>
  );
}