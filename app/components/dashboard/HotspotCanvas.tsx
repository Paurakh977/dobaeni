'use client';

import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';

export type CanvasHotspot = {
  id: string; // temp id for new, or real id
  productId: string;
  left: number; // 0-100
  top: number; // 0-100
  label: string | null;
  product: { name: string; image: string | null; price: number };
};

type Props = {
  imageUrl: string;
  hotspots: CanvasHotspot[];
  placing: boolean;
  selectedId: string | null;
  onPlace: (left: number, top: number) => void;
  onMove: (id: string, left: number, top: number) => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
};

export default function HotspotCanvas({
  imageUrl,
  hotspots,
  placing,
  selectedId,
  onPlace,
  onMove,
  onSelect,
  onRemove,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragId = useRef<string | null>(null);
  const moved = useRef(false);
  const [dragPos, setDragPos] = useState<{ id: string; left: number; top: number } | null>(null);

  const pct = useCallback((clientX: number, clientY: number) => {
    const el = wrapRef.current;
    if (!el) return { left: 50, top: 50 };
    const r = el.getBoundingClientRect();
    const left = ((clientX - r.left) / r.width) * 100;
    const top = ((clientY - r.top) / r.height) * 100;
    return {
      left: Math.min(100, Math.max(0, Math.round(left * 100) / 100)),
      top: Math.min(100, Math.max(0, Math.round(top * 100) / 100)),
    };
  }, []);

  function handleImagePointerDown(e: React.PointerEvent) {
    if (!placing) return;
    const { left, top } = pct(e.clientX, e.clientY);
    onPlace(left, top);
  }

  function handleDotPointerDown(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragId.current = id;
    moved.current = false;
    const hs = hotspots.find((h) => h.id === id);
    if (hs) setDragPos({ id, left: hs.left, top: hs.top });
  }

  function handleDotPointerMove(e: React.PointerEvent) {
    if (dragId.current == null) return;
    moved.current = true;
    const { left, top } = pct(e.clientX, e.clientY);
    setDragPos({ id: dragId.current, left, top });
  }

  function handleDotPointerUp(e: React.PointerEvent, id: string) {
    if (dragId.current == null) return;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    const final = dragPos;
    dragId.current = null;
    const wasMoved = moved.current;
    setDragPos(null);
    if (wasMoved && final) {
      onMove(final.id, final.left, final.top);
    } else {
      onSelect(id);
    }
  }

  return (
    <div
      ref={wrapRef}
      onPointerDown={handleImagePointerDown}
      className={`relative w-full select-none overflow-hidden rounded-2xl bg-black/40 ${
        placing ? 'cursor-crosshair' : 'cursor-default'
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Look cover"
        draggable={false}
        className="block h-auto w-full object-contain"
      />

      {/* Placing hint overlay */}
      {placing && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-dashed ring-[#DFBA73]/60" />
      )}

      {/* Dots */}
      {hotspots.map((h) => {
        const isDragging = dragPos?.id === h.id;
        const left = isDragging ? dragPos!.left : h.left;
        const top = isDragging ? dragPos!.top : h.top;
        const selected = selectedId === h.id;
        return (
          <div
            key={h.id}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            {/* pulse ring */}
            <span
              className={`absolute inset-0 -z-10 rounded-full ${selected ? 'bg-[#DFBA73]/30' : 'bg-white/20'} animate-ping`}
              style={{ transform: 'scale(1.8)' }}
            />
            <button
              type="button"
              onPointerDown={(e) => handleDotPointerDown(e, h.id)}
              onPointerMove={handleDotPointerMove}
              onPointerUp={(e) => handleDotPointerUp(e, h.id)}
              className={`relative flex h-5 w-5 items-center justify-center rounded-full border-2 shadow-lg transition-transform ${
                selected
                  ? 'scale-125 border-[#DFBA73] bg-[#DFBA73]'
                  : 'border-white bg-white/90 hover:scale-110'
              } ${placing ? 'pointer-events-none opacity-60' : 'cursor-grab active:cursor-grabbing'}`}
              aria-label={`Hotspot: ${h.product.name}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${selected ? 'bg-[#08080a]' : 'bg-[#08080a]/70'}`} />
            </button>

            {/* Label tooltip */}
            {h.label && (
              <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/[0.08] bg-black/80 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-[#DFBA73]">
                {h.label}
              </span>
            )}
          </div>
        );
      })}

      {/* When a dot is selected, show remove control near it */}
      {selectedId && !placing && (
        <SelectedDotControl
          hotspot={hotspots.find((h) => h.id === selectedId)}
          onRemove={() => onRemove(selectedId)}
        />
      )}
    </div>
  );
}

function SelectedDotControl({
  hotspot,
  onRemove,
}: {
  hotspot: CanvasHotspot | undefined;
  onRemove: () => void;
}) {
  if (!hotspot) return null;
  return (
    <div
      className="absolute z-20 -translate-x-1/2"
      style={{ left: `${hotspot.left}%`, top: `calc(${hotspot.top}% - 42px)` }}
    >
      <div className="flex items-center gap-1 rounded-full border border-white/[0.1] bg-[#0E0E12] px-2 py-1 shadow-xl">
        <span className="max-w-[120px] truncate text-[10px] text-[#FAF9F6]">{hotspot.product.name}</span>
        <button
          onClick={onRemove}
          className="flex h-5 w-5 items-center justify-center rounded-full text-[#F87171] transition-colors hover:bg-red-500/15"
          aria-label="Remove hotspot"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}
