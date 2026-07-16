'use client';

import { useState } from 'react';
import { Check, Loader2, ShoppingBag } from 'lucide-react';

export default function AddToCartButton({
  productId,
  size = null,
  color = null,
  quantity = 1,
  variant = 'solid',
  label = 'Add to Cart',
  onDone,
  className = '',
}: {
  productId: string;
  size?: string | null;
  color?: string | null;
  quantity?: number;
  variant?: 'solid' | 'outline';
  label?: string;
  onDone?: () => void;
  className?: string;
}) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [err, setErr] = useState<string | null>(null);

  async function add() {
    setState('busy');
    setErr(null);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, size, color, quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add');
      setState('done');
      onDone?.();
      setTimeout(() => setState('idle'), 1300);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
      setState('error');
      setTimeout(() => setState('idle'), 2500);
    }
  }

  const base =
    variant === 'solid'
      ? 'bg-[#DFBA73] text-[#08080a] hover:bg-[#F0E2C3]'
      : 'border border-[#DFBA73]/40 text-[#DFBA73] hover:bg-[#DFBA73]/10';
  const disabled = state === 'busy';

  return (
    <div className={className}>
      <button
        onClick={add}
        disabled={disabled}
        data-cursor="hover"
        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-60 ${base}`}
      >
        {state === 'busy' && <Loader2 size={15} className="animate-spin" />}
        {state === 'done' && <Check size={15} />}
        {state === 'idle' && <ShoppingBag size={15} />}
        {state === 'done' ? 'Added' : label}
      </button>
      {err && <p className="mt-2 text-center text-[11px] text-red-400">{err}</p>}
    </div>
  );
}
