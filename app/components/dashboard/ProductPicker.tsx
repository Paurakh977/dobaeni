'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import { formatPrice } from '@/lib/format';
import type { SellerProductView } from '@/lib/queries';

type Props = {
  products: SellerProductView[];
  excludeIds?: string[];
  onSelect: (p: SellerProductView) => void;
  onClose: () => void;
};

export default function ProductPicker({ products, excludeIds = [], onSelect, onClose }: Props) {
  const [q, setQ] = useState('');
  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);

  const list = useMemo(() => {
    const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return products
      .filter((p) => !excluded.has(p.id))
      .filter((p) => {
        if (tokens.length === 0) return true;
        const hay = `${p.name} ${p.category ?? ''} ${(p.styleKeywords || []).join(' ')}`.toLowerCase();
        return tokens.every((t) => hay.includes(t));
      });
  }, [products, excluded, q]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0E0E12] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/[0.04] px-6 py-4">
          <h3 className="text-base font-light font-display text-[#FAF9F6]">Select a product</h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#52525B] transition-all hover:bg-white/[0.04] hover:text-[#FAF9F6]"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="relative">
            <Search size={13} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#52525B]" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search your catalog…"
              className="w-full rounded-full border border-white/[0.07] bg-[#0A0A0D] py-2.5 pl-10 pr-4 text-[12px] text-[#FAF9F6] outline-none placeholder:text-[#3D3D45] focus:border-[#DFBA73]/40 transition-all"
            />
          </div>
        </div>

        <div className="mt-3 flex-1 space-y-1.5 overflow-y-auto px-4 pb-4">
          {list.length === 0 && (
            <p className="px-2 py-10 text-center text-[12px] text-[#52525B]">
              {excluded.size >= products.length ? 'All products are already tagged in this look.' : 'No products match your search.'}
            </p>
          )}
          {list.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-all hover:border-white/[0.08] hover:bg-white/[0.03]"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/[0.06] bg-black/30">
                <SafeImage src={p.image ?? ''} alt={p.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-[#FAF9F6]">{p.name}</p>
                <p className="mt-0.5 flex items-center gap-2 text-[11px] text-[#7C7C83]">
                  <span>{formatPrice(p.price, p.currency)}</span>
                  {p.category && <span className="text-[#3D3D45]">· {p.category}</span>}
                  {p.stock <= 0 && <span className="text-[#C9772E]">· Out of stock</span>}
                </p>
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] text-[#52525B] transition-all group-hover:border-[#DFBA73]/40 group-hover:bg-[#DFBA73]/10 group-hover:text-[#DFBA73]">
                <Check size={13} />
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
