'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, Check, Loader2, Plus, X } from 'lucide-react';

type BoardOption = {
  id: string;
  name: string;
  itemCount: number;
  hasItem: boolean;
};

export default function SaveToBoard({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [boards, setBoards] = useState<BoardOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  async function openModal() {
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch(`/api/boards?productId=${productId}`);
      const data = await res.json();
      setBoards(data.boards || []);
    } finally {
      setLoading(false);
    }
  }

  async function createBoard() {
    const name = newName.trim();
    if (!name) return;
    setBusyId('new');
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.board) {
        setBoards((b) => [...b, { ...data.board, itemCount: 0, hasItem: false }]);
        setNewName('');
      }
    } finally {
      setBusyId(null);
    }
  }

  async function toggleSave(board: BoardOption) {
    setBusyId(board.id);
    try {
      if (board.hasItem) {
        const res = await fetch(`/api/boards/${board.id}/items?productId=${productId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setBoards((b) =>
            b.map((x) =>
              x.id === board.id ? { ...x, hasItem: false, itemCount: Math.max(0, x.itemCount - 1) } : x,
            ),
          );
        }
      } else {
        const res = await fetch(`/api/boards/${board.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });
        if (res.ok) {
          setBoards((b) =>
            b.map((x) =>
              x.id === board.id ? { ...x, hasItem: true, itemCount: x.itemCount + 1 } : x,
            ),
          );
          setJustSaved(true);
          setTimeout(() => setJustSaved(false), 1500);
        }
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <button
        onClick={open ? () => setOpen(false) : openModal}
        data-cursor="hover"
        className="flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2.5 text-[11px] font-mono uppercase tracking-[0.2em] text-[#FAF9F6] transition-all hover:border-[#DFBA73]/40"
      >
        <Bookmark size={14} className={justSaved ? 'fill-[#DFBA73] text-[#DFBA73]' : ''} />
        {justSaved ? 'Saved' : 'Save'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#121215] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-light text-[#FAF9F6]">Save to board</h3>
                <button onClick={() => setOpen(false)} className="text-[#8E8E93] hover:text-[#FAF9F6]">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="New board name"
                  className="flex-1 rounded-xl border border-white/[0.08] bg-[#0E0E12] px-3 py-2.5 text-[13px] text-[#FAF9F6] outline-none placeholder:text-[#52525B] focus:border-[#DFBA73]/40"
                />
                <button
                  onClick={createBoard}
                  disabled={busyId === 'new' || !newName.trim()}
                  className="flex items-center gap-1 rounded-xl bg-[#DFBA73] px-3 py-2.5 text-[11px] font-mono uppercase tracking-wider text-[#08080a] transition-colors hover:bg-[#F0E2C3] disabled:opacity-50"
                >
                  {busyId === 'new' ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                </button>
              </div>

              <div className="mt-4 max-h-64 space-y-2 overflow-y-auto no-scrollbar">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-[#DFBA73]" size={20} />
                  </div>
                ) : boards.length === 0 ? (
                  <p className="py-8 text-center text-[12px] text-[#52525B]">
                    No boards yet. Create one above.
                  </p>
                ) : (
                  boards.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => toggleSave(b)}
                      disabled={busyId === b.id}
                      className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left transition-colors hover:border-[#DFBA73]/30"
                    >
                      <span>
                        <span className="block text-[13px] text-[#FAF9F6]">{b.name}</span>
                        <span className="block text-[10px] text-[#52525B]">
                          {b.itemCount} item{b.itemCount !== 1 ? 's' : ''}
                        </span>
                      </span>
                      {busyId === b.id ? (
                        <Loader2 className="animate-spin text-[#DFBA73]" size={16} />
                      ) : b.hasItem ? (
                        <Check size={16} className="text-[#DFBA73]" />
                      ) : (
                        <Plus size={16} className="text-[#8E8E93]" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
