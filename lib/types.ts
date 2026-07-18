// Shared serializable types used by BOTH server (lib/queries.ts) and client
// components. This file must NOT import server-only modules (db, better-auth)
// so it is safe to import into client bundles.

export type OrgSummary = {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
  banner: string | null;
  isVerified: boolean;
  tier: string;
  city: string | null;
  businessType: string | null;
  followerCount: number;
};

export type ProductCardData = {
  id: string;
  name: string;
  slug: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  images: string[];
  styleKeywords: string[];
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  organization: OrgSummary;
  category: string | null;
  tags: string[];
  material: string | null;
  gender: string | null;
  occasion: string[];
  viewCount: number;
  isFeatured: boolean;
  likeCount: number;
  commentCount: number;
  liked?: boolean;
};

export type BoardSummary = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  coverImage: string | null;
  type: string;
  itemCount: number;
  previewImages?: string[];
};

// ─── Shop the Look ────────────────────────────────────────────────────────

export type LookHotspotData = {
  id: string;
  productId: string;
  left: number; // % from left of cover image
  top: number; // % from top of cover image
  position: number;
  label: string | null;
  product: {
    id: string;
    name: string;
    slug: string | null;
    price: number;
    compareAtPrice: number | null;
    currency: string;
    image: string | null;
    stock: number;
  };
};

export type LookSummaryHotspot = {
  id: string;
  left: number;
  top: number;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string | null;
    price: number;
    compareAtPrice: number | null;
    currency: string;
    image: string | null;
    stock: number;
  };
};

export type LookSummary = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  coverImage: string;
  imageWidth: number | null;
  imageHeight: number | null;
  bundlePrice: number | null;
  bundleDiscount: number | null;
  isPublished: boolean;
  isFeatured: boolean;
  viewCount: number;
  likeCount: number;
  hotspotCount: number;
  hotspots: LookSummaryHotspot[];
  totalPrice: number; // sum of linked product prices
  createdAt: string;
};

export type LookDetail = Omit<LookSummary, 'hotspots'> & {
  hotspots: LookHotspotData[];
};
