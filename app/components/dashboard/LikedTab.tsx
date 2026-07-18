'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import ProductCard from '@/app/components/ProductCard';
import type { ProductCardData } from '@/lib/types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

export default function LikedTab({ products }: { products: ProductCardData[] }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-[#DFBA73]/70 mb-2">Dashboard / Liked</p>
        <h1 className="text-3xl font-light tracking-wide">Liked Pieces</h1>
        <p className="mt-2 text-[13px] font-light text-[#52525B]">
          {products.length} {products.length === 1 ? 'piece' : 'pieces'} you&apos;ve hearted across Dobaeni.
        </p>
      </motion.div>

      {products.length === 0 ? (
        <div className="flex h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.05] bg-[#0E0E12]/30">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.02] border border-white/[0.04] mb-4">
            <Heart className="w-6 h-6 text-[#52525B]" />
          </div>
          <p className="text-[14px] text-[#7C7C83] font-light">No liked pieces yet.</p>
          <Link href="/discover" className="mt-4 rounded-full bg-[#DFBA73] px-5 py-2 text-[11px] font-mono uppercase tracking-widest text-[#08080a] transition-all hover:bg-[#F0E2C3] active:scale-95">
            Discover Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
