import { requirePermission } from '@/lib/admin-auth';
import { listBrands } from '@/lib/admin';
import BrandsTable from './BrandsTable';
import type { BrandRow } from './BrandsTable';
import { hasPermission } from '@/lib/rbac';
import { Layers, BadgeCheck, Globe, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminBrandsPage() {
  const session = await requirePermission('brand:read');
  const brands = await listBrands();

  const rows: BrandRow[] = brands.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    logo: b.logo,
    isVerified: b.isVerified,
    verificationStatus: b.verificationStatus,
    isPublished: b.isPublished,
    status: b.status,
    analyticsLocked: b.analyticsLocked,
    businessType: b.businessType,
    city: b.city,
    productCount: b.productCount,
    ownerEmail: b.ownerEmail,
    createdAt: b.createdAt.toISOString(),
  }));

  // Clean status mappings matching the table filter logic exactly
  const totalBrands = rows.length;
  const verifiedBrands = rows.filter((b) => b.isVerified).length;
  const liveBrands = rows.filter((b) => b.isPublished).length;
  const suspendedBrands = rows.filter((b) => b.status === 'suspended').length;

  return (
    <div className="space-y-8">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-3xl font-light font-display text-[#FAF9F6] tracking-tight">Brands</h1>
          <p className="mt-1.5 text-[13px] text-[#7C7C83] max-w-xl leading-relaxed">
            Verify sellers, control discover visibility, suspend abusive brands, and manage analytics dashboards.
          </p>
        </div>
      </div>

      {/* Grid of Dynamic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Brands */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.04] bg-[#0A0A0D]/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93]">All Sellers</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-500/10 text-zinc-400">
              <Layers size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-light text-[#FAF9F6] font-display">{totalBrands}</h3>
            <p className="mt-1 text-[11px] text-[#7C7C83]">Registered vendor profiles</p>
          </div>
        </div>

        {/* Metric 2: Verified Brands */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.04] bg-[#0A0A0D]/40 p-5 backdrop-blur-md">
          <div className="absolute top-0 right-0 h-[2px] w-12 bg-[#DFBA73]/40 blur-[1px]" />
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93]">Verified</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DFBA73]/10 text-[#DFBA73]">
              <BadgeCheck size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-light text-[#FAF9F6] font-display">{verifiedBrands}</h3>
            <p className="mt-1 text-[11px] text-[#7C7C83]">Gold tier credentials</p>
          </div>
        </div>

        {/* Metric 3: Live Stores */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.04] bg-[#0A0A0D]/40 p-5 backdrop-blur-md">
          <div className="absolute top-0 right-0 h-[2px] w-12 bg-emerald-500/40 blur-[1px]" />
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93]">Live Directory</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Globe size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-light text-[#FAF9F6] font-display">{liveBrands}</h3>
            <p className="mt-1 text-[11px] text-[#7C7C83]">Visible on discovery channels</p>
          </div>
        </div>

        {/* Metric 4: Suspended Stores */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.04] bg-[#0A0A0D]/40 p-5 backdrop-blur-md">
          <div className="absolute top-0 right-0 h-[2px] w-12 bg-red-500/40 blur-[1px]" />
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93]">Suspended</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
              <ShieldAlert size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-light text-[#FAF9F6] font-display">{suspendedBrands}</h3>
            <p className="mt-1 text-[11px] text-[#7C7C83]">Restricted accounts</p>
          </div>
        </div>
      </div>

      {/* Brands Table View */}
      <div className="mt-6">
        <BrandsTable
          brands={rows}
          canVerify={hasPermission(session.user.role, 'brand:verify')}
          canPublish={hasPermission(session.user.role, 'brand:publish')}
          canSuspend={hasPermission(session.user.role, 'brand:suspend')}
          canLockAnalytics={hasPermission(session.user.role, 'brand:lock-analytics')}
        />
      </div>
    </div>
  );
}