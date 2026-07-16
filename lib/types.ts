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
};

export type BoardSummary = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  coverImage: string | null;
  type: string;
  itemCount: number;
};
