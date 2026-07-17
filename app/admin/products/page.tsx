import { requirePermission } from '@/lib/admin-auth';
import { listProducts } from '@/lib/admin';
import ProductsTable from './ProductsTable';
import type { ProductRow } from './ProductsTable';
import { hasPermission } from '@/lib/rbac';

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

  return (
    <div>
      <h1 className="text-2xl font-light font-display text-[#FAF9F6]">Products</h1>
      <p className="mt-1 text-[13px] text-[#7C7C83]">
        Publish or hide listings and feature them on the discover page.
      </p>

      <p className="mt-4 text-[11px] font-mono uppercase tracking-widest text-[#52525B]">
        {rows.length} shown
      </p>

      <div className="mt-4">
        <ProductsTable
          products={rows}
          canModerate={hasPermission(session.user.role, 'product:moderate')}
          canFeature={hasPermission(session.user.role, 'product:feature')}
        />
      </div>
    </div>
  );
}
