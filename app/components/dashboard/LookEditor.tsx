'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, X, Eye, EyeOff, Sparkles, Trash2, Tag, Save, Image as ImageIcon } from 'lucide-react';
import ImageUpload from '@/app/components/ImageUpload';
import ProductPicker from '@/app/components/dashboard/ProductPicker';
import HotspotCanvas, { type CanvasHotspot } from '@/app/components/dashboard/HotspotCanvas';
import { formatPrice } from '@/lib/format';
import type { LookDetail } from '@/lib/types';
import type { SellerProductView } from '@/lib/queries';

type Props = {
  look: LookDetail | null; // null = create mode
  products: SellerProductView[];
  onClose: () => void;
  onSaved: () => void;
};

let tempCounter = 0;
const tempId = () => `temp-${Date.now()}-${tempCounter++}`;

export default function LookEditor({ look, products, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(look?.title ?? '');
  const [description, setDescription] = useState(look?.description ?? '');
  const [coverImage, setCoverImage] = useState(look?.coverImage ?? '');
  const [imageWidth, setImageWidth] = useState<number | null>(look?.imageWidth ?? null);
  const [imageHeight, setImageHeight] = useState<number | null>(look?.imageHeight ?? null);
  const [bundlePrice, setBundlePrice] = useState<string>(
    look?.bundlePrice != null ? String(look.bundlePrice) : '',
  );
  const [isPublished, setIsPublished] = useState(look ? look.isPublished : true);
  const [isFeatured, setIsFeatured] = useState(look ? look.isFeatured : false);

  const [hotspots, setHotspots] = useState<CanvasHotspot[]>(() =>
    look?.hotspots.map((h) => ({
      id: h.id,
      productId: h.productId,
      left: h.left,
      top: h.top,
      label: h.label,
      product: {
        name: h.product.name,
        image: h.product.image,
        price: h.product.price,
      },
    })) ?? [],
  );

  const [placing, setPlacing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingPlace, setPendingPlace] = useState<{ left: number; top: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const dimRef = useRef<HTMLImageElement | null>(null);

  // Detect cover image natural dimensions.
  useEffect(() => {
    if (!coverImage) return;
    const img = new Image();
    img.onload = () => {
      setImageWidth(img.naturalWidth || null);
      setImageHeight(img.naturalHeight || null);
    };
    img.src = coverImage;
    return () => {
      img.onload = null;
    };
  }, [coverImage]);

  const totalPrice = hotspots.reduce((s, h) => s + h.product.price, 0);
  const bundleNum = bundlePrice ? Number(bundlePrice) : 0;
  const discountPct =
    bundleNum > 0 && totalPrice > 0 && bundleNum < totalPrice
      ? Math.round((1 - bundleNum / totalPrice) * 100)
      : 0;

  function handlePlace(left: number, top: number) {
    setPendingPlace({ left, top });
    setPlacing(false);
    setPickerOpen(true);
  }

  function handlePick(p: SellerProductView) {
    if (!pendingPlace) return;
    const newHotspot: CanvasHotspot = {
      id: tempId(),
      productId: p.id,
      left: pendingPlace.left,
      top: pendingPlace.top,
      label: null,
      product: { name: p.name, image: p.image, price: p.price },
    };
    setHotspots((prev) => [...prev, newHotspot]);
    setPendingPlace(null);
    setPickerOpen(false);
    setSelectedId(newHotspot.id);
  }

  function handleMove(id: string, left: number, top: number) {
    setHotspots((prev) => prev.map((h) => (h.id === id ? { ...h, left, top } : h)));
  }

  function handleRemove(id: string) {
    setHotspots((prev) => prev.filter((h) => h.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function updateLabel(id: string, label: string) {
    setHotspots((prev) => prev.map((h) => (h.id === id ? { ...h, label } : h)));
  }

  async function submit() {
    if (!title.trim()) return setErr('Give your look a title.');
    if (!coverImage) return setErr('Upload a cover image for the look.');
    if (hotspots.length === 0) return setErr('Add at least one product hotspot to the look.');

    setBusy(true);
    setErr(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      coverImage,
      imageWidth,
      imageHeight,
      bundlePrice: bundleNum > 0 ? bundleNum : null,
      bundleDiscount: discountPct || null,
      isPublished,
      isFeatured,
      hotspots: hotspots.map((h, i) => ({
        productId: h.productId,
        left: h.left,
        top: h.top,
        label: h.label,
        position: i,
      })),
    };

    try {
      const res = look
        ? await fetch(`/api/looks/${look.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/looks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save look');
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save look');
      setBusy(false);
    }
  }

  const inputCls =
    'w-full rounded-xl border border-white/[0.07] bg-[#0A0A0D] px-4 py-3 text-[13px] text-[#FAF9F6] outline-none placeholder:text-[#3D3D45] focus:border-[#DFBA73]/40 transition-all focus:shadow-[0_0_14px_rgba(223,186,115,0.08)]';

  const selected = hotspots.find((h) => h.id === selectedId);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 12 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-3xl border border-white/[0.08] bg-[#0E0E12]/70 backdrop-blur-2xl p-6 shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#DFBA73]/70">
            Shop the Look
          </p>
          <h3 className="mt-1 text-lg font-light font-display text-[#FAF9F6]">
            {look ? 'Edit look' : 'New look'}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-[#52525B] transition-all hover:bg-white/[0.04] hover:text-[#FAF9F6]"
          aria-label="Close"
        >
          <X size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* ── Left: image + hotspot editor ── */}
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">
              Cover image
            </label>
            {coverImage ? (
              <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-3">
                <HotspotCanvas
                  imageUrl={coverImage}
                  hotspots={hotspots}
                  placing={placing}
                  selectedId={selectedId}
                  onPlace={handlePlace}
                  onMove={handleMove}
                  onSelect={setSelectedId}
                  onRemove={handleRemove}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-3">
                <ImageUpload
                  value={coverImage}
                  onChange={(v) => setCoverImage(typeof v === 'string' ? v : v[0] ?? '')}
                  multiple={false}
                  label="Upload look image"
                />
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {coverImage && (
                <button
                  onClick={() => setPlacing((p) => !p)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-[0.15em] transition-all active:scale-95 ${
                    placing
                      ? 'bg-[#DFBA73] text-[#08080a]'
                      : 'border border-white/[0.08] text-[#FAF9F6] hover:border-[#DFBA73]/40'
                  }`}
                >
                  <Plus size={12} /> {placing ? 'Click image to place…' : 'Add hotspot'}
                </button>
              )}
              {coverImage && (
                <button
                  onClick={() => {
                    setCoverImage('');
                    setHotspots([]);
                    setSelectedId(null);
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-white/[0.08] px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#52525B] transition-all hover:text-[#FAF9F6] hover:border-white/20"
                >
                  <ImageIcon size={11} /> Change image
                </button>
              )}
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#52525B]">
                {hotspots.length} product{hotspots.length === 1 ? '' : 's'} tagged
              </span>
            </div>
          </div>
        </div>

        {/* ── Right: details + linked products ── */}
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              placeholder="e.g. Summer Linen Edit"
            />
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="Tell the story behind the look…"
            />
          </div>

          {/* Bundle pricing */}
          <div className="rounded-2xl border border-[#DFBA73]/15 bg-[#DFBA73]/[0.03] p-4">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#DFBA73]">
              <Sparkles size={12} /> Bundle pricing
            </div>
            <p className="mt-1.5 text-[11px] text-[#7C7C83]">
              Total of individual items: <span className="text-[#FAF9F6]">{formatPrice(totalPrice)}</span>
            </p>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                value={bundlePrice}
                onChange={(e) => setBundlePrice(e.target.value)}
                placeholder="Optional bundle price"
                className={inputCls}
              />
            </div>
            {discountPct > 0 && (
              <p className="mt-2 text-[11px] font-mono uppercase tracking-wider text-emerald-400">
                Buy the whole look &amp; save {discountPct}%
              </p>
            )}
          </div>

          {/* Linked products list */}
          <div>
            <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-[#6B6B72]">
              Tagged products
            </label>
            <div className="space-y-1.5">
              {hotspots.length === 0 && (
                <p className="rounded-xl border border-dashed border-white/[0.06] px-3 py-4 text-center text-[11px] text-[#52525B]">
                  Add a hotspot on the image to tag a product.
                </p>
              )}
              {hotspots.map((h) => (
                <div
                  key={h.id}
                  className={`flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition-all ${
                    selectedId === h.id
                      ? 'border-[#DFBA73]/40 bg-[#DFBA73]/[0.05]'
                      : 'border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-white/[0.06] bg-black/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={h.product.image ?? ''} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] text-[#FAF9F6]">{h.product.name}</p>
                    <p className="text-[10px] text-[#7C7C83]">{formatPrice(h.product.price)}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(h.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[#52525B] transition-colors hover:bg-red-500/15 hover:text-[#F87171]"
                    aria-label="Remove"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Label editor for selected dot */}
            {selected && (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#0A0A0D] px-3 py-2">
                <Tag size={12} className="text-[#52525B]" />
                <input
                  value={selected.label ?? ''}
                  onChange={(e) => updateLabel(selected.id, e.target.value)}
                  placeholder="Label (e.g. Silk Tie)"
                  className="flex-1 bg-transparent text-[12px] text-[#FAF9F6] outline-none placeholder:text-[#3D3D45]"
                />
              </div>
            )}
          </div>

          {/* Publish toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFeatured((v) => !v)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[10px] font-mono uppercase tracking-wider transition-all ${
                isFeatured
                  ? 'border-[#DFBA73]/40 bg-[#DFBA73]/10 text-[#DFBA73]'
                  : 'border-white/[0.08] text-[#7C7C83] hover:text-[#FAF9F6]'
              }`}
            >
              <Sparkles size={11} /> Featured
            </button>
            <button
              onClick={() => setIsPublished((v) => !v)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[10px] font-mono uppercase tracking-wider transition-all ${
                isPublished
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-white/[0.08] text-[#7C7C83] hover:text-[#FAF9F6]'
              }`}
            >
              {isPublished ? <Eye size={11} /> : <EyeOff size={11} />}
              {isPublished ? 'Published' : 'Draft'}
            </button>
          </div>
        </div>
      </div>

      {err && <p className="mt-4 text-[12px] text-red-400 font-mono">{err}</p>}

      <div className="mt-5 flex justify-end gap-3 border-t border-white/[0.04] pt-5">
        <button
          onClick={onClose}
          className="rounded-full border border-white/[0.07] px-6 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#52525B] transition-all hover:text-[#FAF9F6] hover:border-white/20 active:scale-95"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={busy || !title.trim() || !coverImage || hotspots.length === 0}
          className="flex items-center justify-center gap-2 rounded-full bg-[#DFBA73] px-7 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3] hover:shadow-[0_0_20px_rgba(223,186,115,0.3)] disabled:opacity-40 active:scale-95"
        >
          {busy && <Loader2 size={13} className="animate-spin" />}
          <Save size={13} /> {look ? 'Save changes' : 'Create look'}
        </button>
      </div>

      {pickerOpen && (
        <ProductPicker
          products={products}
          excludeIds={hotspots.map((h) => h.productId)}
          onSelect={handlePick}
          onClose={() => {
            setPickerOpen(false);
            setPendingPlace(null);
          }}
        />
      )}
    </motion.div>
  );
}
