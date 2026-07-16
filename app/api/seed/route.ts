import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── helpers ───────────────────────────────────────────────
function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function toJsonArray(v: unknown): string | null {
  if (Array.isArray(v) && v.length) return JSON.stringify(v);
  if (typeof v === 'string' && v.trim()) return v;
  return null;
}

const rnd = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[rnd(0, arr.length - 1)];
const pickSome = <T,>(arr: T[], n: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(rnd(0, copy.length - 1), 1)[0]);
  }
  return out;
};
const round10 = (n: number) => Math.round(n / 10) * 10;

const SEED_PASS = 'Dobaeni@1234';
// 2-digit up to 99, 3-digit from 100 — matches scripts/seed-images.ts naming.
const img = (i: number) => `/seed/img-${String(i).padStart(i <= 99 ? 2 : 3, '0')}.jpg`;
const KTM_LAT = 27.7172;
const KTM_LNG = 85.324;

// ── brand + product-theme definitions ────────────────────
type Theme = {
  adjectives: string[];
  nouns: string[];
  materials: string[];
  colors: string[];
  sizes: string[];
  occasions: string[];
  aesthetics: string[];
  genders: string[];
  priceMin: number;
  priceMax: number;
};

type Brand = {
  storeName: string;
  ownerName: string;
  emailDomain: string;
  businessType: 'Boutique' | 'Designer' | 'Streetwear' | 'Thrift' | 'Label' | 'Handmade';
  tier: 'silver' | 'gold' | 'platinum';
  city: string;
  description: string;
  shippingPolicy: string;
  returnPolicy: string;
  productCount: number;
  theme: Theme;
};

const BRANDS: Brand[] = [
  {
    storeName: 'Maison Lustre',
    ownerName: 'Anika Shrestha',
    emailDomain: 'maisonlustre',
    businessType: 'Boutique',
    tier: 'gold',
    city: 'Kathmandu',
    description:
      'Quiet-luxury wardrobe staples for the discerning. Old-money tailoring meets Nepali craftsmanship.',
    shippingPolicy: 'Free insured shipping across Nepal on orders above रू 5,000. Dispatched within 2 business days.',
    returnPolicy: '14-day returns on unworn items with tags attached. Exchange for size free of charge.',
    productCount: 12,
    theme: {
      adjectives: ['Cashmere', 'Silk', 'Tailored', 'Heritage', 'Ivory', 'Pleated', 'Structured', 'Oversized'],
      nouns: ['Blazer', 'Trousers', 'Wrap Dress', 'Knit Sweater', 'Trench Coat', 'Slip Skirt', 'Button-Down', 'Cardigan'],
      materials: ['Cashmere', 'Mulberry Silk', 'Merino Wool', 'Cotton Poplin', 'Linen'],
      colors: ['Ivory', 'Camel', 'Charcoal', 'Navy', 'Sage', 'Black'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      occasions: ['Work', 'Date Night', 'Travel', 'Party'],
      aesthetics: ['Old Money', 'Minimalist', 'Clean Girl', 'Office Wear'],
      genders: ['female'],
      priceMin: 3500,
      priceMax: 18500,
    },
  },
  {
    storeName: 'Neon Kathmandu',
    ownerName: 'Rohan Maharjan',
    emailDomain: 'neonktm',
    businessType: 'Streetwear',
    tier: 'silver',
    city: 'Lalitpur',
    description:
      'Loud, layered, unapologetic streetwear engineered for the city. Y2K energy, made to be seen.',
    shippingPolicy: 'Flat रू 150 shipping nationwide. Same-day dispatch from Patan for orders before 2pm.',
    returnPolicy: '7-day return window. Items must be unworn with original packaging.',
    productCount: 12,
    theme: {
      adjectives: ['Oversized', 'Distressed', 'Metallic', 'Holographic', 'Baggy', 'Tech', 'Graffiti', 'Chunky'],
      nouns: ['Hoodie', 'Cargo Pants', 'Graphic Tee', 'Bomber Jacket', 'Jorts', 'Bucket Hat', 'Platform Sneakers', 'Crossbody Bag'],
      materials: ['Heavyweight Cotton', 'Nylon', 'Mesh', 'Denim', 'Fleece'],
      colors: ['Neon Green', 'Hot Pink', 'Black', 'Silver', 'Electric Blue', 'Off-White'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      occasions: ['Party', 'Daily', 'Travel'],
      aesthetics: ['Y2K', 'Streetwear', 'Athleisure', 'Avant-Garde'],
      genders: ['unisex'],
      priceMin: 1200,
      priceMax: 8900,
    },
  },
  {
    storeName: 'Himalayan Threads',
    ownerName: 'Priya Tamang',
    emailDomain: 'himalayanthreads',
    businessType: 'Thrift',
    tier: 'gold',
    city: 'Pokhara',
    description:
      'Curated vintage and bohemian pieces with a story in every seam. Slow fashion from the mountains.',
    shippingPolicy: 'Carbon-neutral shipping across Nepal. Rag-wrapped and hand-delivered where possible.',
    returnPolicy: 'Store credit only on vintage finds — every piece is one of one.',
    productCount: 11,
    theme: {
      adjectives: ['Embroidered', 'Flowy', 'Sun-Faded', 'Patchwork', 'Crochet', 'Earthy', 'Boho', 'Retro'],
      nouns: ['Maxi Dress', 'Kimono', 'Flared Jeans', 'Knit Vest', 'Suede Bag', 'Scarf', 'Prairie Top', 'Wide-brim Hat'],
      materials: ['Cotton', 'Suede', 'Viscose', 'Wool', 'Linen'],
      colors: ['Rust', 'Ochre', 'Olive', 'Cream', 'Terracotta', 'Mustard'],
      sizes: ['S', 'M', 'L', 'One Size'],
      occasions: ['Festive', 'Travel', 'Daily', 'Date Night'],
      aesthetics: ['Boho', 'Vintage', 'Cottagecore', 'Korean'],
      genders: ['female', 'unisex'],
      priceMin: 900,
      priceMax: 6400,
    },
  },
  {
    storeName: 'Atelier Sena',
    ownerName: 'Sena Rai',
    emailDomain: 'ateliersena',
    businessType: 'Designer',
    tier: 'platinum',
    city: 'Kathmandu',
    description:
      'Avant-garde designer label blending Nepali textiles with sculptural, architectural silhouettes.',
    shippingPolicy: 'Complimentary white-glove delivery in Kathmandu Valley. Nationwide insured courier.',
    returnPolicy: 'Made-to-order pieces are final sale. Ready-to-wear eligible for 10-day exchange.',
    productCount: 10,
    theme: {
      adjectives: ['Sculptural', 'Deconstructed', 'Hand-Woven', 'Asymmetric', 'Draped', 'Monochrome', 'Architectural', 'Nomadic'],
      nouns: ['Gown', 'Cape Blazer', 'Wide Trouser', 'Bias Slip', 'Statement Coat', 'Wrap Top', 'Pleat Skirt', 'Evening Jacket'],
      materials: ['Handwoven Dhaka', 'Silk Crepe', 'Wool Felt', 'Organic Cottom', 'Burmese Lace'],
      colors: ['Obsidian', 'Bone', 'Saffron', 'Deep Teal', 'Plum', 'Stone'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'Custom'],
      occasions: ['Party', 'Wedding', 'Work', 'Date Night'],
      aesthetics: ['Avant-Garde', 'Office Wear', 'Minimalist', 'Preppy'],
      genders: ['female'],
      priceMin: 4800,
      priceMax: 24000,
    },
  },
  {
    storeName: 'Kathmandu Collective',
    ownerName: 'Aayush Thapa',
    emailDomain: 'ktmcollective',
    businessType: 'Handmade',
    tier: 'silver',
    city: 'Bhaktapur',
    description:
      'Artisan-made everyday essentials. Korean-minimalist basics crafted by local makers.',
    shippingPolicy: 'Free shipping over रू 3,000. Handmade-to-order, 3–5 day lead time.',
    returnPolicy: '30-day easy returns. Damaged-on-arrival replaced at no cost.',
    productCount: 11,
    theme: {
      adjectives: ['Soft', 'Boxy', 'Ribbed', 'Garment-Dyed', 'Relaxed', 'Everyday', 'Clean', 'Cropped'],
      nouns: ['Crew Tee', 'Chino', 'Cardigan', 'Polo', 'Lounge Pant', 'Oxford Shirt', 'Knit Polo', 'Tote Bag'],
      materials: ['Combed Cotton', 'Lambswool', 'Linen Blend', 'French Terry', 'Corduroy'],
      colors: ['Ecru', 'Slate', 'Sand', 'Clay', 'Sky', 'Black'],
      sizes: ['S', 'M', 'L', 'XL'],
      occasions: ['Daily', 'Work', 'Lounge', 'Travel'],
      aesthetics: ['Korean', 'Clean Girl', 'Minimalist', 'Preppy'],
      genders: ['unisex'],
      priceMin: 800,
      priceMax: 5200,
    },
  },
  {
    storeName: 'Indus Rose',
    ownerName: 'Meera Kapoor',
    emailDomain: 'indusrose',
    businessType: 'Label',
    tier: 'platinum',
    city: 'Kathmandu',
    description:
      'Subcontinental fusionwear — hand-embroidered silhouettes bridging Kathmandu and Delhi.',
    shippingPolicy: 'Insured courier nationwide. Custom pieces ship in 7–10 days.',
    returnPolicy: 'Size exchanges free within 10 days. Embroidery defects replaced.',
    productCount: 12,
    theme: {
      adjectives: ['Hand-Embroidered', 'Anarkali', 'Mirror-Work', 'Organza', 'Bordered', 'Festive', 'Regal', 'Flowy'],
      nouns: ['Lehenga', 'Kurti', 'Saree Blouse', 'Sharara', 'Palazzo Set', 'Dupatta', 'Indo-Western Gown', 'Crop Jacket'],
      materials: ['Banarasi Silk', 'Chiffon', 'Georgette', 'Cotton Silk', 'Velvet'],
      colors: ['Maroon', 'Gold', 'Magenta', 'Teal', 'Ivory', 'Emerald'],
      sizes: ['S', 'M', 'L', 'XL', 'Custom'],
      occasions: ['Wedding', 'Festive', 'Party', 'Date Night'],
      aesthetics: ['Preppy', 'Office Wear', 'Vintage', 'Avant-Garde'],
      genders: ['female'],
      priceMin: 3200,
      priceMax: 21000,
    },
  },
  {
    storeName: 'Terai Weaves',
    ownerName: 'Binita Yadav',
    emailDomain: 'teraiweaves',
    businessType: 'Handmade',
    tier: 'gold',
    city: 'Janakpur',
    description:
      'Heritage handlooms from the Terai plains — natural dyes, slow-made, one of one.',
    shippingPolicy: 'Plastic-free shipping. Handwoven-to-order, 5–8 day lead time.',
    returnPolicy: 'Store credit on unique weaves. Quality issues refunded in full.',
    productCount: 11,
    theme: {
      adjectives: ['Handloom', 'Naturally-Dyed', 'Matka', ' earthy', 'Rustic', 'Breathable', 'Heritage', 'Coarse'],
      nouns: ['Sari', 'Dhoti Pant', 'Kurta', 'Stole', 'Throw Blanket', 'Tunic', 'Wrap Skirt', 'Rug'],
      materials: ['Cotton', 'Jute', 'Silk', 'Linen', 'Wool'],
      colors: ['Indigo', 'Turmeric', 'Terracotta', 'Madder', 'Charcoal', 'Cream'],
      sizes: ['S', 'M', 'L', 'One Size'],
      occasions: ['Daily', 'Festive', 'Travel', 'Work'],
      aesthetics: ['Boho', 'Cottagecore', 'Vintage', 'Korean'],
      genders: ['female', 'unisex'],
      priceMin: 1100,
      priceMax: 7800,
    },
  },
  {
    storeName: 'Everest Street Co.',
    ownerName: 'Saugat Bista',
    emailDomain: 'evereststreet',
    businessType: 'Streetwear',
    tier: 'silver',
    city: 'Kathmandu',
    description:
      'High-altitude streetwear. Tech fabrics, alpine graphics, built for the city and the trail.',
    shippingPolicy: 'Flat रू 120 shipping nationwide. Dispatch next business day.',
    returnPolicy: '14-day returns on unworn gear with tags.',
    productCount: 11,
    theme: {
      adjectives: ['Tech', 'Waterproof', 'Quilted', 'Reflective', 'Trail-Ready', 'Boxy', 'Layered', 'Alpine'],
      nouns: ['Shell Jacket', 'Cargo', 'Puffer', 'Track Pant', 'Beanie', 'Utility Vest', 'Trail Sneaker', 'Backpack'],
      materials: ['Ripstop Nylon', 'Gore-Tex', 'Fleece', 'Cordura', 'Mesh'],
      colors: ['Slate', 'Orange', 'Black', 'Olive', 'Ice Blue', 'Sand'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      occasions: ['Daily', 'Travel', 'Party'],
      aesthetics: ['Streetwear', 'Athleisure', 'Y2K', 'Avant-Garde'],
      genders: ['unisex'],
      priceMin: 1500,
      priceMax: 9600,
    },
  },
  {
    storeName: 'Luxe Atelier',
    ownerName: 'Tara Gurung',
    emailDomain: 'luxeatelier',
    businessType: 'Designer',
    tier: 'platinum',
    city: 'Lalitpur',
    description:
      'After-dark couture. Gothic-leaning eveningwear with razor-sharp tailoring.',
    shippingPolicy: 'White-glove delivery in the Valley. Nationwide by insured courier.',
    returnPolicy: 'Final sale on made-to-measure. Ready pieces exchange in 7 days.',
    productCount: 10,
    theme: {
      adjectives: ['Couture', 'Sequinned', 'Sheer', 'Sharp', 'Noir', 'Draped', 'Sculpted', 'Velvet'],
      nouns: ['Evening Gown', 'Blazer Dress', 'Corset Top', 'Wide-Leg Trouser', 'Cape', 'Slip Dress', 'Tailored Vest', 'Moto Jacket'],
      materials: ['Silk Mikado', 'Velvet', 'Tulle', 'Satin', 'Leather'],
      colors: ['Black', 'Onyx', 'Wine', 'Silver', 'Plum', 'Emerald'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'Custom'],
      occasions: ['Party', 'Wedding', 'Date Night'],
      aesthetics: ['Gothic', 'Avant-Garde', 'Minimalist', 'Office Wear'],
      genders: ['female'],
      priceMin: 5200,
      priceMax: 26000,
    },
  },
  {
    storeName: 'Nari Nest',
    ownerName: 'Samikshya Joshi',
    emailDomain: 'narinnest',
    businessType: 'Boutique',
    tier: 'gold',
    city: 'Pokhara',
    description:
      'Soft, romantic everyday wear for her. Coquette bows meet clean-girl minimalism.',
    shippingPolicy: 'Free shipping over रू 2,500. Same-week dispatch.',
    returnPolicy: '21-day easy returns on unworn pieces.',
    productCount: 12,
    theme: {
      adjectives: ['Bow-Detail', 'Ruffle', 'Pastel', 'Knit', 'Prairie', 'Crochet', 'Soft', 'Frilly'],
      nouns: ['Mini Dress', 'Cardigan', 'Puf-Sleeve Top', 'Skort', 'Baby-Doll Top', 'Knit Set', 'Hair Bow', 'Slip Skirt'],
      materials: ['Cotton', 'Merino', 'Chiffon', 'Lace', 'Ribbed Knit'],
      colors: ['Blush', 'Lilac', 'Cream', 'Baby Blue', 'Butter', 'White'],
      sizes: ['XS', 'S', 'M', 'L'],
      occasions: ['Date Night', 'Daily', 'Party', 'Travel'],
      aesthetics: ['Coquette', 'Clean Girl', 'Minimalist', 'Korean'],
      genders: ['female'],
      priceMin: 1400,
      priceMax: 7400,
    },
  },
];

// ── core seed routine (pure Prisma — no auth API, no email) ──
// nextImg() returns the next UNIQUE seed image url (never re-used, even across runs).
async function seedBrand(brand: Brand, nextImg: () => string) {
  const email = `${brand.emailDomain}@dobaeni.seed`;

  // Idempotency: skip if this seed seller already exists.
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { storeName: brand.storeName, skipped: true, reason: 'user already exists' };
  }

  const userId = randomUUID();
  const orgId = randomUUID();
  const slug = slugify(brand.storeName);

  // 1) user (seller, verified, onboarding complete)
  await db.user.create({
    data: {
      id: userId,
      name: brand.ownerName,
      email,
      emailVerified: true,
      role: 'seller',
      onboardingCompleted: true,
      interests: toJsonArray(pickSome(brand.theme.aesthetics, 3)),
    },
  });

  // 2) credential account (dummy password — sellers are showcase-only)
  await db.account.create({
    data: {
      id: randomUUID(),
      userId,
      accountId: email,
      providerId: 'credential',
      password: SEED_PASS,
    },
  });

  // 3) organization with the full brand profile
  await db.organization.create({
    data: {
      id: orgId,
      name: brand.storeName,
      slug,
      logo: nextImg(),
      banner: nextImg(),
      description: brand.description,
      contactEmail: email,
      contactPhone: `+977-98${rnd(10000000, 99999999)}`,
      legalName: brand.storeName,
      address: `${rnd(1, 480)} ${pick(['Durbar Marg', 'Jhamel', 'Thamel', 'Baluwatar', 'Sanepa'])}`,
      city: brand.city,
      country: 'Nepal',
      businessType: brand.businessType,
      websiteUrl: `https://${brand.emailDomain}.com`,
      socialLinks: JSON.stringify({
        instagram: `https://instagram.com/${brand.emailDomain}`,
        tiktok: `https://tiktok.com/@${brand.emailDomain}`,
        facebook: `https://facebook.com/${brand.emailDomain}`,
      }),
      establishedYear: rnd(2015, 2023),
      taxId: `TAX-${rnd(10000, 99999)}`,
      verificationStatus: 'verified',
      isVerified: true,
      isPublished: true,
      status: 'active',
      tier: brand.tier,
      shippingPolicy: brand.shippingPolicy,
      returnPolicy: brand.returnPolicy,
      latitude: KTM_LAT + (Math.random() - 0.5) * 0.1,
      longitude: KTM_LNG + (Math.random() - 0.5) * 0.1,
    },
  });

  // 4) owner membership (what getSellerOrg looks up)
  await db.member.create({
    data: {
      id: randomUUID(),
      organizationId: orgId,
      userId,
      role: 'owner',
    },
  });

  // 5) products
  const t = brand.theme;
  for (let i = 0; i < brand.productCount; i++) {
    const name = `${pick(t.adjectives)} ${pick(t.nouns)}`;
    const price = round10(rnd(t.priceMin, t.priceMax));
    const hasCompare = Math.random() < 0.55;
    const compareAtPrice = hasCompare ? round10(price * (1.2 + Math.random() * 0.5)) : null;
    const imageCount = Math.random() < 0.5 ? 2 : 1;
    const images: string[] = [];
    for (let k = 0; k < imageCount; k++) {
      images.push(nextImg());
    }

    await db.product.create({
      data: {
        organizationId: orgId,
        name,
        slug: `${slugify(name) || 'product'}-${randomUUID().slice(0, 4)}`,
        description: `${name} from ${brand.storeName}. ${pick([
          'A wardrobe essential cut for effortless everyday wear.',
          'Limited run — crafted in small batches by our studio.',
          'Designed in Nepal, made to last beyond seasons.',
          'A modern silhouette with a heritage twist.',
          'Soft-hand feel, structured enough to dress up or down.',
        ])}`,
        price,
        compareAtPrice,
        currency: 'NPR',
        stock: rnd(4, 90),
        sizes: toJsonArray(t.sizes),
        colors: toJsonArray(pickSome(t.colors, rnd(1, 3))),
        styleKeywords: toJsonArray(pickSome(t.aesthetics, rnd(1, 3))),
        gender: pick(t.genders),
        occasion: toJsonArray(pickSome(t.occasions, rnd(1, 3))),
        material: pick(t.materials),
        tags: toJsonArray(pickSome([...t.aesthetics, ...t.nouns], rnd(1, 3))),
        isPublished: true,
        images: { create: images.map((url, i) => ({ url, position: i })) },
      },
    });
  }

  return {
    storeName: brand.storeName,
    email,
    orgSlug: slug,
    tier: brand.tier,
    products: brand.productCount,
    sampleImages: [],
  };
}

export async function POST(_req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && _req.nextUrl.searchParams.get('confirm') !== '1') {
    return NextResponse.json(
      { error: 'Refusing to seed in production. Append ?confirm=1 to override.' },
      { status: 403 },
    );
  }

  const results: unknown[] = [];
  let totalProducts = 0;

  // Start the unique-image counter AFTER the highest seed image already in use,
  // so re-runs never reuse an image that an earlier (skipped) brand used.
  const used = await db.productImage.findMany({
    where: { url: { startsWith: '/seed/img-' } },
    select: { url: true },
  });
  let maxIndex = 0;
  for (const { url } of used) {
    const m = url.match(/img-(\d+)\.jpg$/);
    if (m) maxIndex = Math.max(maxIndex, parseInt(m[1], 10));
  }
  let cursor = maxIndex + 1;
  const nextImg = () => img(cursor++);

  for (const brand of BRANDS) {
    try {
      const r = await seedBrand(brand, nextImg);
      results.push(r);
      if (!(r as any).skipped) totalProducts += (r as any).products ?? 0;
    } catch (err) {
      results.push({
        storeName: brand.storeName,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    message: `Seeded ${BRANDS.length} brands with ${totalProducts} products.`,
    results,
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
