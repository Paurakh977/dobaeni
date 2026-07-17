import { db } from '@/lib/db';
import type { OrgSummary, ProductCardData, BoardSummary } from './types';

// ===========================================================================
// Serialization helpers — everything returned crosses the server/client
// boundary as RSC props, so Dates must be ISO strings and relations
// flattened into plain objects.
// ===========================================================================

// OrgSummary, ProductCardData, BoardSummary are imported from ./types

function orgSummary(org: any): OrgSummary {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    logo: org.logo,
    banner: org.banner,
    isVerified: Boolean(org.isVerified),
    tier: org.tier || 'none',
    city: org.city,
    businessType: org.businessType ?? null,
    followerCount: org.followerCount || 0,
  };
}

function productCard(p: any, liked?: boolean): ProductCardData {
  const images = (p.images || []).map((i: any) => i.url).filter(Boolean);
  const parseArr = (v: any) => {
    if (!v) return [];
    try { return JSON.parse(v); } catch { return []; }
  };
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    currency: p.currency || 'NPR',
    images,
    styleKeywords: parseArr(p.styleKeywords),
    ratingAvg: p.ratingAvg || 0,
    ratingCount: p.ratingCount || 0,
    soldCount: p.soldCount || 0,
    organization: orgSummary(p.organization),
    category: p.category?.name ?? null,
    tags: parseArr(p.tags),
    material: p.material ?? null,
    gender: p.gender ?? null,
    occasion: parseArr(p.occasion),
    viewCount: p.viewCount || 0,
    isFeatured: Boolean(p.isFeatured),
    likeCount: p.likeCount || 0,
    commentCount: p._count?.comments || 0,
    ...(liked !== undefined ? { liked } : {}),
  };
}

// ===========================================================================
// DISCOVER / FEED
// ===========================================================================

export type DiscoverFilters = {
  search?: string;
  aesthetic?: string;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'popular';
  minPrice?: number;
  maxPrice?: number;
};

export async function getDiscoverProducts(filters: DiscoverFilters = {}, userId?: string): Promise<ProductCardData[]> {
  const where: any = {
    isPublished: true,
    isActive: true,
    stock: { gt: 0 },
    organization: { isPublished: true, status: { not: 'suspended' } },
  };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { styleKeywords: { contains: filters.search, mode: 'insensitive' } },
      { tags: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters.aesthetic) {
    where.styleKeywords = { contains: filters.aesthetic, mode: 'insensitive' };
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {};
    if (filters.minPrice != null) where.price.gte = filters.minPrice;
    if (filters.maxPrice != null) where.price.lte = filters.maxPrice;
  }

  const orderBy: any =
    filters.sort === 'price-asc'
      ? { price: 'asc' }
      : filters.sort === 'price-desc'
        ? { price: 'desc' }
        : filters.sort === 'popular'
          ? { soldCount: 'desc' }
          : { createdAt: 'desc' };

  const products = await db.product.findMany({
    where,
    orderBy,
    include: {
      images: { orderBy: { position: 'asc' }, take: 1 },
      category: { select: { name: true } },
      organization: {
        select: {
          id: true, name: true, slug: true, logo: true, banner: true,
          isVerified: true, tier: true, city: true, followerCount: true,
        },
      },
      _count: { select: { comments: true } },
    },
  });

  const cards = products.map((p) => productCard(p));
  return userId ? await attachLiked(cards, userId) : cards;
}

// ===========================================================================
// PRODUCT DETAIL
// ===========================================================================

export type ProductDetail = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  sizes: string[];
  colors: string[];
  styleKeywords: string[];
  gender: string | null;
  occasion: string[];
  material: string | null;
  stock: number;
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  viewCount: number;
  likeCount: number;
  liked: boolean;
  commentCount: number;
  images: string[];
  organization: OrgSummary & { description: string | null; contactEmail: string | null; businessType: string | null };
  reviews: ReviewData[];
  comments: CommentData[];
};

export type ReviewData = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  user: { name: string; image: string | null };
  sellerReply: string | null;
};

export type CommentData = {
  id: string;
  content: string;
  createdAt: string;
  user: { name: string; image: string | null };
};

export async function getProductBySlug(slug: string, userId?: string): Promise<ProductDetail | null> {
  const p = await db.product.findFirst({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { position: 'asc' } },
      organization: {
        select: {
          id: true, name: true, slug: true, logo: true, banner: true, isVerified: true,
          tier: true, city: true, followerCount: true, description: true,
          contactEmail: true, businessType: true,
        },
      },
      reviews: {
        where: { status: 'approved' },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { user: { select: { name: true, image: true } } },
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { user: { select: { name: true, image: true } } },
      },
      _count: { select: { comments: true } },
    },
  });
  if (!p) return null;

  const images = p.images.map((i: any) => i.url).filter(Boolean);
  const parse = (v: any) => {
    if (!v) return [];
    try { return JSON.parse(v); } catch { return []; }
  };

  const liked = userId
    ? Boolean(await db.like.findUnique({ where: { userId_productId: { userId, productId: p.id } } }))
    : false;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    currency: p.currency || 'NPR',
    sizes: parse(p.sizes),
    colors: parse(p.colors),
    styleKeywords: parse(p.styleKeywords),
    gender: p.gender,
    occasion: parse(p.occasion),
    material: p.material,
    stock: p.stock,
    ratingAvg: p.ratingAvg || 0,
    ratingCount: p.ratingCount || 0,
    soldCount: p.soldCount || 0,
    viewCount: p.viewCount || 0,
    likeCount: p.likeCount || 0,
    liked,
    commentCount: p._count?.comments || 0,
    images,
    organization: {
      ...orgSummary(p.organization),
      description: p.organization.description,
      contactEmail: p.organization.contactEmail,
      businessType: p.organization.businessType,
    },
    reviews: p.reviews.map((r: any) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      images: parse(r.images),
      isVerifiedPurchase: Boolean(r.isVerifiedPurchase),
      helpfulCount: r.helpfulCount || 0,
      createdAt: r.createdAt.toISOString(),
      user: { name: r.user.name, image: r.user.image },
      sellerReply: r.sellerReply,
    })),
    comments: p.comments.map((c: any) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      user: { name: c.user.name, image: c.user.image },
    })),
  };
}

// ===========================================================================
// BRANDS / STOREFRONTS
// ===========================================================================

export type BrandSummary = OrgSummary & {
  description: string | null;
  businessType: string | null;
  productCount: number;
  ratingAvg: number;
  ratingCount: number;
  viewCount: number;
  aesthetics: string[];
  genders: string[];
};

const parseArr = (v: any): string[] => {
  if (!v) return [];
  try {
    const p = JSON.parse(v);
    return Array.isArray(p) ? p.map((x) => String(x)) : [];
  } catch {
    return [];
  }
};

// Weighted composite used for the "Trending" brand ranking. Shared with the
// client so ranking stays consistent when filters are applied there.
export function brandScore(b: {
  followerCount: number;
  ratingAvg: number;
  ratingCount: number;
  viewCount: number;
  productCount: number;
}): number {
  return (
    b.followerCount * 1 +
    b.ratingAvg * b.ratingCount * 5 +
    b.viewCount * 0.2 +
    b.productCount * 2
  );
}

export async function getBrands(): Promise<BrandSummary[]> {
  const orgs = await db.organization.findMany({
    where: { isPublished: true, status: { not: 'suspended' }, members: { some: {} } },
    orderBy: [{ followerCount: 'desc' }, { createdAt: 'desc' }],
    take: 200,
    include: {
      _count: { select: { products: { where: { isPublished: true } } } },
      products: {
        where: { isPublished: true },
        take: 50,
        select: { styleKeywords: true, gender: true },
      },
    },
  });
  return orgs.map((o: any) => {
    const aesthetics: string[] = Array.from(
      new Set(o.products.flatMap((p: any) => parseArr(p.styleKeywords))),
    );
    const genders: string[] = Array.from(
      new Set(o.products.map((p: any) => p.gender).filter(Boolean)),
    );
    return {
      ...orgSummary(o),
      description: o.description,
      businessType: o.businessType,
      productCount: o._count.products,
      ratingAvg: o.ratingAvg || 0,
      ratingCount: o.ratingCount || 0,
      viewCount: o.viewCount || 0,
      aesthetics,
      genders,
    };
  });
}

export type BrandRankings = {
  trending: BrandSummary[];
  mostFollowed: BrandSummary[];
  topRated: BrandSummary[];
};

// Rankings for the Explore page. We lack a time-windowed activity feed, so
// "trending" is a weighted composite of existing denormalized signals
// (followers, rating quality, views, catalog size). Highly rated requires at
// least one approved review.
export async function getBrandRankings(limit = 12): Promise<BrandRankings> {
  const orgs = await db.organization.findMany({
    where: { isPublished: true, status: { not: 'suspended' }, members: { some: {} } },
    orderBy: [{ followerCount: 'desc' }],
    take: 120,
    include: { _count: { select: { products: { where: { isPublished: true } } } } },
  });

  const base = orgs.map((o: any) => ({
    ...orgSummary(o),
    description: o.description,
    businessType: o.businessType,
    productCount: o._count.products,
    ratingAvg: o.ratingAvg || 0,
    ratingCount: o.ratingCount || 0,
    viewCount: o.viewCount || 0,
  }));

  const score = (b: any) =>
    b.followerCount * 1 +
    b.ratingAvg * b.ratingCount * 5 +
    b.viewCount * 0.2 +
    b.productCount * 2;

  const trending = [...base].sort((a, b) => score(b) - score(a)).slice(0, limit);
  const mostFollowed = [...base].sort((a, b) => b.followerCount - a.followerCount).slice(0, limit);
  const topRated = [...base]
    .filter((b) => b.ratingCount > 0)
    .sort((a, b) => b.ratingAvg - a.ratingAvg || b.ratingCount - a.ratingCount)
    .slice(0, limit);

  // Strip the internal ranking signals so callers get clean BrandSummary[].
  const strip = (list: any[]) =>
    list.map(({ ratingAvg, ratingCount, viewCount, ...rest }) => rest);

  return {
    trending: strip(trending),
    mostFollowed: strip(mostFollowed),
    topRated: strip(topRated),
  };
}

export async function getBrandBySlug(slug: string, userId?: string): Promise<(OrgSummary & { description: string | null; contactEmail: string | null; businessType: string | null; city: string | null; websiteUrl: string | null; products: ProductCardData[] }) | null> {
  const org = await db.organization.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isPublished: true, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 60,
        include: {
          images: { orderBy: { position: 'asc' }, take: 1 },
          organization: {
            select: { id: true, name: true, slug: true, logo: true, banner: true, isVerified: true, tier: true, city: true, followerCount: true },
          },
          _count: { select: { comments: true } },
        },
      },
    },
  });
  if (!org) return null;
  return {
    ...orgSummary(org),
    description: org.description,
    contactEmail: org.contactEmail,
    businessType: org.businessType,
    city: org.city,
    websiteUrl: org.websiteUrl,
    products: userId ? await attachLiked(org.products.map((p) => productCard(p)), userId) : org.products.map((p) => productCard(p)),
  };
}

export async function getFollowState(userId: string, orgId: string): Promise<{ isFollowing: boolean; followerCount: number }> {
  const [follow, org] = await Promise.all([
    db.follow.findUnique({ where: { followerId_organizationId: { followerId: userId, organizationId: orgId } } }),
    db.organization.findUnique({ where: { id: orgId }, select: { followerCount: true } }),
  ]);
  return { isFollowing: Boolean(follow), followerCount: org?.followerCount || 0 };
}

// Attach the current user's like state to a list of product cards in a single query.
async function attachLiked(cards: ProductCardData[], userId: string): Promise<ProductCardData[]> {
  if (cards.length === 0) return cards;
  const liked = await db.like.findMany({
    where: { userId, productId: { in: cards.map((c) => c.id) } },
    select: { productId: true },
  });
  const set = new Set(liked.map((l) => l.productId));
  return cards.map((c) => ({ ...c, liked: set.has(c.id) }));
}

export async function getLikeState(userId: string, productId: string): Promise<{ liked: boolean; likeCount: number }> {
  const [like, product] = await Promise.all([
    db.like.findUnique({ where: { userId_productId: { userId, productId } } }),
    db.product.findUnique({ where: { id: productId }, select: { likeCount: true } }),
  ]);
  return { liked: Boolean(like), likeCount: product?.likeCount || 0 };
}

// ===========================================================================
// CART
// ===========================================================================

export type CartItemData = {
  id: string;
  productId: string;
  name: string;
  image: string | null;
  price: number;
  size: string | null;
  color: string | null;
  quantity: number;
  stock: number;
  slug: string | null;
  currency: string;
};

export async function getCart(userId: string): Promise<{ items: CartItemData[]; subtotal: number; count: number }> {
  const cart = await db.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: { select: { name: true, slug: true, stock: true, currency: true, images: { orderBy: { position: 'asc' }, take: 1 } } },
        },
      },
    },
  });
  if (!cart) return { items: [], subtotal: 0, count: 0 };

  const items: CartItemData[] = cart.items.map((it: any) => ({
    id: it.id,
    productId: it.productId,
    name: it.product.name,
    image: it.product.images[0]?.url ?? null,
    price: it.priceSnapshot,
    size: it.size,
    color: it.color,
    quantity: it.quantity,
    stock: it.product.stock,
    slug: it.product.slug,
    currency: it.product.currency || 'NPR',
  }));

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  return { items, subtotal, count };
}

// ===========================================================================
// BOARDS
// ===========================================================================

// BoardSummary is imported from ./types

export async function getBoards(userId: string): Promise<BoardSummary[]> {
  const boards = await db.board.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { savedItems: true } },
      savedItems: {
        orderBy: { createdAt: 'desc' },
        take: 4,
        include: {
          product: {
            include: {
              images: { orderBy: { position: 'asc' }, take: 1 },
            },
          },
        },
      },
    },
  });
  return boards.map((b: any) => {
    const previewImages: string[] = [];
    b.savedItems.forEach((si: any) => {
      const img = si.product?.images?.[0]?.url;
      if (img) previewImages.push(img);
    });
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      coverImage: b.coverImage,
      type: b.type || 'collection',
      itemCount: b._count.savedItems,
      previewImages,
    };
  });
}

export type BoardDetail = BoardSummary & {
  items: { id: string; note: string | null; product: ProductCardData }[];
};

export async function getBoardById(id: string, userId: string): Promise<BoardDetail | null> {
  const board = await db.board.findFirst({
    where: { id, userId },
    include: {
      savedItems: {
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            include: {
              images: { orderBy: { position: 'asc' }, take: 1 },
              organization: {
                select: { id: true, name: true, slug: true, logo: true, banner: true, isVerified: true, tier: true, city: true, followerCount: true },
              },
            },
          },
        },
      },
    },
  });
  if (!board) return null;

  return {
    id: board.id,
    name: board.name,
    slug: board.slug,
    description: board.description,
    coverImage: board.coverImage,
    type: board.type || 'collection',
    itemCount: board.savedItems.length,
    items: board.savedItems.map((si: any) => ({
      id: si.id,
      note: si.note,
      product: productCard(si.product),
    })),
  };
}

// ===========================================================================
// ORDERS
// ===========================================================================

export type OrderItemView = {
  id: string;
  productName: string;
  productImage: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  price: number;
  currency: string;
};

export type OrderView = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  estimatedDelivery: string | null;
  trackingNumber: string | null;
  courierName: string | null;
  items: OrderItemView[];
  brand: { id: string; name: string; slug: string | null; logo: string | null };
};

function orderView(o: any): OrderView {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus || 'pending',
    totalAmount: o.totalAmount,
    currency: o.currency || 'NPR',
    createdAt: o.createdAt.toISOString(),
    estimatedDelivery: o.estimatedDelivery ? o.estimatedDelivery.toISOString() : null,
    trackingNumber: o.trackingNumber,
    courierName: o.courierName,
    items: o.items.map((it: any) => ({
      id: it.id,
      productName: it.productName || '',
      productImage: it.productImage,
      size: it.size,
      color: it.color,
      quantity: it.quantity,
      price: it.price,
      currency: o.currency || 'NPR',
    })),
    brand: { id: o.organization.id, name: o.organization.name, slug: o.organization.slug, logo: o.organization.logo },
  };
}

export async function getBuyerOrders(userId: string): Promise<OrderView[]> {
  const orders = await db.order.findMany({
    where: { buyerId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
      organization: { select: { id: true, name: true, slug: true, logo: true } },
    },
  });
  return orders.map(orderView);
}

export async function getSellerOrders(orgId: string): Promise<OrderView[]> {
  const orders = await db.order.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
      organization: { select: { id: true, name: true, slug: true, logo: true } },
    },
  });
  return orders.map(orderView);
}

// ===========================================================================
// SELLER HELPERS
// ===========================================================================

export async function getSellerOrg(userId: string): Promise<{ id: string; name: string; slug: string | null; analyticsLocked: boolean; status: string | null } | null> {
  const member = await db.member.findFirst({
    where: { userId, role: { in: ['owner', 'admin', 'member'] } },
    orderBy: { createdAt: 'desc' },
    include: { organization: { select: { id: true, name: true, slug: true, analyticsLocked: true, status: true } } },
  });
  if (!member) return null;
  return {
    id: member.organization.id,
    name: member.organization.name,
    slug: member.organization.slug,
    analyticsLocked: member.organization.analyticsLocked ?? false,
    status: member.organization.status,
  };
}

export type SellerProductView = {
  id: string;
  name: string;
  slug: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isPublished: boolean;
  currency: string;
  image: string | null;
  soldCount: number;
  ratingAvg: number;
  ratingCount: number;
  orderCount: number;
};

export async function getSellerProducts(orgId: string): Promise<SellerProductView[]> {
  const products = await db.product.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
    include: {
      images: { orderBy: { position: 'asc' }, take: 1 },
      _count: { select: { orderItems: true } },
    },
  });
  return products.map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    stock: p.stock,
    isPublished: p.isPublished ?? false,
    currency: p.currency || 'NPR',
    image: p.images[0]?.url ?? null,
    soldCount: p.soldCount || 0,
    ratingAvg: p.ratingAvg || 0,
    ratingCount: p.ratingCount || 0,
    orderCount: p._count.orderItems,
  }));
}

export type SellerStats = {
  revenue: number;
  orders: number;
  pendingOrders: number;
  products: number;
  followers: number;
  views: number;
  avgRating: number;
};

export async function getSellerStats(orgId: string): Promise<SellerStats> {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: {
      followerCount: true,
      viewCount: true,
      _count: { select: { products: true } },
    },
  });
  const [ordersAgg, ratingAgg, pendingOrders] = await Promise.all([
    db.order.aggregate({
      where: { organizationId: orgId },
      _sum: { totalAmount: true },
      _count: true,
    }),
    db.product.aggregate({
      where: { organizationId: orgId },
      _avg: { ratingAvg: true },
      _sum: { ratingCount: true },
    }),
    db.order.count({
      where: { organizationId: orgId, status: { in: ['pending', 'processing', 'packed', 'out_for_delivery'] } },
    }),
  ]);

  return {
    revenue: ordersAgg._sum.totalAmount || 0,
    orders: ordersAgg._count || 0,
    pendingOrders,
    products: org?._count.products || 0,
    followers: org?.followerCount || 0,
    views: org?.viewCount || 0,
    avgRating: ratingAgg._avg.ratingAvg || 0,
  };
}

// ===========================================================================
// BUYER PROFILE
// ===========================================================================

export async function getBuyerProfile(userId: string) {
  const profile = await db.buyerProfile.findUnique({ where: { userId } });
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, image: true, interests: true },
  });
  return { profile, user };
}
