import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/get-session';
import { getSellerOrg, getSellerStats, getSellerProducts, getSellerOrders, getSellerAnalytics, getLikedProducts, getFavoriteBrands } from '@/lib/queries';
import { db } from '@/lib/db';
import SellerDashboard from './SellerDashboard';
import PageShell from '@/app/components/PageShell';

export const dynamic = 'force-dynamic';

export default async function SellerPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const org = await getSellerOrg(session.user.id);
  if (!org) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.01] py-24 text-center">
          <h1 className="text-3xl font-light font-display text-[#FAF9F6]">No brand yet</h1>
          <p className="mt-3 max-w-sm text-[14px] text-[#7C7C83]">
            You haven't set up a store. Complete onboarding to start selling.
          </p>
          <Link
            href="/onboarding"
            className="mt-6 rounded-2xl bg-[#DFBA73] px-7 py-3 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a]"
          >
            Set up brand
          </Link>
        </div>
      </PageShell>
    );
  }

  const [stats, products, orders, analytics, rawPromotions, liked, favBrands] = await Promise.all([
    getSellerStats(org.id),
    getSellerProducts(org.id),
    getSellerOrders(org.id),
    getSellerAnalytics(org.id, 30),
    db.promotion.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    getLikedProducts(session.user.id),
    getFavoriteBrands(session.user.id),
  ]);

  // Serialize Date fields so they match the client component's plain types.
  const promotions = rawPromotions.map((p) => ({
    id: p.id,
    title: p.title,
    type: p.type,
    status: p.status,
    budget: p.budget,
    startDate: p.startDate ? p.startDate.toISOString() : null,
    endDate: p.endDate ? p.endDate.toISOString() : null,
  }));

  return (
    <PageShell>
      <SellerDashboard
        orgName={org.name}
        orgSlug={org.slug}
        analyticsLocked={org.analyticsLocked}
        suspended={org.status === 'suspended'}
        stats={stats}
        products={products}
        orders={orders}
        analytics={analytics}
        promotions={promotions}
        liked={liked}
        favBrands={favBrands}
      />
    </PageShell>
  );
}
