'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowUpRight, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import type { ProductCardData } from '@/lib/types';
import LikeButton from '@/app/components/LikeButton';
import DiscoverTile, { FeedItem } from './DiscoverTile';

const toFeedItem = (p: ProductCardData): FeedItem => ({
  id: p.id,
  title: p.name,
  category: p.organization.name,
  src: p.images[0],
  slug: p.slug,
  likeCount: p.likeCount,
  commentCount: p.commentCount,
  liked: p.liked ?? false,
});

// A continuous, page-native infinite feed of Discover-style tiles. Because it
// lives inside the normal document scroll (no fixed/overflow container, no
// wheel hijacking) the page scroll never breaks — it just keeps revealing more
// products. `loadMore` (when provided) is fetched as the sentinel scrolls into
// view, so "You might also like" never ends.
export default function DiscoverFeed({
  products,
  title,
  subtitle,
  loadMore,
}: {
  products: ProductCardData[];
  title?: string;
  subtitle?: string;
  loadMore?: () => Promise<ProductCardData[]>;
}) {
  const [items, setItems] = useState<FeedItem[]>(() => products.map(toFeedItem));
  const [active, setActive] = useState<FeedItem | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const loading = useRef(false);

  const initialIds = products.map((p) => p.id).join(',');
  // Reset the feed when the source product changes (e.g. navigating between
  // product pages without a full remount).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(products.map(toFeedItem));
  }, [initialIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(() => {
    if (!loadMore || loading.current) return;
    loading.current = true;
    Promise.resolve(loadMore())
      .then((more) => {
        if (more && more.length) {
          setItems((prev) => {
            const seen = new Set(prev.map((i) => i.id));
            const fresh = more
              .map(toFeedItem)
              .filter((i) => !seen.has(i.id));
            return [...prev, ...fresh];
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        loading.current = false;
      });
  }, [loadMore]);

  useEffect(() => {
    if (!loadMore) return;
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) load();
      },
      { rootMargin: '800px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [load, loadMore]);

  if (products.length === 0 && items.length === 0) return null;

  return (
    <section className="mt-16">
      {title && (
        <div className="mb-5">
          <h2 className="text-xl font-light font-display text-[#FAF9F6]">{title}</h2>
          {subtitle && <p className="mt-1 text-[12px] text-[#52525B]">{subtitle}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((it, i) => (
          <DiscoverTile key={`${it.id}-${i}`} item={it} index={i} onActivate={setActive} />
        ))}
      </div>

      {loadMore && <div ref={sentinel} className="h-16 w-full" aria-hidden />}

      {/* CINEMATIC PREVIEW MODAL (same as DiscoverView) */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-6 backdrop-blur-md"
            onClick={() => setActive(null)}
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
                onClick={() => setActive(null)}
                className="absolute right-5 top-5 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white backdrop-blur-md transition-all hover:bg-white/15 border border-white/10"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="overflow-hidden rounded-lg border border-white/5 bg-neutral-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={active.src}
                  alt={active.title}
                  className="max-h-[70vh] w-full object-contain"
                />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#DFBA73]/80">
                    {active.category}
                  </span>
                  <span className="text-sm font-medium text-neutral-200">{active.title}</span>
                  <div className="flex items-center gap-4 pt-1">
                    <LikeButton
                      productId={active.id}
                      initialLiked={active.liked}
                      initialCount={active.likeCount}
                      size={15}
                    />
                    <Link
                      href={`/product/${active.slug}`}
                      className="flex items-center gap-1.5 text-[#8E8E93] transition-colors hover:text-[#DFBA73]"
                      data-cursor="hover"
                    >
                      <MessageCircle size={15} />
                      <span>{active.commentCount}</span>
                    </Link>
                  </div>
                </div>
                <Link
                  href={`/product/${active.slug}`}
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
    </section>
  );
}
