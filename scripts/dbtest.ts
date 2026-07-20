import { findProducts, findBrands } from "../lib/agent/db";

async function main() {
  const cases: [string, () => Promise<any>][] = [
    ["findProducts(kurtas)", () => findProducts({ query: "kurta", limit: 3 })],
    ["findProducts(boho wedding <3000)", () =>
      findProducts({ aesthetics: ["Boho"], occasion: "Wedding", max_price: 3000, limit: 3 })],
    ["findProducts(vintage, relaxed check)", () =>
      findProducts({ aesthetics: ["Vintage"], limit: 3 })],
    ["findBrands(streetwear, kathmandu)", () =>
      findBrands({ aesthetic: "Streetwear", city: "Kathmandu", limit: 3 })],
    ["findBrands(name=maison lustre)", () =>
      findBrands({ name: "Maison Lustre", limit: 3 })],
  ];

  for (const [label, fn] of cases) {
    try {
      const r: any = await fn();
      const ok = r.status === "success";
      console.log(`\n=== ${label} => status=${r.status} count=${r.count} fallback=${!!r.fallback} relaxed=${(r.relaxed||[]).join(",")}`);
      if (ok) {
        const first: any = (r.results || [])[0] || {};
        console.log("  first:", JSON.stringify({
          name: first.name, brand: first.brand, price: first.price,
          currency: first.currency, rating_avg: first.rating_avg,
          style_keywords: first.style_keywords, url: first.url, brand_url: first.brand_url,
        }));
        if (r.note) console.log("  note:", r.note);
      } else {
        console.log("  error_message:", r.error_message);
      }
    } catch (e: any) {
      console.log(`\n=== ${label} => THREW`, e?.message || e);
    }
  }
  process.exit(0);
}

main();
