'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Store, Package, ShieldCheck } from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/brands', label: 'Brands', icon: Store },
  { href: '/admin/products', label: 'Products', icon: Package },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/[0.06] bg-[#0A0A0D] px-5 py-8 md:flex">
      <Link href="/admin" className="mb-10 flex items-center gap-2">
        <ShieldCheck size={20} className="text-[#DFBA73]" />
        <span className="font-display text-lg tracking-wide">Dobaeni</span>
        <span className="ml-1 rounded-full bg-[#DFBA73]/15 px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest text-[#DFBA73]">
          admin
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors ${
                active
                  ? 'bg-[#DFBA73]/10 text-[#DFBA73]'
                  : 'text-[#8E8E93] hover:bg-white/[0.03] hover:text-[#FAF9F6]'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto text-[10px] leading-relaxed text-[#52525B]">
        Platform moderation &amp; RBAC console. Actions are audited by role.
      </div>
    </aside>
  );
}
