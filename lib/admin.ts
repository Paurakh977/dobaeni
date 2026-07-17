import { db } from './db';

// ── Types ──────────────────────────────────────────────────────────────────

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string | null;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  emailVerified: boolean;
  createdAt: Date;
  isSeller: boolean;
};

export type AdminBrandRow = {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
  isVerified: boolean;
  verificationStatus: string | null;
  isPublished: boolean;
  status: string | null;
  analyticsLocked: boolean;
  businessType: string | null;
  city: string | null;
  productCount: number;
  ownerEmail: string | null;
  createdAt: Date;
};

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string | null;
  price: number;
  currency: string;
  isPublished: boolean;
  isFeatured: boolean;
  isActive: boolean;
  stock: number;
  organization: { id: string; name: string; slug: string | null; isPublished: boolean; status: string | null };
  image: string | null;
};

// ── Users ──────────────────────────────────────────────────────────────────

export async function listUsers(): Promise<AdminUserRow[]> {
  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      banned: true,
      banReason: true,
      banExpires: true,
      emailVerified: true,
      createdAt: true,
      members: {
        where: { role: 'owner' },
        select: { organizationId: true },
      },
    },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    role: u.role,
    banned: u.banned ?? false,
    banReason: u.banReason,
    banExpires: u.banExpires,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt,
    isSeller: u.members.length > 0,
  }));
}

export async function banUser(userId: string, reason?: string, banExpiresIn?: number) {
  await db.user.update({
    where: { id: userId },
    data: {
      banned: true,
      banReason: reason ?? null,
      banExpires: banExpiresIn ? new Date(Date.now() + banExpiresIn * 1000) : null,
    },
  });
  // Revoke active sessions so the ban takes effect immediately.
  await db.session.deleteMany({ where: { userId } });
}

export async function unbanUser(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: { banned: false, banReason: null, banExpires: null },
  });
}

export async function setUserRole(userId: string, role: string) {
  await db.user.update({ where: { id: userId }, data: { role } });
}

// ── Brands / Organizations ──────────────────────────────────────────────────

export async function listBrands(): Promise<AdminBrandRow[]> {
  const orgs = await db.organization.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      isVerified: true,
      verificationStatus: true,
      isPublished: true,
      status: true,
      analyticsLocked: true,
      businessType: true,
      city: true,
      createdAt: true,
      _count: { select: { products: true } },
      members: {
        where: { role: 'owner' },
        take: 1,
        select: { user: { select: { email: true } } },
      },
    },
  });
  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    logo: o.logo,
    isVerified: o.isVerified ?? false,
    verificationStatus: o.verificationStatus,
    isPublished: o.isPublished ?? true,
    status: o.status,
    analyticsLocked: o.analyticsLocked ?? false,
    businessType: o.businessType,
    city: o.city,
    productCount: o._count.products,
    ownerEmail: o.members[0]?.user.email ?? null,
    createdAt: o.createdAt,
  }));
}

export async function setBrandVerification(orgId: string, verified: boolean) {
  await db.organization.update({
    where: { id: orgId },
    data: {
      isVerified: verified,
      verificationStatus: verified ? 'verified' : 'unverified',
    },
  });
}

export async function setBrandPublished(orgId: string, published: boolean) {
  await db.organization.update({
    where: { id: orgId },
    data: { isPublished: published },
  });
}

export async function setBrandSuspended(orgId: string, suspended: boolean) {
  await db.organization.update({
    where: { id: orgId },
    data: { status: suspended ? 'suspended' : 'active' },
  });
}

export async function setBrandAnalyticsLocked(orgId: string, locked: boolean) {
  await db.organization.update({
    where: { id: orgId },
    data: { analyticsLocked: locked },
  });
}

// ── Products ─────────────────────────────────────────────────────────────────

export async function listProducts(): Promise<AdminProductRow[]> {
  const products = await db.product.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      currency: true,
      isPublished: true,
      isFeatured: true,
      isActive: true,
      stock: true,
      organization: {
        select: { id: true, name: true, slug: true, isPublished: true, status: true },
      },
      images: { orderBy: { position: 'asc' }, take: 1, select: { url: true } },
    },
  });
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    currency: p.currency ?? 'NPR',
    isPublished: p.isPublished ?? false,
    isFeatured: p.isFeatured ?? false,
    isActive: p.isActive ?? true,
    stock: p.stock,
    organization: {
      id: p.organization.id,
      name: p.organization.name,
      slug: p.organization.slug,
      isPublished: p.organization.isPublished ?? true,
      status: p.organization.status,
    },
    image: p.images[0]?.url ?? null,
  }));
}

export async function setProductPublished(productId: string, published: boolean) {
  await db.product.update({
    where: { id: productId },
    data: { isPublished: published, isActive: published ? true : false },
  });
}

export async function setProductFeatured(productId: string, featured: boolean) {
  await db.product.update({ where: { id: productId }, data: { isFeatured: featured } });
}

// ── Stats ────────────────────────────────────────────────────────────────────

export type AdminStats = {
  totalUsers: number;
  totalSellers: number;
  bannedUsers: number;
  pendingVerification: number;
  totalBrands: number;
  suspendedBrands: number;
  unlistedBrands: number;
  totalProducts: number;
  publishedProducts: number;
  totalOrders: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const [
    totalUsers,
    bannedUsers,
    sellers,
    pendingVerification,
    totalBrands,
    suspendedBrands,
    unlistedBrands,
    totalProducts,
    publishedProducts,
    totalOrders,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { banned: true } }),
    db.member.count({ where: { role: 'owner' } }),
    db.organization.count({ where: { verificationStatus: 'pending' } }),
    db.organization.count(),
    db.organization.count({ where: { status: 'suspended' } }),
    db.organization.count({ where: { isPublished: false } }),
    db.product.count(),
    db.product.count({ where: { isPublished: true } }),
    db.order.count(),
  ]);

  return {
    totalUsers,
    totalSellers: sellers,
    bannedUsers,
    pendingVerification,
    totalBrands,
    suspendedBrands,
    unlistedBrands,
    totalProducts,
    publishedProducts,
    totalOrders,
  };
}
