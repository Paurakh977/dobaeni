'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Sparkles, Eye, EyeOff, Layers, Loader2 } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import LookEditor from '@/app/components/dashboard/LookEditor';
import { formatPrice } from '@/lib/format';
import type { LookSummary } from '@/lib/types';
import type { SellerProductView } from '@/lib/queries';

type Props = {
  looks: LookSummary[];
  products: SellerProductView[];
  onChanged: () => void;
};

export default function LooksTab({ looks, products, onChanged }: Props) {
  const router = useRouter();
  const [editorLook, setEditorLook] = useState<import('@/lib/types').LookDetail | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const editing = editorLook ?? (creating ? null : undefined);

  async function deleteLook(id: string) {
    if (!confirm('Delete this look? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/looks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      onChanged();
    } catch {
      setDeletingId(null);
    }
  }

  async function openEdit(l: LookSummary) {
    setLoadingId(l.id);
    try {
      const res = await fetch(`/api/looks/${l.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to load look');
      setCreating(false);
      setEditorLook(data.look);
    } catch {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6B6B72]">
          {looks.length} look{looks.length === 1 ? '' : 's'}
        </p>
        <button
          onClick={() => {
            setEditorLook(null);
            setCreating(true);
          }}
          className="flex items-center gap-2 rounded-full bg-[#DFBA73] px-5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3] hover:shadow-[0_0_20px_rgba(223,186,115,0.25)] active:scale-95"
        >
          <Plus size={13} /> Add look
        </button>
      </div>

      {looks.length === 0 && !creating && (
        <div className="rounded-3xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#DFBA73]/20 bg-[#DFBA73]/[0.04] text-[#DFBA73]">
            <Layers size={22} />
          </div>
          <h4 className="text-lg font-light font-display text-[#FAF9F6]">No looks yet</h4>
          <p className="mx-auto mt-2 max-w-sm text-[12px] text-[#7C7C83]">
            Create a shoppable look — upload a styled image and tag each piece so buyers can shop
            the whole outfit or individual items.
          </p>
          <button
            onClick={() => {
              setEditorLook(null);
              setCreating(true);
            }}
            className="mx-auto mt-5 flex items-center gap-2 rounded-full border border-[#DFBA73]/30 px-5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#DFBA73] transition-all hover:bg-[#DFBA73]/10 active:scale-95"
          >
            <Plus size={13} /> Create your first look
          </button>
        </div>
      )}

      {looks.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {looks.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.5, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="group overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E0E12] transition-all hover:border-white/[0.12]"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-black/30">
                <SafeImage
                  src={l.coverImage}
                  alt={l.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Hotspot count badge */}
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider text-[#FAF9F6] backdrop-blur-sm">
                  <Sparkles size={10} className="text-[#DFBA73]" />
                  {l.hotspotCount} item{l.hotspotCount === 1 ? '' : 's'}
                </span>
                {/* Status */}
                <span
                  className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider backdrop-blur-sm ${
                    l.isPublished
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                      : 'border-white/10 bg-black/60 text-[#7C7C83]'
                  }`}
                >
                  {l.isPublished ? <Eye size={10} /> : <EyeOff size={10} />}
                  {l.isPublished ? 'Live' : 'Draft'}
                </span>
                {/* Hover actions */}
                <div className="absolute inset-x-0 bottom-0 flex translate-y-2 gap-2 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(l)}
                    disabled={loadingId === l.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#DFBA73] py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#08080a] transition-all hover:bg-[#F0E2C3] active:scale-95 disabled:opacity-60"
                  >
                    {loadingId === l.id ? <Loader2 size={11} className="animate-spin" /> : <Pencil size={11} />} Edit
                  </button>
                  <button
                    onClick={() => deleteLook(l.id)}
                    disabled={deletingId === l.id}
                    className="flex items-center justify-center rounded-full border border-white/10 bg-black/50 px-3 py-2 text-[#F87171] transition-all hover:bg-red-500/15 active:scale-95 disabled:opacity-40"
                    aria-label="Delete look"
                  >
                    {deletingId === l.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 p-4">
                <h4 className="truncate text-[14px] font-light text-[#FAF9F6]">{l.title}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#7C7C83]">
                    Items: <span className="text-[#FAF9F6]">{formatPrice(l.totalPrice)}</span>
                  </span>
                  {l.bundleDiscount ? (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-emerald-400">
                      Save {l.bundleDiscount}%
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#52525B]">
                      {l.viewCount} views
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {editing !== undefined && (creating || editorLook) && (
              <div className="fixed inset-0 z-40 overflow-y-auto bg-black/60 p-4 backdrop-blur-sm md:p-8">
                <div className="mx-auto max-w-5xl">
                  <LookEditor
                    look={editorLook}
                    products={products}
                    onClose={() => {
                      setCreating(false);
                      setEditorLook(null);
                    }}
                    onSaved={() => {
                      setCreating(false);
                      setEditorLook(null);
                      onChanged();
                    }}
                  />
                </div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
