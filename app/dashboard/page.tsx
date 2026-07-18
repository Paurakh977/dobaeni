import { redirect } from 'next/navigation';
import { getSession } from '@/lib/get-session';
import {
  getBoards,
  getBuyerOrders,
  getSellerOrg,
  getSellerStats,
  getSellerOrders,
  getSellerProducts,
  getLikedProducts,
  getFavoriteBrands,
} from '@/lib/queries';
import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'Dashboard — Dobaeni',
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = session.user as typeof session.user & {
    twoFactorEnabled?: boolean | null;
    image?: string | null;
    role?: string | null;
    onboardingCompleted?: boolean | null;
  };

  if (!user.onboardingCompleted) {
    redirect('/onboarding');
  }

  const isSeller = user.role === 'seller';

  let data: any = {};

  if (isSeller) {
    const org = await getSellerOrg(user.id);
    if (org) {
      const [stats, orders, products] = await Promise.all([
        getSellerStats(org.id),
        getSellerOrders(org.id),
        getSellerProducts(org.id),
      ]);
      const [liked, favBrands] = await Promise.all([
        getLikedProducts(user.id),
        getFavoriteBrands(user.id),
      ]);
      data = { org, stats, orders, products, liked, favBrands };
    }
  } else {
    const [boards, orders] = await Promise.all([
      getBoards(user.id),
      getBuyerOrders(user.id),
    ]);
    const savedItems = boards.reduce((sum: number, b: any) => sum + b.itemCount, 0);
    const [liked, favBrands] = await Promise.all([
      getLikedProducts(user.id),
      getFavoriteBrands(user.id),
    ]);
    data = { boards, orders, savedItems, liked, favBrands };
  }

  return (
    <DashboardClient
      user={user}
      initialTwoFactorEnabled={Boolean(user.twoFactorEnabled)}
      emailVerified={user.emailVerified}
      data={data}
    />
  );
}
