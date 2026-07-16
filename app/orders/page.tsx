import { redirect } from 'next/navigation';
import { getSession } from '@/lib/get-session';
import { getBuyerOrders } from '@/lib/queries';
import { formatPrice, formatDate } from '@/lib/format';
import SafeImage from '@/app/components/SafeImage';
import { CheckCircle2, Package, Truck } from 'lucide-react';
import PageShell from '@/app/components/PageShell';

export const dynamic = 'force-dynamic';

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  processing: { label: 'Processing', cls: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
  packed: { label: 'Packed', cls: 'bg-violet-500/10 text-violet-400 border-violet-500/30' },
  out_for_delivery: { label: 'Out for delivery', cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  delivered: { label: 'Delivered', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
  refunded: { label: 'Refunded', cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' },
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ placed?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  const [orders, { placed }] = await Promise.all([getBuyerOrders(session.user.id), searchParams]);

  return (
    <PageShell>
      <header className="mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#DFBA73]/80">your orders</p>
        <h1 className="mt-3 text-5xl font-light tracking-wide font-display text-[#FAF9F6]">Orders</h1>
      </header>

      {placed && (
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-[13px] text-emerald-300">
          <CheckCircle2 size={18} /> Your order has been placed. The brand has been notified.
        </div>
      )}

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.01] py-24 text-center">
          <Package size={30} className="mx-auto text-[#52525B]" />
          <p className="mt-4 text-[14px] text-[#7C7C83]">No orders yet. Your purchases will show up here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((o) => {
            const st = STATUS[o.status] ?? STATUS.pending;
            return (
              <div key={o.id} className="rounded-3xl border border-white/[0.06] bg-white/[0.01] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-white/[0.08] bg-[#0E0E12]">
                      <SafeImage src={o.brand.logo} alt={o.brand.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[14px] text-[#FAF9F6]">{o.brand.name}</p>
                      <p className="text-[11px] font-mono text-[#52525B]">{o.orderNumber} · {formatDate(o.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-mono uppercase tracking-wider ${st.cls}`}>
                    {st.label}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {o.items.map((it) => (
                    <div key={it.id} className="flex items-center gap-3">
                      <div className="h-14 w-12 overflow-hidden rounded-lg bg-[#0E0E12]">
                        <SafeImage src={it.productImage} alt={it.productName} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 text-[13px]">
                        <p className="text-[#FAF9F6]">{it.productName}</p>
                        <p className="text-[11px] text-[#7C7C83]">
                          {it.size && `Size ${it.size}`}{it.color ? ` · ${it.color}` : ''} · Qty {it.quantity}
                        </p>
                      </div>
                      <span className="text-[13px] text-[#DFBA73]">{formatPrice(it.price * it.quantity, o.currency)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                  <div className="flex items-center gap-2 text-[12px] text-[#7C7C83]">
                    <Truck size={14} className="text-[#DFBA73]" />
                    {o.trackingNumber
                      ? `${o.courierName || 'Courier'}: ${o.trackingNumber}`
                      : o.status === 'delivered'
                        ? 'Delivered'
                        : 'Awaiting shipment'}
                  </div>
                  <span className="text-[15px] text-[#FAF9F6]">
                    Total <span className="text-[#DFBA73]">{formatPrice(o.totalAmount, o.currency)}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
