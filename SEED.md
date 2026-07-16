# Seeding Demo Data — Dobaeni

This guide explains how to populate the app with **demo sellers + products** so the
buyer-facing UI (discover, brands, storefronts, product detail) looks alive.

> Everything here is **showcase-only**. The seeded sellers are never meant to be
> logged into — their passwords are dummy placeholders written straight to the DB.

---

## What gets created

Hitting the seed endpoint creates, via **direct Prisma writes** (no Better Auth
API, so no email-verification gate / rate limits get in the way):

| Model | Count | Notes |
|---|---|---|
| `User` (role `seller`) | 10 | email `*.@dobaeni.seed`, `emailVerified: true` |
| `Account` | 10 | dummy credential row (`Dobaeni@1234`) |
| `Organization` (brand) | 10 | full profile: logo, banner, businessType, tier, policies, socials, geo… |
| `Member` (owner) | 10 | what `getSellerOrg` looks up |
| `Product` | 112 | ~10–12 per brand, NPR pricing, some with compare-at discounts |
| `ProductImage` | ~170 | 1–2 per product, **all unique, no duplicates** |

Brands span varied aesthetics/business types/tiers for variety:
Maison Lustre, Neon Kathmandu, Himalayan Threads, Atelier Sena, Kathmandu
Collective, Indus Rose, Terai Weaves, Everest Street Co., Luxe Atelier, Nari Nest.

---

## Prerequisites

The database must be up and the client generated (one-time setup):

```bash
docker compose up -d
bunx prisma generate
bunx prisma migrate dev --name init
bun dev
```

> If `postgres` is reachable, the app's other pages already work. Seeding just
> adds demo content on top.

---

## Step 1 — Download the seed images

Images live in `public/seed/img-NN.jpg` and are **git-ignored** (see
`.gitignore` → `/public/seed/`). They are reproduced on demand:

```bash
bun run scripts/seed-images.ts
```

- Targets **260** images, downloads **only the missing ones** (safe to re-run).
- Concurrent downloads with LoremFlickr (keyword-matched) + Picsum fallback.
- Naming: 2 digits up to 99, 3 digits from 100 — must match the route.

After this, `public/seed/` should contain ~260 `.jpg` files.

## Step 2 — Seed the database

```bash
curl -X POST http://localhost:3000/api/seed
```

(Or open `http://localhost:3000/api/seed` in a browser — `GET` is aliased to `POST`.)

Response shows the brands created and total product count.

---

## Re-running / resetting

The seed is **idempotent**: re-running skips any brand whose seed email already
exists (`user already exists`), so it won't duplicate data.

To **wipe and re-create everything fresh** (e.g. after changing brand themes
or image logic):

```bash
bun run scripts/clean-seed.ts
curl -X POST http://localhost:3000/api/seed
```

`clean-seed.ts` deletes all `@dobaeni.seed` users (cascading their accounts,
members, orgs, products) and any orphaned orgs.

Verify what's in the DB:

```bash
bun run scripts/verify-seed.ts
```

It prints brand / product / image counts and confirms **zero duplicate image URLs**.

---

## How image uniqueness is guaranteed

`app/api/seed/route.ts` allocates images from a **sequential, non-wrapping
counter** (`nextImg()`) that starts at `maxIndex + 1`, where `maxIndex` is the
highest `/seed/img-N.jpg` index already referenced by existing products. So:

- No two products ever share an image **within a run**.
- Re-runs extend *past* images used by earlier (skipped) brands, so they never
  collide either.

If you ever see duplicate images, it means an older route version with a
wrapping `% 60` allocator was used — just run `clean-seed.ts` + reseed.

---

## Notes / gotchas

- **Production guard:** in `NODE_ENV=production` the route refuses unless you
  append `?confirm=1`.
- **RESEND_API_KEY:** because it *is* set, Better Auth enforces email
  verification — that's exactly why the seed uses direct Prisma writes instead
  of `auth.api.signUpEmail`.
- **Brand image count on `/brands`:** fixed in `lib/queries.ts`
  (`getBrands` now returns `o._count.products`, not the truncated cover preview).
- **Don't commit `public/seed/`:** it's git-ignored; teammates re-download
  with `scripts/seed-images.ts`.
