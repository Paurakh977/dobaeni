'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bookmark } from 'lucide-react';
import ProductCard from '@/app/components/ProductCard';
import type { BoardDetail as BoardDetailType } from '@/lib/queries';

export default function BoardDetail({ board }: { board: BoardDetailType }) {
  const [items, setItems] = useState(board.items);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function remove(savedItemId: string, productId: string) {
    setBusyId(savedItemId);
    try {
      await fetch(`/api/boards/${board.id}/items?productId=${productId}`, { method: 'DELETE' });
      setItems((it) => it.filter((x) => x.id !== savedItemId));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <header className="mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#DFBA73]/80">board</p>
        <div className="mt-3 flex items-end justify-between">
          <h1 className="text-5xl font-light tracking-wide font-display text-[#FAF9F6]">{board.name}</h1>
          <span className="text-[12px] font-mono uppercase tracking-wider text-[#52525B]">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        </div>
        {board.description && (
          <p className="mt-2 max-w-lg text-[14px] font-light text-[#7C7C83]">{board.description}</p>
        )}
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.01] py-24 text-center">
          <Bookmark size={30} className="text-[#52525B]" />
          <p className="mt-4 text-[14px] text-[#7C7C83]">This board is empty. Save pieces from the discover feed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((it, i) => (
            <div key={it.id} className="group relative">
              <ProductCard product={it.product} index={i} />
              <button
                onClick={() => remove(it.id, it.product.id)}
                disabled={busyId === it.id}
                aria-label="Remove from board"
                className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/90 disabled:opacity-50"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
