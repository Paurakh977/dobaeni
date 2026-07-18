'use client';

import { motion } from 'framer-motion';
import { Maximize2 } from 'lucide-react';
import LikeButton from '@/app/components/LikeButton';

export type FeedItem = {
  id: string;
  title: string;
  category: string;
  src: string;
  slug: string | null;
  likeCount: number;
  commentCount: number;
  liked: boolean;
};

// The Discover-style tile — same look as DiscoverView's card (image fill,
// hover zoom, gradient + title/category overlay, like + expand affordance),
// but rendered as a normal flow element so it lives inside a scrolling page.
export default function DiscoverTile({
  item,
  index = 0,
  onActivate,
}: {
  item: FeedItem;
  index?: number;
  onActivate?: (item: FeedItem) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.035, 0.35), ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        type="button"
        onClick={() => onActivate?.(item)}
        className="group block w-full text-left"
        data-cursor="hover"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/[0.06] bg-neutral-900/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.src}
            alt={item.title}
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute inset-x-0 bottom-0 translate-y-1 px-4 pb-4 pt-8 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="truncate text-[13px] font-medium leading-tight text-[#FAF9F6]">
              {item.title}
            </p>
            <p className="mt-0.5 truncate text-[10px] font-mono uppercase tracking-wider text-[#DFBA73]/80">
              {item.category}
            </p>
          </div>
          <div className="absolute right-3 top-3 rounded-full bg-black/40 p-1.5 backdrop-blur-md">
            <LikeButton
              productId={item.id}
              initialLiked={item.liked}
              initialCount={item.likeCount}
              showCount={false}
              size={15}
            />
          </div>
          <div className="absolute bottom-3 right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100">
            <Maximize2 className="h-2.5 w-2.5 text-neutral-200" />
          </div>
        </div>
      </button>
    </motion.div>
  );
}
