'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Sparkles, Check, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import SafeImage from '@/app/components/SafeImage';
import AddToCartButton from '@/app/components/AddToCartButton';
import LookProductPopup from './LookProductPopup';
import { formatPrice, discountPercent } from '@/lib/format';
import type { LookDetail, LookHotspotData } from '@/lib/types';

function popupPosition(h: LookHotspotData): React.CSSProperties {
  const isLeft = h.left < 30;
  const isRight = h.left > 70;
  const isBottom = h.top > 50;

  let left: string;
  if (isLeft) {
    left = `calc(${h.left}% - 12px)`;
  } else if (isRight) {
    left = `calc(${h.left}% + 12px - 176px)`;
  } else {
    left = `calc(${h.left}% - 88px)`;
  }

  if (isBottom) {
    return { left, bottom: `${100 - h.top}%` };
  }
  return { left, top: `calc(${h.top}% + 12px)` };
}

export default function LookViewer({ look }: { look: LookDetail }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [addingAll, setAddingAll] = useState(false);
  const [addedAll, setAddedAll] = useState(false);

  const discount = look.bundleDiscount;
  const finalPrice = look.bundlePrice ?? look.totalPrice;
  const openHotspot = openId ? look.hotspots.find((h) => h.id === openId) : null;

  async function addWholeLook() {
    setAddingAll(true);
    setAddedAll(false);
    try {
      await Promise.all(
        look.hotspots.map((h) =>
          fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: h.productId, quantity: 1 }),
          }),
        ),
      );
      window.dispatchEvent(new Event('cart:updated'));
      setAddedAll(true);
      setTimeout(() => setAddedAll(false), 1800);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingAll(false);
    }
  }

  const renderHeader = (isMobile: boolean) => (
    <div className={isMobile ? "mb-6 lg:hidden" : "hidden lg:block mb-8"}>
      <Link
        href="/discover"
        className="mb-4 inline-flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.2em] text-[#7C7C83] transition-colors hover:text-[#DFBA73]"
      >
        <ArrowLeft size={10} /> Back to discover
      </Link>

      <div className="space-y-1.5">
        <p className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-[0.3em] text-[#DFBA73]">
          <Sparkles size={10} /> Shop the Look
        </p>
        <h1 className="text-2xl font-light tracking-tight text-[#FAF9F6] md:text-3xl font-display">
          {look.title}
        </h1>
        {look.description && (
          <p className="max-w-md text-[12px] leading-relaxed text-[#7C7C83] font-light">
            {look.description}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
      
      {/* Mobile Header */}
      <div className="lg:col-span-12">
        {renderHeader(true)}
      </div>

      {/* Left Column: Interactive Look Image */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center lg:sticky lg:top-24">
        <div className="relative w-full max-w-md lg:h-[calc(100vh-180px)] aspect-[4/5]">
          
          {/* Inner Rounded Image frame */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c0c0e] shadow-2xl">
            <SafeImage
              src={look.coverImage}
              alt={look.title}
              className="h-full w-full object-cover select-none"
            />
          </div>

          {/* Hotspot dots - direct children of image container */}
          {look.hotspots.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setOpenId(openId === h.id ? null : h.id)}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer focus:outline-none group"
              style={{ left: `${h.left}%`, top: `${h.top}%` }}
              aria-label={`Shop ${h.product.name}`}
            >
              <span className="absolute -inset-3 rounded-full border border-[#DFBA73]/40 animate-ping" />
              <span className={`absolute -inset-2 rounded-full border transition-all duration-300 ${
                openId === h.id ? 'border-white/60 scale-110' : 'border-white/25 group-hover:border-white/50'
              }`} />
              <span className={`relative flex h-3.5 w-3.5 items-center justify-center rounded-full transition-all duration-300 ${
                openId === h.id ? 'bg-[#DFBA73] scale-110' : 'bg-white/90'
              } shadow-[0_2px_8px_rgba(0,0,0,0.5)]`} />
            </button>
          ))}

          {/* Popup rendered at image-container level */}
          <AnimatePresence>
            {openHotspot && (
              <motion.div
                key={openHotspot.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute z-30"
                style={popupPosition(openHotspot)}
                onClick={(e) => e.stopPropagation()}
              >
                <LookProductPopup hotspot={openHotspot} onClose={() => setOpenId(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-3 text-center text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">
          Click the points to explore items
        </p>
      </div>

      {/* Right Column: Collection Panel & Curated Pieces */}
      <div className="lg:col-span-5 flex flex-col justify-start space-y-8">
        
        {/* Desktop Header */}
        {renderHeader(false)}

        {/* Minimal Bundle Checkout Card */}
        <div className="rounded-xl border border-[#DFBA73]/15 bg-[#0A0A0E]/60 p-5 backdrop-blur-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start xl:flex-row xl:items-center">
            <div className="space-y-1">
              <p className="flex items-center gap-1 text-[8px] font-mono uppercase tracking-[0.2em] text-[#DFBA73]">
                <Sparkles size={10} /> Entire Look Bundle
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-light tracking-tight text-[#FAF9F6]">{formatPrice(finalPrice)}</span>
                {discount ? (
                  <>
                    <span className="text-[12px] text-white/30 line-through">
                      {formatPrice(look.totalPrice)}
                    </span>
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-mono text-emerald-400">
                      Save {discount}%
                    </span>
                  </>
                ) : null}
              </div>
            </div>

            <button
              onClick={addWholeLook}
              disabled={addingAll}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#DFBA73] px-5 py-3 text-[9px] font-mono font-medium uppercase tracking-[0.15em] text-[#08080a] transition-all duration-300 hover:bg-[#ebd09b] disabled:opacity-50 active:scale-[0.98] w-full sm:w-auto lg:w-full xl:w-auto"
            >
              {addingAll ? (
                <Loader2 size={12} className="animate-spin" />
              ) : addedAll ? (
                <Check size={12} />
              ) : (
                <ShoppingBag size={12} />
              )}
              {addedAll ? 'Added to bag' : 'Add entire look'}
            </button>
          </div>
        </div>

        {/* Curated Pieces Vertical Grid */}
        <div className="space-y-4">
          <div className="border-b border-white/[0.06] pb-2">
            <p className="text-[9px] font-mono uppercase tracking-widest text-[#7C7C83]">
              Curated Pieces ({look.hotspots.length})
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {look.hotspots.map((h, i) => {
              const p = h.product;
              const d = discountPercent(p.price, p.compareAtPrice);
              const out = p.stock <= 0;
              return (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  className="group flex flex-col justify-between overflow-hidden rounded-xl border border-white/[0.06] bg-[#0E0E12]/30 hover:border-white/10 transition-all duration-300"
                >
                  <Link
                    href={p.slug ? `/product/${p.slug}` : '#'}
                    className="relative block aspect-[3/4] overflow-hidden bg-white/[0.01]"
                  >
                    <SafeImage
                      src={p.image ?? ''}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
                    />
                    {d && (
                      <span className="absolute left-3 top-3 border border-[#DFBA73]/30 bg-black/70 px-1.5 py-0.5 text-[8px] font-mono text-[#DFBA73] backdrop-blur-sm">
                        -{d}%
                      </span>
                    )}
                  </Link>
                  
                  <div className="flex flex-col justify-between flex-1 p-3 space-y-2.5">
                    <div className="space-y-0.5">
                      <Link
                        href={p.slug ? `/product/${p.slug}` : '#'}
                        className="line-clamp-1 text-[11px] font-light text-white/95 transition-colors group-hover:text-[#DFBA73]"
                      >
                        {p.name}
                      </Link>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[11px] text-[#DFBA73] font-mono">{formatPrice(p.price, p.currency)}</span>
                        {d && (
                          <span className="text-[9px] text-white/30 line-through font-mono">
                            {formatPrice(p.compareAtPrice, p.currency)}
                          </span>
                        )}
                      </div>
                    </div>
                    {out ? (
                      <p className="text-center text-[8px] font-mono uppercase tracking-wider text-[#C9772E] py-1">
                        Sold Out
                      </p>
                    ) : (
                      <div className="text-[10px]">
                        <AddToCartButton productId={p.id} label="Add to Bag" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
