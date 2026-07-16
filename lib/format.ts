export function formatPrice(amount: number | null | undefined, currency = 'NPR'): string {
  if (amount == null) return '—';
  const value = Math.round(amount).toLocaleString('en-US');
  return currency === 'NPR' ? `Rs. ${value}` : `${value} ${currency}`;
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

export function formatDate(value: string | number | Date): string {
  const d = new Date(value);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Shared option sets used across onboarding, filters and forms.
export const AESTHETICS = [
  'Old Money', 'Clean Girl', 'Y2K', 'Streetwear', 'Coquette',
  'Minimalist', 'Korean', 'Cottagecore', 'Vintage', 'Office Wear',
  'Boho', 'Gothic', 'Athleisure', 'Preppy', 'Avant-Garde',
];

export const BUSINESS_TYPES = [
  'Boutique', 'Designer', 'Streetwear', 'Thrift', 'Label', 'Handmade',
];

export const GENDER_OPTIONS = [
  { value: 'female', label: 'Women' },
  { value: 'male', label: 'Men' },
  { value: 'unisex', label: 'Unisex' },
  { value: 'non_binary', label: 'Non-binary' },
];

export const AGE_RANGES = ['13-17', '18-24', '25-34', '35-44', '45+'];
export const BUDGET_RANGES = [
  { value: 'low', label: 'Budget friendly' },
  { value: 'mid', label: 'Mid-range' },
  { value: 'high', label: 'Premium' },
  { value: 'luxury', label: 'Luxury' },
];
export const STYLE_INTENSITY = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'maximal', label: 'Maximal' },
];

export const TIER_BADGE: Record<string, { label: string; className: string }> = {
  silver: { label: 'Silver', className: 'bg-zinc-300/10 text-zinc-300 border-zinc-300/30' },
  gold: { label: 'Gold', className: 'bg-[#DFBA73]/10 text-[#DFBA73] border-[#DFBA73]/30' },
  platinum: { label: 'Platinum', className: 'bg-gradient-to-r from-[#E2D4C9] to-[#C9A24B] text-[#08080a] border-transparent' },
};

export function discountPercent(price: number, compareAt: number | null | undefined): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
