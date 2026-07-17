'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Store, Package, ShieldCheck, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/brands', label: 'Brands', icon: Store },
  { href: '/admin/products', label: 'Products', icon: Package },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/[0.04] bg-[#050507]/80 backdrop-blur-2xl px-5 py-8 md:flex">
      {/* Brand Header */}
      <Link href="/admin" className="group mb-10 flex items-center gap-3 px-2">
        <div className="relative flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-[#DFBA73]/20 to-transparent border border-[#DFBA73]/30 overflow-hidden shadow-[0_0_15px_rgba(223,186,115,0.05)]">
          <ShieldCheck size={19} className="text-[#DFBA73] relative z-10 group-hover:rotate-6 group-hover:scale-110 transition-all duration-500" />
          <div className="absolute inset-0 bg-[#DFBA73]/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
        <div>
          <span className="font-display text-xl font-light tracking-wider bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Dobaeni
          </span>
          <span className="block text-[8px] font-mono uppercase tracking-[0.3em] text-[#DFBA73]/80 mt-0.5">
            Console
          </span>
        </div>
      </Link>

      {/* Navigation Options */}
      <nav className="flex flex-col gap-1.5">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-medium transition-all duration-200 outline-none ${
                active ? 'text-[#DFBA73]' : 'text-[#8E8E93] hover:text-[#FAF9F6]'
              }`}
            >
              {/* Slidable background layout highlight */}
              {active && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#DFBA73]/8 to-[#DFBA73]/[0.01] border border-[#DFBA73]/15 shadow-[inset_0_1px_1px_rgba(223,186,115,0.05)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              
              <item.icon
                size={18}
                className={`relative z-10 transition-all duration-300 ${
                  active
                    ? 'scale-110 text-[#DFBA73] drop-shadow-[0_0_8px_rgba(223,186,115,0.4)]'
                    : 'group-hover:scale-105 group-hover:text-[#FAF9F6]'
                }`}
              />
              <span className="relative z-10 font-sans tracking-wide">{item.label}</span>
              
              {/* Active Left Pill */}
              {active && (
                <motion.div
                  layoutId="activePill"
                  className="absolute left-0 top-1/4 h-1/2 w-[3px] rounded-r-full bg-[#DFBA73] shadow-[0_0_10px_#DFBA73]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Console Disclaimer Audit Box */}
      <div className="mt-auto rounded-2xl border border-white/[0.04] bg-white/[0.01] p-4 text-center backdrop-blur-md relative overflow-hidden group">
        <div className="absolute top-0 right-0 h-[1px] w-8 bg-[#DFBA73]/30 blur-[1px] transition-all group-hover:w-16" />
        <p className="flex items-center justify-center gap-1.5 text-[10px] leading-relaxed text-[#7C7C83] font-sans">
          <ShieldAlert size={12} className="text-[#DFBA73]/60 shrink-0" />
          <span>
            RBAC console. Actions are <span className="text-[#DFBA73]/90 font-mono font-semibold">audited</span>.
          </span>
        </p>
      </div>
    </aside>
  );
}