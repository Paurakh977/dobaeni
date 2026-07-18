'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, Megaphone, Plus, Loader2,
  Pencil, Trash2, X, Lock, Sparkles, Star, Users, ExternalLink,
  Calendar, DollarSign, TrendingUp, TrendingDown, Activity, Eye, BarChart3,
  Zap, ArrowUpRight, CheckCircle2, Clock, Layers, Search, SlidersHorizontal,
  ArrowUpDown, Truck, Filter, Heart,
} from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import ImageUpload from '@/app/components/ImageUpload';
import { AreaChart, BarChart, DonutChart, type Segment } from '@/app/components/charts/Charts';
import { formatPrice, formatDate, formatNumber, AESTHETICS } from '@/lib/format';
import type { SellerStats, SellerProductView, OrderView, SellerAnalytics, FavBrand } from '@/lib/queries';
import LikedTab from '@/app/components/dashboard/LikedTab';
import FavBrandsTab from '@/app/components/dashboard/FavBrandsTab';
import type { ProductCardData } from '@/lib/types';

/* ─── Types ──────────────────────────────────────────────────────────── */
type Promotion = {
  id: string;
  title: string;
  type: string;
  status: string | null;
  budget: number | null;
  startDate: string | null;
  endDate: string | null;
};

/* ─── Tabs ───────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'overview',   label: 'Overview',   icon: LayoutDashboard },
  { id: 'analytics',  label: 'Analytics',  icon: BarChart3 },
  { id: 'products',   label: 'Products',   icon: Package },
  { id: 'orders',     label: 'Orders',     icon: ShoppingBag },
  { id: 'promotions', label: 'Promotions', icon: Megaphone },
  { id: 'liked',      label: 'Liked',      icon: Heart },
  { id: 'favbrands', label: 'Fav Brands', icon: Star },
];

const ORDER_STATUSES = ['pending', 'processing', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'];

/* ─── Status colors for the analytics donut ──────────────────────────── */
const STATUS_HEX: Record<string, string> = {
  pending: '#F59E0B',
  processing: '#38BDF8',
  packed: '#818CF8',
  out_for_delivery: '#A78BFA',
  delivered: '#34D399',
  cancelled: '#F87171',
  refunded: '#A1A1AA',
};

const COURIERS = ['Nepal Post', 'FastGo', 'KTM Courier', 'Sastodeal Express', 'BlueDart', 'Pathao', 'Aramex'];
const prettyStatus = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/* ─── Status styles ──────────────────────────────────────────────────── */
const STATUS_STYLE: Record<string, string> = {
  pending:          "bg-amber-500/10 text-amber-300 border-amber-500/20",
  processing:       "bg-sky-500/10 text-sky-300 border-sky-500/20",
  packed:           "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  out_for_delivery: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  delivered:        "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  cancelled:        "bg-red-500/10 text-red-300 border-red-500/20",
  refunded:         "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
};

const STATUS_DOT: Record<string, string> = {
  pending:          "bg-amber-400 animate-pulse",
  processing:       "bg-sky-400",
  packed:           "bg-indigo-400",
  out_for_delivery: "bg-violet-400",
  delivered:        "bg-emerald-400",
  cancelled:        "bg-red-400",
  refunded:         "bg-zinc-400",
};

/* ─── Promotion type accents ─────────────────────────────────────────── */
const PROMO_ACCENT: Record<string, string> = {
  homepage: "from-[#DFBA73]/60 to-[#C9A24B]/40",
  seasonal: "from-sky-400/60 to-indigo-400/40",
  flash:    "from-rose-400/60 to-pink-400/40",
};
const PROMO_ICON_BG: Record<string, string> = {
  homepage: "bg-[#DFBA73]/10 text-[#DFBA73]",
  seasonal: "bg-sky-500/10 text-sky-300",
  flash:    "bg-rose-500/10 text-rose-300",
};

/* ─── Animation variants ─────────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

/* ─── StatusBadge ────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-mono ${STATUS_STYLE[status] || "bg-zinc-500/10 text-zinc-300 border-zinc-500/20"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status] || 'bg-zinc-400'}`} />
      {label}
    </span>
  );
}

/* ─── FulfillmentTimeline ────────────────────────────────────────────── */
function OrderFulfillmentTimeline({ status }: { status: string }) {
  const steps  = ['pending', 'processing', 'packed', 'out_for_delivery', 'delivered'];
  const labels = ['Pending', 'Processing', 'Packed', 'Transit', 'Delivered'];

  if (status === 'cancelled' || status === 'refunded') {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/5 border border-red-500/10 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-red-400/80 w-fit">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Order {status}
      </div>
    );
  }

  const currentIndex = steps.indexOf(status);

  return (
    <div className="mt-5 border-t border-white/[0.04] pt-4">
      <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#6B6B72] mb-4">Fulfillment Progress</p>
      <div className="relative flex items-center justify-between px-1">
        {/* Track */}
        <div className="absolute left-0 right-0 top-[8px] h-[1px] bg-white/[0.05]" />
        {/* Progress */}
        <div
          className="absolute left-0 top-[8px] h-[1px] bg-gradient-to-r from-[#DFBA73] to-[#C9A24B] transition-all duration-700"
          style={{ width: `${(Math.max(0, currentIndex) / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive    = index === currentIndex;
          return (
            <div key={step} className="relative z-10 flex flex-col items-center">
              <div className={`flex h-4 w-4 items-center justify-center rounded-full border transition-all duration-500 ${
                isActive    ? 'border-[#DFBA73] bg-[#08080a] scale-[1.15] shadow-[0_0_10px_rgba(223,186,115,0.5)]'
                : isCompleted ? 'border-[#DFBA73] bg-[#DFBA73]'
                : 'border-white/10 bg-[#0E0E12]'
              }`}>
                {isActive    && <span className="h-1.5 w-1.5 rounded-full bg-[#DFBA73] animate-pulse" />}
                {isCompleted && <span className="block h-1 w-1 rounded-full bg-[#08080a]" />}
              </div>
              <span className={`mt-2 text-[8px] font-mono uppercase tracking-wider whitespace-nowrap ${
                isActive ? 'text-[#DFBA73] font-semibold' : isCompleted ? 'text-[#FAF9F6]/70' : 'text-[#3D3D45]'
              }`}>
                {labels[index]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── PremiumStatCard ────────────────────────────────────────────────── */
function StatCard({
  label, value, sub, icon: Icon, accent = false, trend, trendUp = true,
}: {
  label: string; value: string; sub?: string; icon?: any; accent?: boolean; trend?: string; trendUp?: boolean;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E0E12]/60 backdrop-blur-xl p-5 transition-all duration-500 hover:border-[#DFBA73]/25 hover:shadow-[0_0_40px_rgba(223,186,115,0.06)]"
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#DFBA73]/[0.06] blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        {Icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300 ${accent ? 'bg-[#DFBA73] shadow-[0_0_20px_rgba(223,186,115,0.3)]' : 'bg-white/[0.03] border border-white/[0.05] group-hover:border-[#DFBA73]/20'}`}>
            <Icon className={`w-3.5 h-3.5 ${accent ? 'text-[#08080a]' : 'text-[#DFBA73]'}`} />
          </div>
        )}
        {trend && (
          <span className={`flex items-center gap-1 text-[10px] font-mono ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {trend}
          </span>
        )}
      </div>

      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6B6B72]">{label}</p>
      <p className="mt-1.5 text-[22px] font-light text-[#FAF9F6] tabular-nums leading-none">{value}</p>
      {sub && <p className="mt-1.5 text-[11px] font-light text-[#52525B]">{sub}</p>}

      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#DFBA73]/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </motion.div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────── */
export default function SellerDashboard({
  orgName, orgSlug, analyticsLocked, suspended, stats, products, orders, analytics, promotions, liked, favBrands,
}: {
  orgName: string;
  orgSlug: string | null;
  analyticsLocked: boolean;
  suspended: boolean;
  stats: SellerStats;
  products: SellerProductView[];
  orders: OrderView[];
  analytics: SellerAnalytics;
  promotions: Promotion[];
  liked: ProductCardData[];
  favBrands: FavBrand[];
}) {
  const [tab, setTab] = useState('overview');

  return (
    <div className="space-y-8">

      {/* ── Brand hero header ──────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#0E0E12] via-[#121215] to-[#0A0A0D] p-8"
      >
        {/* Ambient orbs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#DFBA73]/[0.07] blur-[100px]" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-[#6B3FA0]/[0.04] blur-[80px]" />

        <div className="relative flex flex-wrap items-end justify-between gap-6">
          {/* Brand info */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.45em] text-[#DFBA73]/70">Brand Studio</p>
              {!suspended && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[8px] font-mono uppercase tracking-wider text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <h1 className="text-[42px] font-light tracking-wide font-display text-[#FAF9F6] leading-none">
              {orgSlug ? (
                <Link href={`/brand/${orgSlug}`} data-cursor="hover" className="transition-colors duration-300 hover:text-[#DFBA73]">{orgName}</Link>
              ) : orgName}
            </h1>
            <p className="mt-2 text-[13px] font-light text-[#52525B]">
              {stats.products} products · {formatNumber(stats.followers)} followers · {stats.avgRating.toFixed(1)} ★
            </p>
          </div>

          {/* Tab strip */}
          <div className="relative flex gap-1 overflow-x-auto rounded-full border border-white/[0.07] bg-white/[0.02] backdrop-blur-md p-1 no-scrollbar shadow-inner">
            {TABS.map((t) => {
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  data-cursor="hover"
                  className={`relative flex items-center gap-2 rounded-full px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider transition-colors duration-300 z-10 whitespace-nowrap ${
                    isActive ? 'text-[#08080a]' : 'text-[#7C7C83] hover:text-[#FAF9F6]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sellerActiveTabIndicator"
                      className="absolute inset-0 bg-[#DFBA73] rounded-full -z-10 shadow-[0_0_20px_rgba(223,186,115,0.3)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <t.icon size={11} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom gold line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#DFBA73]/30 to-transparent" />
      </motion.header>

      {/* ── Alert banners ──────────────────────────────────────────── */}
      {suspended && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-start gap-4 rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
            <Lock size={14} className="text-red-400" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-red-200">Brand suspended by Dobaeni</p>
            <p className="mt-1 text-[12px] text-red-200/60 leading-relaxed">
              Your brand has been suspended. Your storefront is hidden from customers and all sales are paused. Contact support for more information.
            </p>
          </div>
        </motion.div>
      )}

      {analyticsLocked && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-start gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Lock size={14} className="text-amber-400" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-amber-200">Analytics locked by Dobaeni</p>
            <p className="mt-1 text-[12px] text-amber-200/60 leading-relaxed">
              A platform administrator has temporarily hidden your brand's performance metrics. Your storefront and products are unaffected.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Tab content ────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 16, filter: 'blur(5px)' }}
          animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
          exit={{   opacity: 0, y: -16, filter: 'blur(5px)' }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        >
          {tab === 'overview'   && <Overview analyticsLocked={analyticsLocked} stats={stats} orders={orders} analytics={analytics} />}
          {tab === 'analytics'  && <Analytics analyticsLocked={analyticsLocked} stats={stats} initial={analytics} />}
          {tab === 'products'   && <Products suspended={suspended} products={products} />}
          {tab === 'orders'     && <Orders   suspended={suspended} orders={orders} />}
          {tab === 'promotions' && <Promotions suspended={suspended} promotions={promotions} />}
          {tab === 'liked'      && <LikedTab products={liked} />}
          {tab === 'favbrands'  && <FavBrandsTab brands={favBrands} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ═══ Overview ═══════════════════════════════════════════════════════════ */
function Overview({ analyticsLocked, stats, orders, analytics }: { analyticsLocked: boolean; stats: SellerStats; orders: OrderView[]; analytics: SellerAnalytics }) {
  const totalUnits = orders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0);
  const conversion = stats.views ? `${((stats.orders / stats.views) * 100).toFixed(1)}%` : '0%';
  const revChange = analytics.totals.revenueChangePct;

  if (analyticsLocked) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-amber-500/15 bg-amber-500/[0.02] py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/15 mb-4">
          <Lock size={22} className="text-amber-400/60" />
        </div>
        <p className="text-[15px] text-amber-200/80 font-light">Analytics are hidden</p>
        <p className="mt-2 max-w-sm text-[13px] text-amber-200/40 leading-relaxed font-light">
          A platform administrator has locked your brand's analytics. Contact support if you believe this is a mistake.
        </p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Revenue"       value={formatPrice(stats.revenue)}           icon={DollarSign}  accent trend={revChange !== 0 ? `${revChange > 0 ? '+' : ''}${revChange.toFixed(0)}%` : undefined} trendUp={revChange >= 0} />
        <StatCard label="Orders"        value={formatNumber(stats.orders)}            icon={ShoppingBag} sub={`${stats.pendingOrders} pending`} />
        <StatCard label="Products"      value={formatNumber(stats.products)}          icon={Package} />
        <StatCard label="Followers"     value={formatNumber(stats.followers)}         icon={Users} />
        <StatCard label="Profile Views" value={formatNumber(stats.views)}             icon={Eye} />
        <StatCard label="Avg Rating"    value={stats.avgRating.toFixed(1)}            icon={Star} />
        <StatCard label="Units Sold"    value={formatNumber(totalUnits)}              icon={Layers} />
        <StatCard label="Conversion"    value={conversion}                            icon={TrendingUp} />
      </div>

      {/* Revenue trend chart (last 30 days) */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-white/[0.06] bg-[#0E0E12]/60 backdrop-blur-xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#DFBA73]/60" />
            <h2 className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#8E8E93]">Revenue · Last 30 Days</h2>
          </div>
          <span className="text-[13px] font-light text-[#DFBA73] tabular-nums">{formatPrice(analytics.totals.revenue)}</span>
        </div>
        <AreaChart data={analytics.revenueSeries} height={200} format={(n) => formatPrice(n)} />
      </motion.div>

      {/* Quick KPI strip */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Pending fulfillment", value: `${stats.pendingOrders}`, icon: Clock,         color: "text-amber-400" },
          { label: "Products live",       value: `${stats.products}`,      icon: CheckCircle2,  color: "text-emerald-400" },
          { label: "Brand rating",        value: `${stats.avgRating.toFixed(1)} ★`, icon: Sparkles, color: "text-[#DFBA73]" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3.5 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3 backdrop-blur-sm">
            <item.icon className={`w-4 h-4 shrink-0 ${item.color}`} />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#52525B]">{item.label}</p>
              <p className="text-[15px] font-light text-[#FAF9F6] tabular-nums">{item.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Recent orders */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#DFBA73]/60" />
            <h2 className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#8E8E93]">Recent Orders</h2>
          </div>
          {orders.length > 5 && (
            <span className="text-[10px] font-mono text-[#52525B]">Showing 5 of {orders.length}</span>
          )}
        </div>
        {orders.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-white/[0.05] bg-[#0E0E12]/20">
            <p className="text-[13px] text-[#52525B] font-light">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {orders.slice(0, 5).map((o) => (
              <Link key={o.id} href={`/orders/${o.id}`} data-cursor="hover" className="group flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.04] bg-[#0E0E12]/40 px-4 py-3 transition-all duration-300 hover:border-[#DFBA73]/15 hover:bg-[#0E0E12]/70">
                <span className="font-mono text-[12px] text-[#FAF9F6] transition-colors group-hover:text-[#DFBA73]">{o.orderNumber}</span>
                <span className="text-[12px] text-[#52525B]">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</span>
                <span className="text-[13px] text-[#DFBA73] font-light tabular-nums">{formatPrice(o.totalAmount, o.currency)}</span>
                <StatusBadge status={o.status} />
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ═══ Analytics ══════════════════════════════════════════════════════════ */
const RANGES = [
  { days: 7, label: '7D' },
  { days: 30, label: '30D' },
  { days: 90, label: '90D' },
];

function Analytics({ analyticsLocked, stats, initial }: { analyticsLocked: boolean; stats: SellerStats; initial: SellerAnalytics }) {
  const [range, setRange] = useState(initial.range);
  const [data, setData] = useState<SellerAnalytics>(initial);
  const [loading, setLoading] = useState(false);

  async function changeRange(days: number) {
    if (days === range) return;
    setRange(days);
    setLoading(true);
    try {
      const res = await fetch(`/api/seller/analytics?range=${days}`);
      if (res.ok) {
        const { analytics } = await res.json();
        setData(analytics);
      }
    } finally {
      setLoading(false);
    }
  }

  if (analyticsLocked) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-amber-500/15 bg-amber-500/[0.02] py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/15 mb-4">
          <Lock size={22} className="text-amber-400/60" />
        </div>
        <p className="text-[15px] text-amber-200/80 font-light">Analytics are hidden</p>
        <p className="mt-2 max-w-sm text-[13px] text-amber-200/40 leading-relaxed font-light">
          A platform administrator has locked your brand's analytics. Contact support if you believe this is a mistake.
        </p>
      </div>
    );
  }

  const t = data.totals;
  const statusSegments: Segment[] = data.statusBreakdown.map((s) => ({
    label: prettyStatus(s.status),
    value: s.count,
    color: STATUS_HEX[s.status] || '#A1A1AA',
  }));
  const totalStatusOrders = data.statusBreakdown.reduce((a, s) => a + s.count, 0);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Range selector */}
      <motion.div variants={itemVariants} className="flex items-center justify-between border-b border-white/[0.04] pb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-[#DFBA73]/60" />
          <h2 className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#8E8E93]">Performance Analytics</h2>
          {loading && <Loader2 size={12} className="animate-spin text-[#DFBA73]" />}
        </div>
        <div className="flex gap-1 rounded-full border border-white/[0.07] bg-white/[0.02] p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => changeRange(r.days)}
              className={`rounded-full px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${range === r.days ? 'bg-[#DFBA73] text-[#08080a]' : 'text-[#7C7C83] hover:text-[#FAF9F6]'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* KPI row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <AnalyticKpi label="Revenue" value={formatPrice(t.revenue)} trend={t.revenueChangePct} />
        <AnalyticKpi label="Orders" value={formatNumber(t.orders)} />
        <AnalyticKpi label="Units Sold" value={formatNumber(t.units)} />
        <AnalyticKpi label="Avg Order Value" value={formatPrice(t.avgOrderValue)} />
      </motion.div>

      {/* Revenue + Orders area charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Revenue Over Time" value={formatPrice(t.revenue)} icon={DollarSign}>
          <AreaChart data={data.revenueSeries} height={210} format={(n) => formatPrice(n)} replayKey={range} />
        </ChartCard>
        <ChartCard title="Orders Over Time" value={formatNumber(t.orders)} icon={ShoppingBag}>
          <AreaChart data={data.ordersSeries} height={210} format={(n) => `${n} orders`} color="#38BDF8" replayKey={range} />
        </ChartCard>
      </div>

      {/* Views + Status breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Product Views" value={formatNumber(t.views)} icon={Eye}>
          <AreaChart data={data.viewsSeries} height={210} format={(n) => `${n} views`} color="#A78BFA" replayKey={range} />
        </ChartCard>
        <ChartCard title="Order Status Breakdown" icon={Activity}>
          {statusSegments.length === 0 ? (
            <EmptyChart label="No orders yet" />
          ) : (
            <div className="py-2">
              <DonutChart data={statusSegments} centerLabel="Orders" centerValue={String(totalStatusOrders)} replayKey={range} />
            </div>
          )}
        </ChartCard>
      </div>

      {/* Top products + Revenue by category */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Top Products · Units Sold" icon={Layers}>
          {data.topProducts.length === 0 ? (
            <EmptyChart label="No sales yet" />
          ) : (
            <div className="pt-2">
              <BarChart
                horizontal
                data={data.topProducts.map((p) => ({ label: p.name, value: p.units }))}
                format={(n) => `${n} sold`}
                replayKey={range}
              />
            </div>
          )}
        </ChartCard>
        <ChartCard title="Revenue by Category" icon={BarChart3}>
          {data.revenueByCategory.length === 0 ? (
            <EmptyChart label="No revenue yet" />
          ) : (
            <div className="pt-2">
              <BarChart
                horizontal
                data={data.revenueByCategory.map((c) => ({ label: c.name, value: Math.round(c.revenue) }))}
                format={(n) => formatPrice(n)}
                replayKey={range}
              />
            </div>
          )}
        </ChartCard>
      </div>
    </motion.div>
  );
}

function AnalyticKpi({ label, value, trend }: { label: string; value: string; trend?: number }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0E0E12]/60 backdrop-blur-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6B6B72]">{label}</p>
        {trend != null && trend !== 0 && (
          <span className={`flex items-center gap-0.5 text-[9px] font-mono ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend > 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {Math.abs(trend).toFixed(0)}%
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[20px] font-light text-[#FAF9F6] tabular-nums leading-none">{value}</p>
    </div>
  );
}

function ChartCard({ title, value, icon: Icon, children }: { title: string; value?: string; icon?: any; children: React.ReactNode }) {
  return (
    <motion.div variants={itemVariants} className="rounded-2xl border border-white/[0.06] bg-[#0E0E12]/60 backdrop-blur-xl p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5 text-[#DFBA73]/60" />}
          <h3 className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#8E8E93]">{title}</h3>
        </div>
        {value && <span className="text-[13px] font-light text-[#DFBA73] tabular-nums">{value}</span>}
      </div>
      {children}
    </motion.div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-white/[0.05] bg-[#0E0E12]/20">
      <p className="text-[12px] text-[#52525B] font-light">{label}</p>
    </div>
  );
}

/* ═══ Products ═══════════════════════════════════════════════════════════ */
type ProductSort = 'newest' | 'oldest' | 'price_desc' | 'price_asc' | 'sold_desc';
const PRODUCT_SORTS: { value: ProductSort; label: string }[] = [
  { value: 'newest',    label: 'Newest' },
  { value: 'oldest',    label: 'Oldest' },
  { value: 'price_desc', label: 'Price ↓' },
  { value: 'price_asc',  label: 'Price ↑' },
  { value: 'sold_desc',  label: 'Best selling' },
];

function Products({ suspended, products }: { suspended: boolean; products: SellerProductView[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SellerProductView | null>(null);

  /* Filter / search / sort state */
  const [query, setQuery]               = useState('');
  const [category, setCategory]         = useState<string | null>(null);
  const [aesthetic, setAesthetic]       = useState<string | null>(null);
  const [status, setStatus]             = useState<'all' | 'live' | 'draft'>('all');
  const [sort, setSort]                 = useState<ProductSort>('newest');

  function openCreate() { setEditing(null); setShowForm(true); }
  function openEdit(p: SellerProductView) { setEditing(p); setShowForm(true); }

  /* Derive category options from data */
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];

  const filtered = useMemo(() => {
    // Flexible, tokenized search across every meaningful field.
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matchesQuery = (p: SellerProductView) => {
      if (tokens.length === 0) return true;
      const haystack = [
        p.name,
        p.category ?? '',
        ...(p.styleKeywords || []),
        p.gender ?? '',
        p.material ?? '',
      ].join(' ').toLowerCase();
      // every typed token must appear somewhere (AND semantics)
      return tokens.every((t) => haystack.includes(t));
    };

    let list = products.filter((p) => {
      if (!matchesQuery(p)) return false;
      if (category && p.category !== category) return false;
      if (aesthetic && !(p.styleKeywords || []).includes(aesthetic)) return false;
      if (status === 'live' && !p.isPublished) return false;
      if (status === 'draft' && p.isPublished) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'oldest':     return a.createdAt.localeCompare(b.createdAt);
        case 'price_desc': return b.price - a.price;
        case 'price_asc':  return a.price - b.price;
        case 'sold_desc':  return b.soldCount - a.soldCount;
        default:           return b.createdAt.localeCompare(a.createdAt);
      }
    });
    return list;
  }, [products, query, category, aesthetic, status, sort]);

  const hasFilters = !!query || !!category || !!aesthetic || status !== 'all';

  if (showForm) {
    return <ProductForm product={editing} onClose={() => { setShowForm(false); router.refresh(); }} />;
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header + controls */}
      <motion.div variants={itemVariants} className="space-y-4 border-b border-white/[0.04] pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6B6B72]">
              {filtered.length} of {products.length} products
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.02] p-1">
              <ArrowUpDown size={11} className="ml-1.5 text-[#52525B]" />
              {PRODUCT_SORTS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSort(s.value)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-all ${sort === s.value ? 'bg-[#DFBA73]/15 text-[#DFBA73]' : 'text-[#7C7C83] hover:text-[#FAF9F6]'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {!suspended && (
              <button
                onClick={openCreate}
                data-cursor="hover"
                className="flex items-center gap-2 rounded-full bg-[#DFBA73] px-5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3] hover:shadow-[0_0_20px_rgba(223,186,115,0.25)] active:scale-95"
              >
                <Plus size={13} /> Add product
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#52525B]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or category…"
            className="w-full rounded-full border border-white/[0.07] bg-[#0A0A0D] py-3 pl-10 pr-4 text-[12px] text-[#FAF9F6] outline-none placeholder:text-[#3D3D45] focus:border-[#DFBA73]/40 transition-all focus:shadow-[0_0_14px_rgba(223,186,115,0.08)]"
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'live', 'draft'] as const).map((s) => (
            <FilterChip key={s} active={status === s} label={s === 'all' ? 'All' : s === 'live' ? 'Live' : 'Draft'} onClick={() => setStatus(s)} />
          ))}
          {categories.map((c) => (
            <FilterChip key={c} active={category === c} label={c} onClick={() => setCategory(category === c ? null : c)} />
          ))}
          {aesthetic && <FilterChip active label={aesthetic} onClick={() => setAesthetic(null)} onRemove={() => setAesthetic(null)} />}
          {!aesthetic && (
            <div className="relative">
              <select
                value=""
                onChange={(e) => { if (e.target.value) setAesthetic(e.target.value); }}
                className="appearance-none rounded-full border border-dashed border-white/[0.08] bg-white/[0.02] py-1.5 pl-3 pr-7 text-[10px] font-mono uppercase tracking-wider text-[#7C7C83] outline-none hover:text-[#FAF9F6] hover:border-[#DFBA73]/30 transition-all cursor-pointer"
              >
                <option value="" className="bg-[#0E0E12]">+ Aesthetic</option>
                {AESTHETICS.map((a) => (
                  <option key={a} value={a} className="bg-[#0E0E12]">{a}</option>
                ))}
              </select>
              <SlidersHorizontal size={10} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#52525B]" />
            </div>
          )}
          {hasFilters && (
            <button
              onClick={() => { setQuery(''); setCategory(null); setAesthetic(null); setStatus('all'); }}
              className="flex items-center gap-1 rounded-full border border-white/[0.07] px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#52525B] transition-all hover:text-[#FAF9F6] hover:border-white/20 active:scale-95"
            >
              <X size={10} /> Clear
            </button>
          )}
        </div>
      </motion.div>

      {filtered.length === 0 ? (
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.05] bg-[#0E0E12]/20 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.02] border border-white/[0.04] mb-4">
            <Package size={24} className="text-[#52525B]" />
          </div>
          <p className="text-[14px] text-[#8E8E93] font-light max-w-xs leading-relaxed">
            {products.length === 0 ? 'No products yet. List your first piece into the catalog.' : 'No products match your filters.'}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
                className="group flex items-center gap-4 rounded-2xl border border-white/[0.05] bg-[#0E0E12]/50 p-4 transition-all duration-300 hover:border-[#DFBA73]/20 hover:bg-[#0E0E12]/80 hover:shadow-[0_0_20px_rgba(223,186,115,0.04)]"
              >
                {/* Product image */}
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-[#0A0A0D] border border-white/[0.04]">
                  <SafeImage
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  {p.slug ? (
                    <Link href={`/product/${p.slug}`} data-cursor="hover" className="block truncate text-[14px] font-light text-[#FAF9F6] transition-colors duration-300 hover:text-[#DFBA73]">
                      {p.name}
                    </Link>
                  ) : (
                    <p className="truncate text-[14px] font-light text-[#FAF9F6] transition-colors group-hover:text-[#DFBA73] duration-300">
                      {p.name}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-[#52525B]">
                    <span className="text-[#DFBA73] font-light">{formatPrice(p.price, p.currency)}</span>
                    <span className="text-white/10">·</span>
                    <span className={p.stock <= 5 ? "text-amber-400 font-medium" : ""}>{p.stock} in stock</span>
                    <span className="text-white/10">·</span>
                    <span>{p.soldCount} sold</span>
                    {p.category && (<><span className="text-white/10">·</span><span>{p.category}</span></>)}
                  </div>
                </div>

                {/* Status badge */}
                <span className={`inline-flex items-center gap-1.5 shrink-0 rounded-full border px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-mono ${p.isPublished ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'}`}>
                  {p.isPublished ? (
                    <><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Live</>
                  ) : (
                    <><span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />Draft</>
                  )}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(p)}
                    disabled={suspended}
                    data-cursor="hover"
                    className="rounded-xl p-2 text-[#52525B] transition-all hover:bg-white/[0.04] hover:text-[#DFBA73] disabled:opacity-30 disabled:pointer-events-none active:scale-90"
                    aria-label="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <DeleteProduct id={p.id} disabled={suspended} onDone={() => router.refresh()} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ─── FilterChip ────────────────────────────────────────────────────── */
function FilterChip({ active, label, onClick, onRemove }: { active: boolean; label: string; onClick: () => void; onRemove?: () => void }) {
  return (
    <button
      onClick={onClick}
      data-cursor="hover"
      className={`group flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all active:scale-95 ${active ? 'border-[#DFBA73]/40 bg-[#DFBA73]/12 text-[#DFBA73]' : 'border-white/[0.07] text-[#7C7C83] hover:text-[#FAF9F6] hover:border-white/20'}`}
    >
      {label}
      {active && onRemove && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 -mr-1 rounded-full p-0.5 text-[#DFBA73]/60 hover:text-[#DFBA73] hover:bg-white/10"
        >
          <X size={9} />
        </span>
      )}
    </button>
  );
}

/* ─── DeleteProduct ──────────────────────────────────────────────────── */
function DeleteProduct({ id, disabled, onDone }: { id: string; disabled?: boolean; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  async function del() {
    if (!confirm('Delete this product?')) return;
    setBusy(true);
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      onDone();
    } finally { setBusy(false); }
  }
  return (
    <button
      onClick={del}
      disabled={busy || disabled}
      data-cursor="hover"
      className="rounded-xl p-2 text-[#52525B] transition-all hover:bg-white/[0.04] hover:text-red-400 disabled:opacity-40 active:scale-90"
      aria-label="Delete"
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
    </button>
  );
}

/* ─── ProductForm ────────────────────────────────────────────────────── */
function ProductForm({ product, onClose }: { product: SellerProductView | null; onClose: () => void }) {
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
  const [err, setErr]   = useState<string | null>(null);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const toArr = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

  async function submit() {
    setBusy(true); setErr(null);
    const payload = {
      name:           form.name,
      description:    form.description || null,
      price:          Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      stock:          Number(form.stock) || 0,
      currency:       'NPR',
      material:       form.material || null,
      gender:         form.gender || null,
      sizes:          toArr(form.sizes),
      colors:         toArr(form.colors),
      styleKeywords:  toArr(form.styleKeywords),
      occasion:       toArr(form.occasion),
      images:         form.images,
    };
    try {
      const res = product
        ? await fetch(`/api/products/${product.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/products',               { method: 'POST',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
      setBusy(false);
    }
  }

  const inputCls = 'w-full rounded-xl border border-white/[0.07] bg-[#0A0A0D] px-4 py-3 text-[13px] text-[#FAF9F6] outline-none placeholder:text-[#3D3D45] focus:border-[#DFBA73]/40 transition-all focus:shadow-[0_0_14px_rgba(223,186,115,0.08)]';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 12 }}
      animate={{ opacity: 1, scale: 1,    y: 0 }}
      exit={{   opacity: 0, scale: 0.98,  y: 12 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-3xl border border-white/[0.08] bg-[#0E0E12]/70 backdrop-blur-2xl p-6 shadow-2xl space-y-6"
    >
      <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
        <h3 className="text-lg font-light font-display text-[#FAF9F6]">{product ? 'Edit product' : 'New product'}</h3>
        <button onClick={onClose} className="rounded-full p-2 text-[#52525B] transition-all hover:bg-white/[0.04] hover:text-[#FAF9F6]">
          <X size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">Images</label>
          <div className="rounded-2xl border border-white/[0.05] bg-black/20 p-3">
            <ImageUpload value={form.images} onChange={(v) => set('images', v)} multiple label="Add product images" />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">Name</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="e.g. Silk Drape Atelier Coat" />
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">Price (NPR)</label>
          <input value={form.price} onChange={(e) => set('price', e.target.value)} type="number" className={inputCls} placeholder="1200" />
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">Compare-at Price (optional)</label>
          <input value={form.compareAtPrice} onChange={(e) => set('compareAtPrice', e.target.value)} type="number" className={inputCls} placeholder="1800" />
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">Stock Quantity</label>
          <input value={form.stock} onChange={(e) => set('stock', e.target.value)} type="number" className={inputCls} placeholder="10" />
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">Gender</label>
          <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className={inputCls}>
            <option value="" className="bg-[#0A0A0D]">Any / Unisex</option>
            <option value="female" className="bg-[#0A0A0D]">Women</option>
            <option value="male" className="bg-[#0A0A0D]">Men</option>
            <option value="unisex" className="bg-[#0A0A0D]">Unisex</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} className={`${inputCls} resize-none`} placeholder="Describe the fabrics, silhouette, fit, and construction details..." />
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">Sizes (comma separated)</label>
          <input value={form.sizes} onChange={(e) => set('sizes', e.target.value)} className={inputCls} placeholder="S, M, L, XL" />
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">Colors (comma separated)</label>
          <input value={form.colors} onChange={(e) => set('colors', e.target.value)} className={inputCls} placeholder="Black, Ivory, Sage" />
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">Style Keywords</label>
          <input value={form.styleKeywords} onChange={(e) => set('styleKeywords', e.target.value)} className={inputCls} placeholder="Minimalist, Quiet Luxury, Oversized" />
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">Occasion</label>
          <input value={form.occasion} onChange={(e) => set('occasion', e.target.value)} className={inputCls} placeholder="Evening, Formal, Lounge" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">Material</label>
          <input value={form.material} onChange={(e) => set('material', e.target.value)} className={inputCls} placeholder="e.g. 100% Organic Silk Gingham" />
        </div>
      </div>

      {err && <p className="text-[12px] text-red-400 font-mono">{err}</p>}

      <div className="flex justify-end gap-3 border-t border-white/[0.04] pt-5">
        <button
          onClick={onClose}
          className="rounded-full border border-white/[0.07] px-6 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#52525B] transition-all hover:text-[#FAF9F6] hover:border-white/20 active:scale-95"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={busy || !form.name || !form.price}
          className="flex items-center justify-center gap-2 rounded-full bg-[#DFBA73] px-7 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3] hover:shadow-[0_0_20px_rgba(223,186,115,0.3)] disabled:opacity-40 active:scale-95"
        >
          {busy && <Loader2 size={13} className="animate-spin" />}
          {product ? 'Save changes' : 'Create product'}
        </button>
      </div>
    </motion.div>
  );
}

/* ═══ Orders ═════════════════════════════════════════════════════════════ */
function Orders({ suspended, orders }: { suspended: boolean; orders: OrderView[] }) {
  const [list, setList] = useState(orders);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [query, setQuery]               = useState('');
  const [trackingFor, setTrackingFor]   = useState<string | null>(null);

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
        setList((l) => l.map((o) => o.id === id ? { ...o, status: order.status, trackingNumber: order.trackingNumber, courierName: order.courierName } : o));
      }
    } finally { setBusyId(null); }
  }

  const filtered = useMemo(() => {
    // Flexible, tokenized search across order number AND product names.
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return list.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (tokens.length === 0) return true;
      const haystack = [
        o.orderNumber,
        ...o.items.map((it) => it.productName || ""),
      ].join(" ").toLowerCase();
      // every typed token must appear somewhere (AND semantics)
      return tokens.every((t) => haystack.includes(t));
    });
  }, [list, statusFilter, query]);

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.05] bg-[#0E0E12]/20 py-24">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.02] border border-white/[0.04] mb-4">
          <ShoppingBag size={22} className="text-[#52525B]" />
        </div>
        <p className="text-[14px] text-[#52525B] font-light">No orders yet.</p>
      </div>
    );
  }

  const inputCls = 'w-full rounded-xl border border-white/[0.07] bg-[#0A0A0D] px-3.5 py-2.5 text-[12px] text-[#FAF9F6] outline-none placeholder:text-[#3D3D45] focus:border-[#DFBA73]/40 transition-all';

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      {/* Search + status filter chips */}
      <motion.div variants={itemVariants} className="space-y-4 border-b border-white/[0.04] pb-5">
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#52525B]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order number or product name…"
            className="w-full rounded-full border border-white/[0.07] bg-[#0A0A0D] py-3 pl-10 pr-4 text-[12px] text-[#FAF9F6] outline-none placeholder:text-[#3D3D45] focus:border-[#DFBA73]/40 transition-all focus:shadow-[0_0_14px_rgba(223,186,115,0.08)]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={statusFilter === null} label="All" onClick={() => setStatusFilter(null)} />
          {ORDER_STATUSES.map((s) => (
            <FilterChip key={s} active={statusFilter === s} label={prettyStatus(s)} onClick={() => setStatusFilter(statusFilter === s ? null : s)} />
          ))}
        </div>
      </motion.div>

      <motion.p variants={itemVariants} className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6B6B72]">
        {filtered.length} of {list.length} orders
      </motion.p>

      {filtered.length === 0 ? (
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.05] bg-[#0E0E12]/20 py-24 text-center">
          <p className="text-[14px] text-[#8E8E93] font-light">No orders match your filters.</p>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((o) => {
              const isTrackingOpen = trackingFor === o.id;
              return (
                <motion.div
                  key={o.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
                  className="group rounded-2xl border border-white/[0.05] bg-[#0E0E12]/50 p-5 transition-all duration-300 hover:border-white/10"
                >
                  {/* Order header */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-mono text-[13px] font-medium text-[#FAF9F6]">{o.orderNumber}</p>
                      <p className="mt-1 text-[11px] text-[#52525B]">
                        {formatDate(o.createdAt)} · <span className="text-[#DFBA73]">{formatPrice(o.totalAmount, o.currency)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={o.status} />
                      {busyId === o.id && <Loader2 size={13} className="animate-spin text-[#DFBA73]" />}
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="mt-4 space-y-3 border-t border-white/[0.04] pt-4">
                    {o.items.map((it) => (
                      <div key={it.id} className="flex items-center gap-3">
                        <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg border border-white/[0.04] bg-[#0A0A0D]">
                          <SafeImage src={it.productImage} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {it.productSlug ? (
                            <Link href={`/product/${it.productSlug}`} data-cursor="hover" className="block truncate text-[13px] font-light text-[#FAF9F6] transition-colors duration-300 hover:text-[#DFBA73]">{it.productName}</Link>
                          ) : (
                            <span className="block truncate text-[13px] font-light text-[#FAF9F6]">{it.productName}</span>
                          )}
                          <span className="block text-[10px] text-[#52525B] mt-0.5 font-mono">
                            {it.size ? `Size: ${it.size}` : ''}{it.color ? ` · Color: ${it.color}` : ''}
                          </span>
                        </div>
                        <span className="text-[12px] text-[#52525B]">×{it.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <OrderFulfillmentTimeline status={o.status} />

                  {/* Tracking summary / entry */}
                  {o.trackingNumber ? (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/[0.015] border border-white/[0.04] px-3.5 py-2.5 text-[11px] text-[#52525B]">
                      <span>Carrier: <strong className="text-[#FAF9F6] font-mono ml-1">{o.courierName || 'Standard'}</strong></span>
                      <span>Tracking: <strong className="text-[#DFBA73] font-mono ml-1">{o.trackingNumber}</strong></span>
                    </div>
                  ) : (
                    !suspended && (
                      <button
                        onClick={() => setTrackingFor(isTrackingOpen ? null : o.id)}
                        className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-white/[0.1] px-3.5 py-2.5 text-[11px] font-mono uppercase tracking-wider text-[#7C7C83] transition-all hover:border-[#DFBA73]/30 hover:text-[#DFBA73] active:scale-95"
                      >
                        <Truck size={12} /> Add tracking
                      </button>
                    )
                  )}

                  {isTrackingOpen && (
                    <TrackingForm
                      order={o}
                      disabled={suspended}
                      busy={busyId === o.id}
                      onCancel={() => setTrackingFor(null)}
                      onSubmit={async (courier, trackingNumber, status) => {
                        await update(o.id, status, trackingNumber, courier);
                        setTrackingFor(null);
                      }}
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ─── TrackingForm ──────────────────────────────────────────────────── */
function TrackingForm({
  order, disabled, busy, onCancel, onSubmit,
}: {
  order: OrderView;
  disabled: boolean;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (courier: string, tracking: string, status: string) => void;
}) {
  const [courier, setCourier]       = useState(order.courierName || COURIERS[0]);
  const [tracking, setTracking]     = useState('');
  const [status, setStatus]         = useState(order.status === 'pending' ? 'processing' : order.status);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
      className="mt-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0A0A0D] p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[9px] font-mono uppercase tracking-widest text-[#6B6B72]">Carrier</label>
          <select value={courier} onChange={(e) => setCourier(e.target.value)} disabled={disabled} className="w-full rounded-xl border border-white/[0.07] bg-[#0E0E12] px-3.5 py-2.5 text-[12px] text-[#FAF9F6] outline-none focus:border-[#DFBA73]/40 cursor-pointer disabled:opacity-40">
            {COURIERS.map((c) => <option key={c} value={c} className="bg-[#0E0E12]">{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[9px] font-mono uppercase tracking-widest text-[#6B6B72]">Tracking Number</label>
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} disabled={disabled} placeholder="e.g. NP-8842319" className="w-full rounded-xl border border-white/[0.07] bg-[#0E0E12] px-3.5 py-2.5 text-[12px] text-[#FAF9F6] outline-none placeholder:text-[#3D3D45] focus:border-[#DFBA73]/40 disabled:opacity-40" />
        </div>
      </div>
      <div className="mt-3">
        <label className="mb-1.5 block text-[9px] font-mono uppercase tracking-widest text-[#6B6B72]">Update Status To</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={disabled} className="w-full rounded-xl border border-white/[0.07] bg-[#0E0E12] px-3.5 py-2.5 text-[12px] text-[#FAF9F6] outline-none focus:border-[#DFBA73]/40 cursor-pointer disabled:opacity-40">
          {ORDER_STATUSES.map((s) => <option key={s} value={s} className="bg-[#0E0E12]">{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onCancel} className="rounded-full border border-white/[0.07] px-5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#52525B] transition-all hover:text-[#FAF9F6] hover:border-white/20 active:scale-95">
          Cancel
        </button>
        <button
          onClick={() => tracking.trim() && onSubmit(courier, tracking.trim(), status)}
          disabled={busy || disabled || !tracking.trim()}
          className="flex items-center justify-center gap-2 rounded-full bg-[#DFBA73] px-6 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3] hover:shadow-[0_0_20px_rgba(223,186,115,0.3)] disabled:opacity-40 active:scale-95"
        >
          {busy && <Loader2 size={12} className="animate-spin" />} Save tracking
        </button>
      </div>
    </motion.div>
  );
}

/* ═══ Promotions ═════════════════════════════════════════════════════════ */
function Promotions({ suspended, promotions }: { suspended: boolean; promotions: Promotion[] }) {
  const router = useRouter();
  const [open, setOpen]   = useState(false);
  const [busy, setBusy]   = useState(false);
  const [form, setForm]   = useState({ title: '', type: 'homepage', budget: '', startDate: '', endDate: '' });

  async function create() {
    setBusy(true);
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:     form.title,
          type:      form.type,
          budget:    form.budget ? Number(form.budget) : null,
          startDate: form.startDate || null,
          endDate:   form.endDate   || null,
        }),
      });
      if (res.ok) {
        setOpen(false);
        setForm({ title: '', type: 'homepage', budget: '', startDate: '', endDate: '' });
        router.refresh();
      }
    } finally { setBusy(false); }
  }

  const inputCls = 'w-full rounded-xl border border-white/[0.07] bg-[#0A0A0D] px-4 py-3 text-[13px] text-[#FAF9F6] outline-none placeholder:text-[#3D3D45] focus:border-[#DFBA73]/40 transition-all focus:shadow-[0_0_14px_rgba(223,186,115,0.08)]';

  const PROMO_TYPES = [
    { value: 'homepage', label: 'Homepage Feature Spotlight',  icon: Zap },
    { value: 'seasonal', label: 'Seasonal Curator Carousel',   icon: Sparkles },
    { value: 'flash',    label: 'Flash Capsule Sale',          icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6B6B72]">{promotions.length} campaigns</p>
        {!suspended && (
          <button
            onClick={() => setOpen((v) => !v)}
            data-cursor="hover"
            className="flex items-center gap-2 rounded-full bg-[#DFBA73] px-5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3] hover:shadow-[0_0_20px_rgba(223,186,115,0.25)] active:scale-95"
          >
            {open ? <X size={13} /> : <Plus size={13} />}
            {open ? 'Cancel' : 'New campaign'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{   opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="rounded-3xl border border-white/[0.08] bg-[#0E0E12]/70 backdrop-blur-2xl p-6 shadow-2xl space-y-4">
              <div>
                <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">Campaign Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Winter Solstice Collection Launch" className={inputCls} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">Placement Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls}>
                    {PROMO_TYPES.map((t) => (
                      <option key={t.value} value={t.value} className="bg-[#0A0A0D]">{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">Budget (NPR)</label>
                  <input value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} type="number" placeholder="Budget (NPR)" className={inputCls} />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">Start Date</label>
                  <input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} type="date" className={inputCls} />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">End Date</label>
                  <input value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} type="date" className={inputCls} />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-white/[0.04] pt-4">
                <button onClick={create} disabled={busy || !form.title} className="flex items-center gap-2 rounded-full bg-[#DFBA73] px-7 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3] hover:shadow-[0_0_20px_rgba(223,186,115,0.3)] disabled:opacity-40 active:scale-95">
                  {busy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={12} />}
                  Launch Campaign
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {promotions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.05] bg-[#0E0E12]/20 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.02] border border-white/[0.04] mb-4">
            <Megaphone size={22} className="text-[#52525B]" />
          </div>
          <p className="text-[14px] text-[#52525B] font-light max-w-xs leading-relaxed">No campaigns yet. Launch a promotion to increase catalog views.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promotions.map((p) => {
            const accentCls = PROMO_ACCENT[p.type]   ?? PROMO_ACCENT.homepage;
            const iconBgCls = PROMO_ICON_BG[p.type]  ?? PROMO_ICON_BG.homepage;
            const PromoIcon = p.type === 'flash' ? Activity : p.type === 'seasonal' ? Sparkles : Zap;
            return (
              <div key={p.id} className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E0E12]/50 p-5 transition-all duration-300 hover:border-white/10 hover:shadow-[0_0_30px_rgba(223,186,115,0.04)]">
                {/* Top color accent */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accentCls}`} />

                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconBgCls} border border-current/10`}>
                    <PromoIcon size={14} />
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[8px] font-mono uppercase tracking-wider ${p.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'}`}>
                    {p.status ?? 'pending'}
                  </span>
                </div>

                <p className="text-[13px] font-light text-[#FAF9F6] truncate pr-2">{p.title}</p>
                <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-[#52525B]">{p.type} campaign</p>

                <div className="mt-4 border-t border-white/[0.04] pt-4 space-y-2">
                  {p.budget != null && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#52525B]">
                      <DollarSign size={11} className="text-[#DFBA73]" />
                      <span>Budget: <strong className="text-[#FAF9F6] font-normal">{formatPrice(p.budget)}</strong></span>
                    </div>
                  )}
                  {(p.startDate || p.endDate) && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#52525B]">
                      <Calendar size={11} />
                      <span className="text-[10px] font-mono">
                        {p.startDate ? formatDate(p.startDate) : 'Start'} – {p.endDate ? formatDate(p.endDate) : 'End'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
