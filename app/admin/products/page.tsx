import { requirePermission } from '@/lib/admin-auth';
import { listProducts } from '@/lib/admin';
import ProductsTable from './ProductsTable';
import type { ProductRow } from './ProductsTable';
import { hasPermission } from '@/lib/rbac';
import { Layers, Star, Globe, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const session = await requirePermission('product:read');
  const products = await listProducts();

  const rows: ProductRow[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    currency: p.currency,
    isPublished: p.isPublished,
    isFeatured: p.isFeatured,
    isActive: p.isActive,
    stock: p.stock,
    organization: p.organization,
    image: p.image,
  }));

  // Server-side calculations from processed data
  const totalProducts = rows.length;
  const featuredProducts = rows.filter((p) => p.isFeatured).length;
  const publishedProducts = rows.filter((p) => p.isPublished).length;
  const flaggedProducts = rows.filter(
    (p) => !p.organization.isPublished || p.organization.status === 'suspended'
  ).length;

  return (
    <div className="space-y-8">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-3xl font-light font-display text-[#FAF9F6] tracking-tight">Products</h1>
          <p className="mt-1.5 text-[13px] text-[#7C7C83] max-w-xl leading-relaxed">
            Publish or hide listings, configure features on discovery channels, and review parental brand health warnings.
          </p>
        </div>
      </div>

      {/* Grid of Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Products */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.04] bg-[#0A0A0D]/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93]">All Listings</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-500/10 text-zinc-400">
              <Layers size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-light text-[#FAF9F6] font-display">{totalProducts}</h3>
            <p className="mt-1 text-[11px] text-[#7C7C83]">Total uploaded listings</p>
          </div>
        </div>

        {/* Metric 2: Featured Products */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.04] bg-[#0A0A0D]/40 p-5 backdrop-blur-md">
          <div className="absolute top-0 right-0 h-[2px] w-12 bg-[#DFBA73]/40 blur-[1px]" />
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93]">Featured</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DFBA73]/10 text-[#DFBA73]">
              <Star size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-light text-[#FAF9F6] font-display">{featuredProducts}</h3>
            <p className="mt-1 text-[11px] text-[#7C7C83]">Highlighted on store discovery</p>
          </div>
        </div>

        {/* Metric 3: Published Products */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.04] bg-[#0A0A0D]/40 p-5 backdrop-blur-md">
          <div className="absolute top-0 right-0 h-[2px] w-12 bg-emerald-500/40 blur-[1px]" />
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93]">Published</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Globe size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-light text-[#FAF9F6] font-display">{publishedProducts}</h3>
            <p className="mt-1 text-[11px] text-[#7C7C83]">Active buyer facing catalogs</p>
          </div>
        </div>

        {/* Metric 4: Parental Flag Warnings */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.04] bg-[#0A0A0D]/40 p-5 backdrop-blur-md">
          <div className="absolute top-0 right-0 h-[2px] w-12 bg-red-500/40 blur-[1px]" />
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93]">Flags</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
              <AlertTriangle size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-light text-[#FAF9F6] font-display">{flaggedProducts}</h3>
            <p className="mt-1 text-[11px] text-[#7C7C83]">With parental brand issues</p>
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="mt-6">
        <ProductsTable
          products={rows}
          canModerate={hasPermission(session.user.role, 'product:moderate')}
          canFeature={hasPermission(session.user.role, 'product:feature')}
        />
      </div>
    </div>
  );
}