// Ported 1:1 from server/db_tools.py.
// Read-only catalog access for the chat tools. Uses `pg` (node-postgres) with a
// single lazily-created, read-only connection pool.
//
// The three read-only guarantees from the Python original are preserved:
//   1. Every query is a hand-written SELECT — nothing can mutate data.
//   2. All user values travel through $1, $2, ... placeholders.
//   3. Every connection sets default_transaction_read_only = on.

import { Pool } from "pg";

// Default connection that matches the local docker-compose Postgres. Used only as
// a fallback when no DB url is configured anywhere.
const DEFAULT_DATABASE_URL =
  "postgresql://dobaeni:dobaeni@localhost:5432/dobaeni";

// Falls back to DATABASE_URL if a dedicated agent url isn't set. Production
// deployments should set AGENT_DATABASE_URL to a read-only role.
function resolveDbUrl(): string {
  return (
    process.env.AGENT_DATABASE_URL ||
    process.env.DATABASE_URL ||
    DEFAULT_DATABASE_URL
  );
}

// Used to turn a product/brand slug into a link the chat UI can render.
const SITE_BASE_URL = (process.env.SITE_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

let _pool: Pool | null = null;

async function getPool(): Promise<Pool> {
  if (_pool === null) {
    const dbUrl = resolveDbUrl();
    _pool = new Pool({
      connectionString: dbUrl,
      min: 0,
      max: 2,
      idleTimeoutMillis: 30_000,
      // Defense-in-depth: force every session read-only so a future bug here
      // gets rejected by Postgres with a permission error, not a silent mutation.
      options: "-c default_transaction_read_only=on",
    });
  }
  return _pool;
}

function productUrl(slug: string): string {
  return `${SITE_BASE_URL}/product/${slug}`;
}

function brandUrl(slug: string): string {
  return `${SITE_BASE_URL}/brand/${slug}`;
}

function parseJsonList(raw: unknown): string[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed.map((x) => String(x)) : [];
  } catch {
    return [];
  }
}

function categoryTerms(category: string): string[] {
  const base = category.trim();
  if (!base) return [];
  const terms = new Set<string>([base]);
  if (base.toLowerCase().endsWith("s") && base.length > 2) {
    const s1 = base.slice(0, -1); // Sneakers -> Sneaker, Dresses -> Dresse
    terms.add(s1);
    if (s1.toLowerCase().endsWith("e") && s1.length > 2) {
      terms.add(s1.slice(0, -1)); // Dresse -> Dress
    }
  } else {
    terms.add(base + "s"); // Kurta -> Kurtas
  }
  return [...terms].filter(Boolean);
}

// Fixed, whitelisted ORDER BY fragments — sort_by is validated against these
// keys before use, so the SQL never contains anything from the model.
const PRODUCT_SORT: Record<string, string> = {
  trending: "trend_score DESC",
  rating: 'p."ratingAvg" DESC NULLS LAST, p."ratingCount" DESC',
  newest: 'p."createdAt" DESC',
  price_low: "p.price ASC",
  price_high: "p.price DESC",
};

const BRAND_SORT: Record<string, string> = {
  trending: "trend_score DESC",
  most_followed: 'o."followerCount" DESC',
  top_rated: 'o."ratingAvg" DESC NULLS LAST, o."ratingCount" DESC',
};

// Hard filters every catalog query must satisfy.
const PRODUCT_HARD_WHERE = [
  'p."isPublished" = true',
  'p."isActive" = true',
  "p.stock > 0",
  "p.slug IS NOT NULL",
  'o."isPublished" = true',
  "o.status IS DISTINCT FROM 'suspended'",
];

// Optional product filters, ordered by how aggressively they get dropped when a
// search comes back empty (same as the Python original).
const PRODUCT_RELAX_ORDER = [
  "occasion",
  "category",
  "gender",
  "min_price",
  "max_price",
  "aesthetics",
  "query",
];

const BRAND_HARD_WHERE = [
  'o."isPublished" = true',
  "o.status IS DISTINCT FROM 'suspended'",
  "EXISTS (SELECT 1 FROM member m WHERE m.\"organizationId\" = o.id)",
  "o.slug IS NOT NULL",
];

const BRAND_RELAX_ORDER = ["aesthetic", "business_type", "city", "name"];

type Builder = (i: number) => { clause: string; next: number; params: unknown[] };

function clampInt(v: unknown, fallback: number, lo: number, hi: number): number {
  const n = Math.max(lo, Math.min(hi, parseInt(String(v ?? fallback), 10) || fallback));
  return n;
}

// ---------------------------------------------------------------------------
// find_products
// ---------------------------------------------------------------------------

export async function findProducts(args: {
  query?: string | null;
  aesthetics?: string[] | null;
  category?: string | null;
  gender?: string | null;
  occasion?: string | null;
  min_price?: number | null;
  max_price?: number | null;
  sort_by?: string;
  limit?: number;
}): Promise<Record<string, unknown>> {
  const limit = clampInt(args.limit, 6, 1, 12);
  const sortBy = args.sort_by && args.sort_by in PRODUCT_SORT ? args.sort_by! : "trending";

  const optionals: { label: string; build: Builder }[] = [];

  if (args.occasion) {
    const oc = `%${args.occasion}%`;
    optionals.push({
      label: "occasion",
      build: (i) => ({ clause: "p.occasion::text ILIKE $" + i, next: i + 1, params: [oc] }),
    });
  }

  if (args.category) {
    const terms = categoryTerms(args.category);
    optionals.push({
      label: "category",
      build: (i) => {
        const clauses: string[] = [];
        const params: unknown[] = [];
        let idx = i;
        for (const t of terms) {
          const ph = `%${t}%`;
          for (let k = 0; k < 4; k++) params.push(ph);
          clauses.push(
            `(c.name ILIKE $${idx} OR p.name ILIKE $${idx + 1} ` +
              `OR p.tags::text ILIKE $${idx + 2} OR p."styleKeywords"::text ILIKE $${idx + 3})`
          );
          idx += 4;
        }
        return { clause: `(${clauses.join(" OR ")})`, next: idx, params };
      },
    });
  }

  if (args.min_price != null) {
    const mp = parseFloat(String(args.min_price));
    optionals.push({
      label: "min_price",
      build: (i) => ({ clause: "p.price >= $" + i, next: i + 1, params: [mp] }),
    });
  }

  if (args.max_price != null) {
    const xp = parseFloat(String(args.max_price));
    optionals.push({
      label: "max_price",
      build: (i) => ({ clause: "p.price <= $" + i, next: i + 1, params: [xp] }),
    });
  }

  if (args.gender) {
    const g = args.gender.toLowerCase();
    optionals.push({
      label: "gender",
      build: (i) => ({ clause: "LOWER(p.gender) = $" + i, next: i + 1, params: [g] }),
    });
  }

  if (args.aesthetics && args.aesthetics.length) {
    const tags = args.aesthetics.slice(0, 5);
    optionals.push({
      label: "aesthetics",
      build: (i) => {
        const clauses: string[] = [];
        const params: unknown[] = [];
        let idx = i;
        for (const tag of tags) {
          params.push(`%${tag}%`);
          clauses.push(`p."styleKeywords"::text ILIKE $${idx}`);
          idx += 1;
        }
        return { clause: `(${clauses.join(" OR ")})`, next: idx, params };
      },
    });
  }

  if (args.query) {
    const q = `%${args.query}%`;
    optionals.push({
      label: "query",
      build: (i) => ({
        clause:
          `(p.name ILIKE $${i} OR p.description ILIKE $${i} ` +
          `OR p."styleKeywords"::text ILIKE $${i})`,
        next: i + 1,
        params: [q],
      }),
    });
  }

  // Always respect PRODUCT_RELAX_ORDER for drop priority.
  const orderIndex: Record<string, number> = {};
  for (const { label } of optionals) orderIndex[label] = PRODUCT_RELAX_ORDER.indexOf(label);
  optionals.sort((a, b) => orderIndex[a.label] - orderIndex[b.label]);

  async function run(active: Set<string>): Promise<any[]> {
    const where = [...PRODUCT_HARD_WHERE];
    const params: unknown[] = [];
    let idx = 1;
    for (const { label, build } of optionals) {
      if (!active.has(label)) continue;
      const r = build(idx);
      where.push(r.clause);
      params.push(...r.params);
      idx = r.next;
    }
    params.push(limit);
    const sql = `
      SELECT
        p.id, p.name, p.slug, p.price,
        p."compareAtPrice" AS compare_at_price,
        p.currency, p."styleKeywords" AS style_keywords, p.gender, p.material,
        p."ratingAvg" AS rating_avg, p."ratingCount" AS rating_count,
        p."soldCount" AS sold_count, p."likeCount" AS like_count,
        o.name AS brand_name, o.slug AS brand_slug, o.tier AS brand_tier,
        o."isVerified" AS brand_verified,
        (SELECT pi.url FROM "productImage" pi WHERE pi."productId" = p.id
          ORDER BY pi.position ASC LIMIT 1) AS image,
        (p."soldCount" * 3 + p."likeCount" * 1 + p."viewCount" * 0.05
          + p."ratingAvg" * p."ratingCount" * 2) AS trend_score
      FROM product p
      JOIN organization o ON o.id = p."organizationId"
      LEFT JOIN category c ON c.id = p."categoryId"
      WHERE ${where.join(" AND ")}
      ORDER BY ${PRODUCT_SORT[sortBy]}
      LIMIT $${params.length}
    `;
    const pool = await getPool();
    const res = await pool.query(sql, params);
    return res.rows;
  }

  const relaxed: string[] = [];
  let fallback = false;
  try {
    const active = new Set(optionals.map((o) => o.label));
    let rows = await run(active);
    const dropQueue = optionals.map((o) => o.label); // already in relax order
    while (!rows.length && dropQueue.length) {
      const dropped = dropQueue.shift()!;
      relaxed.push(dropped);
      active.delete(dropped);
      rows = await run(active);
    }
    if (!rows.length) {
      fallback = true;
      rows = await run(new Set());
    }

    const results = rows.map((r: any) => ({
      name: r.name,
      brand: r.brand_name,
      brand_slug: r.brand_slug,
      brand_verified: Boolean(r.brand_verified),
      brand_tier: r.brand_tier,
      price: r.price,
      compare_at_price: r.compare_at_price,
      currency: r.currency || "NPR",
      rating_avg: Math.round((r.rating_avg || 0) * 10) / 10,
      rating_count: r.rating_count || 0,
      sold_count: r.sold_count || 0,
      style_keywords: parseJsonList(r.style_keywords),
      gender: r.gender,
      material: r.material,
      image: r.image,
      url: productUrl(r.slug),
      brand_url: brandUrl(r.brand_slug),
    }));

    let note = "";
    if (fallback) {
      note = "No items matched your filters; showing popular products instead.";
    } else if (relaxed.length) {
      const FRIENDLY: Record<string, string> = {
        occasion: "occasion",
        category: "category/type",
        gender: "gender",
        min_price: "minimum price",
        max_price: "maximum price",
        aesthetics: "style",
        query: "your search words",
      };
      const dropped = relaxed.map((x) => FRIENDLY[x] || x).join(", ");
      note = "No exact match — broadened the search by ignoring: " + dropped + ".";
    }

    return {
      status: "success",
      count: results.length,
      results,
      relaxed,
      fallback,
      note,
    };
  } catch (exc: any) {
    return { status: "error", error_message: `Catalog lookup failed: ${exc?.message || exc}` };
  }
}

// ---------------------------------------------------------------------------
// find_brands
// ---------------------------------------------------------------------------

export async function findBrands(args: {
  aesthetic?: string | null;
  business_type?: string | null;
  city?: string | null;
  name?: string | null;
  sort_by?: string;
  limit?: number;
}): Promise<Record<string, unknown>> {
  const limit = clampInt(args.limit, 5, 1, 10);
  const sortBy = args.sort_by && args.sort_by in BRAND_SORT ? args.sort_by! : "trending";

  const optionals: { label: string; build: Builder }[] = [];

  if (args.name) {
    const n = `%${args.name}%`;
    optionals.push({
      label: "name",
      build: (i) => ({ clause: "o.name ILIKE $" + i, next: i + 1, params: [n] }),
    });
  }

  if (args.aesthetic) {
    const a = `%${args.aesthetic}%`;
    optionals.push({
      label: "aesthetic",
      build: (i) => ({
        clause:
          'EXISTS (SELECT 1 FROM product pp WHERE pp."organizationId" = o.id ' +
          `AND pp."isPublished" = true AND pp."styleKeywords"::text ILIKE $${i})`,
        next: i + 1,
        params: [a],
      }),
    });
  }

  if (args.business_type) {
    const bt = args.business_type;
    optionals.push({
      label: "business_type",
      build: (i) => ({ clause: 'o."businessType" ILIKE $' + i, next: i + 1, params: [bt] }),
    });
  }

  if (args.city) {
    const ci = `%${args.city}%`;
    optionals.push({
      label: "city",
      build: (i) => ({ clause: "o.city ILIKE $" + i, next: i + 1, params: [ci] }),
    });
  }

  const orderIndex: Record<string, number> = {};
  for (const { label } of optionals) orderIndex[label] = BRAND_RELAX_ORDER.indexOf(label);
  optionals.sort((a, b) => orderIndex[a.label] - orderIndex[b.label]);

  async function run(active: Set<string>): Promise<any[]> {
    const where = [...BRAND_HARD_WHERE];
    const params: unknown[] = [];
    let idx = 1;
    for (const { label, build } of optionals) {
      if (!active.has(label)) continue;
      const r = build(idx);
      where.push(r.clause);
      params.push(...r.params);
      idx = r.next;
    }
    if (sortBy === "top_rated") where.push('o."ratingCount" > 0');
    params.push(limit);
    const sql = `
      SELECT
        o.id, o.name, o.slug, o.logo, o.banner, o.description,
        o."businessType" AS business_type, o.city, o.tier,
        o."isVerified" AS is_verified, o."followerCount" AS follower_count,
        o."ratingAvg" AS rating_avg, o."ratingCount" AS rating_count,
        (SELECT COUNT(*) FROM product pp WHERE pp."organizationId" = o.id
          AND pp."isPublished" = true) AS product_count,
        (o."followerCount" * 1 + o."ratingAvg" * o."ratingCount" * 5
          + o."viewCount" * 0.2
          + (SELECT COUNT(*) FROM product pp WHERE pp."organizationId" = o.id
            AND pp."isPublished" = true) * 2) AS trend_score
      FROM organization o
      WHERE ${where.join(" AND ")}
      ORDER BY ${BRAND_SORT[sortBy]}
      LIMIT $${params.length}
    `;
    const pool = await getPool();
    const res = await pool.query(sql, params);
    return res.rows;
  }

  const relaxed: string[] = [];
  let fallback = false;
  try {
    const active = new Set(optionals.map((o) => o.label));
    let rows = await run(active);
    const dropQueue = optionals.map((o) => o.label);
    while (!rows.length && dropQueue.length) {
      const dropped = dropQueue.shift()!;
      relaxed.push(dropped);
      active.delete(dropped);
      rows = await run(active);
    }
    if (!rows.length) {
      fallback = true;
      rows = await run(new Set());
    }

    const results = rows.map((r: any) => ({
      name: r.name,
      business_type: r.business_type,
      city: r.city,
      tier: r.tier,
      is_verified: Boolean(r.is_verified),
      follower_count: r.follower_count || 0,
      rating_avg: Math.round((r.rating_avg || 0) * 10) / 10,
      rating_count: r.rating_count || 0,
      product_count: r.product_count || 0,
      description: r.description,
      url: brandUrl(r.slug),
    }));

    let note = "";
    if (fallback) {
      note = "No brands matched your filters; showing popular brands instead.";
    } else if (relaxed.length) {
      note = "No exact match — broadened the search by ignoring: " + relaxed.join(", ") + ".";
    }

    return {
      status: "success",
      count: results.length,
      results,
      relaxed,
      fallback,
      note,
    };
  } catch (exc: any) {
    return { status: "error", error_message: `Brand lookup failed: ${exc?.message || exc}` };
  }
}
