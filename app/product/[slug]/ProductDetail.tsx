'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BadgeCheck,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  ShieldCheck,
  Share2,
  Check,
  Sparkles,
  Maximize2,
  X,
  PenTool,
  Compass,
} from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import { StarRating } from '@/app/components/StarRating';
import { StarInput } from '@/app/components/StarInput';
import FollowButton from '@/app/components/FollowButton';
import SaveToBoard from '@/app/components/SaveToBoard';
import AddToCartButton from '@/app/components/AddToCartButton';
import LikeButton from '@/app/components/LikeButton';
import CommentSection from '@/app/components/CommentSection';
import DiscoverFeed from '@/app/components/DiscoverFeed';
import { formatPrice, formatDate, discountPercent, TIER_BADGE } from '@/lib/format';
import type { ProductDetail, ReviewData } from '@/lib/queries';
import type { ProductCardData } from '@/lib/types';

export default function ProductDetail({
  product,
  initialFollowing,
  initialFollowerCount,
  related,
}: {
  product: ProductDetail;
  initialFollowing: boolean;
  initialFollowerCount: number;
  related: { fromVendor: ProductCardData[]; similar: ProductCardData[] };
}) {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [size, setSize] = useState<string | null>(product.sizes[0] ?? null);
  const [color, setColor] = useState<string | null>(product.colors[0] ?? null);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<ReviewData[]>(product.reviews);
  const [visibleReviews, setVisibleReviews] = useState(3);
  const [isZoomed, setIsZoomed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'reviews' | 'discussion'>('reviews');
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Related products logic
  const [similarPool, setSimilarPool] = useState<ProductCardData[]>(related.similar);
  const similarRef = useRef(similarPool);
  useEffect(() => {
    similarRef.current = similarPool;
  }, [similarPool]);

  const loadMoreSimilar = useCallback(async (): Promise<ProductCardData[]> => {
    const exclude = similarRef.current.map((p) => p.id).join(',');
    try {
      const res = await fetch(
        `/api/related?productId=${product.id}&exclude=${encodeURIComponent(exclude)}&limit=16`,
      );
      if (!res.ok) return [];
      const data = await res.json();
      const more: ProductCardData[] = data.products || [];
      if (more.length) setSimilarPool((prev) => [...prev, ...more]);
      return more;
    } catch {
      return [];
    }
  }, [product.id]);

  // Review states
  const [rvRating, setRvRating] = useState(0);
  const [rvTitle, setRvTitle] = useState('');
  const [rvComment, setRvComment] = useState('');
  const [rvBusy, setRvBusy] = useState(false);
  const [rvDone, setRvDone] = useState(false);

  const disc = discountPercent(product.price, product.compareAtPrice);
  const mainImage = product.images[active] ?? product.images[0] ?? null;
  const tier = TIER_BADGE[product.organization.tier];
  const lowStock = product.stock > 0 && product.stock <= 5;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          url: window.location.href,
        });
      } catch {
        // Safe fallback
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
        setShowReviewForm(false);
        setTimeout(() => setRvDone(false), 3000);
      }
    } finally {
      setRvBusy(false);
    }
  }

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  return (
    <div className="relative min-h-screen text-[#FAF9F6] antialiased selection:bg-[#DFBA73]/30 selection:text-[#FAF9F6]">
      {/* Top Breadcrumb & Actions bar */}
      <div className="sticky top-0 z-40 mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#08080A]/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.01] px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#8E8E93] transition-colors hover:border-[#DFBA73]/40 hover:text-[#DFBA73]"
          >
            <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
            Back
          </button>
          <div className="hidden h-4 w-px bg-white/[0.08] sm:block" />
          <nav className="hidden items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#52525B] sm:flex">
            <Link href="/discover" className="flex items-center gap-1 transition-colors hover:text-[#DFBA73]">
              <Compass size={12} /> Discover
            </Link>
            <span>/</span>
            <Link href={`/brand/${product.organization.slug}`} className="transition-colors hover:text-[#DFBA73]">
              {product.organization.name}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.01] px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#8E8E93] transition-colors hover:border-white/20 hover:text-[#FAF9F6]"
          >
            {copied ? (
              <>
                <Check size={12} className="text-[#DFBA73]" /> Copied
              </>
            ) : (
              <>
                <Share2 size={12} /> Share
              </>
            )}
          </button>
          <LikeButton
            productId={product.id}
            initialLiked={product.liked}
            initialCount={product.likeCount}
            size={13}
            className="rounded-xl border border-white/[0.08] bg-white/[0.01] px-3 py-1.5"
          />
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Left Side: Media Section */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            {/* Stage Frame */}
            <div className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0E0E12] aspect-[4/5] lg:aspect-auto lg:h-[calc(100vh-9rem)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                    className="h-full w-full overflow-hidden"
                 >
                   <SafeImage
                     src={mainImage}
                     alt={product.name}
                     className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                   />
                </motion.div>
              </AnimatePresence>

              {/* Overlaid badges */}
              <div className="absolute left-4 top-4 flex flex-col gap-2">
                {disc != null && (
                  <span className="flex items-center gap-1 rounded-full border border-[#DFBA73]/30 bg-[#08080A]/90 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#DFBA73] backdrop-blur-sm">
                    <Sparkles size={11} className="animate-pulse" /> Save {disc}%
                  </span>
                )}
              </div>

              {/* Stage zoom tool */}
              <button
                onClick={() => setIsZoomed(true)}
                className="absolute right-4 top-4 rounded-full border border-white/10 bg-[#08080A]/70 p-2.5 text-[#FAF9F6] opacity-0 backdrop-blur-sm transition-all hover:scale-110 hover:bg-black group-hover:opacity-100"
                aria-label="Enlarge view"
              >
                <Maximize2 size={14} />
              </button>
            </div>

            {/* Slider list */}
            {product.images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                {product.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition-all duration-200 ${
                      active === i
                        ? 'border-[#DFBA73] bg-[#DFBA73]/10 ring-1 ring-[#DFBA73]/30'
                        : 'border-white/[0.08] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <SafeImage src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Purchasing Context */}
        <div className="flex flex-col lg:col-span-7">
          {/* Brand header */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4">
            <div className="flex items-center justify-between gap-3">
              <Link href={`/brand/${product.organization.slug}`} className="group flex items-center gap-3">
                <div className="h-9 w-9 overflow-hidden rounded-full border border-white/10 bg-[#0E0E12]">
                  <SafeImage src={product.organization.logo} alt={product.organization.name} className="h-full w-full object-cover" />
                </div>
                <div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-[#FAF9F6] transition-colors group-hover:text-[#DFBA73]">
                    {product.organization.name}
                    {product.organization.isVerified && <BadgeCheck size={14} className="text-[#DFBA73]" />}
                  </span>
                  {product.organization.city && (
                    <span className="text-[10px] font-mono text-[#8E8E93]">{product.organization.city}</span>
                  )}
                </div>
              </Link>
              <div className="flex items-center gap-2">
                {tier && (
                  <span className={`rounded-full border px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider ${tier.className}`}>
                    {tier.label}
                  </span>
                )}
                <FollowButton
                  orgId={product.organization.id}
                  initialFollowing={initialFollowing}
                  initialCount={initialFollowerCount}
                />
              </div>
            </div>
          </div>

          {/* Pricing & title header */}
          <div className="mt-6">
            <h1 className="font-display text-2xl font-light leading-snug tracking-tight text-[#FAF9F6] sm:text-3xl">
              {product.name}
            </h1>

            <div className="mt-3 flex items-center gap-2 text-xs text-[#8E8E93]">
              <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#0E0E12]/80 px-2.5 py-0.5 font-mono text-[10px]">
                <StarRating value={product.ratingAvg} size={10} />
                <span className="ml-1 font-semibold text-[#FAF9F6]">{product.ratingAvg.toFixed(1)}</span>
                <span className="text-[#52525B]">({product.ratingCount})</span>
              </div>
              {product.soldCount > 0 && <span className="font-mono text-[10px] text-[#52525B]">· {product.soldCount} ordered</span>}
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold text-[#DFBA73]">
                {formatPrice(product.price, product.currency)}
              </span>
              {product.compareAtPrice && (
                <span className="font-mono text-sm text-[#52525B] line-through">
                  {formatPrice(product.compareAtPrice, product.currency)}
                </span>
              )}
            </div>
          </div>

          {product.description && (
            <p className="mt-4 text-xs font-light leading-relaxed text-[#9A9AA0]">{product.description}</p>
          )}

          {/* Variant system selection */}
          {product.sizes.length > 0 && (
            <div className="mt-6 border-t border-white/[0.06] pt-5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E93]">Size</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {product.sizes.map((s) => (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-[3rem] rounded-lg border px-3 py-1.5 font-mono text-xs transition-all ${
                      size === s
                        ? 'border-[#DFBA73] bg-[#DFBA73]/15 font-semibold text-[#DFBA73]'
                        : 'border-white/[0.08] text-[#FAF9F6] hover:border-white/20'
                    }`}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {product.colors.length > 0 && (
            <div className="mt-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E93]">Color</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {product.colors.map((c) => (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    key={c}
                    onClick={() => setColor(c)}
                    className={`rounded-lg border px-3.5 py-1.5 text-xs transition-all ${
                      color === c
                        ? 'border-[#DFBA73] bg-[#DFBA73]/15 font-semibold text-[#DFBA73]'
                        : 'border-white/[0.08] text-[#FAF9F6] hover:border-white/20'
                    }`}
                  >
                    {c}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Checkout Controls */}
          <div className="mt-6 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-xl border border-white/[0.08] bg-[#0E0E12] p-0.5">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="rounded-lg p-1.5 text-[#FAF9F6] transition-colors hover:text-[#DFBA73]"
                >
                  <Minus size={13} />
                </button>
                <span className="w-8 text-center font-mono text-xs text-[#FAF9F6]">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                  className="rounded-lg p-1.5 text-[#FAF9F6] transition-colors hover:text-[#DFBA73]"
                >
                  <Plus size={13} />
                </button>
              </div>

              <AddToCartButton
                productId={product.id}
                size={size}
                color={color}
                quantity={qty}
                className="h-10 flex-1 rounded-xl bg-gradient-to-r from-[#DFBA73] to-[#C59B4E] font-mono text-[11px] font-bold uppercase tracking-widest text-[#08080A] transition-transform hover:brightness-105"
              />
            </div>
               <div className="w-fit">
                 <SaveToBoard productId={product.id} />
               </div>
          </div>

          {lowStock && (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 text-center">
              <span className="font-mono text-[10px] text-amber-300">Urgency Alert: Only {product.stock} left in stock</span>
            </div>
          )}

          {/* Trust assurances strip */}
          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-5 text-[10px] text-[#8E8E93]">
            <div className="flex flex-col items-center gap-1 text-center">
              <Truck size={14} className="text-[#DFBA73]" /> Expedited Shipping
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <RotateCcw size={14} className="text-[#DFBA73]" /> 14-Day Returns
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <ShieldCheck size={14} className="text-[#DFBA73]" /> Authenticity Check
            </div>
          </div>
        </div>
      </div>

      {/* Split Interactive lower Hub */}
      <div className="mt-16 grid grid-cols-1 gap-10 border-t border-white/[0.08] pt-12 lg:grid-cols-12">
        
        {/* Specifications panel */}
        <div className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
            <h2 className="font-display text-base font-light text-[#FAF9F6]">Specifications</h2>
            
            <dl className="mt-4 divide-y divide-white/[0.06] text-xs font-mono">
              {product.material && (
                <div className="flex justify-between py-2.5">
                  <span className="text-[#8E8E93]">Material</span>
                  <span className="text-[#FAF9F6]">{product.material}</span>
                </div>
              )}
              {product.gender && (
                <div className="flex justify-between py-2.5">
                  <span className="text-[#8E8E93]">Target</span>
                  <span className="text-[#FAF9F6] capitalize">{product.gender}</span>
                </div>
              )}
              {product.occasion.length > 0 && (
                <div className="flex justify-between py-2.5">
                  <span className="text-[#8E8E93]">Occasion</span>
                  <span className="text-right text-[#FAF9F6]">{product.occasion.join(', ')}</span>
                </div>
              )}
              <div className="flex justify-between py-2.5">
                <span className="text-[#8E8E93]">Product Views</span>
                <span className="text-[#FAF9F6]">{product.viewCount}</span>
              </div>
            </dl>

            {product.styleKeywords.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-4">
                {product.styleKeywords.map((k) => (
                  <span key={k} className="rounded-md border border-white/[0.08] bg-white/[0.01] px-2 py-0.5 text-[9px] font-mono text-[#8E8E93]">
                    #{k}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Interactive area (Tabbed Feedback & Community) */}
        <div className="lg:col-span-8 rounded-2xl border border-white/[0.06] bg-[#0E0E12]/30 p-5 backdrop-blur-md">
          {/* Navigation header tabs */}
          <div className="flex border-b border-white/[0.08] pb-3">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`relative mr-6 pb-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                activeTab === 'reviews' ? 'text-[#DFBA73]' : 'text-[#8E8E93] hover:text-[#FAF9F6]'
              }`}
            >
              Feedback ({reviews.length})
              {activeTab === 'reviews' && (
                <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 h-0.5 w-full bg-[#DFBA73]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('discussion')}
              className={`relative pb-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                activeTab === 'discussion' ? 'text-[#DFBA73]' : 'text-[#8E8E93] hover:text-[#FAF9F6]'
              }`}
            >
              Discussion ({product.commentCount})
              {activeTab === 'discussion' && (
                <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 h-0.5 w-full bg-[#DFBA73]" />
              )}
            </button>
          </div>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              {activeTab === 'reviews' ? (
                <motion.div
                  key="reviews-pane"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-12">
                    {/* Left: Star breakdown summaries */}
                    <div className="sm:col-span-4">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-3xl text-[#DFBA73]">
                          {product.ratingAvg > 0 ? product.ratingAvg.toFixed(1) : '0.0'}
                        </span>
                        <div className="flex flex-col">
                          <StarRating value={product.ratingAvg} size={11} />
                          <span className="text-[9px] text-[#52525B]">Based on {reviews.length} reviews</span>
                        </div>
                      </div>

                      {/* Stack Distribution rows */}
                      <div className="mt-4 space-y-1.5">
                        {ratingCounts.map(({ star, count }) => {
                          const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 text-[10px] font-mono">
                              <span className="w-5 text-[#8E8E93]">{star}★</span>
                              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                                <div className="h-full bg-[#DFBA73]" style={{ width: `${percent}%` }} />
                              </div>
                              <span className="w-4 text-right text-[#52525B]">{count}</span>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setShowReviewForm(!showReviewForm)}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.01] py-2 font-mono text-[10px] uppercase tracking-wider text-[#FAF9F6] transition-colors hover:border-[#DFBA73]/40 hover:text-[#DFBA73]"
                      >
                        <PenTool size={11} /> Write Feedback
                      </button>
                    </div>

                    {/* Right: Review List stack */}
                    <div className="sm:col-span-8 border-t border-white/[0.06] pt-6 sm:border-t-0 sm:border-l sm:border-white/[0.06] sm:pt-0 sm:pl-6">
                      {/* Write reviews drop container */}
                      <AnimatePresence>
                        {showReviewForm && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-b border-white/[0.06] pb-4 mb-4"
                          >
                            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E93]">
                              {rvDone ? 'Review submitted!' : 'Review this piece'}
                            </span>
                            <div className="mt-2">
                              <StarInput value={rvRating} onChange={setRvRating} />
                            </div>
                            <input
                              value={rvTitle}
                              onChange={(e) => setRvTitle(e.target.value)}
                              placeholder="Title (Optional)"
                              className="mt-2 w-full rounded-lg border border-white/[0.08] bg-[#0E0E12] px-3 py-2 text-xs text-[#FAF9F6] outline-none focus:border-[#DFBA73]"
                            />
                            <textarea
                              value={rvComment}
                              onChange={(e) => setRvComment(e.target.value)}
                              placeholder="Share your thoughts..."
                              rows={2}
                              className="mt-2 w-full resize-none rounded-lg border border-white/[0.08] bg-[#0E0E12] px-3 py-2 text-xs text-[#FAF9F6] outline-none focus:border-[#DFBA73]"
                            />
                            <button
                              onClick={submitReview}
                              disabled={rvBusy || !rvRating}
                              className="mt-2 rounded-lg bg-[#DFBA73] px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#08080A] disabled:opacity-40"
                            >
                              {rvBusy ? 'Posting...' : 'Post'}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="space-y-3">
                        {reviews.length === 0 ? (
                          <p className="py-6 text-center text-xs text-[#52525B]">Be the first to review this piece.</p>
                        ) : (
                          reviews.slice(0, visibleReviews).map((r) => (
                            <div key={r.id} className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 text-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DFBA73] text-[10px] font-bold text-[#08080A]">
                                    {r.user.name?.[0]?.toUpperCase() || '?'}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-[#FAF9F6]">{r.user.name}</p>
                                    <p className="text-[9px] font-mono text-[#52525B]">{formatDate(r.createdAt)}</p>
                                  </div>
                                </div>
                                <StarRating value={r.rating} size={10} />
                              </div>
                              {r.title && <p className="mt-2 font-medium text-[#FAF9F6]">{r.title}</p>}
                              {r.comment && <p className="mt-1 font-light text-[#9A9AA0]">{r.comment}</p>}
                              {r.isVerifiedPurchase && (
                                <span className="mt-2 inline-block rounded bg-[#DFBA73]/10 px-2 py-0.5 text-[8px] font-mono uppercase text-[#DFBA73]">
                                  Verified Purchase
                                </span>
                              )}
                              {r.sellerReply && (
                                <div className="mt-2 rounded-lg border-l border-[#DFBA73] bg-white/[0.02] p-2 text-[11px]">
                                  <span className="font-mono text-[9px] text-[#DFBA73] block">Brand reply:</span>
                                  <p className="text-[#9A9AA0]">{r.sellerReply}</p>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {reviews.length > visibleReviews && (
                        <button
                          onClick={() => setVisibleReviews((v) => v + 3)}
                          className="mt-3 w-full rounded-xl border border-white/[0.08] bg-white/[0.01] py-2 text-center font-mono text-[10px] uppercase text-[#FAF9F6] hover:border-white/20"
                        >
                          View More Reviews
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="comments-pane"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <CommentSection
                    productId={product.id}
                    initialComments={product.comments}
                    initialCount={product.commentCount}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Recommended Carousel Streams */}
      <div className="mt-20 border-t border-white/[0.06] pt-12">
        {related.fromVendor.length > 0 && (
          <DiscoverFeed
            title={`More from ${product.organization.name}`}
            subtitle="Explore complementary creations"
            products={related.fromVendor}
          />
        )}
        <DiscoverFeed
          title="You might also like"
          subtitle="Explore similar premium designs"
          products={similarPool}
          loadMore={loadMoreSimilar}
        />
      </div>

      {/* Image zoom lightbox tool */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute right-6 top-6 rounded-full border border-white/20 bg-white/10 p-3 text-white transition-all hover:scale-105"
            >
              <X size={18} />
            </button>
            <div className="relative max-h-[85vh] max-w-[85vw] overflow-hidden rounded-2xl">
              <SafeImage src={mainImage} alt={product.name} className="max-h-[80vh] w-auto object-contain" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}