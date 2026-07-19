'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  const confirmCls = danger
    ? 'bg-red-500/90 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.25)]'
    : 'bg-[#DFBA73] hover:bg-[#F0E2C3] text-[#08080a] shadow-[0_0_20px_rgba(223,186,115,0.25)]';

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => !busy && onCancel()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0E0E12]/90 backdrop-blur-2xl p-6 shadow-2xl"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#DFBA73]/[0.06] blur-3xl" />

            <div className="relative flex items-start gap-4">
              {danger && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle size={16} className="text-red-400" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-[16px] font-light font-display text-[#FAF9F6]">{title}</h3>
                {description && (
                  <p className="mt-1.5 text-[12px] font-light leading-relaxed text-[#7C7C83]">{description}</p>
                )}
              </div>
            </div>

            <div className="relative mt-6 flex justify-end gap-3">
              <button
                onClick={onCancel}
                disabled={busy}
                data-cursor="hover"
                className="rounded-full border border-white/[0.07] px-5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#52525B] transition-all hover:text-[#FAF9F6] hover:border-white/20 active:scale-95 disabled:opacity-40"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={busy}
                data-cursor="hover"
                className={`flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-40 ${confirmCls}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
