import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
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

// ── buyer pool definitions ───────────────────────────────
// Each buyer is fully onboarded (BuyerProfile + interests) so the buyer
// dashboard, recommendations and boards all have real data to render.
type Buyer = {
  name: string;
  emailName: string;
  city: string;
  gender: 'female' | 'male' | 'non_binary';
  ageRange: '13-17' | '18-24' | '25-34' | '35-44' | '45+';
  budgetRange: 'low' | 'mid' | 'high' | 'luxury';
  styleIntensity: 'minimal' | 'balanced' | 'maximal';
  preferredGenders: ('female' | 'male' | 'unisex')[];
  aesthetics: string[]; // up to 5, from AESTHETICS
  occasions: string[];
  bio: string;
  // how "active" this shopper is — drives orders / likes / follows volume
  activity: number; // 0.3 (quiet) .. 1 (power shopper)
};

const CITIES = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Janakpur', 'Biratnagar', 'Butwal'];

const BUYERS: Buyer[] = [
  { name: 'Sara Karki', emailName: 'sara.karki', city: 'Kathmandu', gender: 'female', ageRange: '25-34', budgetRange: 'high', styleIntensity: 'minimal', preferredGenders: ['female'], aesthetics: ['Old Money', 'Clean Girl', 'Minimalist'], occasions: ['Work', 'Date Night', 'Travel'], bio: 'Quiet luxury and slow fashion. Coffee in Thamel, meetings in Durbar Marg.', activity: 1 },
  { name: 'Aarav Shrestha', emailName: 'aarav.shrestha', city: 'Lalitpur', gender: 'male', ageRange: '18-24', budgetRange: 'mid', styleIntensity: 'maximal', preferredGenders: ['male', 'unisex'], aesthetics: ['Streetwear', 'Y2K', 'Athleisure'], occasions: ['Party', 'Daily', 'Travel'], bio: 'Sneakerhead. Always hunting the next drop.', activity: 1 },
  { name: 'Maya Gurung', emailName: 'maya.gurung', city: 'Pokhara', gender: 'female', ageRange: '25-34', budgetRange: 'mid', styleIntensity: 'balanced', preferredGenders: ['female', 'unisex'], aesthetics: ['Boho', 'Cottagecore', 'Vintage'], occasions: ['Festive', 'Travel', 'Date Night'], bio: 'Thrift finds and lake-side strolls.', activity: 0.8 },
  { name: 'Kiran Rai', emailName: 'kiran.rai', city: 'Kathmandu', gender: 'female', ageRange: '35-44', budgetRange: 'luxury', styleIntensity: 'minimal', preferredGenders: ['female'], aesthetics: ['Minimalist', 'Office Wear', 'Old Money'], occasions: ['Work', 'Wedding'], bio: 'Architect. Loves sculptural silhouettes.', activity: 0.7 },
  { name: 'Dev Thapa', emailName: 'dev.thapa', city: 'Bhaktapur', gender: 'male', ageRange: '25-34', budgetRange: 'low', styleIntensity: 'balanced', preferredGenders: ['male'], aesthetics: ['Korean', 'Clean Girl', 'Minimalist'], occasions: ['Daily', 'Work', 'Lounge'], bio: 'Handmade basics for everyday.', activity: 0.9 },
  { name: 'Anaya Joshi', emailName: 'anaya.joshi', city: 'Kathmandu', gender: 'female', ageRange: '18-24', budgetRange: 'high', styleIntensity: 'maximal', preferredGenders: ['female'], aesthetics: ['Preppy', 'Coquette', 'Office Wear'], occasions: ['Wedding', 'Festive', 'Party'], bio: 'Fusionwear collector. Saree blouses and shararas.', activity: 1 },
  { name: 'Rohit Yadav', emailName: 'rohit.yadav', city: 'Janakpur', gender: 'male', ageRange: '25-34', budgetRange: 'mid', styleIntensity: 'balanced', preferredGenders: ['male', 'unisex'], aesthetics: ['Boho', 'Vintage', 'Cottagecore'], occasions: ['Daily', 'Festive', 'Travel'], bio: 'Terai heritage weaves enthusiast.', activity: 0.6 },
  { name: 'Esha Bista', emailName: 'esha.bista', city: 'Kathmandu', gender: 'female', ageRange: '18-24', budgetRange: 'mid', styleIntensity: 'maximal', preferredGenders: ['female', 'unisex'], aesthetics: ['Streetwear', 'Y2K', 'Athleisure'], occasions: ['Party', 'Daily', 'Travel'], bio: 'Alpine streetwear and trail runs.', activity: 0.85 },
  { name: 'Tara Magar', emailName: 'tara.magar', city: 'Lalitpur', gender: 'female', ageRange: '35-44', budgetRange: 'luxury', styleIntensity: 'minimal', preferredGenders: ['female'], aesthetics: ['Gothic', 'Avant-Garde', 'Minimalist'], occasions: ['Party', 'Wedding', 'Date Night'], bio: 'After-dark couture only.', activity: 0.6 },
  { name: 'Samiya Shah', emailName: 'samiya.shah', city: 'Pokhara', gender: 'female', ageRange: '18-24', budgetRange: 'mid', styleIntensity: 'balanced', preferredGenders: ['female'], aesthetics: ['Coquette', 'Clean Girl', 'Korean'], occasions: ['Date Night', 'Daily', 'Party'], bio: 'Soft romantic everyday wear.', activity: 0.8 },
  { name: 'Bibek Maharjan', emailName: 'bibek.maharjan', city: 'Kathmandu', gender: 'male', ageRange: '25-34', budgetRange: 'high', styleIntensity: 'balanced', preferredGenders: ['male'], aesthetics: ['Old Money', 'Preppy', 'Office Wear'], occasions: ['Work', 'Date Night'], bio: 'Tailored and timeless.', activity: 0.7 },
  { name: 'Nisha Tamang', emailName: 'nisha.tamang', city: 'Biratnagar', gender: 'female', ageRange: '25-34', budgetRange: 'low', styleIntensity: 'balanced', preferredGenders: ['female', 'unisex'], aesthetics: ['Boho', 'Vintage', 'Korean'], occasions: ['Daily', 'Festive', 'Travel'], bio: 'Curated vintage from the east.', activity: 0.5 },
  { name: 'Yubaraj KC', emailName: 'yubaraj.kc', city: 'Butwal', gender: 'male', ageRange: '35-44', budgetRange: 'mid', styleIntensity: 'minimal', preferredGenders: ['male'], aesthetics: ['Minimalist', 'Korean', 'Streetwear'], occasions: ['Daily', 'Work', 'Lounge'], bio: 'Keep it clean and simple.', activity: 0.4 },
  { name: 'Riya Poudel', emailName: 'riya.poudel', city: 'Kathmandu', gender: 'female', ageRange: '13-17', budgetRange: 'low', styleIntensity: 'maximal', preferredGenders: ['female', 'unisex'], aesthetics: ['Y2K', 'Coquette', 'Streetwear'], occasions: ['Party', 'Daily', 'School'], bio: 'Trend-obsessed Gen Z.', activity: 0.9 },
  { name: 'Aashish Adhikari', emailName: 'aashish.adhikari', city: 'Lalitpur', gender: 'non_binary', ageRange: '25-34', budgetRange: 'high', styleIntensity: 'maximal', preferredGenders: ['unisex', 'female', 'male'], aesthetics: ['Avant-Garde', 'Gothic', 'Streetwear'], occasions: ['Party', 'Wedding', 'Travel'], bio: 'Gender-fluid avant-garde looks.', activity: 0.75 },
];

// Comment + review copy pools (Nepali-flavoured, reusable)
const REVIEW_TITLES = ['Love it', 'Exceeded expectations', 'Great quality', 'My new favorite', 'Worth every rupee', 'Beautiful piece', 'Perfect fit', 'Would buy again', 'Stunning', 'Solid buy'];
const REVIEW_BODIES = [
  'The fabric feels so much more expensive than the price. Arrived faster than expected.',
  'Exactly as pictured. The stitching is clean and it fits true to size.',
  'Got so many compliments the first time I wore this out in Kathmandu.',
  'Quality is unreal for a local brand. Will be shopping here again.',
  'Beautiful craftsmanship — you can tell it is made with care.',
  'Perfect for the occasion I bought it for. Recommending to friends.',
  'Slightly different shade in person but honestly even better.',
  'Comfortable, well made and the packaging was lovely.',
  'Such a versatile piece. I have worn it three ways already.',
  'Customer service was responsive and the fit advice was spot on.',
];
const COMMENT_BODIES = [
  'This is gorgeous 😍 where is it from?',
  'Need this in my life rn',
  'The color is perfect for festive season',
  'Does it run true to size?',
  'Adding to my board immediately',
  'Obsessed with this aesthetic',
  'Pair this with the ivory trousers and it is a whole look',
  'Just bought something similar, the quality is amazing',
  'Goals. Absolutely goals.',
  'Saving this for my birthday wishlist',
];
const SELLER_REPLIES = [
  'Thank you so much! Glad you love it 🤍',
  'Appreciate the kind words — enjoy!',
  'So happy it worked out for the occasion!',
  'Thanks for the support, we craft each piece with care.',
  'That means a lot to our small studio 🧡',
];
const BOARD_NAMES = ['Wishlist', 'Date Night Looks', 'Work Capsule', 'Festive Edit', 'Everyday Faves', 'Vacation Moodboard', 'Trending Now'];
const NOTI_TITLES = ['Order shipped', 'New follower', 'New review on your product', 'Message from a buyer', 'Promo live: 20% off', 'Restock alert'];

// ── curated custom images from public/filtered/<Aesthetic>/ ──
// These are hand-picked, category-accurate photos. We surface them as the
// NEWEST + most-engaged products in the seed so they dominate the discover
// feed, brand storefronts and rankings.
type CustomImage = { aesthetic: string; url: string };
const CUSTOM_IMAGES: CustomImage[] = (() => {
  const root = join(process.cwd(), 'public', 'filtered');
  if (!existsSync(root)) return [];
  const out: CustomImage[] = [];
  for (const dir of readdirSync(root, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const aesthetic = dir.name;
    const full = join(root, aesthetic);
    for (const entry of readdirSync(full, { withFileTypes: true })) {
      if (entry.isDirectory()) continue; // skip nested dirs (e.g. accidental Y2K/Y2K)
      const f = entry.name;
      if (/\.(jpg|jpeg|png)$/i.test(f)) {
        out.push({ aesthetic, url: `/filtered/${encodeURIComponent(aesthetic)}/${encodeURIComponent(f)}` });
      }
    }
  }
  return out;
})();

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

// small deterministic-ish helpers for timestamps spread over the past ~120 days
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const pickDate = (maxDays: number) => daysAgo(rnd(1, maxDays));

// order / payment enums (mirrors Order model status values)
const ORDER_STATUSES = ['pending', 'processing', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'] as const;
const PAYMENT_METHODS = ['cod', 'esewa', 'khalti', 'bank', 'card'] as const;
const COURIERS = ['Sastodeal Express', 'Nepal Post', 'FastGo', 'KTM Courier', 'BlueDart'];

function orderNo() {
  return `DB-${rnd(100000, 999999)}-${randomUUID().slice(0, 4).toUpperCase()}`;
}

// ── seed buyers (user + profile + address) ───────────────
async function seedBuyer(b: Buyer) {
  const email = `${b.emailName}@dobaeni.seed`;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { name: b.name, skipped: true };

  const userId = randomUUID();
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'One Size'];

  await db.user.create({
    data: {
      id: userId,
      name: b.name,
      email,
      emailVerified: true,
      role: 'buyer',
      onboardingCompleted: true,
      interests: JSON.stringify(b.aesthetics),
      image: img(rnd(1, 30)),
    },
  });

  await db.account.create({
    data: {
      id: randomUUID(),
      userId,
      accountId: email,
      providerId: 'credential',
      password: SEED_PASS,
    },
  });

  await db.buyerProfile.create({
    data: {
      userId,
      gender: b.gender,
      ageRange: b.ageRange,
      phone: `+977-98${rnd(10000000, 99999999)}`,
      city: b.city,
      country: 'Nepal',
      bio: b.bio,
      avatarUrl: img(rnd(1, 30)),
      sizePrefs: JSON.stringify({ tops: pick(sizes), bottoms: pick(sizes), shoes: pick(['38', '40', '42', '44']), dress: pick(['S', 'M', 'L']) }),
      budgetRange: b.budgetRange,
      preferredCategories: JSON.stringify(b.aesthetics),
      preferredOccasions: JSON.stringify(b.occasions),
      styleIntensity: b.styleIntensity,
      preferredGenders: JSON.stringify(b.preferredGenders),
    },
  });

  await db.address.create({
    data: {
      userId,
      label: 'Home',
      recipientName: b.name,
      phone: `+977-98${rnd(10000000, 99999999)}`,
      line1: `${rnd(1, 480)} ${pick(['Durbar Marg', 'Jhamel', 'Thamel', 'Baluwatar', 'Sanepa', 'New Road', 'Lakeside'])}`,
      city: b.city,
      state: b.city,
      postalCode: String(rnd(10000, 99999)),
      country: 'Nepal',
      latitude: KTM_LAT + (Math.random() - 0.5) * 0.2,
      longitude: KTM_LNG + (Math.random() - 0.5) * 0.2,
      isDefault: true,
    },
  });

  return { name: b.name, id: userId, email };
}

// ── seed all the social/order engagement for a brand's products ──
// buyers + products must already exist. We attach: likes, comments, reviews,
// product views, follows, orders (with items), boards/saved items,
// conversations, notifications. Then re-sync denormalized counters so the
// seller dashboard / discover feed / product page all read consistent numbers.
async function seedEngagement(opts: {
  orgId: string;
  products: EnrichedProduct[];
  buyers: { id: string; name: string; buyer: Buyer }[];
}) {
  const { orgId, products, buyers } = opts;
  if (products.length === 0 || buyers.length === 0) return;

  // 1) LIKES — high-activity buyers like more; aesthetic overlap boosts odds
  const likeRows: { userId: string; productId: string; createdAt: Date }[] = [];
  for (const p of products) {
    for (const b of buyers) {
      const overlap = b.buyer.aesthetics.some((a) => p.orgAesthetics?.includes(a)) ? 0.2 : 0;
      const chance = 0.25 + 0.4 * b.buyer.activity + overlap;
      if (Math.random() < Math.min(0.85, chance)) {
        likeRows.push({ userId: b.id, productId: p.id, createdAt: pickDate(120) });
      }
    }
  }
  // dedupe unique (userId, productId)
  const likeSet = new Set<string>();
  const uniqueLikes = likeRows.filter((l) => {
    const k = `${l.userId}:${l.productId}`;
    if (likeSet.has(k)) return false;
    likeSet.add(k);
    return true;
  });
  if (uniqueLikes.length) {
    await db.like.createMany({
      data: uniqueLikes.map((l) => ({ userId: l.userId, productId: l.productId, createdAt: l.createdAt })),
    });
  }

  // 2) COMMENTS
  const commentRows: { userId: string; productId: string; content: string; createdAt: Date }[] = [];
  for (const p of products) {
    for (const b of buyers) {
      if (Math.random() < 0.18 + 0.25 * b.buyer.activity) {
        commentRows.push({ userId: b.id, productId: p.id, content: pick(COMMENT_BODIES), createdAt: pickDate(90) });
      }
    }
  }
  if (commentRows.length) {
    await db.comment.createMany({ data: commentRows });
  }

  // 3) PRODUCT VIEWS (analytics + recently viewed)
  const viewRows: { productId: string; userId: string | null; source: string; createdAt: Date }[] = [];
  const sources = ['feed', 'search', 'board', 'recommendation', 'product_page'];
  for (const p of products) {
    const viewCount = rnd(20, 180);
    for (let i = 0; i < viewCount; i++) {
      const b = Math.random() < 0.7 ? pick(buyers) : null;
      viewRows.push({ productId: p.id, userId: b ? b.id : null, source: pick(sources), createdAt: pickDate(120) });
    }
  }
  // chunk to avoid oversized payloads
  for (let i = 0; i < viewRows.length; i += 500) {
    await db.productView.createMany({ data: viewRows.slice(i, i + 500) });
  }

  // 4) REVIEWS (approved) + seller replies
  const reviewRows: any[] = [];
  for (const p of products) {
    // 1–6 reviews per product
    const nReviews = rnd(1, 6);
    const reviewers = [...buyers].sort(() => Math.random() - 0.5).slice(0, nReviews);
    for (const b of reviewers) {
      const rating = rnd(3, 5);
      const hasReply = Math.random() < 0.5;
      reviewRows.push({
        productId: p.id,
        userId: b.id,
        rating,
        title: pick(REVIEW_TITLES),
        comment: pick(REVIEW_BODIES),
        images: null,
        isVerifiedPurchase: Math.random() < 0.7,
        helpfulCount: rnd(0, 24),
        sellerReply: hasReply ? pick(SELLER_REPLIES) : null,
        sellerRepliedAt: hasReply ? pickDate(60) : null,
        status: 'approved',
        createdAt: pickDate(110),
      });
    }
  }
  if (reviewRows.length) {
    await db.review.createMany({ data: reviewRows });
  }

  // 5) FOLLOWS (buyer -> org) — varies by activity & aesthetic overlap
  const followRows: { followerId: string; organizationId: string; createdAt: Date }[] = [];
  for (const b of buyers) {
    const overlap = b.buyer.aesthetics.some((a) => products.some((p) => p.orgAesthetics?.includes(a)));
    const chance = 0.3 + 0.5 * b.buyer.activity + (overlap ? 0.15 : 0);
    if (Math.random() < Math.min(0.95, chance)) {
      followRows.push({ followerId: b.id, organizationId: orgId, createdAt: pickDate(120) });
    }
  }
  if (followRows.length) {
    await db.follow.createMany({ data: followRows });
  }

  // 6) ORDERS + ORDER ITEMS (buyer -> this org). Some delivered, some in-flight, some cancelled.
  const orderRows: any[] = [];
  const orderItemRows: { orderId: string; productId: string; quantity: number; price: number; discount: number; size: string | null; color: string | null; productName: string; productImage: string | null }[] = [];
  for (const b of buyers) {
    const orderChance = 0.2 + 0.7 * b.buyer.activity;
    if (Math.random() > orderChance) continue;
    const nOrders = rnd(1, 3);
    for (let o = 0; o < nOrders; o++) {
      const orderId = randomUUID();
      const nItems = rnd(1, 3);
      const items = [...products].sort(() => Math.random() - 0.5).slice(0, nItems);
      let subtotal = 0;
      for (const p of items) {
        const qty = rnd(1, 2);
        const unit = p.price;
        const discount = Math.random() < 0.3 ? round10(unit * 0.1) : 0;
        subtotal += (unit - discount) * qty;
        orderItemRows.push({
          orderId,
          productId: p.id,
          quantity: qty,
          price: unit,
          discount,
          size: p.sizes.length ? pick(p.sizes) : null,
          color: p.colors.length ? pick(p.colors) : null,
          productName: p.name,
          productImage: p.images[0] ?? null,
        });
      }
      const shippingFee = Math.random() < 0.5 ? 0 : 150;
      const total = Math.round(subtotalGuard(subtotal) + shippingFee);
      const status = pickWeighted(ORDER_STATUSES, (s) =>
        s === 'delivered' ? 5 : s === 'out_for_delivery' ? 2 : s === 'processing' ? 2 : s === 'packed' ? 1.5 : s === 'pending' ? 1.5 : 0.4,
      );
      const paid = status === 'cancelled' ? Math.random() < 0.3 : true;
      const paymentStatus = status === 'refunded' ? 'refunded' : paid ? 'paid' : 'pending';
      orderRows.push({
        id: orderId,
        orderNumber: orderNo(),
        organizationId: orgId,
        buyerId: b.id,
        addressId: await defaultAddressId(b.id),
        subtotal: Math.round(subtotal),
        shippingFee,
        tax: 0,
        discount: 0,
        totalAmount: total,
        currency: 'NPR',
        status,
        paymentMethod: pick(PAYMENT_METHODS as any),
        paymentStatus,
        trackingNumber: status === 'out_for_delivery' || status === 'delivered' ? `TRK${rnd(1000000, 9999999)}` : null,
        courierName: status === 'out_for_delivery' || status === 'delivered' ? pick(COURIERS) : null,
        estimatedDelivery: status === 'delivered' ? pickDate(20) : daysAgo(-rnd(1, 10)),
        deliveredAt: status === 'delivered' ? pickDate(15) : null,
        notes: null,
        createdAt: pickDate(100),
      });
    }
  }
  if (orderRows.length) {
    await db.order.createMany({ data: orderRows });
    await db.orderItem.createMany({ data: orderItemRows });
  }

  // 7) BOARDS / WISHLISTS (one 'Wishlist' board per active buyer + a themed one)
  for (const b of buyers) {
    if (Math.random() > 0.7 + 0.3 * b.buyer.activity) continue;
    const created = pickDate(100);
    const wishlist = await db.board.create({
      data: {
        userId: b.id,
        name: 'Wishlist',
        slug: `wishlist-${b.id.slice(0, 6)}`,
        type: 'wishlist',
        isPrivate: false,
        createdAt: created,
      },
    });
    const saved: { boardId: string; productId: string }[] = [];
    const picked = [...products].sort(() => Math.random() - 0.5).slice(0, rnd(2, 6));
    for (const p of picked) saved.push({ boardId: wishlist.id, productId: p.id });
    const extra = await db.board.create({
      data: {
        userId: b.id,
        name: pick(BOARD_NAMES.filter((n) => n !== 'Wishlist')),
        slug: `${slugify(pick(BOARD_NAMES))}-${b.id.slice(0, 6)}`,
        type: 'collection',
        isPrivate: Math.random() < 0.3,
        coverImage: picked[0]?.images[0] ?? null,
        createdAt: pickDate(80),
      },
    });
    const picked2 = [...products].sort(() => Math.random() - 0.5).slice(0, rnd(1, 4));
    for (const p of picked2) saved.push({ boardId: extra.id, productId: p.id });
    if (saved.length) await db.savedItem.createMany({ data: saved });
  }

  // 8) CONVERSATIONS + MESSAGES (a subset of buyers chat with the seller)
  for (const b of buyers) {
    if (Math.random() > 0.25 * (0.5 + b.buyer.activity)) continue;
    const conv = await db.conversation.create({
      data: {
        organizationId: orgId,
        buyerId: b.id,
        lastMessageAt: pickDate(30),
        createdAt: pickDate(60),
      },
    });
    const nMsg = rnd(2, 6);
    const msgs: { conversationId: string; senderId: string; content: string; createdAt: Date }[] = [];
    for (let m = 0; m < nMsg; m++) {
      const isBuyer = m % 2 === 0;
      msgs.push({
        conversationId: conv.id,
        senderId: isBuyer ? b.id : (await orgOwnerId(orgId)),
        content: isBuyer ? pick(['Hi, is this still available?', 'What is the delivery time to my city?', 'Do you do custom sizing?', 'Can I get a discount on 2?']) : pick(['Yes! Ships in 2 days 🚚', 'We deliver nationwide.', 'Sure, share your measurements.', 'Happy to offer 10% on 2+ items.']),
        createdAt: pickDate(30),
      });
    }
    await db.message.createMany({ data: msgs });
  }

  // 9) NOTIFICATIONS (for the org owner + a few buyers)
  // (kept light; seller gets order/follow/review alerts, buyers get shipment alerts)
  const notiRows: any[] = [];
  for (const o of orderRows.slice(0, 4)) {
    notiRows.push({
      userId: await orgOwnerId(orgId),
      type: 'order_update',
      title: 'New order received',
      body: `Order ${o.orderNumber} placed.`,
      data: JSON.stringify({ orderId: o.id }),
      createdAt: o.createdAt,
    });
  }
  if (followRows.length) {
    notiRows.push({
      userId: await orgOwnerId(orgId),
      type: 'follow',
      title: 'New follower',
      body: `${followRows.length} new followers this month.`,
      data: null,
      createdAt: pickDate(30),
    });
  }
  for (const o of orderRows.filter((x) => x.status === 'out_for_delivery').slice(0, 3)) {
    notiRows.push({
      userId: o.buyerId,
      type: 'order_update',
      title: 'Your order is on the way',
      body: `Order ${o.orderNumber} is out for delivery.`,
      data: JSON.stringify({ orderId: o.id }),
      createdAt: o.createdAt,
    });
  }
  if (notiRows.length) await db.notification.createMany({ data: notiRows });

  // 10) PROMOTIONS (a couple per org to feed the seller dashboard Promotions tab)
  await db.promotion.createMany({
    data: [
      {
        organizationId: orgId,
        title: 'New Season Drop',
        type: 'homepage',
        status: Math.random() < 0.6 ? 'active' : 'paused',
        budget: rnd(2000, 12000),
        startDate: daysAgo(rnd(10, 40)),
        endDate: daysAgo(-rnd(5, 30)),
        targetStyles: JSON.stringify(pickSome(products.flatMap((p) => p.orgAesthetics ?? []), 3)),
        impressions: rnd(200, 5000),
        clicks: rnd(20, 400),
        isActive: Math.random() < 0.6,
      },
      {
        organizationId: orgId,
        title: 'Weekend Flash Sale',
        type: 'collection',
        status: Math.random() < 0.5 ? 'ended' : 'active',
        budget: rnd(1000, 8000),
        startDate: daysAgo(rnd(1, 20)),
        endDate: daysAgo(-rnd(1, 10)),
        targetStyles: JSON.stringify(pickSome(products.flatMap((p) => p.orgAesthetics ?? []), 2)),
        impressions: rnd(100, 2500),
        clicks: rnd(10, 250),
        isActive: Math.random() < 0.5,
      },
    ],
  });
}

// ── helpers used inside seedEngagement ───────────────────
const _defaultAddrCache = new Map<string, string | null>();
async function defaultAddressId(userId: string): Promise<string | null> {
  if (_defaultAddrCache.has(userId)) return _defaultAddrCache.get(userId)!;
  const a = await db.address.findFirst({ where: { userId, isDefault: true }, select: { id: true } });
  const id = a?.id ?? null;
  _defaultAddrCache.set(userId, id);
  return id;
}
const _ownerCache = new Map<string, string>();
async function orgOwnerId(orgId: string): Promise<string> {
  if (_ownerCache.has(orgId)) return _ownerCache.get(orgId)!;
  const m = await db.member.findFirst({ where: { organizationId: orgId, role: 'owner' }, select: { userId: true } });
  const id = m?.userId ?? '';
  _ownerCache.set(orgId, id);
  return id;
}
function subtotalGuard(n: number) {
  return Number.isFinite(n) ? n : 0;
}
function pickWeighted<T>(arr: readonly T[], weight: (v: T) => number): T {
  const weights = arr.map(weight);
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

// ── sync denormalized counters after engagement is written ──
async function syncCounters(orgId: string) {
  // product-level: likes, comments, views, ratings, soldCount
  const products = await db.product.findMany({ where: { organizationId: orgId }, select: { id: true } });
  for (const p of products) {
    const [likes, comments, views, reviews, sold] = await Promise.all([
      db.like.count({ where: { productId: p.id } }),
      db.comment.count({ where: { productId: p.id } }),
      db.productView.count({ where: { productId: p.id } }),
      db.review.aggregate({ where: { productId: p.id, status: 'approved' }, _avg: { rating: true }, _count: true }),
      db.orderItem.aggregate({ where: { productId: p.id }, _sum: { quantity: true } }),
    ]);
    await db.product.update({
      where: { id: p.id },
      data: {
      likeCount: likes,
      viewCount: views,
        ratingCount: reviews._count,
        ratingAvg: reviews._avg.rating ?? 0,
        soldCount: sold._sum.quantity ?? 0,
      },
    });
  }
  // org-level: followerCount, ratingAvg, ratingCount, viewCount (sum of product views)
  const [followers, rating, prodViews] = await Promise.all([
    db.follow.count({ where: { organizationId: orgId } }),
    db.product.aggregate({ where: { organizationId: orgId }, _avg: { ratingAvg: true }, _sum: { ratingCount: true } }),
    db.productView.count({ where: { productId: { in: products.map((p) => p.id) } } }),
  ]);
  await db.organization.update({
    where: { id: orgId },
    data: {
      followerCount: followers,
      ratingCount: rating._sum.ratingCount ?? 0,
      ratingAvg: rating._avg.ratingAvg ?? 0,
      viewCount: prodViews,
    },
  });
}

// ── seed the curated /filtered images as their OWN new products ──
// Each custom image becomes a separate, brand-new product (NOT mixed into the
// 112 theme products) and is attached to the brand whose aesthetics best match
// the image's category folder. Returns the created product ids.
async function seedCustomProducts(
  brandResults: { orgId: string; skipped?: boolean; theme?: Theme }[],
): Promise<string[]> {
  if (!CUSTOM_IMAGES.length) return [];

  // Map each aesthetic folder -> a matching orgId (first brand whose theme
  // aesthetics include it; fall back to the first non-skipped brand).
  const eligible = brandResults.filter((b) => !b.skipped && b.orgId && b.theme);
  const fallbackOrg = eligible[0]?.orgId ?? '';
  const orgForAesthetic = (aesthetic: string): string => {
    const match = eligible.find((b) => b.theme!.aesthetics.includes(aesthetic));
    return match?.orgId ?? fallbackOrg;
  };

  const createdIds: string[] = [];
  for (const c of CUSTOM_IMAGES) {
    const orgId = orgForAesthetic(c.aesthetic);
    if (!orgId) continue;
    const brand = eligible.find((b) => b.orgId === orgId);
    const theme = brand?.theme;
    const sizes = theme?.sizes ?? ['S', 'M', 'L', 'XL'];
    const colors = theme ? pickSome(theme.colors, rnd(1, 3)) : ['Black'];
    const price = theme ? round10(rnd(theme.priceMin, theme.priceMax)) : round10(rnd(1000, 9000));
    const hasCompare = Math.random() < 0.5;
    const compareAtPrice = hasCompare ? round10(price * (1.2 + Math.random() * 0.5)) : null;
    const name = `${c.aesthetic} Edit ${rnd(1, 99)}`;

    const created = await db.product.create({
      data: {
        organizationId: orgId,
        name,
        slug: `${slugify(name) || 'custom'}-${randomUUID().slice(0, 4)}`,
        description: `A hand-picked ${c.aesthetic} piece from our curated drop. ${pick([
          'Limited, one-of-a-kind find.',
          'Category-accurate styling straight from the studio.',
          'A standout addition to your rotation.',
          'Shot in natural light to show true colour and texture.',
        ])}`,
        price,
        compareAtPrice,
        currency: 'NPR',
        stock: rnd(3, 40),
        sizes: toJsonArray(sizes),
        colors: toJsonArray(colors),
        styleKeywords: toJsonArray([c.aesthetic, ...(theme ? pickSome(theme.aesthetics, 2) : [])]),
        gender: theme ? pick(theme.genders) : 'unisex',
        occasion: theme ? toJsonArray(pickSome(theme.occasions, rnd(1, 3))) : null,
        material: theme ? pick(theme.materials) : null,
        tags: toJsonArray([c.aesthetic, ...(theme ? pickSome(theme.nouns, 2) : [])]),
        isPublished: true,
        isFeatured: Math.random() < 0.4,
        images: { create: [{ url: c.url, position: 0 }] },
      },
    });
    createdIds.push(created.id);
  }
  return createdIds;
}

// ── boost the curated custom-image products ──────────────
// Make every product that uses a hand-picked /filtered image the NEWEST
// (createdAt = now) and pile on the highest likes / comments / views / reviews
// / purchases so they top the discover feed, brand pages and rankings.
async function boostCustomProducts(
  buyers: { id: string; name: string; buyer: Buyer }[],
  customProductIds: string[],
) {
  const customProducts = await db.product.findMany({
    where: { id: { in: customProductIds }, isPublished: true },
    include: { images: { orderBy: { position: 'asc' } }, organization: { select: { id: true } } },
  });
  if (!customProducts.length) return;

  // newest first — bump createdAt to just now (and stagger slightly), so they
  // top the discover feed / "newest" sorts above the 112 theme products.
  let offset = 0;
  for (const p of customProducts) {
    await db.product.update({ where: { id: p.id }, data: { createdAt: new Date(Date.now() - offset * 1000) } });
    offset++;
  }

  for (const p of customProducts) {
    const orgId = p.organization.id;
    const image = p.images[0]?.url ?? null;

    // Skip buyers who already engaged with this product in the base pass,
    // to avoid violating the unique (userId, productId) constraints.
    const [existingLikes, existingComments, existingReviews] = await Promise.all([
      db.like.findMany({ where: { productId: p.id }, select: { userId: true } }),
      db.comment.findMany({ where: { productId: p.id }, select: { userId: true } }),
      db.review.findMany({ where: { productId: p.id }, select: { userId: true } }),
    ]);
    const likedSet = new Set(existingLikes.map((l) => l.userId));
    const commentedSet = new Set(existingComments.map((c) => c.userId));
    const reviewedSet = new Set(existingReviews.map((r) => r.userId));

    // Likes: nearly every buyer likes it (way above the random baseline)
    const likeRows = buyers
      .filter((b) => !likedSet.has(b.id) && Math.random() < 0.92)
      .map((b) => ({ userId: b.id, productId: p.id, createdAt: daysAgo(rnd(1, 20)) }));
    if (likeRows.length) await db.like.createMany({ data: likeRows });

    // Comments: many buyers comment
    const commentRows = buyers
      .filter((b) => !commentedSet.has(b.id) && Math.random() < 0.7)
      .map((b) => ({ userId: b.id, productId: p.id, content: pick(COMMENT_BODIES), createdAt: daysAgo(rnd(1, 15)) }));
    if (commentRows.length) await db.comment.createMany({ data: commentRows });

    // Reviews: lots, all approved, high ratings, with seller replies
    // (exclude buyers who already reviewed this product in the base pass)
    const reviewers = buyers
      .filter((b) => !reviewedSet.has(b.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, rnd(6, Math.min(12, buyers.length)));
    const reviewRows = reviewers.map((b) => {
      const hasReply = Math.random() < 0.7;
      return {
        productId: p.id,
        userId: b.id,
        rating: rnd(4, 5),
        title: pick(REVIEW_TITLES),
        comment: pick(REVIEW_BODIES),
        images: null,
        isVerifiedPurchase: Math.random() < 0.85,
        helpfulCount: rnd(10, 80),
        sellerReply: hasReply ? pick(SELLER_REPLIES) : null,
        sellerRepliedAt: hasReply ? daysAgo(rnd(1, 10)) : null,
        status: 'approved' as const,
        createdAt: daysAgo(rnd(1, 25)),
      };
    });
    if (reviewRows.length) await db.review.createMany({ data: reviewRows });

    // Product views: very high
    const viewRows: { productId: string; userId: string | null; source: string; createdAt: Date }[] = [];
    const sources = ['feed', 'search', 'board', 'recommendation', 'product_page'];
    for (let i = 0; i < rnd(250, 600); i++) {
      const b = Math.random() < 0.8 ? pick(buyers) : null;
      viewRows.push({ productId: p.id, userId: b ? b.id : null, source: pick(sources), createdAt: daysAgo(rnd(1, 30)) });
    }
    for (let i = 0; i < viewRows.length; i += 500) {
      await db.productView.createMany({ data: viewRows.slice(i, i + 500) });
    }

    // Orders: several delivered (purchased) + a couple in-flight
    const buyersForOrders = [...buyers].sort(() => Math.random() - 0.5).slice(0, rnd(4, 9));
    for (const b of buyersForOrders) {
      const status = Math.random() < 0.8 ? 'delivered' : pick(['out_for_delivery', 'processing'] as const);
      const qty = rnd(1, 3);
      const discount = Math.random() < 0.3 ? round10(p.price * 0.1) : 0;
      const orderId = randomUUID();
      const shippingFee = Math.random() < 0.5 ? 0 : 150;
      await db.order.create({
        data: {
          id: orderId,
          orderNumber: orderNo(),
          organizationId: orgId,
          buyerId: b.id,
          addressId: await defaultAddressId(b.id),
          subtotal: Math.round((p.price - discount) * qty),
          shippingFee,
          tax: 0,
          discount: 0,
          totalAmount: Math.round((p.price - discount) * qty + shippingFee),
          currency: 'NPR',
          status,
          paymentMethod: pick(PAYMENT_METHODS as any),
          paymentStatus: 'paid',
          trackingNumber: status === 'out_for_delivery' || status === 'delivered' ? `TRK${rnd(1000000, 9999999)}` : null,
          courierName: status === 'out_for_delivery' || status === 'delivered' ? pick(COURIERS) : null,
          estimatedDelivery: status === 'delivered' ? daysAgo(rnd(1, 10)) : daysAgo(-rnd(1, 8)),
          deliveredAt: status === 'delivered' ? daysAgo(rnd(1, 8)) : null,
          createdAt: daysAgo(rnd(1, 20)),
        },
      });
      await db.orderItem.create({
        data: {
          orderId,
          productId: p.id,
          quantity: qty,
          price: p.price,
          discount,
          size: p.sizes && p.sizes.length ? pick(JSON.parse(p.sizes)) : null,
          color: p.colors && p.colors.length ? pick(JSON.parse(p.colors)) : null,
          productName: p.name,
          productImage: image,
        },
      });
    }

    // Adds the product to a few buyers' wishlists
    const savers = [...buyers].sort(() => Math.random() - 0.5).slice(0, rnd(3, 7));
    for (const b of savers) {
      const board = await db.board.findFirst({ where: { userId: b.id, type: 'wishlist' } });
      if (board) {
        await db.savedItem.upsert({
          where: { boardId_productId: { boardId: board.id, productId: p.id } },
          create: { boardId: board.id, productId: p.id },
          update: {},
        });
      }
    }

    // Re-sync this product's denormalized counters.
    const [likes, comments, views, reviews, sold] = await Promise.all([
      db.like.count({ where: { productId: p.id } }),
      db.comment.count({ where: { productId: p.id } }),
      db.productView.count({ where: { productId: p.id } }),
      db.review.aggregate({ where: { productId: p.id, status: 'approved' }, _avg: { rating: true }, _count: true }),
      db.orderItem.aggregate({ where: { productId: p.id }, _sum: { quantity: true } }),
    ]);
    await db.product.update({
      where: { id: p.id },
      data: {
        likeCount: likes,
        viewCount: views,
        ratingCount: reviews._count,
        ratingAvg: reviews._avg.rating ?? 0,
        soldCount: sold._sum.quantity ?? 0,
      },
    });
  }

  // Re-sync org-level counters for orgs that own boosted products.
  const orgIds = Array.from(new Set(customProducts.map((p) => p.organization.id)));
  for (const orgId of orgIds) await syncCounters(orgId);
}

// enrich products with parsed attributes + org aesthetics for matching
type EnrichedProduct = {
  id: string;
  price: number;
  name: string;
  images: string[];
  sizes: string[];
  colors: string[];
  orgName: string;
  orgAesthetics?: string[];
  styleMatch?: (a: string) => boolean;
};

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
  const enriched: EnrichedProduct[] = [];
  for (let i = 0; i < brand.productCount; i++) {
    const name = `${pick(t.adjectives)} ${pick(t.nouns)}`;
    const price = round10(rnd(t.priceMin, t.priceMax));
    const hasCompare = Math.random() < 0.55;
    const compareAtPrice = hasCompare ? round10(price * (1.2 + Math.random() * 0.5)) : null;
    const sizes = t.sizes;
    const colors = pickSome(t.colors, rnd(1, 3));
    const styleKeywords = pickSome(t.aesthetics, rnd(1, 3));

    // Use only generated seed-pool images for the theme products; the curated
    // /filtered/ images are seeded as their OWN separate newer products below.
    const images: string[] = [nextImg()];
    if (Math.random() < 0.5) {
      const extra = nextImg();
      if (!images.includes(extra)) images.push(extra);
    }

    const created = await db.product.create({
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
        sizes: toJsonArray(sizes),
        colors: toJsonArray(colors),
        styleKeywords: toJsonArray(styleKeywords),
        gender: pick(t.genders),
        occasion: toJsonArray(pickSome(t.occasions, rnd(1, 3))),
        material: pick(t.materials),
        tags: toJsonArray(pickSome([...t.aesthetics, ...t.nouns], rnd(1, 3))),
        isPublished: true,
        images: { create: images.map((url, i) => ({ url, position: i })) },
      },
    });

    enriched.push({
      id: created.id,
      price,
      name,
      images,
      sizes,
      colors,
      orgName: brand.storeName,
      orgAesthetics: t.aesthetics,
    });
  }

  return {
    storeName: brand.storeName,
    email,
    orgId,
    orgSlug: slug,
    tier: brand.tier,
    products: brand.productCount,
    theme: brand.theme,
    enriched,
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

  // 1) Seed buyers first (shared across all brands for engagement).
  const buyers: { id: string; name: string; buyer: Buyer }[] = [];
  for (const b of BUYERS) {
    try {
      const r = await seedBuyer(b);
      results.push(r);
      if (!(r as any).skipped) buyers.push({ id: (r as any).id, name: b.name, buyer: b });
    } catch (err) {
      results.push({ buyer: b.name, error: err instanceof Error ? err.message : String(err) });
    }
  }

  // 2) Seed brands + their products.
  const brandResults: any[] = [];
  for (const brand of BRANDS) {
    try {
      const r = await seedBrand(brand, nextImg);
      brandResults.push(r);
      results.push(r);
      if (!r.skipped) totalProducts += r.products ?? 0;
    } catch (err) {
      results.push({
        storeName: brand.storeName,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // 3) Attach engagement (likes, comments, reviews, views, follows, orders,
  //    boards, conversations, notifications, promotions) per brand, then sync
  //    the denormalized counters so dashboards read consistent numbers.
  for (const r of brandResults) {
    if (r.skipped || !r.enriched?.length) continue;
    try {
      await seedEngagement({ orgId: r.orgId, products: r.enriched, buyers });
      await syncCounters(r.orgId);
    } catch (err) {
      results.push({
        storeName: r.storeName,
        engagementError: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // 4) Create the curated /filtered images as their OWN brand-new products
  //    (separate from the 112 theme products), then boost them to be the
  //    newest + most-engaged + purchased items in the store.
  let customIds: string[] = [];
  try {
    customIds = await seedCustomProducts(brandResults as any);
    totalProducts += customIds.length;
  } catch (err) {
    results.push({ customProductsError: err instanceof Error ? err.message : String(err) });
  }

  // 5) Boost the curated custom-image products: newest + highest engagement
  //    + purchased, so they dominate the feed / storefronts / rankings.
  try {
    await boostCustomProducts(buyers, customIds);
  } catch (err) {
    results.push({ boostError: err instanceof Error ? err.message : String(err) });
  }

  return NextResponse.json({
    ok: true,
    message: `Seeded ${BUYERS.length} buyers, ${BRANDS.length} brands with ${totalProducts} products (incl. ${customIds.length} curated /filtered image products) (+ engagement).`,
    results,
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
