'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BadgeCheck, Minus, Plus, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import { StarRating } from '@/app/components/StarRating';
import { StarInput } from '@/app/components/StarInput';
import FollowButton from '@/app/components/FollowButton';
import SaveToBoard from '@/app/components/SaveToBoard';
import AddToCartButton from '@/app/components/AddToCartButton';
import { formatPrice, formatDate, discountPercent, TIER_BADGE } from '@/lib/format';
import type { ProductDetail, ReviewData } from '@/lib/queries';

export default function ProductDetail({
  product,
  initialFollowing,
  initialFollowerCount,
}: {
  product: ProductDetail;
  initialFollowing: boolean;
  initialFollowerCount: number;
}) {
  const [active, setActive] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<ReviewData[]>(product.reviews);

  const [rvRating, setRvRating] = useState(0);
  const [rvTitle, setRvTitle] = useState('');
  const [rvComment, setRvComment] = useState('');
  const [rvBusy, setRvBusy] = useState(false);
  const [rvDone, setRvDone] = useState(false);

  const disc = discountPercent(product.price, product.compareAtPrice);
  const mainImage = product.images[active] ?? product.images[0] ?? null;
  const tier = TIER_BADGE[product.organization.tier];
  const lowStock = product.stock > 0 && product.stock <= 5;

  async function submitReview() {
    if (!rvRating) return;
    setRvBusy(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          rating: rvRating,
          title: rvTitle,
          comment: rvComment,
        }),
      });
      if (res.ok) {
        const { review } = await res.json();
        const newReview: ReviewData = {
          id: review.id,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          images: [],
          isVerifiedPurchase: false,
          helpfulCount: 0,
          createdAt: new Date().toISOString(),
          user: { name: 'You', image: null },
          sellerReply: null,
        };
        setReviews((r) => [newReview, ...r]);
        setRvRating(0);
        setRvTitle('');
        setRvComment('');
        setRvDone(true);
        setTimeout(() => setRvDone(false), 2500);
      }
    } finally {
      setRvBusy(false);
    }
  }

  return (
    <div>
      <nav className="mb-8 flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#52525B]">
        <Link href="/discover" className="hover:text-[#DFBA73]" data-cursor="hover">Discover</Link>
        <span>/</span>
        <span className="text-[#8E8E93]">{product.organization.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative aspect-square overflow-hidden rounded-3xl border border-white/[0.06] bg-[#0E0E12]"
          >
            <SafeImage src={mainImage} alt={product.name} className="h-full w-full object-cover" />
            {disc != null && (
              <span className="absolute left-4 top-4 rounded-full bg-[#DFBA73] px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#08080a]">
                {disc}% off
              </span>
            )}
          </motion.div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  data-cursor="hover"
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border transition-all ${
                    active === i ? 'border-[#DFBA73]' : 'border-white/[0.08] opacity-70 hover:opacity-100'
                  }`}
                >
                  <SafeImage src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center justify-between gap-4">
            <Link
              href={`/brand/${product.organization.slug}`}
              className="group flex items-center gap-3"
              data-cursor="hover"
            >
              <div className="h-11 w-11 overflow-hidden rounded-full border border-white/[0.08] bg-[#0E0E12]">
                <SafeImage src={product.organization.logo} alt={product.organization.name} className="h-full w-full object-cover" />
              </div>
              <div>
                <span className="flex items-center gap-1.5 text-[14px] text-[#FAF9F6] group-hover:text-[#DFBA73]">
                  {product.organization.name}
                  {product.organization.isVerified && <BadgeCheck size={14} className="text-[#DFBA73]" />}
                </span>
                {product.organization.city && (
                  <span className="text-[11px] text-[#52525B]">{product.organization.city}</span>
                )}
              </div>
            </Link>
            {tier && (
              <span className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-wider ${tier.className}`}>
                {tier.label}
              </span>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <FollowButton
              orgId={product.organization.id}
              initialFollowing={initialFollowing}
              initialCount={initialFollowerCount}
            />
          </div>

          <h1 className="mt-6 text-4xl font-light tracking-wide font-display text-[#FAF9F6]">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl text-[#DFBA73]">{formatPrice(product.price, product.currency)}</span>
            {product.compareAtPrice && (
              <span className="text-[15px] text-[#52525B] line-through">
                {formatPrice(product.compareAtPrice, product.currency)}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-3 text-[12px] text-[#8E8E93]">
            <span className="flex items-center gap-1.5">
              <StarRating value={product.ratingAvg} size={13} />
              {product.ratingCount > 0 ? `${product.ratingAvg.toFixed(1)} · ${product.ratingCount} reviews` : 'No reviews yet'}
            </span>
            {product.soldCount > 0 && <span>· {product.soldCount} sold</span>}
          </div>

          {product.description && (
            <p className="mt-5 max-w-prose text-[14px] font-light leading-relaxed text-[#9A9AA0]">
              {product.description}
            </p>
          )}

          {/* Size */}
          {product.sizes.length > 0 && (
            <div className="mt-7">
              <p className="mb-2 text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    data-cursor="hover"
                    className={`min-w-[3rem] rounded-xl border px-4 py-2.5 text-[13px] transition-all ${
                      size === s
                        ? 'border-[#DFBA73] bg-[#DFBA73]/10 text-[#DFBA73]'
                        : 'border-white/[0.08] text-[#FAF9F6] hover:border-white/20'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color */}
          {product.colors.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">Color</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    data-cursor="hover"
                    className={`rounded-xl border px-4 py-2.5 text-[13px] transition-all ${
                      color === c
                        ? 'border-[#DFBA73] bg-[#DFBA73]/10 text-[#DFBA73]'
                        : 'border-white/[0.08] text-[#FAF9F6] hover:border-white/20'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + actions */}
          <div className="mt-7 flex items-center gap-3">
            <div className="flex items-center rounded-2xl border border-white/[0.08]">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-4 py-3 text-[#FAF9F6] transition-colors hover:text-[#DFBA73]"
                aria-label="Decrease"
              >
                <Minus size={15} />
              </button>
              <span className="w-10 text-center text-[14px] text-[#FAF9F6]">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                className="px-4 py-3 text-[#FAF9F6] transition-colors hover:text-[#DFBA73]"
                aria-label="Increase"
              >
                <Plus size={15} />
              </button>
            </div>
            <AddToCartButton productId={product.id} size={size} color={color} quantity={qty} className="flex-1" />
          </div>

          <div className="mt-3">
            <SaveToBoard productId={product.id} />
          </div>

          {/* Trust row */}
          <div className="mt-7 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-6 text-[11px] text-[#8E8E93]">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Truck size={16} className="text-[#DFBA73]" /> Fast shipping
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <RotateCcw size={16} className="text-[#DFBA73]" /> Easy returns
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <ShieldCheck size={16} className="text-[#DFBA73]" /> Buyer protected
            </div>
          </div>

          {lowStock && (
            <p className="mt-4 text-[12px] text-[#DFBA73]">Only {product.stock} left in stock — hurry!</p>
          )}
        </div>
      </div>

      {/* Details + reviews */}
      <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="text-xl font-light font-display text-[#FAF9F6]">Details</h2>
          <dl className="mt-4 space-y-3 text-[13px]">
            {product.material && (
              <div className="flex justify-between border-b border-white/[0.06] pb-3">
                <dt className="text-[#52525B]">Material</dt>
                <dd className="text-[#FAF9F6]">{product.material}</dd>
              </div>
            )}
            {product.gender && (
              <div className="flex justify-between border-b border-white/[0.06] pb-3">
                <dt className="text-[#52525B]">For</dt>
                <dd className="text-[#FAF9F6] capitalize">{product.gender}</dd>
              </div>
            )}
            {product.occasion.length > 0 && (
              <div className="flex justify-between border-b border-white/[0.06] pb-3">
                <dt className="text-[#52525B]">Occasion</dt>
                <dd className="text-right text-[#FAF9F6]">{product.occasion.join(', ')}</dd>
              </div>
            )}
            <div className="flex justify-between border-b border-white/[0.06] pb-3">
              <dt className="text-[#52525B]">Views</dt>
              <dd className="text-[#FAF9F6]">{product.viewCount}</dd>
            </div>
          </dl>

          {product.styleKeywords.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.styleKeywords.map((k) => (
                <span key={k} className="rounded-full border border-white/[0.08] px-3 py-1 text-[11px] text-[#8E8E93]">
                  {k}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-light font-display text-[#FAF9F6]">
              Reviews <span className="text-[#52525B]">({reviews.length})</span>
            </h2>
            <div className="flex items-center gap-2 text-[13px] text-[#8E8E93]">
              <StarRating value={product.ratingAvg} size={15} />
              {product.ratingAvg.toFixed(1)}
            </div>
          </div>

          {/* Review form */}
          <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="mb-3 text-[12px] font-mono uppercase tracking-widest text-[#7C7C83]">
              {rvDone ? 'Thank you for your review!' : 'Write a review'}
            </p>
            <StarInput value={rvRating} onChange={setRvRating} />
            <input
              value={rvTitle}
              onChange={(e) => setRvTitle(e.target.value)}
              placeholder="Title (optional)"
              data-cursor="text"
              className="mt-3 w-full rounded-xl border border-white/[0.08] bg-[#0E0E12] px-4 py-3 text-[13px] text-[#FAF9F6] outline-none placeholder:text-[#52525B] focus:border-[#DFBA73]/40"
            />
            <textarea
              value={rvComment}
              onChange={(e) => setRvComment(e.target.value)}
              placeholder="Share your thoughts…"
              rows={3}
              data-cursor="text"
              className="mt-3 w-full resize-none rounded-xl border border-white/[0.08] bg-[#0E0E12] px-4 py-3 text-[13px] text-[#FAF9F6] outline-none placeholder:text-[#52525B] focus:border-[#DFBA73]/40"
            />
            <button
              onClick={submitReview}
              disabled={rvBusy || !rvRating}
              className="mt-3 rounded-xl bg-[#DFBA73] px-6 py-3 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3] disabled:opacity-40"
            >
              {rvBusy ? 'Posting…' : 'Post review'}
            </button>
          </div>

          {/* Review list */}
          <div className="mt-6 space-y-4">
            {reviews.length === 0 ? (
              <p className="rounded-2xl border border-white/[0.06] bg-white/[0.01] py-10 text-center text-[13px] text-[#52525B]">
                Be the first to review this piece.
              </p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DFBA73] text-[11px] font-bold text-[#08080a]">
                        {r.user.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-[13px] text-[#FAF9F6]">{r.user.name}</p>
                        <p className="text-[10px] text-[#52525B]">{formatDate(r.createdAt)}</p>
                      </div>
                    </div>
                    <StarRating value={r.rating} size={13} />
                  </div>
                  {r.title && <p className="mt-3 text-[14px] font-light text-[#FAF9F6]">{r.title}</p>}
                  {r.comment && <p className="mt-1 text-[13px] font-light leading-relaxed text-[#9A9AA0]">{r.comment}</p>}
                  {r.isVerifiedPurchase && (
                    <span className="mt-3 inline-block rounded-full bg-[#DFBA73]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#DFBA73]">
                      Verified purchase
                    </span>
                  )}
                  {r.sellerReply && (
                    <div className="mt-3 rounded-xl border-l-2 border-[#DFBA73] bg-white/[0.02] px-4 py-2 text-[12px] text-[#9A9AA0]">
                      <span className="text-[#DFBA73]">Seller:</span> {r.sellerReply}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
