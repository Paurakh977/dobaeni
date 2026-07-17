import { requirePermission } from '@/lib/admin-auth';
import { listBrands } from '@/lib/admin';
import BrandsTable from './BrandsTable';
import type { BrandRow } from './BrandsTable';
import { hasPermission } from '@/lib/rbac';

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

  return (
    <div>
      <h1 className="text-2xl font-light font-display text-[#FAF9F6]">Brands</h1>
      <p className="mt-1 text-[13px] text-[#7C7C83]">
        Verify sellers, control discover visibility, suspend abusive brands and lock analytics.
      </p>

      <p className="mt-4 text-[11px] font-mono uppercase tracking-widest text-[#52525B]">
        {rows.length} total
      </p>

      <div className="mt-4">
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
