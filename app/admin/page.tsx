import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminStats } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export default async function AdminOverview() {
  await requireAdmin();
  const s = await getAdminStats();

  const cards = [
    { label: 'Total users', value: s.totalUsers, href: '/admin/users', tone: 'neutral' as const },
    { label: 'Sellers', value: s.totalSellers, href: '/admin/users', tone: 'neutral' as const },
    { label: 'Banned users', value: s.bannedUsers, href: '/admin/users', tone: s.bannedUsers ? ('danger' as const) : ('neutral' as const) },
    { label: 'Brands', value: s.totalBrands, href: '/admin/brands', tone: 'neutral' as const },
    { label: 'Pending verification', value: s.pendingVerification, href: '/admin/brands', tone: s.pendingVerification ? ('warn' as const) : ('neutral' as const) },
    { label: 'Suspended brands', value: s.suspendedBrands, href: '/admin/brands', tone: s.suspendedBrands ? ('danger' as const) : ('neutral' as const) },
    { label: 'Unlisted brands', value: s.unlistedBrands, href: '/admin/brands', tone: s.unlistedBrands ? ('warn' as const) : ('neutral' as const) },
    { label: 'Products', value: s.totalProducts, href: '/admin/products', tone: 'neutral' as const },
    { label: 'Published products', value: s.publishedProducts, href: '/admin/products', tone: 'neutral' as const },
    { label: 'Orders', value: s.totalOrders, href: null, tone: 'neutral' as const },
  ];

  return (
    <div>
      <h1 className="text-2xl font-light font-display text-[#FAF9F6]">Overview</h1>
      <p className="mt-1 text-[13px] text-[#7C7C83]">
        Marketplace health at a glance. Use the sidebar to moderate users, brands and products.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => {
          const inner = (
            <div
              className={`rounded-2xl border p-5 transition-colors ${
                c.tone === 'danger'
                  ? 'border-red-500/20 bg-red-500/[0.04]'
                  : c.tone === 'warn'
                  ? 'border-amber-500/20 bg-amber-500/[0.04]'
                  : 'border-white/[0.06] bg-white/[0.01]'
              }`}
            >
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#7C7C83]">{c.label}</p>
              <p
                className={`mt-2 text-3xl font-light ${
                  c.tone === 'danger' ? 'text-red-400' : c.tone === 'warn' ? 'text-amber-400' : 'text-[#DFBA73]'
                }`}
              >
                {c.value}
              </p>
            </div>
          );
          return c.href ? (
            <Link key={c.label} href={c.href} className="block">
              {inner}
            </Link>
          ) : (
            <div key={c.label}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
