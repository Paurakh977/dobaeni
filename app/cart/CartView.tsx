'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import { formatPrice } from '@/lib/format';
import type { CartItemData } from '@/lib/queries';

type Cart = { items: CartItemData[]; subtotal: number; count: number };

export default function CartView({ initialCart }: { initialCart: Cart }) {
  const router = useRouter();
  const [cart, setCart] = useState<Cart>(initialCart);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch('/api/cart');
    if (res.ok) setCart(await res.json());
  }

  async function setQty(item: CartItemData, q: number) {
    if (q < 1) return;
    setBusyId(item.id);
    try {
      await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, quantity: q }),
      });
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item: CartItemData) {
    setBusyId(item.id);
    try {
      await fetch(`/api/cart?itemId=${item.id}`, { method: 'DELETE' });
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  const shipping = cart.subtotal >= 2000 || cart.subtotal === 0 ? 0 : 120;
  const total = cart.subtotal + shipping;

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.01] py-24 text-center">
        <ShoppingBag size={32} className="text-[#52525B]" />
        <h2 className="mt-5 text-2xl font-light font-display text-[#FAF9F6]">Your cart is empty</h2>
        <p className="mt-2 text-[13px] text-[#7C7C83]">Pieces you save will appear here.</p>
        <Link
          href="/discover"
          className="mt-6 rounded-2xl bg-[#DFBA73] px-7 py-3 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3]"
        >
          Discover pieces
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#DFBA73]/80">your bag</p>
        <h1 className="mt-3 text-5xl font-light tracking-wide font-display text-[#FAF9F6]">Cart</h1>
        <p className="mt-2 text-[13px] text-[#7C7C83]">{cart.count} item{cart.count !== 1 ? 's' : ''}</p>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {cart.items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4"
              >
                <Link href={`/product/${item.slug}`} className="h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-[#0E0E12]" data-cursor="hover">
                  <SafeImage src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/product/${item.slug}`} className="text-[14px] font-light text-[#FAF9F6] hover:text-[#DFBA73]" data-cursor="hover">
                      {item.name}
                    </Link>
                    <button
                      onClick={() => remove(item)}
                      disabled={busyId === item.id}
                      className="text-[#52525B] transition-colors hover:text-red-400"
                      aria-label="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[#52525B]">
                    {item.size && <span>Size {item.size}</span>}
                    {item.color && <span>· {item.color}</span>}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center rounded-full border border-white/[0.08]">
                      <button
                        onClick={() => setQty(item, item.quantity - 1)}
                        disabled={busyId === item.id}
                        className="px-3 py-1.5 text-[#FAF9F6] hover:text-[#DFBA73]"
                        aria-label="Decrease"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-8 text-center text-[13px]">{item.quantity}</span>
                      <button
                        onClick={() => setQty(item, item.quantity + 1)}
                        disabled={busyId === item.id || item.quantity >= item.stock}
                        className="px-3 py-1.5 text-[#FAF9F6] hover:text-[#DFBA73] disabled:opacity-40"
                        aria-label="Increase"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <span className="text-[14px] text-[#DFBA73]">
                      {formatPrice(item.price * item.quantity, item.currency)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <aside className="h-fit rounded-3xl border border-white/[0.06] bg-white/[0.01] p-6 lg:sticky lg:top-28">
          <h2 className="text-[13px] font-mono uppercase tracking-widest text-[#7C7C83]">Summary</h2>
          <div className="mt-5 space-y-3 text-[13px]">
            <div className="flex justify-between text-[#9A9AA0]">
              <span>Subtotal</span>
              <span className="text-[#FAF9F6]">{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#9A9AA0]">
              <span>Shipping</span>
              <span className="text-[#FAF9F6]">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between border-t border-white/[0.06] pt-3 text-[15px]">
              <span className="text-[#FAF9F6]">Total</span>
              <span className="text-[#DFBA73]">{formatPrice(total)}</span>
            </div>
          </div>
          <button
            onClick={() => router.push('/checkout')}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#DFBA73] px-6 py-3.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3]"
          >
            Checkout <ArrowRight size={15} />
          </button>
          <Link
            href="/discover"
            className="mt-3 block text-center text-[11px] font-mono uppercase tracking-wider text-[#7C7C83] hover:text-[#DFBA73]"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
