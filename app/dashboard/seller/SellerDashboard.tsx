'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, Megaphone, Plus, Loader2,
  Pencil, Trash2, X, Check, Eye, EyeOff, Lock,
} from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import ImageUpload from '@/app/components/ImageUpload';
import { formatPrice, formatDate, formatNumber } from '@/lib/format';
import type { SellerStats, SellerProductView, OrderView } from '@/lib/queries';

type Promotion = {
  id: string;
  title: string;
  type: string;
  status: string | null;
  budget: number | null;
  startDate: string | null;
  endDate: string | null;
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'promotions', label: 'Promotions', icon: Megaphone },
];

const ORDER_STATUSES = ['pending', 'processing', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'];

export default function SellerDashboard({
  orgName,
  analyticsLocked,
  suspended,
  stats,
  products,
  orders,
  promotions,
}: {
  orgName: string;
  analyticsLocked: boolean;
  suspended: boolean;
  stats: SellerStats;
  products: SellerProductView[];
  orders: OrderView[];
  promotions: Promotion[];
}) {
  const [tab, setTab] = useState('overview');

  return (
    <div>
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#DFBA73]/80">brand studio</p>
          <h1 className="mt-3 text-4xl font-light tracking-wide font-display text-[#FAF9F6]">{orgName}</h1>
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-full border border-white/[0.06] bg-white/[0.01] p-1 no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              data-cursor="hover"
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-mono uppercase tracking-wider transition-all ${
                tab === t.id ? 'bg-[#DFBA73] text-[#08080a]' : 'text-[#8E8E93] hover:text-[#FAF9F6]'
              }`}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>
      </header>

      {suspended && (
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-5 py-4">
          <Lock size={18} className="mt-0.5 shrink-0 text-red-400" />
          <div>
            <p className="text-[13px] font-medium text-red-200">Brand suspended by Dobaeni</p>
            <p className="mt-1 text-[12px] text-red-200/70">
              Your brand has been suspended. Your storefront is hidden from customers and all sales are paused.
              Contact support for more information.
            </p>
          </div>
        </div>
      )}

      {analyticsLocked && (
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-5 py-4">
          <Lock size={18} className="mt-0.5 shrink-0 text-amber-400" />
          <div>
            <p className="text-[13px] font-medium text-amber-200">Analytics locked by Dobaeni</p>
            <p className="mt-1 text-[12px] text-amber-200/70">
              A platform administrator has temporarily hidden your brand's performance metrics. Your storefront and
              products are unaffected. Contact support if you believe this is a mistake.
            </p>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          {tab === 'overview' && <Overview analyticsLocked={analyticsLocked} stats={stats} orders={orders} />}
          {tab === 'products' && <Products suspended={suspended} products={products} />}
          {tab === 'orders' && <Orders suspended={suspended} orders={orders} />}
          {tab === 'promotions' && <Promotions suspended={suspended} promotions={promotions} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Overview ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#7C7C83]">{label}</p>
      <p className="mt-2 text-2xl font-light text-[#DFBA73]">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-[#52525B]">{sub}</p>}
    </div>
  );
}

function Overview({ analyticsLocked, stats, orders }: { analyticsLocked: boolean; stats: SellerStats; orders: OrderView[] }) {
  return (
    <div>
      {analyticsLocked ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-amber-500/20 bg-amber-500/[0.04] py-20 text-center">
          <Lock size={32} className="text-amber-400/60" />
          <p className="mt-4 text-[15px] text-amber-200/80">Analytics are hidden</p>
          <p className="mt-1 max-w-sm text-[13px] text-amber-200/50">
            A platform administrator has locked your brand's analytics. Contact support if you believe this is a
            mistake.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Revenue" value={formatPrice(stats.revenue)} />
            <StatCard label="Orders" value={formatNumber(stats.orders)} sub={`${stats.pendingOrders} pending`} />
            <StatCard label="Products" value={formatNumber(stats.products)} />
            <StatCard label="Followers" value={formatNumber(stats.followers)} />
            <StatCard label="Profile views" value={formatNumber(stats.views)} />
            <StatCard label="Avg rating" value={stats.avgRating.toFixed(1)} />
            <StatCard label="Units sold" value={formatNumber(orders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0))} />
            <StatCard label="Conversion" value={stats.views ? `${((stats.orders / stats.views) * 100).toFixed(1)}%` : '0%'} />
          </div>

          <h2 className="mt-10 mb-4 text-[13px] font-mono uppercase tracking-widest text-[#7C7C83]">Recent orders</h2>
          {orders.length === 0 ? (
            <p className="rounded-2xl border border-white/[0.06] bg-white/[0.01] px-5 py-8 text-center text-[13px] text-[#52525B]">
              No orders yet.
            </p>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.01] px-4 py-3 text-[13px]">
                  <span className="font-mono text-[#8E8E93]">{o.orderNumber}</span>
                  <span className="text-[#FAF9F6]">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</span>
                  <span className="text-[#DFBA73]">{formatPrice(o.totalAmount, o.currency)}</span>
                  <span className="text-[11px] uppercase tracking-wider text-[#7C7C83]">{o.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Products ───────────────────────────────────────────────────────────

function Products({ suspended, products }: { suspended: boolean; products: SellerProductView[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SellerProductView | null>(null);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(p: SellerProductView) {
    setEditing(p);
    setShowForm(true);
  }

  if (showForm) {
    return <ProductForm product={editing} onClose={() => { setShowForm(false); router.refresh(); }} />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-[13px] font-mono uppercase tracking-widest text-[#7C7C83]">{products.length} products</p>
        {!suspended && (
          <button
            onClick={openCreate}
            data-cursor="hover"
            className="flex items-center gap-2 rounded-2xl bg-[#DFBA73] px-5 py-3 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3]"
          >
            <Plus size={15} /> Add product
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.01] py-20 text-center">
          <Package size={30} className="text-[#52525B]" />
          <p className="mt-4 text-[14px] text-[#7C7C83]">No products yet. List your first piece.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-4 border-b border-white/[0.04] bg-white/[0.01] px-4 py-3 last:border-0">
              <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-[#0E0E12]">
                <SafeImage src={p.image} alt={p.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] text-[#FAF9F6]">{p.name}</p>
                <p className="text-[11px] text-[#52525B]">
                  {formatPrice(p.price, p.currency)} · {p.stock} in stock · {p.soldCount} sold
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${p.isPublished ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                {p.isPublished ? 'Live' : 'Draft'}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(p)} disabled={suspended} data-cursor="hover" className="rounded-lg p-2 text-[#8E8E93] transition-colors hover:text-[#DFBA73] disabled:opacity-30 disabled:pointer-events-none" aria-label="Edit">
                  <Pencil size={15} />
                </button>
                <DeleteProduct id={p.id} disabled={suspended} onDone={() => router.refresh()} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeleteProduct({ id, disabled, onDone }: { id: string; disabled?: boolean; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  async function del() {
    if (!confirm('Delete this product?')) return;
    setBusy(true);
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      onDone();
    } finally {
      setBusy(false);
    }
  }
  return (
    <button onClick={del} disabled={busy || disabled} data-cursor="hover" className="rounded-lg p-2 text-[#8E8E93] transition-colors hover:text-red-400 disabled:opacity-40" aria-label="Delete">
      {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
    </button>
  );
}

function ProductForm({ product, onClose }: { product: SellerProductView | null; onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: '',
    price: product?.price ? String(product.price) : '',
    compareAtPrice: product?.compareAtPrice ? String(product.compareAtPrice) : '',
    stock: product?.stock ? String(product.stock) : '',
    material: '',
    gender: '',
    sizes: '',
    colors: '',
    styleKeywords: '',
    occasion: '',
    images: [] as string[],
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const toArr = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

  async function submit() {
    setBusy(true);
    setErr(null);
    const payload = {
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      stock: Number(form.stock) || 0,
      currency: 'NPR',
      material: form.material || null,
      gender: form.gender || null,
      sizes: toArr(form.sizes),
      colors: toArr(form.colors),
      styleKeywords: toArr(form.styleKeywords),
      occasion: toArr(form.occasion),
      images: form.images,
    };
    try {
      const res = product
        ? await fetch(`/api/products/${product.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
      setBusy(false);
    }
  }

  const input = 'w-full rounded-xl border border-white/[0.08] bg-[#0E0E12] px-4 py-3 text-[13px] text-[#FAF9F6] outline-none placeholder:text-[#52525B] focus:border-[#DFBA73]/40';

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-light font-display text-[#FAF9F6]">{product ? 'Edit product' : 'New product'}</h3>
        <button onClick={onClose} className="text-[#8E8E93] hover:text-[#FAF9F6]"><X size={18} /></button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Images</label>
          <ImageUpload value={form.images} onChange={(v) => set('images', v)} multiple label="Add images" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Name</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} className={input} placeholder="Product name" />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Price (NPR)</label>
          <input value={form.price} onChange={(e) => set('price', e.target.value)} type="number" className={input} placeholder="1200" />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Compare-at (optional)</label>
          <input value={form.compareAtPrice} onChange={(e) => set('compareAtPrice', e.target.value)} type="number" className={input} placeholder="1800" />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Stock</label>
          <input value={form.stock} onChange={(e) => set('stock', e.target.value)} type="number" className={input} placeholder="10" />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Gender</label>
          <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className={input}>
            <option value="" className="bg-[#121215]">Any</option>
            <option value="female" className="bg-[#121215]">Women</option>
            <option value="male" className="bg-[#121215]">Men</option>
            <option value="unisex" className="bg-[#121215]">Unisex</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className={`${input} resize-none`} placeholder="Describe the piece…" />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Sizes (comma)</label>
          <input value={form.sizes} onChange={(e) => set('sizes', e.target.value)} className={input} placeholder="S, M, L, XL" />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Colors (comma)</label>
          <input value={form.colors} onChange={(e) => set('colors', e.target.value)} className={input} placeholder="Black, Ivory" />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Style keywords (comma)</label>
          <input value={form.styleKeywords} onChange={(e) => set('styleKeywords', e.target.value)} className={input} placeholder="Minimalist, Old Money" />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Occasion (comma)</label>
          <input value={form.occasion} onChange={(e) => set('occasion', e.target.value)} className={input} placeholder="Party, Work" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Material</label>
          <input value={form.material} onChange={(e) => set('material', e.target.value)} className={input} placeholder="100% Cotton" />
        </div>
      </div>

      {err && <p className="mt-4 text-[12px] text-red-400">{err}</p>}
      <button
        onClick={submit}
        disabled={busy || !form.name || !form.price}
        className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-[#DFBA73] px-7 py-3.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3] disabled:opacity-40"
      >
        {busy && <Loader2 size={15} className="animate-spin" />}
        {product ? 'Save changes' : 'Create product'}
      </button>
    </div>
  );
}

// ── Orders ──────────────────────────────────────────────────────────────

function Orders({ suspended, orders }: { suspended: boolean; orders: OrderView[] }) {
  const [list, setList] = useState(orders);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function update(id: string, status: string, tracking?: string, courier?: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, trackingNumber: tracking, courierName: courier }),
      });
      if (res.ok) {
        const { order } = await res.json();
        setList((l) => l.map((o) => (o.id === id ? { ...o, status: order.status, trackingNumber: order.trackingNumber, courierName: order.courierName } : o)));
      }
    } finally {
      setBusyId(null);
    }
  }

  if (list.length === 0) {
    return <p className="rounded-3xl border border-white/[0.06] bg-white/[0.01] py-20 text-center text-[14px] text-[#7C7C83]">No orders yet.</p>;
  }

  return (
    <div className="space-y-4">
      {list.map((o) => (
        <div key={o.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[13px] text-[#FAF9F6]">{o.orderNumber}</p>
              <p className="text-[11px] text-[#52525B]">{formatDate(o.createdAt)} · {formatPrice(o.totalAmount, o.currency)}</p>
            </div>
            <div className="flex items-center gap-2">
              {busyId === o.id && <Loader2 size={14} className="animate-spin text-[#DFBA73]" />}
              <select
                value={o.status}
                disabled={busyId === o.id || suspended}
                onChange={(e) => update(o.id, e.target.value)}
                className="rounded-xl border border-white/[0.08] bg-[#0E0E12] px-3 py-2 text-[12px] text-[#FAF9F6] outline-none focus:border-[#DFBA73]/40 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-[#121215]">{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
            {o.items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 text-[13px]">
                <div className="h-10 w-8 overflow-hidden rounded bg-[#0E0E12]">
                  <SafeImage src={it.productImage} alt="" className="h-full w-full object-cover" />
                </div>
                <span className="flex-1 truncate text-[#FAF9F6]">{it.productName}</span>
                <span className="text-[#7C7C83]">×{it.quantity}</span>
              </div>
            ))}
          </div>
          {o.trackingNumber && (
            <p className="mt-3 text-[11px] text-[#7C7C83]">
              {o.courierName || 'Courier'}: <span className="text-[#FAF9F6]">{o.trackingNumber}</span>
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Promotions ──────────────────────────────────────────────────────────

function Promotions({ suspended, promotions }: { suspended: boolean; promotions: Promotion[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'homepage', budget: '', startDate: '', endDate: '' });

  async function create() {
    setBusy(true);
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          budget: form.budget ? Number(form.budget) : null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        }),
      });
      if (res.ok) {
        setOpen(false);
        setForm({ title: '', type: 'homepage', budget: '', startDate: '', endDate: '' });
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  const input = 'w-full rounded-xl border border-white/[0.08] bg-[#0E0E12] px-4 py-3 text-[13px] text-[#FAF9F6] outline-none placeholder:text-[#52525B] focus:border-[#DFBA73]/40';

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-[13px] font-mono uppercase tracking-widest text-[#7C7C83]">{promotions.length} campaigns</p>
        {!suspended && (
          <button onClick={() => setOpen((v) => !v)} data-cursor="hover" className="flex items-center gap-2 rounded-2xl bg-[#DFBA73] px-5 py-3 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3]">
            <Plus size={15} /> New campaign
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Campaign title" className={`${input} mb-4`} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={input}>
                  <option value="homepage" className="bg-[#121215]">Homepage feature</option>
                  <option value="seasonal" className="bg-[#121215]">Seasonal</option>
                  <option value="flash" className="bg-[#121215]">Flash sale</option>
                </select>
                <input value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} type="number" placeholder="Budget (NPR)" className={input} />
                <input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} type="date" className={input} />
                <input value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} type="date" className={input} />
              </div>
              <button onClick={create} disabled={busy || !form.title} className="mt-5 flex items-center gap-2 rounded-2xl bg-[#DFBA73] px-7 py-3.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3] disabled:opacity-40">
                {busy && <Loader2 size={15} className="animate-spin" />} Launch
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {promotions.length === 0 ? (
        <p className="rounded-3xl border border-white/[0.06] bg-white/[0.01] py-20 text-center text-[14px] text-[#7C7C83]">No campaigns yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promotions.map((p) => (
            <div key={p.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
              <div className="flex items-center justify-between">
                <p className="text-[14px] text-[#FAF9F6]">{p.title}</p>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${p.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                  {p.status}
                </span>
              </div>
              <p className="mt-1 text-[11px] capitalize text-[#7C7C83]">{p.type}</p>
              {p.budget != null && <p className="mt-2 text-[12px] text-[#DFBA73]">Budget {formatPrice(p.budget)}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
