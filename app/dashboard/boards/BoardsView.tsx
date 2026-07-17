'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Bookmark, Loader2, X } from 'lucide-react';
import BoardCollagePreview from '@/app/components/BoardCollagePreview';
import type { BoardSummary } from '@/lib/types';

const TYPES = [
  { value: 'collection', label: 'Collection' },
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'inspo', label: 'Inspo' },
];

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
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

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
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10">
      <motion.header variants={itemVariants} className="flex items-end justify-between border-b border-white/[0.04] pb-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#DFBA73]/80">your collections</p>
          <h1 className="mt-3 text-5xl font-light tracking-wide font-display text-[#FAF9F6]">Boards</h1>
        </div>
        <button
          onClick={() => setCreating(true)}
          data-cursor="hover"
          className="flex items-center gap-2 rounded-full bg-[#DFBA73] px-5 py-3 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3] active:scale-95"
        >
          <Plus size={14} /> New board
        </button>
      </motion.header>

      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="rounded-3xl border border-white/[0.08] bg-[#121215]/60 backdrop-blur-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-light text-[#FAF9F6] font-display">Create a new board</h3>
                <button onClick={() => setCreating(false)} className="text-[#8E8E93] hover:text-[#FAF9F6] transition-colors p-1 rounded-full hover:bg-white/5">
                  <X size={16} />
                </button>
              </div>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Capsule"
                data-cursor="text"
                className="mt-5 w-full rounded-xl border border-white/[0.08] bg-[#0E0E12] px-4 py-3 text-[14px] text-[#FAF9F6] outline-none placeholder:text-[#52525B] focus:border-[#DFBA73]/40 transition-all focus:shadow-[0_0_12px_rgba(223,186,115,0.08)]"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`rounded-full border px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all active:scale-95 ${
                      type === t.value ? 'border-[#DFBA73] bg-[#DFBA73] text-[#08080a]' : 'border-white/[0.08] text-[#8E8E93] hover:text-[#FAF9F6] hover:border-white/20'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setCreating(false)}
                  className="rounded-full border border-white/[0.08] px-5 py-3 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#8E8E93] transition-all hover:text-[#FAF9F6] hover:border-white/20 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={create}
                  disabled={busy || !name.trim()}
                  className="flex items-center gap-2 rounded-full bg-[#DFBA73] px-6 py-3 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3] disabled:opacity-40 active:scale-95"
                >
                  {busy && <Loader2 size={13} className="animate-spin" />}
                  Create
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {boards.length === 0 ? (
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center rounded-3xl border border-white/[0.06] bg-[#121215]/20 py-24 text-center border-dashed">
          <Bookmark size={30} className="text-[#52525B]" />
          <p className="mt-4 text-[13px] text-[#8E8E93] font-light max-w-sm px-4">No boards yet. Save elements from the discover catalog to curate your aesthetic.</p>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {boards.map((b) => (
            <div key={b.id} className="group relative">
              <Link href={`/dashboard/boards/${b.id}`} className="block" data-cursor="hover">
                <div className="relative aspect-[4/5] w-full">
                  <BoardCollagePreview images={b.previewImages} name={b.name} />
                </div>
                <div className="mt-4">
                  <p className="truncate text-[14px] font-light text-[#FAF9F6] transition-colors group-hover:text-[#DFBA73] duration-300">{b.name}</p>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#52525B] mt-1">{b.itemCount} item{b.itemCount !== 1 ? 's' : ''}</p>
                </div>
              </Link>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
