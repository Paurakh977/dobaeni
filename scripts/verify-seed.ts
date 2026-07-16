import { db } from '@/lib/db';
async function main() {
  const orgs = await db.organization.count();
  const brands = await db.organization.count({ where: { slug: { endsWith: 'collective' } } }); // placeholder
  const products = await db.product.count();
  const images = await db.productImage.count();
  const seedImages = await db.productImage.count({ where: { url: { startsWith: '/seed/img-' } } });
  // duplicate detection across ALL product image urls
  const all = await db.productImage.findMany({ select: { url: true } });
  const seen = new Set<string>();
  const dups: string[] = [];
  for (const { url } of all) { if (seen.has(url)) dups.push(url); else seen.add(url); }
  console.log({ orgs, products, totalImages: images, seedImages, uniqueSeedImages: seen.size, duplicateImageUrls: dups.length });
  if (dups.length) console.log('DUP SAMPLE:', dups.slice(0, 5));
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
