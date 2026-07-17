import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminStats } from '@/lib/admin';
import { Users, Store, Ban, ShieldAlert, Package, ShoppingBag, TrendingUp, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminOverview() {
  await requireAdmin();
  const s = await getAdminStats();

  const cards = [
    { label: 'Total users', value: s.totalUsers, href: '/admin/users', tone: 'neutral' as const, icon: Users },
    { label: 'Sellers', value: s.totalSellers, href: '/admin/users', tone: 'neutral' as const, icon: Store },
    { label: 'Banned users', value: s.bannedUsers, href: '/admin/users', tone: s.bannedUsers ? ('danger' as const) : ('neutral' as const), icon: Ban },
    { label: 'Brands', value: s.totalBrands, href: '/admin/brands', tone: 'neutral' as const, icon: ShoppingBag },
    { label: 'Pending verification', value: s.pendingVerification, href: '/admin/brands', tone: s.pendingVerification ? ('warn' as const) : ('neutral' as const), icon: ShieldAlert },
    { label: 'Suspended brands', value: s.suspendedBrands, href: '/admin/brands', tone: s.suspendedBrands ? ('danger' as const) : ('neutral' as const), icon: AlertTriangle },
    { label: 'Unlisted brands', value: s.unlistedBrands, href: '/admin/brands', tone: s.unlistedBrands ? ('warn' as const) : ('neutral' as const), icon: Store },
    { label: 'Products', value: s.totalProducts, href: '/admin/products', tone: 'neutral' as const, icon: Package },
    { label: 'Published products', value: s.publishedProducts, href: '/admin/products', tone: 'neutral' as const, icon: Package },
    { label: 'Orders', value: s.totalOrders, href: null, tone: 'neutral' as const, icon: TrendingUp },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-light font-display tracking-tight text-[#FAF9F6] bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
          Marketplace Overview
        </h1>
        <p className="mt-1.5 text-[14px] text-[#8E8E93] max-w-xl leading-relaxed">
          Monitor marketplace resource counts, platform metrics, and track seller onboarding health indicators.
        </p>
      </div>

      {/* Stat Card Grid: Polished luxury interface with staggered entrances */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((c, i) => {
          const Icon = c.icon;
          const isDanger = c.tone === 'danger';
          const isWarn = c.tone === 'warn';

          const inner = (
            <div
              className={`group relative h-full overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                isDanger
                  ? 'border-red-500/20 bg-red-500/[0.02] hover:border-red-500/40 hover:bg-red-500/[0.04] hover:shadow-red-500/10'
                  : isWarn
                  ? 'border-amber-500/20 bg-amber-500/[0.02] hover:border-amber-500/40 hover:bg-amber-500/[0.04] hover:shadow-amber-500/10'
                  : 'border-white/[0.04] bg-white/[0.01] hover:border-[#DFBA73]/35 hover:bg-[#DFBA73]/[0.02] hover:shadow-[#DFBA73]/5'
              }`}
            >
              {/* Colored ambient corner blur for warned/danger states */}
              {isDanger && (
                <div className="absolute top-0 right-0 h-10 w-10 bg-red-500/10 blur-[12px] rounded-full" />
              )}
              {isWarn && (
                <div className="absolute top-0 right-0 h-10 w-10 bg-amber-500/10 blur-[12px] rounded-full" />
              )}

              {/* Hover highlight shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity duration-350 group-hover:opacity-100" />
              
              <div className="relative z-10 flex items-start justify-between gap-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#7C7C83] group-hover:text-[#FAF9F6] transition-colors leading-relaxed">
                  {c.label}
                </p>
                <div className={`rounded-lg p-2 ${
                  isDanger ? 'bg-red-500/10 text-red-400' 
                  : isWarn ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-white/[0.04] text-[#8E8E93] group-hover:bg-[#DFBA73]/10 group-hover:text-[#DFBA73]'
                } transition-all duration-300`}>
                  <Icon size={14} />
                </div>
              </div>
              <p
                className={`relative z-10 mt-4 text-3xl font-light tracking-tight font-display ${
                  isDanger ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-[#FAF9F6] group-hover:text-[#DFBA73]'
                } transition-colors duration-300`}
              >
                {c.value.toLocaleString()}
              </p>
            </div>
          );
          
          return c.href ? (
            <Link 
              key={c.label} 
              href={c.href} 
              className="block outline-none animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
              style={{ animationDelay: `${i * 35}ms` }}
            >
              {inner}
            </Link>
          ) : (
            <div 
              key={c.label}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
              style={{ animationDelay: `${i * 35}ms` }}
            >
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}