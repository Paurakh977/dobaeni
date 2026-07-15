"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Heart, ShoppingBag, Settings, LogOut, ChevronRight, ArrowLeft, BarChart3, Store, Megaphone } from "lucide-react";
import AccountPanel from "./AccountPanel";

export default function DashboardClient({ user, initialTwoFactorEnabled, emailVerified }: any) {
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
                      <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#121215]/40 backdrop-blur-xl">
                        <BarChart3 className="w-5 h-5 text-[#DFBA73] mb-4" />
                        <p className="text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Total Revenue</p>
                        <p className="text-2xl font-light mt-1 text-[#DFBA73]">Rs. 0</p>
                      </div>
                      <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#121215]/40 backdrop-blur-xl">
                        <ShoppingBag className="w-5 h-5 text-[#DFBA73] mb-4" />
                        <p className="text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Orders to Fulfill</p>
                        <p className="text-2xl font-light mt-1">0</p>
                      </div>
                      <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#121215]/40 backdrop-blur-xl">
                        <Store className="w-5 h-5 text-[#DFBA73] mb-4" />
                        <p className="text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Store Views</p>
                        <p className="text-2xl font-light mt-1">0</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Stat Cards */}
                      <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#121215]/40 backdrop-blur-xl">
                        <ShoppingBag className="w-5 h-5 text-[#DFBA73] mb-4" />
                        <p className="text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Total Orders</p>
                        <p className="text-2xl font-light mt-1">0</p>
                      </div>
                      <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#121215]/40 backdrop-blur-xl">
                        <Heart className="w-5 h-5 text-[#DFBA73] mb-4" />
                        <p className="text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Saved Items</p>
                        <p className="text-2xl font-light mt-1">12</p>
                      </div>
                      <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#121215]/40 backdrop-blur-xl">
                        <LayoutDashboard className="w-5 h-5 text-[#DFBA73] mb-4" />
                        <p className="text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Active Boards</p>
                        <p className="text-2xl font-light mt-1">3</p>
                      </div>
                    </div>
                  )}

                  {/* Recent Activity placeholder */}
                  <div className="mt-8">
                    <h3 className="text-sm font-medium tracking-wide mb-4 text-[#FAF9F6]">Recent Activity</h3>
                    <div className="h-48 rounded-2xl border border-white/[0.04] bg-[#121215]/20 flex items-center justify-center border-dashed">
                      <p className="text-xs text-[#7C7C83] font-light">No recent activity</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "store" && isSeller && (
                <div className="space-y-8">
                  <header>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#52525B] mb-2">
                      Dashboard // Storefront
                    </p>
                    <h1 className="text-3xl font-light tracking-wide">Manage Store</h1>
                  </header>
                  <div className="h-64 rounded-2xl border border-white/[0.04] bg-[#121215]/20 flex flex-col items-center justify-center border-dashed">
                    <Store className="w-8 h-8 text-[#52525B] mb-3" />
                    <p className="text-[13px] text-[#7C7C83] font-light">Your store is currently empty.</p>
                    <button className="mt-4 px-5 py-2 rounded-full bg-[#DFBA73] text-[#08080a] text-[11px] font-mono uppercase tracking-widest hover:bg-[#E8D9B5] transition-colors">
                      Upload First Product
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "ads" && isSeller && (
                <div className="space-y-8">
                  <header>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#52525B] mb-2">
                      Dashboard // Advertisements
                    </p>
                    <h1 className="text-3xl font-light tracking-wide">Promote Products</h1>
                  </header>
                  <div className="h-64 rounded-2xl border border-white/[0.04] bg-[#121215]/20 flex flex-col items-center justify-center border-dashed">
                    <Megaphone className="w-8 h-8 text-[#52525B] mb-3" />
                    <p className="text-[13px] text-[#7C7C83] font-light">Feature your products on the homepage.</p>
                    <button className="mt-4 px-5 py-2 rounded-full border border-[#DFBA73]/30 text-[#DFBA73] text-[11px] font-mono uppercase tracking-widest hover:bg-[#DFBA73]/10 transition-colors">
                      Create Campaign
                    </button>
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
                  <div className="h-64 rounded-2xl border border-white/[0.04] bg-[#121215]/20 flex flex-col items-center justify-center border-dashed">
                    <ShoppingBag className="w-8 h-8 text-[#52525B] mb-3" />
                    <p className="text-[13px] text-[#7C7C83] font-light">
                      {isSeller ? "You have no pending orders." : "You haven't placed any orders yet."}
                    </p>
                    {!isSeller && (
                      <button className="mt-4 px-5 py-2 rounded-full bg-[#DFBA73] text-[#08080a] text-[11px] font-mono uppercase tracking-widest hover:bg-[#E8D9B5] transition-colors">
                        Start Shopping
                      </button>
                    )}
                  </div>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Placeholder Boards */}
                    <div className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                      <div className="absolute inset-0 bg-[#121215] flex items-center justify-center text-[#52525B] font-light group-hover:scale-105 transition-transform duration-500">
                        [Image Placeholder]
                      </div>
                      <div className="absolute bottom-4 left-4 z-20">
                        <p className="text-sm font-medium">Winter Fits</p>
                        <p className="text-[10px] text-[#7C7C83]">5 items</p>
                      </div>
                    </div>
                    <div className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                      <div className="absolute inset-0 bg-[#121215] flex items-center justify-center text-[#52525B] font-light group-hover:scale-105 transition-transform duration-500">
                        [Image Placeholder]
                      </div>
                      <div className="absolute bottom-4 left-4 z-20">
                        <p className="text-sm font-medium">Wishlist</p>
                        <p className="text-[10px] text-[#7C7C83]">7 items</p>
                      </div>
                    </div>
                  </div>
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
