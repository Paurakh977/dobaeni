# DOBAENI — Theme Documentation

This document explains how theming and styling are implemented across the DOBAENI application.

## Overview

DOBAENI is a **Next.js 16.2.10** (App Router) single-route landing page with a **dark luxury** aesthetic and heavy scroll-driven animation. Styling is built on **Tailwind CSS v4** using a **CSS-first configuration** (there is no `tailwind.config.js`), a small hand-authored palette exposed as CSS variables, and Google Fonts loaded via `<link>` tags.

> Note: `README.md` is stale — it claims `next/font` + Geist, but the app actually loads fonts via a Google Fonts `<link>` and uses Manrope/Fraunces/Space Mono.

## Styling Stack

- **Tailwind CSS v4** (`tailwindcss@^4`, `@tailwindcss/postcss@^4`) — CSS-first config via the `@theme` directive; no JS config file.
- **PostCSS** — single plugin `@tailwindcss/postcss` (`postcss.config.mjs`); autoprefixer not needed in v4.
- **Animation** — `framer-motion@^12`, `gsap@^3`, `lenis@^1` (smooth scroll).
- **No** styled-components, CSS Modules, next-themes, clsx/tailwind-merge, or shadcn/ui.

## Theme Configuration — `app/globals.css`

This file is the heart of the theme. It imports Tailwind, registers tokens via `@theme inline`, defines the palette in `:root`, and adds bespoke utility classes.

### `@theme inline` — bridges Tailwind tokens to CSS variables

```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--dobaeni-ink);
  --color-foreground: var(--dobaeni-paper);
  --color-gold: var(--dobaeni-gold);
  --color-gold-soft: var(--dobaeni-gold-soft);
  --color-ink: var(--dobaeni-ink);
  --color-abyss: var(--dobaeni-abyss);
  --color-panel: var(--dobaeni-panel);
  --color-paper: var(--dobaeni-paper);
  --color-sage: var(--dobaeni-sage);
  --font-sans: 'Manrope', ui-sans-serif, system-ui, sans-serif;
  --font-display: 'Fraunces', ui-serif, Georgia, serif;
  --font-mono: 'Space Mono', ui-monospace, monospace;
}
```

> In practice, components mostly **bypass the `--color-*` tokens** and use Tailwind arbitrary values with raw hex (e.g. `bg-[#08080a]`, `text-[#DFBA73]`). The **font** tokens (`font-display`, `font-mono`) *are* used via generated utilities.

### Palette — `:root` design tokens

```css
:root {
  --dobaeni-ink: #08080a;
  --dobaeni-abyss: #020202;
  --dobaeni-panel: #121215;
  --dobaeni-gold: #DFBA73;
  --dobaeni-gold-soft: #F0E2C3;
  --dobaeni-paper: #FAF9F6;
  --dobaeni-sage: #8E8E93;
  --dobaeni-line: rgba(250, 249, 246, 0.08);
}
```

### Theme root — `.dobaeni-page`

The theme is scoped to a `.dobaeni-page` wrapper (applied in `page.tsx`, **not** on `<body>`):

```css
.dobaeni-page {
  background-color: var(--dobaeni-ink);
  color: var(--dobaeni-paper);
  font-family: 'Manrope', sans-serif;
  overflow-x: clip;
  position: relative;
}
.dobaeni-page .font-display { font-family: 'Fraunces', serif; font-optical-sizing: auto; }
.dobaeni-page .font-mono { font-family: 'Space Mono', monospace; }
```

## Color System

A single, tightly-constrained dark theme. Semantic mapping:

| Token | CSS var | Hex | Role |
|---|---|---|---|
| Ink | `--dobaeni-ink` | `#08080A` | Page background (primary ground) |
| Abyss | `--dobaeni-abyss` | `#020202` | Deepest black (gradient overlays) |
| Panel | `--dobaeni-panel` | `#121215` | Card / surface backgrounds |
| Gold | `--dobaeni-gold` | `#DFBA73` | **Brand accent** (highlights, lines, CTAs) |
| Gold Soft | `--dobaeni-gold-soft` | `#F0E2C3` | Hover / glow gold variant |
| Paper | `--dobaeni-paper` | `#FAF9F6` | Primary text (off-white) |
| Sage | `--dobaeni-sage` | `#8E8E93` | Muted / secondary text |
| Line | `--dobaeni-line` | `rgba(250,249,246,0.08)` | Hairline borders |

**Off-palette exceptions:** `Preloader.tsx` intentionally uses emerald `#003134` and gold `#c9a24b` for the intro screen only.

**Applied in components** via Tailwind arbitrary values, e.g. from `Navbar.tsx`:

```tsx
className="bg-[#08080a] text-[#FAF9F6] border border-[#FAF9F6]/20 hover:bg-[#DFBA73] hover:text-[#08080a]"
```

Opacity modifiers are common: `text-[#8E8E93]`, `bg-[#DFBA73]/[0.04]`, `border-[#FAF9F6]/5`.

## Dark / Light Mode

**There is no theme switching** — no `next-themes`, no `.dark` class, no toggle. The site is permanently dark (`--dobaeni-ink`).

The only "mode" awareness is **motion preference**:
- `globals.css` honors `prefers-reduced-motion` (disables animations/transitions inside `.dobaeni-page`).
- Components use framer-motion's `useReducedMotion()` to branch animation logic (e.g. `FeaturesSection.tsx`).
- The custom cursor is disabled on touch / coarse pointers.

## Typography

Fonts load via **Google Fonts `<link>`** in `app/layout.tsx` (not `next/font`):

```tsx
<link
  href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,400;1,9..144,500&family=Manrope:wght@200;300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
  rel="stylesheet"
/>
```

| Role | Family | Weights | Applied via |
|---|---|---|---|
| Sans (body) | **Manrope** | 200–700 | default body font |
| Display (headings) | **Fraunces** (serif, optical) | 300–500 + italic | `font-display` |
| Mono (labels/eyebrows) | **Space Mono** | 400, 700 | `font-mono` |

- **Display serif** for large headlines (Hero, Features, Manifesto, Footer wordmark).
- **Mono** for uppercase "eyebrow" labels with wide tracking (`tracking-[0.25em–0.65em]`, `text-[9px–11px]`).
- **Italic Fraunces** for gold accent words.
- **No type scale tokens** — sizes are set ad-hoc with responsive utilities (e.g. `text-[14vw] md:text-[6.8vw]`, `text-4xl md:text-7xl lg:text-8xl`).

## Design Tokens (spacing / radius / shadows / breakpoints)

- **No custom `@theme` tokens** for spacing, radius, or shadows — Tailwind defaults + arbitrary values.
- **Common radii:** `rounded-full` (pills/buttons), `rounded-2xl` (cards), `rounded-[2px]` (sharp photo corners).
- **Shadows:** bespoke arbitrary values, e.g. `shadow-[0_30px_60px_-15px_rgba(0,0,0,0.75)]`.
- **Breakpoints:** default Tailwind v4 only (`sm:`, `md:`, `lg:`). Desktop-rich layouts collapse to simpler mobile via `md:hidden` / `hidden md:block`.
- **Hairline motif:** gold lines `w-px bg-[#DFBA73]` and `border-[#FAF9F6]/5` recur throughout.

## Custom Utilities & Animations (`globals.css`)

- `.dobaeni-noise` — film-grain overlay.
- `.no-scrollbar` — hides scrollbars (mobile carousels).
- `.text-stroke-gold` — outlined transparent text (`-webkit-text-stroke: 1px rgba(223,186,115,0.06)`) for watermarks.
- `.perspective-800` / `.perspective-1200` — 3D perspective containers.
- `.preserve-3d` — `transform-style: preserve-3d`.
- Custom cursor suppression under `@media (hover: hover) and (pointer: fine)`.
- Gold text selection color.
- Keyframes: `animate-dobaeni-spin` (22s) and `animate-dobaeni-marquee` (26s, translateX -50%).

## Pages Inventory

Single-route app (`/`). Composition lives in `app/page.tsx`:

```tsx
<div className="dobaeni-page">
  <div className="dobaeni-noise" />
  <AnimatePresence>{loading && <Preloader .../>}</AnimatePresence>
  <CustomCursor />
  <SmoothScroll>
    <Navbar />
    <main>
      <Hero isIntro={!loading} />
      <Marquee />
      <RevealSection />
      <GallerySection />
      <FeaturesSection />
      <ManifestoSection />
    </main>
    <Footer />
  </SmoothScroll>
</div>
```

| Component | Section | Theme/styling notes |
|---|---|---|
| `Hero.tsx` | Hero | `bg-[#08080a]`; gold radial glows; `font-display` headline (paper + gold italic); orbiting mono tags; `text-stroke-gold` watermark; `InkReveal` canvas mask |
| `Marquee.tsx` | Gold ticker | Inline `#DFBA73` background, `text-[#08080a]`; `animate-dobaeni-marquee` |
| `RevealSection.tsx` | Spotlight moodboard | `bg-[#08080a]`; gold-framed cards; CSS mask radial spotlight |
| `GallerySection.tsx` | Curated boards | Desktop diagonal scroll (`h-[400vh]` + sticky); grayscale→color hover; mobile snap carousel (`no-scrollbar`) |
| `FeaturesSection.tsx` | The Ritual / The Ateliers | `bg-[#08080a] border-b border-[#FAF9F6]/5`; gold thread SVG; animated counters; `useReducedMotion` |
| `ManifestoSection.tsx` | Manifesto | Gold line wipe; 3D `perspective:1200px` rotateX; scroll-bound word reveal; giant `text-stroke` watermark |
| `Footer.tsx` | Footer | Gold gradient divider; newsletter input; live Kathmandu clock; interactive `font-display` wordmark |
| `Navbar.tsx` | Top nav | `bg-[#08080a]`; `font-mono` links with gold underline-on-hover; gold "Sign In" button |

**Overlay / interactive components:**
- `Preloader.tsx` — intro loader; off-palette emerald `#003134` + gold `#c9a24b`; GSAP + framer.
- `CustomCursor.tsx` — gold `#DFBA73` dot with `mix-blend-mode: difference`; variants via `data-cursor` / `data-cursor-text` attributes; desktop-only.
- `SmoothScroll.tsx` — Lenis wired into GSAP ticker + ScrollTrigger.
- `Magnetic.tsx` — reusable magnetic-hover wrapper (`strength` prop).
- `InkReveal.tsx` — canvas ink-wipe mask (`maskColor={[8,8,10]}` = ink).

## Reusable UI & Utilities

- **No `components/ui`, no shadcn/ui, no Radix/Headless UI** — no component library.
- **No `cn()` / `clsx` / `tailwind-merge`** — className composition uses plain template literals, e.g.:
  ```tsx
  className={`block ${i === 2 ? "italic text-[#DFBA73]" : ""}`}
  ```
- Reusable primitives are custom-built and colocated in `app/` (`Magnetic`, `SmoothScroll`, `CustomCursor`, `InkReveal`).
- The only "design system" primitives are the CSS utility classes in `globals.css`.

## Root Layout — `app/layout.tsx`

- `<html lang="en" className="h-full antialiased">` — global `antialiased`.
- `<head>` with the three Google Fonts `<link>`s (preconnect + stylesheet).
- Imports `./globals.css` so tokens are global.
- `<body className="min-h-full flex flex-col">` — note the theme root `.dobaeni-page` is applied in `page.tsx`, not on `<body>`.
- `metadata` export (title/description/openGraph). **No ThemeProvider, no context, no color-scheme meta.**

## Key Takeaways

1. **Stack:** Next.js 16 App Router + Tailwind v4 (CSS-first `@theme`, no JS config) + framer-motion/GSAP/Lenis.
2. **Single dark theme, no toggling.** Palette: ink `#08080A`, gold `#DFBA73`, paper `#FAF9F6`, sage `#8E8E93`, panel `#121215`, abyss `#020202`.
3. **Tokens live in `app/globals.css`** `:root` as `--dobaeni-*`, surfaced via `@theme inline`; components mostly hardcode hex through arbitrary values.
4. **Fonts (Manrope / Fraunces / Space Mono) load via Google Fonts `<link>`** in `layout.tsx` — not `next/font`.
5. **No UI library, no `cn()` helper** — everything is bespoke and colocated in `app/`.
6. **One route (`/`)**; theme root is the `.dobaeni-page` div.
7. **Custom cursor + noise + reduced-motion** are core to the premium feel; cursor is desktop-only.
