'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
  useReducedMotion,
  AnimatePresence,
} from 'framer-motion';
import {
  Maximize2,
  X,
  Move,
  ArrowUpRight,
  Compass,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import type { ProductCardData } from '@/lib/types';

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const DIAGONAL_STEP = 38;

// ---- ELASTIC / FUZZY SEARCH HELPERS ----
// Strip everything but alphanumerics + lowercase so "Old Money", "old money"
// and "oldmoney" all collapse to the same token and match each other.
function normalizeSearch(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// Tiny Levenshtein for typo tolerance (e.g. "old mney" → "old money").
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      );
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

// Score a single product against a query. Returns 0 when there is no match.
function scoreProduct(
  p: ProductCardData,
  query: string,
): number {
  const qNorm = normalizeSearch(query);
  if (!qNorm) return 0;
  const qTokens = query.toLowerCase().match(/[a-z0-9]+/g) || [qNorm];

  const fields: { text: string; weight: number }[] = [
    { text: p.name, weight: 3 },
    { text: p.organization.name, weight: 2 },
    { text: p.category ?? '', weight: 2 },
    { text: (p.styleKeywords || []).join(' '), weight: 3 },
    { text: (p.tags || []).join(' '), weight: 1 },
    { text: p.material ?? '', weight: 1 },
  ];

  let score = 0;
  for (const f of fields) {
    const fNorm = normalizeSearch(f.text);
    if (!fNorm) continue;

    // Full normalized substring match (handles spaces / punctuation gaps).
    if (fNorm.includes(qNorm)) {
      score += f.weight * (1 + Math.min(1, qNorm.length / fNorm.length));
    }

    // Token overlap + fuzzy prefix/typo tolerance (handles multi-word & typos).
    const fTokens: string[] = fNorm.match(/[a-z0-9]+/g) || [];
    let hits = 0;
    for (const t of qTokens) {
      if (!t) continue;
      if (fTokens.includes(t)) {
        hits++;
      } else if (
        fTokens.some(
          (ft) =>
            ft.startsWith(t) ||
            t.startsWith(ft) ||
            (ft.length >= 4 && levenshtein(ft, t) <= 1),
        )
      ) {
        hits += 0.6;
      }
    }
    if (hits > 0) score += f.weight * 0.4 * (hits / qTokens.length);
  }
  return score;
}

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most loved' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
];

type DiscoverItem = {
  id: string;
  title: string;
  category: string;
  src: string;
  slug: string | null;
};

export default function DiscoverView({
  products,
  aesthetics,
}: {
  products: ProductCardData[];
  aesthetics: string[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeItem, setActiveItem] = useState<DiscoverItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ---- DISCOVER FILTER STATE ----
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('newest');
  const [aesthetic, setAesthetic] = useState<string | null>(null);

  // ---- VIEWPORT (reactive state, not a ref — so constraints re-render) ----
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 800 });

  // Keep a ref for live reads inside callbacks / card depth calcs
  const viewportRef = useRef(viewportSize);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => {
      const next = { width: window.innerWidth, height: window.innerHeight };
      viewportRef.current = next;
      setViewportSize(next);
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  // ---- SEARCH PANEL: visible at top, hides on scroll down, reveals on hard upward ----
  const [searchOpen, setSearchOpen] = useState(true);
  const prevSmoothY = useRef(0);

  // ---- FILTERED / SORTED ITEMS ----
  const items: DiscoverItem[] = useMemo(() => {
    const query = q.trim();
    let scored = products
      .filter((p) => p.images && p.images.length > 0)
      .map((p) => ({ p, score: query ? scoreProduct(p, query) : 1 }));

    // Drop non-matches when a search query is active.
    if (query) scored = scored.filter((s) => s.score > 0);

    // Aesthetic chip filter stays an exact match.
    if (aesthetic) {
      scored = scored.filter((s) =>
        s.p.styleKeywords.some(
          (k) => k.toLowerCase() === aesthetic.toLowerCase(),
        ),
      );
    }

    scored.sort((a, b) => {
      // When searching, rank by relevance first, then the chosen sort.
      if (query && b.score !== a.score) return b.score - a.score;
      if (sort === 'price-asc') return a.p.price - b.p.price;
      if (sort === 'price-desc') return b.p.price - a.p.price;
      if (sort === 'popular') return b.p.soldCount - a.p.soldCount;
      return 0;
    });

    return scored.map(({ p }) => ({
      id: p.id,
      title: p.name,
      category: p.organization.name,
      src: p.images[0],
      slug: p.slug,
    }));
  }, [products, q, sort, aesthetic]);

  // ---- GRID DIMENSIONS ----
  const columns = 10;
  const cardWidth = 158;
  const cardHeight = 214;
  const gap = 18;

  // Bottom row is shifted down by the per-column diagonal offset, so the
  // grid is taller than a plain rows × (card+gap) calc. Without this the
  // scroll constraint cuts off the bottom-most (rightmost column) cards.
  const diagonalOffsetMax = (columns - 1) * DIAGONAL_STEP;

  const gridWidth = columns * (cardWidth + gap) - gap;
  const gridHeight =
    Math.ceil(items.length / columns) * (cardHeight + gap) -
    gap +
    diagonalOffsetMax;

  const padding = 140;
  const maxX = padding;
  const minX = viewportSize.width - gridWidth - padding;
  const maxY = padding;
  const minY = viewportSize.height - gridHeight - padding;

  // ---- SPRINGS — start at top of grid ----
  const x = useMotionValue(maxX);
  const y = useMotionValue(maxY);

  const springConfig = { damping: 46, stiffness: 210, mass: 0.85 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  // ---- SEARCH PANEL VISIBILITY LOGIC ----
  // At top → visible. Scroll down → hide. Hard upward scroll → reveal.
  useEffect(() => {
    prevSmoothY.current = maxY;
    const unsub = smoothY.on('change', (latest) => {
      const prev = prevSmoothY.current;
      const delta = latest - prev; // + = scrolling up, - = scrolling down
      prevSmoothY.current = latest;

      // Near top: always show
      if (latest > maxY - 80) {
        setSearchOpen(true);
        return;
      }

      // Hard upward scroll: reveal
      if (delta > 35) {
        setSearchOpen(true);
        return;
      }

      // Scrolling down: hide
      if (delta < -5) {
        setSearchOpen(false);
      }
    });
    return unsub;
  }, [smoothY, maxY]);

  // ---- RESET SCROLL POSITION WHEN FILTERS CHANGE ----
  const prevItemCount = useRef(items.length);
  useEffect(() => {
    if (prevItemCount.current !== items.length) {
      // Reset to top-left
      x.set(padding);
      y.set(padding);
      prevItemCount.current = items.length;
    }
  }, [items.length, x, y]);

  // ---- VELOCITY SKEW ----
  const xVelocity = useVelocity(smoothX);
  const yVelocity = useVelocity(smoothY);

  const rawSkewX = useTransform(xVelocity, [-2500, 2500], [-7, 7]);
  const rawSkewY = useTransform(yVelocity, [-2500, 2500], [-7, 7]);

  const skewSpringX = useSpring(rawSkewX, { damping: 28, stiffness: 130 });
  const skewSpringY = useSpring(rawSkewY, { damping: 28, stiffness: 130 });

  const reduceMotion = useReducedMotion();
  const skewXFinal: number | ReturnType<typeof useSpring> = reduceMotion
    ? 0
    : skewSpringX;
  const skewYFinal: number | ReturnType<typeof useSpring> = reduceMotion
    ? 0
    : skewSpringY;

  // ---- WHEEL PANNING (bounds use reactive viewportSize) ----
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const dX = e.deltaX;
      const dY = e.deltaY;
      const targetX = clamp(
        x.get() - (dX * 1.0 + dY * 0.18),
        viewportSize.width - gridWidth - padding,
        padding,
      );
      const targetY = clamp(
        y.get() - (dY * 1.0 + dX * 0.18),
        viewportSize.height - gridHeight - padding,
        padding,
      );
      x.set(targetX);
      y.set(targetY);
    },
    [x, y, gridWidth, gridHeight, viewportSize],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ---- ESCAPE KEY CLOSE MODAL ----
  useEffect(() => {
    if (!activeItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveItem(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeItem]);

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-[#070709] text-white selection:bg-stone-200 selection:text-black">
      {/* ─── MINIMAL EDITORIAL HEADER ─── */}
      <header className="pointer-events-none fixed left-0 right-0 top-[92px] z-30 flex items-center justify-between px-8">
        <div className="flex flex-col">
          <span className="font-mono text-[9px] tracking-[0.4em] text-[#DFBA73]/80">
            the feed
          </span>
          <h1 className="mt-1 font-display text-xl font-light tracking-wide text-[#FAF9F6]">
            Discover
          </h1>
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <span className="text-[10px] font-mono tracking-widest text-neutral-500">
            DRAG OR SCROLL — ANY DIRECTION — TO EXPLORE
          </span>
          <div className="flex items-center gap-2 rounded-full border border-white/5 bg-neutral-900/40 px-3 py-1 backdrop-blur-md">
            <Compass className="h-3 w-3 text-[#DFBA73]" />
            <span className="text-[9px] font-mono">FREE FLOW ON</span>
          </div>
        </div>
      </header>

      {/* ─── SOFT VIGNETTE ─── */}
      <div className="pointer-events-none fixed inset-0 z-20 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.35)_100%)]" />

      {/* ─── SEARCH PANEL — sticky top, visible at top, hides on scroll down, reveals on hard upward ─── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            key="search-panel"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="pointer-events-auto fixed left-0 right-0 top-[88px] z-40 flex justify-center px-4"
          >
            <div className="w-full max-w-2xl rounded-2xl border border-white/5 bg-[#0a0a0c]/90 px-4 py-3 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52525B]"
                  />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search products, brands, styles…"
                    className="w-full rounded-full border border-white/[0.06] bg-white/[0.03] py-2 pl-10 pr-8 text-[12px] text-[#FAF9F6] outline-none transition-all placeholder:text-[#52525B] focus:border-[#DFBA73]/30"
                  />
                  {q && (
                    <button
                      onClick={() => setQ('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525B] transition-colors hover:text-[#FAF9F6]"
                      aria-label="Clear search"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal size={13} className="text-[#52525B]" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#FAF9F6] outline-none focus:border-[#DFBA73]/30"
                  >
                    {SORTS.map((s) => (
                      <option
                        key={s.value}
                        value={s.value}
                        className="bg-[#121215]"
                      >
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {aesthetics.length > 0 && (
                <div className="mt-2.5 flex flex-nowrap gap-1.5 overflow-x-auto scrollbar-none">
                  <button
                    onClick={() => setAesthetic(null)}
                    className={`shrink-0 rounded-full border px-3 py-0.5 text-[9px] font-mono uppercase tracking-wider transition-all ${
                      aesthetic === null
                        ? 'border-[#DFBA73] bg-[#DFBA73] text-[#08080a]'
                        : 'border-white/[0.06] text-[#8E8E93] hover:text-[#FAF9F6]'
                    }`}
                  >
                    All
                  </button>
                  {aesthetics.map((a) => (
                    <button
                      key={a}
                      onClick={() =>
                        setAesthetic(aesthetic === a ? null : a)
                      }
                      className={`shrink-0 rounded-full border px-3 py-0.5 text-[9px] font-mono uppercase tracking-wider transition-all ${
                        aesthetic === a
                          ? 'border-[#DFBA73] bg-[#DFBA73] text-[#08080a]'
                          : 'border-white/[0.06] text-[#8E8E93] hover:text-[#FAF9F6]'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── DRAGGABLE CANVAS ─── */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full">
        <motion.div
          drag
          dragConstraints={{
            left: viewportSize.width - gridWidth - padding,
            right: padding,
            top: viewportSize.height - gridHeight - padding,
            bottom: padding,
          }}
          dragTransition={{ bounceStiffness: 380, bounceDamping: 42 }}
          dragElastic={0.06}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          style={{
            width: gridWidth,
            height: gridHeight,
            x: smoothX,
            y: smoothY,
            willChange: 'transform',
          }}
          className="absolute flex touch-none p-[120px]"
        >
          {items.map((item, index) => (
            <DiscoverCard
              key={`${item.id}-${index}`}
              item={item}
              index={index}
              columns={columns}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              gap={gap}
              smoothX={smoothX}
              smoothY={smoothY}
              viewportRef={viewportRef}
              skewSpringX={skewXFinal}
              skewSpringY={skewYFinal}
              reduceMotion={reduceMotion ?? false}
              isDragging={isDragging}
              onActivate={setActiveItem}
            />
          ))}
        </motion.div>
      </div>

      {/* ─── FLOAT INSTRUCTION ─── */}
      <div className="pointer-events-none absolute bottom-10 left-8 z-30 flex items-center gap-3.5 rounded-full border border-white/5 bg-black/40 px-4 py-2.5 backdrop-blur-md shadow-lg">
        <Move className="h-3.5 w-3.5 animate-bounce text-stone-400" />
        <span className="font-mono text-[9px] tracking-widest text-neutral-300">
          EXPLORE DISCOVER CANVAS
        </span>
      </div>

      {/* ─── CINEMATIC PREVIEW MODAL ─── */}
      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-6 backdrop-blur-md"
            onClick={() => setActiveItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 28, stiffness: 250 }}
              className="relative max-w-3xl overflow-hidden rounded-xl border border-white/10 bg-[#0c0c0e] p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveItem(null)}
                className="absolute right-5 top-5 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white backdrop-blur-md transition-all hover:bg-white/15 border border-white/10"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="overflow-hidden rounded-lg border border-white/5 bg-neutral-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeItem.src}
                  alt={activeItem.title}
                  className="max-h-[70vh] w-full object-contain"
                />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#DFBA73]/80">
                    {activeItem.category}
                  </span>
                  <span className="text-sm font-medium text-neutral-200">
                    {activeItem.title}
                  </span>
                </div>
                <Link
                  href={`/product/${activeItem.slug}`}
                  className="flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-center text-xs font-semibold text-black transition-all hover:bg-neutral-200"
                >
                  <span>VIEW</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ==========================================
   DISCOVER CARD — parallax + magnetic hover
   ========================================== */
type CardProps = {
  item: DiscoverItem;
  index: number;
  columns: number;
  cardWidth: number;
  cardHeight: number;
  gap: number;
  smoothX: ReturnType<typeof useSpring>;
  smoothY: ReturnType<typeof useSpring>;
  viewportRef: React.MutableRefObject<{ width: number; height: number }>;
  skewSpringX: number | ReturnType<typeof useSpring>;
  skewSpringY: number | ReturnType<typeof useSpring>;
  reduceMotion: boolean;
  isDragging: boolean;
  onActivate: (item: DiscoverItem) => void;
};

function DiscoverCard({
  item,
  index,
  columns,
  cardWidth,
  cardHeight,
  gap,
  smoothX,
  smoothY,
  viewportRef,
  skewSpringX,
  skewSpringY,
  reduceMotion,
  isDragging,
  onActivate,
}: CardProps) {
  const colIndex = index % columns;
  const diagonalOffset = colIndex * DIAGONAL_STEP;

  const left = colIndex * (cardWidth + gap);
  const top =
    Math.floor(index / columns) * (cardHeight + gap) + diagonalOffset;

  const depthMV = useMotionValue(1);

  const computeDepth = useCallback(() => {
    const cx = smoothX.get() + left + cardWidth / 2;
    const cy = smoothY.get() + top + cardHeight / 2;
    const vp = viewportRef.current;
    const dx = (cx - vp.width / 2) / (vp.width / 2 + 400);
    const dy = (cy - vp.height / 2) / (vp.height / 2 + 400);
    depthMV.set(Math.max(0, 1 - Math.hypot(dx, dy)));
  }, [smoothX, smoothY, left, top, cardWidth, cardHeight, viewportRef, depthMV]);

  useEffect(() => {
    computeDepth();
    const unsubX = smoothX.on('change', computeDepth);
    const unsubY = smoothY.on('change', computeDepth);
    return () => {
      unsubX();
      unsubY();
    };
  }, [computeDepth, smoothX, smoothY]);

  // ---- ENTRANCE REVEAL: staggered on first load + ease-in on scroll-into-view ----
  const revealedRef = useRef(false);
  const [revealed, setRevealed] = useState(reduceMotion);
  const revealTarget = useMotionValue(reduceMotion ? 1 : 0);
  const revealSpring = useSpring(revealTarget, {
    damping: 32,
    stiffness: 210,
    mass: 0.8,
  });

  const isVisibleNow = useCallback(() => {
    const cx = smoothX.get() + left + cardWidth / 2;
    const cy = smoothY.get() + top + cardHeight / 2;
    const vp = viewportRef.current;
    const margin = 140;
    return (
      cx > -margin &&
      cx < vp.width + margin &&
      cy > -margin &&
      cy < vp.height + margin
    );
  }, [smoothX, smoothY, left, top, cardWidth, cardHeight, viewportRef]);

  // Initial reveal: stagger only the cards already on screen at load.
  useEffect(() => {
    if (reduceMotion) {
      revealedRef.current = true;
      setRevealed(true);
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const raf = requestAnimationFrame(() => {
      if (isVisibleNow()) {
        const stagger = Math.min(index, 24) * 0.035;
        timer = setTimeout(() => {
          if (!revealedRef.current) {
            revealedRef.current = true;
            setRevealed(true);
          }
        }, stagger * 1000);
      }
    });
    return () => {
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [index, reduceMotion, isVisibleNow]);

  // Scroll reveal: ease in any card as it enters the viewport.
  useEffect(() => {
    const check = () => {
      if (!revealedRef.current && isVisibleNow()) {
        revealedRef.current = true;
        setRevealed(true);
      }
    };
    check();
    const unsubX = smoothX.on('change', check);
    const unsubY = smoothY.on('change', check);
    return () => {
      unsubX();
      unsubY();
    };
  }, [isVisibleNow, smoothX, smoothY]);

  useEffect(() => {
    revealTarget.set(revealed ? 1 : 0);
  }, [revealed, revealTarget]);

  const depthOpacity = useTransform(
    depthMV,
    [0, 0.3, 1],
    reduceMotion ? [1, 1, 1] : [0.35, 0.7, 1],
  );
  const depthScale = useTransform(
    depthMV,
    [0, 1],
    reduceMotion ? [1, 1] : [0.9, 1],
  );
  const parallaxY = useTransform(
    depthMV,
    [0, 1],
    reduceMotion ? [0, 0] : [40, 0],
  );

  // Combine the entrance reveal with the parallax depth transforms.
  const opacity = useTransform(
    [revealSpring, depthOpacity],
    ([r, d]: number[]) => r * d,
  );
  const scale = useTransform(
    [revealSpring, depthScale],
    ([r, d]: number[]) => r * d,
  );
  const revealY = useTransform(revealSpring, [0, 1], [28, 0]);
  const yTotal = useTransform(
    [parallaxY, revealY],
    ([p, r]: number[]) => p + r,
  );

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 260, damping: 18, mass: 0.35 });
  const smy = useSpring(my, { stiffness: 260, damping: 18, mass: 0.35 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * 0.22);
    my.set((e.clientY - (r.top + r.height / 2)) * 0.3);
  };
  const handleLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      className="absolute"
      style={{
        left,
        top,
        width: cardWidth,
        height: cardHeight,
        y: yTotal,
        opacity,
        scale,
        willChange: 'transform, opacity',
      }}
    >
      <motion.div
        style={{
          x: smx,
          y: smy,
          skewX: skewSpringX,
          skewY: skewSpringY,
          willChange: 'transform',
        }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        whileHover={reduceMotion ? undefined : { scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400, damping: 26 }}
        onClick={() => {
          if (!isDragging) onActivate(item);
        }}
        className="group relative h-full w-full overflow-hidden rounded-lg border border-white/5 bg-neutral-900/60 p-2.5 backdrop-blur-sm transition-colors duration-300 hover:border-[#DFBA73]/40"
      >
        <div className="relative h-[184px] w-full overflow-hidden rounded-md bg-neutral-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.src}
            alt={item.title}
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100">
            <Maximize2 className="h-2.5 w-2.5 text-neutral-200" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
