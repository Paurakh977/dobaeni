'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import SafeImage from './SafeImage';
import { StarRating } from './StarRating';
import { formatPrice, discountPercent } from '@/lib/format';
import type { ProductCardData } from '@/lib/types';

export default function ProductCard({
  product,
  index = 0,
}: {
  product: ProductCardData;
  index?: number;
}) {
  const disc = discountPercent(product.price, product.compareAtPrice);
  const href = product.slug ? `/product/${product.slug}` : `/product/${product.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.035, 0.35), ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={href} className="group block" data-cursor="hover">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E0E12]">
          <SafeImage
            src={product.images[0] ?? null}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          {disc != null && (
            <span className="absolute left-3 top-3 rounded-full bg-[#DFBA73] px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#08080a]">
              {disc}% off
            </span>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[11px] text-[#8E8E93]">
              {product.organization.name}
            </span>
            {product.organization.isVerified && (
              <BadgeCheck size={12} className="shrink-0 text-[#DFBA73]" />
            )}
          </div>
          <h3 className="mt-0.5 truncate text-[13px] font-light text-[#FAF9F6]">
            {product.name}
          </h3>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-[13px] text-[#DFBA73]">
              {formatPrice(product.price, product.currency)}
            </span>
            {product.compareAtPrice && (
              <span className="text-[11px] text-[#52525B] line-through">
                {formatPrice(product.compareAtPrice, product.currency)}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-[#52525B]">
            <StarRating value={product.ratingAvg} size={11} />
            <span>{product.ratingCount || 0}</span>
            {product.soldCount > 0 && <span>· {product.soldCount} sold</span>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
