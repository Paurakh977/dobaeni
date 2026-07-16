"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Heart, ShoppingBag, Settings, LogOut, ChevronRight, ArrowLeft, BarChart3, Store, Megaphone, Package, Users, Star, ExternalLink, Sparkles } from "lucide-react";
import AccountPanel from "./AccountPanel";
import SafeImage from "@/app/components/SafeImage";
import { formatPrice, formatDate, formatNumber } from "@/lib/format";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  processing: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  packed: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  out_for_delivery: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  delivered: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-300 border-red-500/20",
  refunded: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
};

function StatusPill({ status }: { status: string }) {
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[9px] uppercase tracking-[0.18em] font-mono ${STATUS_STYLE[status] || "bg-zinc-500/10 text-zinc-300 border-zinc-500/20"}`}>
      {label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#121215]/40 backdrop-blur-xl p-6 transition-all duration-300 hover:border-[#DFBA73]/30">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#DFBA73]/[0.07] blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-0" />
      <Icon className="w-5 h-5 text-[#DFBA73] mb-4" />
      <p className="text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">{label}</p>
      <p className="text-2xl font-light mt-1 text-[#FAF9F6]">{value}</p>
      {sub && <p className="mt-1 text-[11px] font-light text-[#52525B]">{sub}</p>}
    </div>
  );
}

function OrderRow({ order, isSeller }: { order: any; isSeller?: boolean }) {
  const first = order.items?.[0];
  const extra = order.items?.length > 1 ? `+${order.items.length - 1} more` : null;
  return (
    <Link
      href={isSeller ? "/dashboard/seller" : "/orders"}
      data-cursor="hover"
      className="flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-[#121215]/40 p-4 transition-all hover:border-[#DFBA73]/30"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#0E0E12]">
        {first?.productImage ? (
          <SafeImage src={first.productImage} alt={first.productName} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#52525B]"><Package className="w-5 h-5" /></div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-light text-[#FAF9F6]">{first?.productName || "Order"}</p>
          {extra && <span className="shrink-0 text-[10px] font-light text-[#52525B]">{extra}</span>}
        </div>
        <p className="mt-0.5 text-[11px] font-light text-[#7C7C83]">
          {order.orderNumber} · {formatDate(order.createdAt)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <StatusPill status={order.status} />
        <span className="text-[12px] font-light text-[#DFBA73]">{formatPrice(order.totalAmount, order.currency)}</span>
      </div>
    </Link>
  );
}

export default function DashboardClient({ user, initialTwoFactorEnabled, emailVerified, data }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const isSeller = user.role === 'seller';

  const BUYER_TABS = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "orders", label: "My Orders", icon: ShoppingBag },
    { id: "boards", label: "My Boards", icon: Heart },
    { id: "settings", label: "Account Settings", icon: Settings },
  ];

  const SELLER_TABS = [
    { id: "overview", label: "Analytics", icon: BarChart3 },
    { id: "store", label: "Storefront", icon: Store },
    { id: "orders", label: "Manage Orders", icon: ShoppingBag },
    { id: "ads", label: "Advertisements", icon: Megaphone },
    { id: "settings", label: "Account Settings", icon: Settings },
  ];

  const TABS = isSeller ? SELLER_TABS : BUYER_TABS;

  const boards: any[] = data?.boards ?? [];
  const orders: any[] = data?.orders ?? [];
  const savedItems: number = data?.savedItems ?? 0;
  const stats: any = data?.stats;
  const products: any[] = data?.products ?? [];
  const recent = orders.slice(0, 4);

  return (
    <div className="flex min-h-screen w-full bg-[#08080a] text-[#FAF9F6] font-sans pt-24 pb-12 px-6 md:px-12">
      {/* Background Glows */}
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-hidden">
        <div className="h-[500px] w-[500px] rounded-full bg-[#C9A24B]/10 blur-[120px] translate-y-[-20%]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col gap-8">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="group flex w-fit items-center gap-2 self-start rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#FAF9F6]/70 transition-all hover:border-[#DFBA73]/40 hover:text-[#FAF9F6]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>

        <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-8">
          {/* User Profile Summary */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.08] bg-[#121215]/80 text-xl font-light text-[#C9A24B] shadow-inner">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name ?? user.email}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{(user.name || user.email || '?').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-light tracking-wide text-[#FAF9F6]">
                {user.name || "User"}
              </h2>
              <p className="mt-0.5 text-[10px] font-mono uppercase tracking-widest text-[#DFBA73]">
                {isSeller ? "Brand Account" : "Buyer Account"}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center justify-between w-full px-4 py-3 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? "bg-white/[0.06] text-[#FAF9F6]"
                      : "text-[#FAF9F6]/60 hover:bg-white/[0.02] hover:text-[#FAF9F6]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#DFBA73]" : ""}`} />
                    <span className="text-[13px] font-light tracking-wide">{tab.label}</span>
                  </div>
                  {isActive && (
                    <motion.div layoutId="activeTabIndicator" className="absolute left-0 w-1 h-1/2 bg-[#DFBA73] rounded-r-full" />
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-[#DFBA73] opacity-50" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {activeTab === "overview" && (
                <div className="space-y-8">
                  <header>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#52525B] mb-2">
                      Dashboard // {isSeller ? 'Analytics' : 'Overview'}
                    </p>
                    <h1 className="text-3xl font-light tracking-wide">
                      Welcome back,{' '}
                      <span className="bg-gradient-to-r from-[#E8D9B5] via-[#C9A24B] to-[#E2D4C9] bg-clip-text font-serif italic text-transparent">
                        {user.name?.split(' ')[0]}
                      </span>
                    </h1>
                  </header>

                  {isSeller ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <StatCard icon={BarChart3} label="Total Revenue" value={stats ? formatPrice(stats.revenue) : "—"} sub={stats ? `${stats.orders} lifetime orders` : undefined} />
                      <StatCard icon={ShoppingBag} label="Orders to Fulfill" value={stats ? `${stats.pendingOrders}` : "0"} sub={stats ? `${stats.orders} total` : undefined} />
                      <StatCard icon={Store} label="Store Views" value={stats ? formatNumber(stats.views) : "0"} sub={stats ? `${formatNumber(stats.followers)} followers` : undefined} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <StatCard icon={ShoppingBag} label="Total Orders" value={`${orders.length}`} />
                      <StatCard icon={Heart} label="Saved Items" value={`${savedItems}`} />
                      <StatCard icon={LayoutDashboard} label="Active Boards" value={`${boards.length}`} />
                    </div>
                  )}

                  {/* Recent Activity */}
                  <div className="mt-2">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-medium tracking-wide text-[#FAF9F6]">Recent Activity</h3>
                      <Link
                        href={isSeller ? "/dashboard/seller" : (orders.length ? "/orders" : "/discover")}
                        className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#DFBA73]/80 hover:text-[#DFBA73] transition-colors"
                      >
                        {isSeller ? "Manage" : "View all"}
                      </Link>
                    </div>
                    {recent.length ? (
                      <div className="space-y-3">
                        {recent.map((o: any) => (
                          <OrderRow key={o.id} order={o} isSeller={isSeller} />
                        ))}
                      </div>
                    ) : (
                      <div className="h-40 rounded-2xl border border-white/[0.04] bg-[#121215]/20 flex items-center justify-center border-dashed">
                        <p className="text-xs text-[#7C7C83] font-light">
                          {isSeller ? "No orders yet — your sales will appear here." : "No orders yet. Start exploring."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "store" && isSeller && (
                <div className="space-y-8">
                  <header>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#52525B] mb-2">
                      Dashboard // Storefront
                    </p>
                    <h1 className="text-3xl font-light tracking-wide">Your Products</h1>
                  </header>
                  {products.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.map((p: any) => (
                        <div key={p.id} className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#121215]/40">
                          <div className="relative aspect-[4/5] bg-[#0E0E12]">
                            {p.image ? (
                              <SafeImage src={p.image} alt={p.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[#52525B]"><Package className="w-8 h-8" /></div>
                            )}
                            {!p.isPublished && (
                              <span className="absolute left-3 top-3 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.18em] font-mono text-amber-300">Draft</span>
                            )}
                          </div>
                          <div className="p-4">
                            <p className="truncate text-[13px] font-light text-[#FAF9F6]">{p.name}</p>
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-[12px] font-light text-[#DFBA73]">{formatPrice(p.price, p.currency)}</span>
                              <span className="text-[11px] font-light text-[#7C7C83]">{p.soldCount} sold</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-64 rounded-2xl border border-white/[0.04] bg-[#121215]/20 flex flex-col items-center justify-center border-dashed">
                      <Store className="w-8 h-8 text-[#52525B] mb-3" />
                      <p className="text-[13px] text-[#7C7C83] font-light">Your store is currently empty.</p>
                      <Link href="/dashboard/seller" className="mt-4 rounded-full bg-[#DFBA73] px-5 py-2 text-[11px] font-mono uppercase tracking-widest text-[#08080a] transition-colors hover:bg-[#E8D9B5]">
                        Manage Store
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "ads" && isSeller && (
                <div className="space-y-8">
                  <header>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#52525B] mb-2">
                      Dashboard // Advertisements
                    </p>
                    <h1 className="text-3xl font-light tracking-wide">Promotions</h1>
                  </header>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard icon={Sparkles} label="Products Listed" value={`${products.length}`} />
                    <StatCard icon={Star} label="Avg. Rating" value={stats ? (stats.avgRating ? stats.avgRating.toFixed(1) : "—") : "—"} />
                    <StatCard icon={Users} label="Followers" value={stats ? formatNumber(stats.followers) : "0"} />
                  </div>
                  <div className="h-48 rounded-2xl border border-white/[0.04] bg-[#121215]/20 flex flex-col items-center justify-center border-dashed">
                    <Megaphone className="w-8 h-8 text-[#52525B] mb-3" />
                    <p className="text-[13px] text-[#7C7C83] font-light">Feature your products with a promotion campaign.</p>
                    <Link href="/dashboard/seller" className="mt-4 flex items-center gap-2 rounded-full border border-[#DFBA73]/30 px-5 py-2 text-[11px] font-mono uppercase tracking-widest text-[#DFBA73] transition-colors hover:bg-[#DFBA73]/10">
                      Open Promotions <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === "orders" && (
                <div className="space-y-8">
                  <header>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#52525B] mb-2">
                      Dashboard // Orders
                    </p>
                    <h1 className="text-3xl font-light tracking-wide">
                      {isSeller ? "Manage Orders" : "My Orders"}
                    </h1>
                  </header>
                  {orders.length ? (
                    <div className="space-y-3">
                      {orders.map((o: any) => (
                        <OrderRow key={o.id} order={o} isSeller={isSeller} />
                      ))}
                    </div>
                  ) : (
                    <div className="h-64 rounded-2xl border border-white/[0.04] bg-[#121215]/20 flex flex-col items-center justify-center border-dashed">
                      <ShoppingBag className="w-8 h-8 text-[#52525B] mb-3" />
                      <p className="text-[13px] text-[#7C7C83] font-light">
                        {isSeller ? "You have no orders yet." : "You haven't placed any orders yet."}
                      </p>
                      {!isSeller && (
                        <Link href="/discover" className="mt-4 rounded-full bg-[#DFBA73] px-5 py-2 text-[11px] font-mono uppercase tracking-widest text-[#08080a] transition-colors hover:bg-[#E8D9B5]">
                          Start Shopping
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "boards" && !isSeller && (
                <div className="space-y-8">
                  <header>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#52525B] mb-2">
                      Dashboard // Boards
                    </p>
                    <h1 className="text-3xl font-light tracking-wide">My Boards</h1>
                  </header>
                  {boards.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {boards.map((b: any) => (
                        <Link
                          key={b.id}
                          href={`/dashboard/boards/${b.id}`}
                          data-cursor="hover"
                          className="group relative h-52 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#121215]/40"
                        >
                          {b.coverImage ? (
                            <>
                              <div className="absolute inset-0">
                                <SafeImage src={b.coverImage} alt={b.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                            </>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#121215] to-[#0E0E12] text-[#52525B] font-light">
                              <Heart className="w-7 h-7" />
                            </div>
                          )}
                          <div className="absolute bottom-4 left-4 right-4 z-20">
                            <p className="truncate text-sm font-medium text-[#FAF9F6]">{b.name}</p>
                            <p className="text-[10px] text-[#FAF9F6]/70">{b.itemCount} {b.itemCount === 1 ? "item" : "items"}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="h-64 rounded-2xl border border-white/[0.04] bg-[#121215]/20 flex flex-col items-center justify-center border-dashed">
                      <Heart className="w-8 h-8 text-[#52525B] mb-3" />
                      <p className="text-[13px] text-[#7C7C83] font-light">You haven't created any boards yet.</p>
                      <Link href="/discover" className="mt-4 rounded-full bg-[#DFBA73] px-5 py-2 text-[11px] font-mono uppercase tracking-widest text-[#08080a] transition-colors hover:bg-[#E8D9B5]">
                        Discover Products
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-8">
                  <header>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#52525B] mb-2">
                      Dashboard // Settings
                    </p>
                    <h1 className="text-3xl font-light tracking-wide">Account Settings</h1>
                  </header>

                  <AccountPanel
                    initialTwoFactorEnabled={initialTwoFactorEnabled}
                    emailVerified={emailVerified}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
        </div>
      </div>
    </div>
  );
}
