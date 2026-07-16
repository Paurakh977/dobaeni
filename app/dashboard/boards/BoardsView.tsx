'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Bookmark, Loader2, X } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import type { BoardSummary } from '@/lib/types';

const TYPES = [
  { value: 'collection', label: 'Collection' },
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'inspo', label: 'Inspo' },
];

export default function BoardsView({ initialBoards }: { initialBoards: BoardSummary[] }) {
  const router = useRouter();
  const [boards, setBoards] = useState<BoardSummary[]>(initialBoards);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('collection');
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
      });
      const data = await res.json();
      if (res.ok && data.board) {
        router.push(`/dashboard/boards/${data.board.id}`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <header className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#DFBA73]/80">your collections</p>
          <h1 className="mt-3 text-5xl font-light tracking-wide font-display text-[#FAF9F6]">Boards</h1>
        </div>
        <button
          onClick={() => setCreating(true)}
          data-cursor="hover"
          className="flex items-center gap-2 rounded-2xl bg-[#DFBA73] px-5 py-3 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3]"
        >
          <Plus size={15} /> New board
        </button>
      </header>

      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-light text-[#FAF9F6]">Create a board</h3>
                <button onClick={() => setCreating(false)} className="text-[#8E8E93] hover:text-[#FAF9F6]">
                  <X size={18} />
                </button>
              </div>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Capsule"
                data-cursor="text"
                className="mt-4 w-full rounded-xl border border-white/[0.08] bg-[#0E0E12] px-4 py-3 text-[14px] text-[#FAF9F6] outline-none placeholder:text-[#52525B] focus:border-[#DFBA73]/40"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`rounded-full border px-4 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-all ${
                      type === t.value ? 'border-[#DFBA73] bg-[#DFBA73] text-[#08080a]' : 'border-white/[0.08] text-[#8E8E93]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                onClick={create}
                disabled={busy || !name.trim()}
                className="mt-5 flex items-center gap-2 rounded-2xl bg-[#DFBA73] px-6 py-3 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3] disabled:opacity-40"
              >
                {busy && <Loader2 size={14} className="animate-spin" />}
                Create
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.01] py-24 text-center">
          <Bookmark size={30} className="text-[#52525B]" />
          <p className="mt-4 text-[14px] text-[#7C7C83]">No boards yet. Save pieces into curated collections.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {boards.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
            >
              <Link href={`/dashboard/boards/${b.id}`} className="group block" data-cursor="hover">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E0E12]">
                  {b.coverImage ? (
                    <SafeImage src={b.coverImage} alt={b.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Bookmark size={28} className="text-[#3a3a40]" />
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <p className="truncate text-[13px] font-light text-[#FAF9F6]">{b.name}</p>
                  <p className="text-[10px] text-[#52525B]">{b.itemCount} item{b.itemCount !== 1 ? 's' : ''}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
