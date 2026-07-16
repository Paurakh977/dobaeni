'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Loader2, Plus, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import type { CartItemData } from '@/lib/queries';

type Address = {
  id: string;
  label: string | null;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  isDefault?: boolean | null;
};

const METHODS = [
  { value: 'cod', label: 'Cash on Delivery', icon: Banknote },
  { value: 'esewa', label: 'eSewa', icon: Smartphone },
  { value: 'khalti', label: 'Khalti', icon: Smartphone },
  { value: 'bank', label: 'Bank Transfer', icon: CreditCard },
];

export default function CheckoutView({
  cart,
  addresses,
}: {
  cart: { items: CartItemData[]; subtotal: number; count: number };
  addresses: Address[];
}) {
  const router = useRouter();
  const [selectedAddr, setSelectedAddr] = useState<string>(addresses[0]?.id ?? 'new');
  const [method, setMethod] = useState('cod');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({ recipientName: '', phone: '', line1: '', city: '' });

  const shipping = cart.subtotal >= 2000 || cart.subtotal === 0 ? 0 : 120;
  const total = cart.subtotal + shipping;

  async function placeOrder() {
    setBusy(true);
    setErr(null);
    try {
      let addressId: string | null = null;
      if (selectedAddr === 'new') {
        if (!form.recipientName || !form.phone || !form.line1 || !form.city) {
          throw new Error('Please fill in your shipping address');
        }
        const res = await fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Address failed');
        addressId = data.address.id;
      } else {
        addressId = selectedAddr;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: method, addressId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order failed');
      router.push('/orders?placed=1');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong');
      setBusy(false);
    }
  }

  return (
    <div>
      <header className="mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#DFBA73]/80">secure</p>
        <h1 className="mt-3 text-5xl font-light tracking-wide font-display text-[#FAF9F6]">Checkout</h1>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          {/* Address */}
          <section>
            <h2 className="mb-4 text-[13px] font-mono uppercase tracking-widest text-[#7C7C83]">Shipping address</h2>
            <div className="space-y-3">
              {addresses.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAddr(a.id)}
                  data-cursor="hover"
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                    selectedAddr === a.id ? 'border-[#DFBA73] bg-[#DFBA73]/5' : 'border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <span className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${selectedAddr === a.id ? 'border-[#DFBA73] bg-[#DFBA73]' : 'border-white/30'}`}>
                    {selectedAddr === a.id && <Check size={10} className="text-[#08080a]" />}
                  </span>
                  <span className="text-[13px]">
                    <span className="text-[#FAF9F6]">{a.recipientName}</span>
                    <span className="block text-[11px] text-[#7C7C83]">{a.line1}{a.city ? `, ${a.city}` : ''} · {a.phone}</span>
                  </span>
                </button>
              ))}

              <button
                onClick={() => setSelectedAddr('new')}
                data-cursor="hover"
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                  selectedAddr === 'new' ? 'border-[#DFBA73] bg-[#DFBA73]/5' : 'border-white/[0.08] hover:border-white/20'
                }`}
              >
                <Plus size={16} className="text-[#DFBA73]" />
                <span className="text-[13px] text-[#FAF9F6]">Use a new address</span>
              </button>

              {selectedAddr === 'new' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4 sm:grid-cols-2">
                  <input placeholder="Recipient name" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} className={inputCls} />
                  <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
                  <input placeholder="Address line 1" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} className={`${inputCls} sm:col-span-2`} />
                  <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
                </motion.div>
              )}
            </div>
          </section>

          {/* Payment */}
          <section>
            <h2 className="mb-4 text-[13px] font-mono uppercase tracking-widest text-[#7C7C83]">Payment method</h2>
            <div className="grid grid-cols-2 gap-3">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  data-cursor="hover"
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                    method === m.value ? 'border-[#DFBA73] bg-[#DFBA73]/5' : 'border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <m.icon size={18} className={method === m.value ? 'text-[#DFBA73]' : 'text-[#8E8E93]'} />
                  <span className="text-[13px] text-[#FAF9F6]">{m.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-3xl border border-white/[0.06] bg-white/[0.01] p-6 lg:sticky lg:top-28">
          <h2 className="text-[13px] font-mono uppercase tracking-widest text-[#7C7C83]">Order summary</h2>
          <div className="mt-4 space-y-3 border-b border-white/[0.06] pb-4">
            {cart.items.map((it) => (
              <div key={it.id} className="flex justify-between text-[12px]">
                <span className="text-[#9A9AA0]">{it.name} × {it.quantity}</span>
                <span className="text-[#FAF9F6]">{formatPrice(it.price * it.quantity, it.currency)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-3 text-[13px]">
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
            onClick={placeOrder}
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#DFBA73] px-6 py-3.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3] disabled:opacity-60"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {busy ? 'Placing…' : 'Place order'}
          </button>
          {err && <p className="mt-3 text-center text-[12px] text-red-400">{err}</p>}
        </aside>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-white/[0.08] bg-[#0E0E12] px-4 py-3 text-[13px] text-[#FAF9F6] outline-none placeholder:text-[#52525B] focus:border-[#DFBA73]/40';
