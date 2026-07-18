'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Truck, BadgeCheck, MapPin, ShoppingBag, Star, ExternalLink } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import { formatPrice, formatDate, formatNumber } from '@/lib/format';
import type { OrderView } from '@/lib/queries';

const EASE = [0.16, 1, 0.3, 1] as const;

const STATUS_STYLE: Record<string, { pill: string; dot: string; label: string }> = {
  pending:          { pill: 'bg-amber-500/10 text-amber-300 border-amber-500/20',   dot: 'bg-amber-400 animate-pulse', label: 'Pending' },
  processing:       { pill: 'bg-sky-500/10 text-sky-300 border-sky-500/20',         dot: 'bg-sky-400',                 label: 'Processing' },
  packed:           { pill: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',dot: 'bg-indigo-400',              label: 'Packed' },
  out_for_delivery: { pill: 'bg-violet-500/10 text-violet-300 border-violet-500/20',dot: 'bg-violet-400',              label: 'In Transit' },
  delivered:        { pill: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',dot: 'bg-emerald-400',         label: 'Delivered' },
  cancelled:        { pill: 'bg-red-500/10 text-red-300 border-red-500/20',         dot: 'bg-red-400',                 label: 'Cancelled' },
  refunded:         { pill: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20',      dot: 'bg-zinc-400',                label: 'Refunded' },
};

const STEPS = ['pending', 'processing', 'packed', 'out_for_delivery', 'delivered'];
const STEP_LABELS = ['Pending', 'Processing', 'Packed', 'Transit', 'Delivered'];

function productHref(it: { productSlug: string | null; productId: string }) {
  return it.productSlug ? `/product/${it.productSlug}` : `/product/${it.productId}`;
}

export default function OrderDetail({ order }: { order: OrderView & { viewerRole: 'buyer' | 'seller' } }) {
  const s = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending;
  const backHref = order.viewerRole === 'seller' ? '/dashboard/seller' : '/orders';

  const currentIndex = STEPS.indexOf(order.status);
  const isClosed = order.status === 'cancelled' || order.status === 'refunded';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: EASE }}
      className="mx-auto max-w-3xl"
    >
      {/* Back */}
      <Link
        href={backHref}
        className="group mb-8 flex w-fit items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-4 py-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#FAF9F6]/60 transition-all hover:border-[#DFBA73]/30 hover:text-[#FAF9F6]"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Back
      </Link>

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#0E0E12] via-[#121215] to-[#0E0E12] p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#DFBA73]/[0.07] blur-[80px]" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#DFBA73]/70">Order</p>
            <h1 className="mt-2 text-2xl font-light tracking-wide">{order.orderNumber}</h1>
            <p className="mt-1.5 text-[11px] font-mono text-[#52525B]">{formatDate(order.createdAt)}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-wider ${s.pill}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
        </div>

        {/* Brand link */}
        <Link
          href={order.brand.slug ? `/brand/${order.brand.slug}` : '#'}
          data-cursor="hover"
          className="group relative mt-6 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 transition-all duration-300 hover:border-[#DFBA73]/25 hover:bg-white/[0.04]"
        >
          <div className="h-11 w-11 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0E0E12]">
            <SafeImage src={order.brand.logo} alt={order.brand.name} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[14px] font-light text-[#FAF9F6] transition-colors group-hover:text-[#DFBA73]">
                {order.brand.name}
              </p>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#52525B]">Sold by</p>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-[#52525B] transition-colors group-hover:text-[#DFBA73]" />
        </Link>
      </div>

      {/* Fulfillment timeline */}
      {!isClosed && (
        <div className="mt-5 rounded-2xl border border-white/[0.06] bg-[#0E0E12]/60 p-6 backdrop-blur-xl">
          <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#6B6B72] mb-5">Fulfillment Progress</p>
          <div className="relative flex items-center justify-between px-1">
            <div className="absolute left-0 right-0 top-[7px] h-[1px] bg-white/[0.06]" />
            <div
              className="absolute left-0 top-[7px] h-[1px] bg-gradient-to-r from-[#DFBA73] to-[#C9A24B] transition-all duration-700"
              style={{ width: `${(Math.max(0, currentIndex) / (STEPS.length - 1)) * 100}%` }}
            />
            {STEPS.map((step, index) => {
              const done = index < currentIndex;
              const active = index === currentIndex;
              return (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  <div className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-all duration-500 ${active ? 'border-[#DFBA73] bg-[#08080a] scale-125 shadow-[0_0_10px_rgba(223,186,115,0.5)]' : done ? 'border-[#DFBA73] bg-[#DFBA73]' : 'border-white/10 bg-[#0E0E12]'}`}>
                    {done && <span className="block h-1 w-1 rounded-full bg-[#08080a]" />}
                  </div>
                  <span className={`mt-2 text-[8px] font-mono uppercase tracking-wider whitespace-nowrap ${active ? 'text-[#DFBA73] font-semibold' : done ? 'text-[#FAF9F6]/70' : 'text-[#3D3D45]'}`}>
                    {STEP_LABELS[index]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="mt-5 rounded-2xl border border-white/[0.06] bg-[#0E0E12]/60 p-6 backdrop-blur-xl">
        <div className="mb-5 flex items-center gap-2">
          <ShoppingBag className="w-3.5 h-3.5 text-[#DFBA73]/60" />
          <h2 className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#8E8E93]">Items</h2>
        </div>
        <div className="space-y-3">
          {order.items.map((it) => (
            <Link
              key={it.id}
              href={productHref(it)}
              data-cursor="hover"
              className="group flex items-center gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.015] p-3 transition-all duration-300 hover:border-[#DFBA73]/20 hover:bg-white/[0.03]"
            >
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0A0A0D]">
                <SafeImage src={it.productImage} alt={it.productName} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-light text-[#FAF9F6] transition-colors group-hover:text-[#DFBA73]">{it.productName}</p>
                <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-[#52525B]">
                  {it.size ? `Size ${it.size}` : '—'}{it.color ? ` · ${it.color}` : ''} · Qty {it.quantity}
                </p>
              </div>
              <span className="shrink-0 text-[13px] font-light text-[#DFBA73]">{formatPrice(it.price * it.quantity, it.currency)}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Tracking */}
      <div className="mt-5 rounded-2xl border border-white/[0.06] bg-[#0E0E12]/60 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Truck className="w-3.5 h-3.5 text-[#DFBA73]/60" />
          <h2 className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#8E8E93]">Shipping</h2>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <MapPin className="w-4 h-4 text-[#DFBA73]" />
          </div>
          <div>
            {order.trackingNumber ? (
              <>
                <p className="text-[13px] font-light text-[#FAF9F6]">{order.courierName || 'Courier'}</p>
                <p className="text-[11px] font-mono text-[#52525B]">Tracking: <span className="text-[#DFBA73]">{order.trackingNumber}</span></p>
              </>
            ) : order.status === 'delivered' ? (
              <p className="text-[13px] font-light text-emerald-300/80">Delivered</p>
            ) : (
              <p className="text-[13px] font-light text-[#7C7C83]">Awaiting shipment</p>
            )}
            {order.estimatedDelivery && (
              <p className="text-[11px] font-mono text-[#52525B]">Est. delivery {formatDate(order.estimatedDelivery)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="mt-5 flex items-center justify-between rounded-2xl border border-[#DFBA73]/15 bg-[#DFBA73]/[0.04] p-6">
        <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#8E8E93]">Total</span>
        <span className="text-[20px] font-light text-[#DFBA73] tabular-nums">{formatPrice(order.totalAmount, order.currency)}</span>
      </div>
    </motion.div>
  );
}
