'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import { formatPrice } from '@/lib/format';
import LookProductPopup from './LookProductPopup';
import type { LookSummary } from '@/lib/types';

export default function LookCard({ look, index = 0 }: { look: LookSummary; index?: number }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const href = `/looks/${look.slug ?? look.id}`;
  const price = look.bundlePrice ?? look.totalPrice;

  const openHotspot = openId ? look.hotspots.find((h) => h.id === openId) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.4, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <div className="space-y-2.5">
        <div className="relative aspect-[4/5] overflow-visible rounded-xl border border-white/[0.06] bg-black/20">
          <Link href={href} className="block h-full" data-cursor="hover">
            <SafeImage
              src={look.coverImage}
              alt={look.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102 rounded-xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-xl" />
          </Link>

          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider text-[#FAF9F6] backdrop-blur-sm z-10">
            <Sparkles size={8} className="text-[#DFBA73]/85" />
            {look.hotspotCount} item{look.hotspotCount === 1 ? '' : 's'}
          </span>

          {look.bundleDiscount ? (
            <span className="absolute right-3 top-3 border border-emerald-500/25 bg-black/60 px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider text-emerald-400 backdrop-blur-sm z-10">
              Save {look.bundleDiscount}%
            </span>
          ) : null}

          <span className="absolute bottom-3 left-3 text-[8px] font-mono uppercase tracking-[0.2em] text-white/80 transition-transform duration-300 group-hover:translate-x-0.5 z-10">
            View Look →
          </span>

          {/* Hotspot dots */}
          {look.hotspots.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpenId(openId === h.id ? null : h.id);
              }}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer focus:outline-none"
              style={{ left: `${h.left}%`, top: `${h.top}%` }}
              aria-label={`Shop ${h.product.name}`}
            >
              <span className="absolute -inset-3 rounded-full border border-[#DFBA73]/40 animate-ping" />
              <span className={`absolute -inset-2 rounded-full border transition-all duration-300 ${
                openId === h.id ? 'border-white/60 scale-110' : 'border-white/25'
              }`} />
              <span className={`relative flex h-3.5 w-3.5 items-center justify-center rounded-full transition-all duration-300 ${
                openId === h.id ? 'bg-[#DFBA73] scale-110' : 'bg-white/90'
              } shadow-[0_2px_8px_rgba(0,0,0,0.5)]`} />
            </button>
          ))}

          {/* Popup rendered at image-container level so it doesn't inherit zero-size parent */}
          <AnimatePresence>
            {openHotspot && (
              <motion.div
                key={openHotspot.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute z-30"
                style={
                  openHotspot.top > 50
                    ? {
                        left: openHotspot.left < 30
                          ? `calc(${openHotspot.left}% - 12px)`
                          : openHotspot.left > 70
                            ? `calc(${openHotspot.left}% + 12px - 176px)`
                            : `calc(${openHotspot.left}% - 88px)`,
                        bottom: `${100 - openHotspot.top}%`,
                      }
                    : {
                        left: openHotspot.left < 30
                          ? `calc(${openHotspot.left}% - 12px)`
                          : openHotspot.left > 70
                            ? `calc(${openHotspot.left}% + 12px - 176px)`
                            : `calc(${openHotspot.left}% - 88px)`,
                        top: `calc(${openHotspot.top}% + 12px)`,
                      }
                }
                onClick={(e) => e.stopPropagation()}
              >
                <LookProductPopup hotspot={openHotspot as any} onClose={() => setOpenId(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link href={href} className="block" data-cursor="hover">
          <div className="flex items-center justify-between px-0.5">
            <h4 className="truncate text-[12px] font-light text-white/90 transition-colors group-hover:text-[#DFBA73]">
              {look.title}
            </h4>
            <span className="shrink-0 text-[11px] text-[#7C7C83] font-mono">{formatPrice(price)}</span>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
