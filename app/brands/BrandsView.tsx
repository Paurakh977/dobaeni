'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, BadgeCheck, Users, Flame, Star, TrendingUp, Crown, SlidersHorizontal, X } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import { formatNumber } from '@/lib/format';
import { AESTHETICS, BUSINESS_TYPES, GENDER_OPTIONS } from '@/lib/format';
import type { BrandSummary } from '@/lib/queries';
import { brandScore } from '@/lib/queries';

type Tab = 'trending' | 'mostFollowed' | 'topRated' | 'all';

const TABS: { value: Tab; label: string; icon: typeof Flame; blurb: string }[] = [
  { value: 'trending', label: 'Trending', icon: Flame, blurb: 'Rising houses by momentum' },
  { value: 'mostFollowed', label: 'Most Followed', icon: Users, blurb: 'The biggest communities' },
  { value: 'topRated', label: 'Top Rated', icon: Star, blurb: 'Loved by buyers' },
  { value: 'all', label: 'All Brands', icon: Crown, blurb: 'Every independent label' },
];

const RANK_ACCENT = ['text-[#DFBA73]', 'text-zinc-300', 'text-[#C08457]'];
const GENDER_VALUES = GENDER_OPTIONS.map((g) => g.value);
const GENDER_LABEL: Record<string, string> = Object.fromEntries(
  GENDER_OPTIONS.map((g) => [g.value, g.label]),
);

export default function BrandsView({ brands }: { brands: BrandSummary[] }) {
  const [tab, setTab] = useState<Tab>('trending');
  const [q, setQ] = useState('');
  const [businessTypes, setBusinessTypes] = useState<Set<string>>(new Set());
  const [aesthetics, setAesthetics] = useState<Set<string>>(new Set());
  const [genders, setGenders] = useState<Set<string>>(new Set());
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    q.trim().length > 0 ||
    businessTypes.size > 0 ||
    aesthetics.size > 0 ||
    genders.size > 0 ||
    verifiedOnly;

  // Elastic: every whitespace-separated token must appear somewhere in the
  // brand's searchable text (name, description, type, city, aesthetics, genders).
  const matchesSearch = (b: BrandSummary, query: string) => {
    const t = query.trim().toLowerCase();
    if (!t) return true;
    const haystack = [
      b.name,
      b.description || '',
      b.businessType || '',
      b.city || '',
      ...b.aesthetics,
      ...b.genders.map((g) => GENDER_LABEL[g] || g),
    ]
      .join(' ')
      .toLowerCase();
    return t.split(/\s+/).every((tok) => haystack.includes(tok));
  };

  const passesFilters = (b: BrandSummary) => {
    if (businessTypes.size > 0 && (!b.businessType || !businessTypes.has(b.businessType))) return false;
    if (aesthetics.size > 0 && !b.aesthetics.some((a) => aesthetics.has(a))) return false;
    if (genders.size > 0 && !b.genders.some((g) => genders.has(g))) return false;
    if (verifiedOnly && !b.isVerified) return false;
    return true;
  };

  const filtered = useMemo(
    () => brands.filter((b) => matchesSearch(b, q) && passesFilters(b)),
    [brands, q, businessTypes, aesthetics, genders, verifiedOnly],
  );

  const ranked = useMemo(() => {
    if (tab === 'mostFollowed')
      return [...filtered].sort((a, b) => b.followerCount - a.followerCount);
    if (tab === 'topRated')
      return [...filtered]
        .filter((b) => b.ratingCount > 0)
        .sort((a, b) => b.ratingAvg - a.ratingAvg || b.ratingCount - a.ratingCount);
    if (tab === 'trending')
      return [...filtered].sort((a, b) => brandScore(b) - brandScore(a));
    return [...filtered].sort((a, b) => b.followerCount - a.followerCount);
  }, [tab, filtered]);

  const active = TABS.find((t) => t.value === tab)!;
  const toggle = (set: Set<string>, setFn: (s: Set<string>) => void, v: string) => {
    const next = new Set(set);
    next.has(v) ? next.delete(v) : next.add(v);
    setFn(next);
  };
  const clearAll = () => {
    setQ('');
    setBusinessTypes(new Set());
    setAesthetics(new Set());
    setGenders(new Set());
    setVerifiedOnly(false);
  };

  return (
    <div>
      <header className="mb-8">
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#DFBA73]/80">the houses</p>
        <h1 className="mt-3 flex items-center gap-3 text-5xl font-light tracking-wide font-display text-[#FAF9F6] md:text-6xl">
          <Crown size={40} className="text-[#DFBA73]" /> Brands
        </h1>
        <p className="mt-3 max-w-md text-[14px] font-light text-[#7C7C83]">
          Independent labels shaping the Dobaeni aesthetic — search, filter and rank by momentum, community and love.
        </p>
      </header>

      {/* Search + filters (persist across all tabs) */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525B]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search brands, aesthetics, types…"
              data-cursor="text"
              className="w-full rounded-full border border-white/[0.08] bg-white/[0.02] py-3 pl-11 pr-4 text-[13px] text-[#FAF9F6] outline-none placeholder:text-[#52525B] focus:border-[#DFBA73]/40"
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            data-cursor="hover"
            className={`flex items-center gap-2 rounded-full border px-4 py-3 text-[11px] font-mono uppercase tracking-[0.2em] transition-all ${
              showFilters || hasActiveFilters
                ? 'border-[#DFBA73] text-[#DFBA73]'
                : 'border-white/[0.08] text-[#8E8E93] hover:text-[#FAF9F6]'
            }`}
          >
            <SlidersHorizontal size={13} />
            Filters{hasActiveFilters ? ` (${activeFilterCount(businessTypes, aesthetics, genders, verifiedOnly)})` : ''}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              data-cursor="hover"
              className="flex items-center gap-1 rounded-full border border-white/[0.08] px-3 py-3 text-[11px] font-mono uppercase tracking-[0.2em] text-[#8E8E93] transition-colors hover:text-[#FAF9F6]"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-5 space-y-4 rounded-3xl border border-white/[0.06] bg-white/[0.01] p-5">
            <FilterRow label="Business type">
              {BUSINESS_TYPES.map((b) => (
                <Chip key={b} active={businessTypes.has(b)} onClick={() => toggle(businessTypes, setBusinessTypes, b)}>
                  {b}
                </Chip>
              ))}
            </FilterRow>
            <FilterRow label="Aesthetic">
              {AESTHETICS.map((a) => (
                <Chip key={a} active={aesthetics.has(a)} onClick={() => toggle(aesthetics, setAesthetics, a)}>
                  {a}
                </Chip>
              ))}
            </FilterRow>
            <FilterRow label="Shop for">
              {GENDER_VALUES.map((g) => (
                <Chip key={g} active={genders.has(g)} onClick={() => toggle(genders, setGenders, g)}>
                  {GENDER_LABEL[g] || g}
                </Chip>
              ))}
            </FilterRow>
            <FilterRow label="Trust">
              <Chip active={verifiedOnly} onClick={() => setVerifiedOnly((v) => !v)}>
                Verified only
              </Chip>
            </FilterRow>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const activeTab = t.value === tab;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              data-cursor="hover"
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-mono uppercase tracking-[0.2em] transition-all ${
                activeTab
                  ? 'border-[#DFBA73] bg-[#DFBA73] text-[#08080a]'
                  : 'border-white/[0.08] text-[#8E8E93] hover:text-[#FAF9F6]'
              }`}
            >
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      <p className="mb-6 text-[12px] text-[#52525B]">
        {active.blurb}
        {hasActiveFilters && ` · ${ranked.length} match${ranked.length === 1 ? '' : 'es'}`}
      </p>

      {ranked.length === 0 ? (
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.01] py-24 text-center text-[14px] text-[#7C7C83]">
          No brands match your search or filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ranked.map((b, i) => (
            <BrandCard key={b.id} b={b} index={i} showRankBadge={tab !== 'all'} />
          ))}
        </div>
      )}
    </div>
  );
}

function activeFilterCount(
  businessTypes: Set<string>,
  aesthetics: Set<string>,
  genders: Set<string>,
  verifiedOnly: boolean,
) {
  return businessTypes.size + aesthetics.size + genders.size + (verifiedOnly ? 1 : 0);
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.3em] text-[#52525B]">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-cursor="hover"
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-all ${
        active
          ? 'border-[#DFBA73] bg-[#DFBA73] text-[#08080a]'
          : 'border-white/[0.08] text-[#8E8E93] hover:border-white/20 hover:text-[#FAF9F6]'
      }`}
    >
      {children}
    </button>
  );
}

function BrandCard({
  b,
  index,
  showRankBadge,
}: {
  b: BrandSummary;
  index: number;
  showRankBadge: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        href={`/brand/${b.slug}`}
        className="group relative block overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.01] transition-colors hover:border-white/15"
        data-cursor="hover"
      >
        <div className="relative h-32 overflow-hidden bg-[#0E0E12]">
          {b.banner ? (
            <SafeImage src={b.banner} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#1a1a1f] to-[#0E0E12]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E12] to-transparent" />
          {showRankBadge && index < 3 && (
            <span className={`absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-[12px] font-bold backdrop-blur-md ${RANK_ACCENT[index]}`}>
              {index + 1}
            </span>
          )}
        </div>
        <div className="px-5 pb-5">
          <div className="-mt-8 flex items-end gap-3">
            <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-[#0E0E12] bg-[#0E0E12]">
              <SafeImage src={b.logo} alt={b.name} className="h-full w-full object-cover" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-[15px] font-light text-[#FAF9F6]">{b.name}</span>
            {b.isVerified && <BadgeCheck size={14} className="text-[#DFBA73]" />}
            {showRankBadge && index < 3 && <TrendingUp size={13} className={RANK_ACCENT[index]} />}
          </div>
          {b.description && (
            <p className="mt-1 line-clamp-2 text-[12px] text-[#7C7C83]">{b.description}</p>
          )}
          {b.aesthetics.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {b.aesthetics.slice(0, 3).map((a) => (
                <span key={a} className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[9px] uppercase tracking-wider text-[#52525B]">
                  {a}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center gap-4 text-[11px] text-[#52525B]">
            <span className="flex items-center gap-1">
              <Users size={12} /> {formatNumber(b.followerCount)} followers
            </span>
            <span>{b.productCount} products</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
