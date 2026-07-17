"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Heart, ShoppingBag, Settings, LogOut, ChevronRight,
  ArrowLeft, BarChart3, Store, Megaphone, Package, Users, Star, ExternalLink,
  Sparkles, TrendingUp, Activity, Zap, Clock, Grid3X3, Search,
} from "lucide-react";
import AccountPanel from "./AccountPanel";
import SafeImage from "@/app/components/SafeImage";
import BoardCollagePreview from "@/app/components/BoardCollagePreview";
import CustomCursor from "@/app/CustomCursor";
import { formatPrice, formatDate, formatNumber } from "@/lib/format";

/* ─── Design tokens ─────────────────────────────────────────────────── */
const GOLD = "#DFBA73";
const GOLD_LIGHT = "#F0E2C3";
const CREAM = "#FAF9F6";
const SURFACE = "#121215";
const BASE = "#08080a";

/* ─── Status styles ─────────────────────────────────────────────────── */
const STATUS_STYLE: Record<string, { pill: string; dot: string; label: string }> = {
  pending:         { pill: "bg-amber-500/10 text-amber-300 border-amber-500/20",   dot: "bg-amber-400 animate-pulse", label: "Pending" },
  processing:      { pill: "bg-sky-500/10 text-sky-300 border-sky-500/20",         dot: "bg-sky-400",                 label: "Processing" },
  packed:          { pill: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",dot: "bg-indigo-400",              label: "Packed" },
  out_for_delivery:{ pill: "bg-violet-500/10 text-violet-300 border-violet-500/20",dot: "bg-violet-400",              label: "In Transit" },
  delivered:       { pill: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",dot: "bg-emerald-400",         label: "Delivered" },
  cancelled:       { pill: "bg-red-500/10 text-red-300 border-red-500/20",         dot: "bg-red-400",                 label: "Cancelled" },
  refunded:        { pill: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",      dot: "bg-zinc-400",                label: "Refunded" },
};

/* ─── Board type accents ─────────────────────────────────────────────── */
const BOARD_ACCENT: Record<string, string> = {
  collection: "from-[#DFBA73]/60 to-[#C9A24B]/60",
  wishlist:   "from-pink-400/60 to-rose-400/60",
  inspo:      "from-violet-400/60 to-indigo-400/60",
};
const BOARD_BADGE: Record<string, string> = {
  collection: "bg-[#DFBA73]/15 text-[#DFBA73] border-[#DFBA73]/20",
  wishlist:   "bg-pink-500/15 text-pink-300 border-pink-500/20",
  inspo:      "bg-violet-500/15 text-violet-300 border-violet-500/20",
};

/* ─── Animation variants ─────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 18, filter: "blur(5px)" },
  show:   { opacity: 1, y: 0,  filter: "blur(0px)", transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

/* ─── Greeting helper ────────────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ─── StatusPill ─────────────────────────────────────────────────────── */
function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] uppercase tracking-[0.18em] font-mono whitespace-nowrap ${s.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

/* ─── PremiumStatCard ────────────────────────────────────────────────── */
function PremiumStatCard({ icon: Icon, label, value, sub, accent = false }: {
  icon: any; label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#121215]/50 backdrop-blur-xl p-5 transition-all duration-500 hover:border-[#DFBA73]/25 hover:shadow-[0_0_40px_rgba(223,186,115,0.06)]"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#DFBA73]/[0.07] blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Icon */}
      <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-xl ${accent ? 'bg-[#DFBA73] shadow-[0_0_20px_rgba(223,186,115,0.3)]' : 'bg-white/[0.04] border border-white/[0.06]'}`}>
        <Icon className={`w-4 h-4 ${accent ? 'text-[#08080a]' : 'text-[#DFBA73]'}`} />
      </div>

      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6B6B72]">{label}</p>
      <p className="mt-1.5 text-[22px] font-light text-[#FAF9F6] leading-none tracking-wide tabular-nums">{value}</p>
      {sub && <p className="mt-2 text-[11px] font-light text-[#52525B]">{sub}</p>}

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#DFBA73]/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </motion.div>
  );
}

/* ─── OrderRow ────────────────────────────────────────────────────────── */
function OrderRow({ order, isSeller }: { order: any; isSeller?: boolean }) {
  const first = order.items?.[0];
  const extra = order.items?.length > 1 ? order.items.length - 1 : 0;
  const s = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending;

  return (
    <Link
      href={isSeller ? "/dashboard/seller" : "/orders"}
      data-cursor="hover"
      className="group flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-[#0E0E12]/60 p-3.5 transition-all duration-300 hover:border-[#DFBA73]/20 hover:bg-[#121215]/80 hover:shadow-[0_0_20px_rgba(223,186,115,0.04)]"
    >
      {/* Product image stack */}
      <div className="relative shrink-0">
        <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0E0E12]">
          {first?.productImage ? (
            <SafeImage src={first.productImage} alt={first.productName} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="w-5 h-5 text-[#52525B]" />
            </div>
          )}
        </div>
        {extra > 0 && (
          <div className="absolute -right-1.5 -bottom-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/[0.08] bg-[#1C1C20] text-[9px] font-mono text-[#8E8E93]">
            +{extra}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-light text-[#E8E8E8] transition-colors duration-300 group-hover:text-[#DFBA73]">
          {first?.productName || "Order"}
        </p>
        <p className="mt-0.5 text-[10px] font-mono text-[#52525B] tracking-wide">
          {order.orderNumber} · {formatDate(order.createdAt)}
        </p>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <StatusPill status={order.status} />
        <span className="text-[13px] font-light text-[#DFBA73]">{formatPrice(order.totalAmount, order.currency)}</span>
      </div>
    </Link>
  );
}

/* ─── OrdersTab (search + status filter) ─────────────────────────────── */
const ORDER_FILTERS = ["all", "pending", "processing", "packed", "out_for_delivery", "delivered", "cancelled", "refunded"];
const ORDER_FILTER_LABEL: Record<string, string> = {
  all: "All",
  pending: "Pending",
  processing: "Processing",
  packed: "Packed",
  out_for_delivery: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

function OrdersTab({ orders, isSeller }: { orders: any[]; isSeller: boolean }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return orders.filter((o: any) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (tokens.length === 0) return true;
      const haystack = [
        o.orderNumber,
        ...(o.items || []).map((it: any) => it.productName || ""),
      ].join(" ").toLowerCase();
      return tokens.every((t: string) => haystack.includes(t));
    });
  }, [orders, query, statusFilter]);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={fadeUp}>
        <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-[#DFBA73]/70 mb-2">Dashboard / Orders</p>
        <h1 className="text-3xl font-light tracking-wide">{isSeller ? "Manage Orders" : "My Orders"}</h1>
      </motion.div>

      {orders.length ? (
        <>
          {/* Search + status filter */}
          <motion.div variants={fadeUp} className="space-y-4 border-b border-white/[0.04] pb-5">
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
              {ORDER_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all active:scale-95 ${statusFilter === s ? "border-[#DFBA73]/40 bg-[#DFBA73]/12 text-[#DFBA73]" : "border-white/[0.07] text-[#7C7C83] hover:text-[#FAF9F6] hover:border-white/20"}`}
                >
                  {ORDER_FILTER_LABEL[s]}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.p variants={fadeUp} className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6B6B72]">
            {filtered.length} of {orders.length} orders
          </motion.p>

          {filtered.length ? (
            <motion.div variants={stagger} className="space-y-2.5">
              {filtered.map((o: any) => (
                <motion.div variants={fadeUp} key={o.id}>
                  <OrderRow order={o} isSeller={isSeller} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div variants={fadeUp} className="flex h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.06] bg-[#0E0E12]/30">
              <p className="text-[13px] text-[#52525B] font-light">No orders match your filters.</p>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div variants={fadeUp} className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.05] bg-[#0E0E12]/30">
          <ShoppingBag className="w-8 h-8 text-[#52525B] mb-3" />
          <p className="text-[13px] text-[#7C7C83] font-light">
            {isSeller ? "No orders have come in yet." : "You haven't placed any orders yet."}
          </p>
          {!isSeller && (
            <Link href="/discover" className="mt-4 rounded-full bg-[#DFBA73] px-5 py-2 text-[11px] font-mono uppercase tracking-widest text-[#08080a] transition-all hover:bg-[#EFDDBC] active:scale-95">
              Start Shopping
            </Link>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ─── BoardCard ────────────────────────────────────────────────────────── */
function BoardCard({ board }: { board: any }) {
  const accentClass = BOARD_ACCENT[board.type] ?? BOARD_ACCENT.collection;
  const badgeClass  = BOARD_BADGE[board.type]  ?? BOARD_BADGE.collection;
  const typeLabel   = board.type ? board.type.charAt(0).toUpperCase() + board.type.slice(1) : 'Board';

  return (
    <Link href={`/dashboard/boards/${board.id}`} data-cursor="hover" className="group block">
      {/* Image area */}
      <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E0E12]">
        {/* Top gradient accent */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accentClass} z-20 opacity-70 transition-opacity duration-300 group-hover:opacity-100`} />

        {/* Collage */}
        <div className="absolute inset-0">
          <BoardCollagePreview images={board.previewImages} name={board.name} />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent z-10 transition-opacity duration-500" />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 translate-y-1 transition-transform duration-400 group-hover:translate-y-0">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-light text-[#FAF9F6] tracking-wide transition-colors duration-300 group-hover:text-[#DFBA73]">
                {board.name}
              </p>
              <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-[#FAF9F6]/50">
                {board.itemCount} {board.itemCount === 1 ? "item" : "items"}
              </p>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider ${badgeClass}`}>
              {typeLabel}
            </span>
          </div>
        </div>

        {/* Hover glow */}
        <div className="absolute inset-0 z-10 rounded-2xl ring-1 ring-inset ring-[#DFBA73]/0 transition-all duration-500 group-hover:ring-[#DFBA73]/20 group-hover:shadow-[inset_0_0_40px_rgba(223,186,115,0.04)]" />
      </div>
    </Link>
  );
}

/* ─── SidebarNavItem ─────────────────────────────────────────────────── */
function SidebarNavItem({ tab, isActive, onClick }: { tab: any; isActive: boolean; onClick: () => void }) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition-all duration-300 ${
        isActive ? "text-[#FAF9F6]" : "text-[#52525B] hover:text-[#A8A8B0]"
      }`}
    >
      {/* Active background */}
      {isActive && (
        <motion.div
          layoutId="sidebarActive"
          className="absolute inset-0 rounded-xl bg-white/[0.04] border border-white/[0.06]"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      {/* Active left accent */}
      {isActive && (
        <motion.div
          layoutId="sidebarAccentBar"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-[#DFBA73] shadow-[0_0_10px_rgba(223,186,115,0.5)]"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}

      <div className="relative z-10 flex items-center gap-3">
        <Icon className={`w-4 h-4 transition-colors duration-300 ${isActive ? "text-[#DFBA73]" : "text-current"}`} />
        <span className="text-[13px] font-light tracking-wide">{tab.label}</span>
      </div>

      {isActive && (
        <ChevronRight className="relative z-10 w-3.5 h-3.5 text-[#DFBA73] opacity-50" />
      )}
    </button>
  );
}

/* ─── Main component ─────────────────────────────────────────────────── */
export default function DashboardClient({ user, initialTwoFactorEnabled, emailVerified, data }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => { setGreeting(getGreeting()); }, []);

  /* Reset scroll to top whenever the active tab changes (in-page nav) */
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [activeTab]);

  const isSeller = user.role === "seller";

  const BUYER_TABS = [
    { id: "overview", label: "Overview",          icon: LayoutDashboard },
    { id: "orders",   label: "My Orders",          icon: ShoppingBag },
    { id: "boards",   label: "My Boards",          icon: Heart },
    { id: "settings", label: "Account Settings",   icon: Settings },
  ];
  const SELLER_TABS = [
    { id: "overview", label: "Analytics",          icon: BarChart3 },
    { id: "store",    label: "Storefront",          icon: Store },
    { id: "orders",   label: "Manage Orders",       icon: ShoppingBag },
    { id: "ads",      label: "Advertisements",      icon: Megaphone },
    { id: "settings", label: "Account Settings",    icon: Settings },
  ];

  const TABS     = isSeller ? SELLER_TABS : BUYER_TABS;
  const boards: any[]  = data?.boards    ?? [];
  const orders: any[]  = data?.orders    ?? [];
  const savedItems: number = data?.savedItems ?? 0;
  const stats: any     = data?.stats;
  const products: any[]= data?.products  ?? [];
  const recent         = orders.slice(0, 4);

  const avatarInitial = (user.name || user.email || "?").charAt(0).toUpperCase();

  return (
    <div className="dobaeni-page flex min-h-screen w-full bg-[#08080a] text-[#FAF9F6] font-sans pt-24 pb-16 px-5 md:px-10">
      <CustomCursor />

      {/* Background ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-[600px] w-[600px] -translate-y-1/3 rounded-full bg-[#C9A24B]/[0.06] blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] translate-y-1/3 rounded-full bg-[#6B3FA0]/[0.04] blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col gap-8">

        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => router.push("/")}
          className="group flex w-fit items-center gap-2 self-start rounded-full border border-white/[0.07] bg-white/[0.02] px-4 py-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#FAF9F6]/60 transition-all hover:border-[#DFBA73]/30 hover:text-[#FAF9F6]"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back
        </motion.button>

        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">

          {/* ── Sidebar ──────────────────────────────────────────────── */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-72 shrink-0"
          >
            {/* Sidebar card */}
            <div className="sticky top-28 rounded-2xl border border-white/[0.06] bg-[#0E0E12]/80 backdrop-blur-xl overflow-hidden">
              {/* Gold top accent */}
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#DFBA73]/40 to-transparent" />

              <div className="p-5 space-y-6">
                {/* Avatar + user info */}
                <div className="flex items-center gap-3.5">
                  {/* Avatar with glow ring */}
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 rounded-full bg-[#DFBA73]/20 blur-md scale-110 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div
                      className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 text-base font-light shadow-[0_0_20px_rgba(223,186,115,0.15)]"
                      style={{ borderColor: `${GOLD}40` }}
                    >
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.image} alt={user.name ?? user.email} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[#C9A24B] font-medium">{avatarInitial}</span>
                      )}
                    </div>
                    {/* Online indicator */}
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0E0E12] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-light text-[#FAF9F6] tracking-wide">
                      {user.name || "User"}
                    </p>
                    <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-mono uppercase tracking-widest ${isSeller ? 'bg-[#DFBA73]/10 text-[#DFBA73] border border-[#DFBA73]/20' : 'bg-sky-500/10 text-sky-300 border border-sky-500/20'}`}>
                      <Sparkles className="w-2 h-2" />
                      {isSeller ? "Brand Account" : "Buyer Account"}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/[0.04]" />

                {/* Navigation */}
                <nav className="flex flex-col gap-1">
                  {TABS.map((tab) => (
                    <SidebarNavItem
                      key={tab.id}
                      tab={tab}
                      isActive={activeTab === tab.id}
                      onClick={() => setActiveTab(tab.id)}
                    />
                  ))}
                </nav>

                {/* Divider */}
                <div className="h-px bg-white/[0.04]" />

                {/* Quick stats strip */}
                {!isSeller && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Orders", value: orders.length },
                      { label: "Saved",  value: savedItems },
                      { label: "Boards", value: boards.length },
                    ].map((s) => (
                      <div key={s.label} className="flex flex-col items-center gap-1 rounded-xl bg-white/[0.02] border border-white/[0.04] py-2.5">
                        <span className="text-[15px] font-light text-[#FAF9F6] tabular-nums">{s.value}</span>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#52525B]">{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                {isSeller && stats && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Revenue",  value: formatPrice(stats.revenue) },
                      { label: "Orders",   value: formatNumber(stats.orders) },
                    ].map((s) => (
                      <div key={s.label} className="flex flex-col items-center gap-1 rounded-xl bg-[#DFBA73]/[0.04] border border-[#DFBA73]/10 py-2.5">
                        <span className="text-[13px] font-light text-[#DFBA73] tabular-nums truncate w-full text-center px-1">{s.value}</span>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#8E8E93]">{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom accent */}
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
            </div>
          </motion.aside>

          {/* ── Main content ─────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
                exit={{   opacity: 0, y: -14, filter: "blur(6px)" }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >

                {/* ── Overview ─────────────────────────────────────── */}
                {activeTab === "overview" && (
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-10">
                    {/* Hero greeting */}
                    <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl border border-white/[0.05] bg-gradient-to-br from-[#0E0E12] via-[#121215] to-[#0E0E12] p-8">
                      {/* Background glow */}
                      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#DFBA73]/[0.06] blur-[80px]" />
                      <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-[#6B3FA0]/[0.04] blur-[60px]" />

                      <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#DFBA73]/70 mb-3">
                        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                      </p>
                      <h1 className="text-4xl font-light tracking-wide leading-tight">
                        {greeting},{" "}
                        <span className="bg-gradient-to-r from-[#E8D9B5] via-[#DFBA73] to-[#C9A24B] bg-clip-text font-serif italic text-transparent">
                          {user.name?.split(" ")[0] || "there"}
                        </span>
                      </h1>
                      <p className="mt-2 text-[13px] font-light text-[#52525B] max-w-md">
                        {isSeller
                          ? "Your brand studio awaits. Here's a snapshot of how your store is performing."
                          : "Here's a summary of your shopping activity and curated collections."}
                      </p>

                      {/* Decorative corner element */}
                      <div className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full border border-[#DFBA73]/10 bg-[#DFBA73]/[0.04]">
                        {isSeller ? <Activity className="w-4 h-4 text-[#DFBA73]/60" /> : <Sparkles className="w-4 h-4 text-[#DFBA73]/60" />}
                      </div>
                    </motion.div>

                    {/* Stats grid */}
                    <motion.div variants={stagger} className={`grid gap-4 ${isSeller ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'}`}>
                      {isSeller ? (
                        <>
                          <PremiumStatCard icon={TrendingUp}   label="Total Revenue"    value={stats ? formatPrice(stats.revenue) : "—"}          sub={stats ? `${stats.orders} lifetime orders` : undefined} accent />
                          <PremiumStatCard icon={ShoppingBag}  label="To Fulfill"        value={stats ? `${stats.pendingOrders}` : "0"}            sub={stats ? `${stats.orders} total orders` : undefined} />
                          <PremiumStatCard icon={Users}         label="Store Views"       value={stats ? formatNumber(stats.views) : "0"}           sub={stats ? `${formatNumber(stats.followers)} followers` : undefined} />
                        </>
                      ) : (
                        <>
                          <PremiumStatCard icon={ShoppingBag}  label="Total Orders"  value={`${orders.length}`}   accent />
                          <PremiumStatCard icon={Heart}         label="Saved Items"   value={`${savedItems}`} />
                          <PremiumStatCard icon={Grid3X3}       label="Active Boards" value={`${boards.length}`} />
                        </>
                      )}
                    </motion.div>

                    {/* Recent activity */}
                    <motion.div variants={fadeUp} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Clock className="w-4 h-4 text-[#DFBA73]/60" />
                          <h2 className="text-[13px] font-light tracking-wide text-[#FAF9F6]">Recent Activity</h2>
                        </div>
                        <Link
                          href={isSeller ? "/dashboard/seller" : (orders.length ? "/orders" : "/discover")}
                          className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-[#DFBA73]/70 hover:text-[#DFBA73] transition-colors"
                        >
                          {isSeller ? "Manage" : "View all"}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      {recent.length ? (
                        <div className="space-y-2.5">
                          {recent.map((o: any) => (
                            <OrderRow key={o.id} order={o} isSeller={isSeller} />
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.06] bg-[#0E0E12]/30">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.03] mb-3 border border-white/[0.04]">
                            {isSeller ? <Zap className="w-4 h-4 text-[#52525B]" /> : <ShoppingBag className="w-4 h-4 text-[#52525B]" />}
                          </div>
                          <p className="text-[13px] text-[#52525B] font-light">
                            {isSeller ? "No orders yet — your sales will appear here." : "No orders yet. Start exploring."}
                          </p>
                          {!isSeller && (
                            <Link href="/discover" className="mt-3 rounded-full bg-[#DFBA73] px-5 py-2 text-[11px] font-mono uppercase tracking-widest text-[#08080a] transition-all hover:bg-[#F0E2C3] active:scale-95">
                              Explore
                            </Link>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}

                {/* ── Storefront (seller) ───────────────────────────── */}
                {activeTab === "store" && isSeller && (
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
                    <motion.div variants={fadeUp}>
                      <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-[#DFBA73]/70 mb-2">Dashboard / Storefront</p>
                      <h1 className="text-3xl font-light tracking-wide">Your Products</h1>
                    </motion.div>

                    {products.length ? (
                      <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map((p: any) => (
                          <motion.div variants={fadeUp} key={p.id} className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E0E12]/60 transition-all duration-300 hover:border-[#DFBA73]/20 hover:shadow-[0_0_30px_rgba(223,186,115,0.05)]">
                            <div className="relative aspect-[4/5] bg-[#0A0A0D]">
                              {p.image ? (
                                <SafeImage src={p.image} alt={p.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Package className="w-8 h-8 text-[#52525B]" />
                                </div>
                              )}
                              {/* Status badge */}
                              <span className={`absolute left-3 top-3 rounded-full border px-2.5 py-0.5 text-[9px] uppercase tracking-[0.18em] font-mono backdrop-blur-md ${p.isPublished ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'}`}>
                                {p.isPublished ? (
                                  <><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle animate-pulse" />Live</>
                                ) : "Draft"}
                              </span>
                            </div>
                            <div className="p-4">
                              <p className="truncate text-[13px] font-light text-[#FAF9F6] group-hover:text-[#DFBA73] transition-colors duration-300">{p.name}</p>
                              <div className="mt-1.5 flex items-center justify-between">
                                <span className="text-[13px] font-light text-[#DFBA73]">{formatPrice(p.price, p.currency)}</span>
                                <span className="text-[11px] font-light text-[#52525B]">{p.soldCount} sold</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div variants={fadeUp} className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.05] bg-[#0E0E12]/30">
                        <Store className="w-8 h-8 text-[#52525B] mb-3" />
                        <p className="text-[13px] text-[#7C7C83] font-light">Your store is currently empty.</p>
                        <Link href="/dashboard/seller" className="mt-4 rounded-full bg-[#DFBA73] px-5 py-2 text-[11px] font-mono uppercase tracking-widest text-[#08080a] transition-all hover:bg-[#EFDDBC] active:scale-95">
                          Manage Store
                        </Link>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* ── Advertisements (seller) ───────────────────────── */}
                {activeTab === "ads" && isSeller && (
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
                    <motion.div variants={fadeUp}>
                      <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-[#DFBA73]/70 mb-2">Dashboard / Advertisements</p>
                      <h1 className="text-3xl font-light tracking-wide">Promotions</h1>
                    </motion.div>

                    <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <PremiumStatCard icon={Package} label="Products Listed" value={`${products.length}`} />
                      <PremiumStatCard icon={Star}    label="Avg. Rating"     value={stats ? (stats.avgRating ? stats.avgRating.toFixed(1) : "—") : "—"} />
                      <PremiumStatCard icon={Users}   label="Followers"       value={stats ? formatNumber(stats.followers) : "0"} />
                    </motion.div>

                    <motion.div variants={fadeUp} className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.05] bg-[#0E0E12]/30">
                      <Megaphone className="w-7 h-7 text-[#52525B] mb-3" />
                      <p className="text-[13px] text-[#7C7C83] font-light">Feature your products with a promotion campaign.</p>
                      <Link href="/dashboard/seller" className="mt-4 flex items-center gap-2 rounded-full border border-[#DFBA73]/30 px-5 py-2 text-[11px] font-mono uppercase tracking-widest text-[#DFBA73] transition-all hover:bg-[#DFBA73]/10 active:scale-95">
                        Open Promotions <ExternalLink className="w-3 h-3" />
                      </Link>
                    </motion.div>
                  </motion.div>
                )}

                {/* ── Orders ───────────────────────────────────────── */}
                {activeTab === "orders" && (
                  <OrdersTab orders={orders} isSeller={isSeller} />
                )}

                {/* ── Boards ───────────────────────────────────────── */}
                {activeTab === "boards" && !isSeller && (
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
                    <motion.div variants={fadeUp} className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-[#DFBA73]/70 mb-2">Dashboard / Boards</p>
                        <h1 className="text-3xl font-light tracking-wide">My Boards</h1>
                      </div>
                      <Link href="/dashboard/boards" className="flex items-center gap-2 rounded-full border border-[#DFBA73]/30 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-[#DFBA73] transition-all hover:bg-[#DFBA73]/10 active:scale-95">
                        <Grid3X3 className="w-3 h-3" /> All boards
                      </Link>
                    </motion.div>

                    {boards.length ? (
                      <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {boards.map((b: any) => (
                          <motion.div variants={fadeUp} key={b.id}>
                            <BoardCard board={b} />
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div variants={fadeUp} className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.05] bg-[#0E0E12]/30">
                        <Heart className="w-8 h-8 text-[#52525B] mb-3" />
                        <p className="text-[13px] text-[#7C7C83] font-light">You haven't created any boards yet.</p>
                        <Link href="/discover" className="mt-4 rounded-full bg-[#DFBA73] px-5 py-2 text-[11px] font-mono uppercase tracking-widest text-[#08080a] transition-all hover:bg-[#EFDDBC] active:scale-95">
                          Discover Products
                        </Link>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* ── Settings ─────────────────────────────────────── */}
                {activeTab === "settings" && (
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
                    <motion.div variants={fadeUp}>
                      <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-[#DFBA73]/70 mb-2">Dashboard / Settings</p>
                      <h1 className="text-3xl font-light tracking-wide">Account Settings</h1>
                    </motion.div>
                    <motion.div variants={fadeUp}>
                      <AccountPanel
                        initialTwoFactorEnabled={initialTwoFactorEnabled}
                        emailVerified={emailVerified}
                      />
                    </motion.div>
                  </motion.div>
                )}

              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
