// Ensures public/seed holds TARGET fashion images, downloading only the missing ones.
// Safe to re-run: existing img-*.jpg files are never re-downloaded or overwritten.
// Run with:  bun run scripts/seed-images.ts
import { writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const TARGET = 260;
const WIDTH = 800;
const HEIGHT = 1000;
const CONCURRENCY = 6;

// Naming matches the seed route: 2 digits up to 99, 3 digits from 100.
const nameFor = (i: number) =>
  `img-${String(i).padStart(i <= 99 ? 2 : 3, '0')}.jpg`;

const KEYWORDS = [
  'dress', 'fashion', 'outfit', 'model', 'clothing', 'sneakers', 'shoes',
  'handbag', 'purse', 'jewelry', 'necklace', 'sunglasses', 'boots', 'jacket',
  'coat', 'sweater', 'knitwear', 'streetwear', 'vintage', 'summer', 'hat',
  'scarf', 'blazer', 'skirt', 'denim', 'linen', 'runway', 'aesthetic', 'style',
  'wardrobe', 'glamour', 'chic', 'casual', 'elegant', 'trendy', 'fashionweek',
  'ootd', 'designer', 'luxury', 'mensfashion', 'womensfashion', 'boutique',
  'thrift', 'accessory', 'heels', 'sandals', 'suit', 'trenchcoat', 'cardigan',
  'earrings', 'watch', 'belt', 'beanie', 'poncho', 'shawl', 'kurti', 'saree',
];

const outDir = join(process.cwd(), 'public', 'seed');
await mkdir(outDir, { recursive: true });

async function existingMaxIndex(): Promise<number> {
  const files = await readdir(outDir);
  let max = 0;
  for (const f of files) {
    const m = f.match(/^img-(\d+)\.jpg$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

async function fetchWithTimeout(url: string, ms = 15000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function downloadOne(index: number): Promise<boolean> {
  const file = join(outDir, nameFor(index));
  const keyword = KEYWORDS[index % KEYWORDS.length];
  const lock = index + 1;
  const candidates = [
    `https://loremflickr.com/${WIDTH}/${HEIGHT}/${keyword}?lock=${lock}`,
    `https://loremflickr.com/${WIDTH}/${HEIGHT}/fashion,clothing?lock=${lock + 5000}`,
    `https://picsum.photos/seed/dobaeni${lock}/${WIDTH}/${HEIGHT}`,
  ];
  for (const url of candidates) {
    try {
      const res = await fetchWithTimeout(url);
      const ct = res.headers.get('content-type') ?? '';
      if (!res.ok || !ct.startsWith('image/')) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1500) continue;
      await writeFile(file, buf);
      return true;
    } catch {
      /* try next candidate */
    }
  }
  return false;
}

const start = (await existingMaxIndex()) + 1;
const needed = Math.max(0, TARGET - (start - 1));
console.log(`Seed images: ${start - 1} present, downloading ${needed} more (target ${TARGET})...`);

let done = 0;
let ok = 0;
for (let i = start; i <= TARGET; i += CONCURRENCY) {
  const batch = [];
  for (let j = 0; j < CONCURRENCY && i + j <= TARGET; j++) batch.push(i + j);
  const results = await Promise.all(batch.map(downloadOne));
  results.forEach((r) => {
    done++;
    if (r) ok++;
  });
  console.log(`  progress ${done}/${needed}`);
}

const final = await existingMaxIndex();
console.log(`Done. ${final} images present in public/seed.`);
if (final < TARGET) {
  console.warn('Some downloads failed — re-run to top up.');
  process.exit(final === 0 ? 1 : 0);
}
