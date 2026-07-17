'use client';

/* ────────────────────────────────────────────────────────────────────────
   Dobaeni — minimalist animated charts (pure SVG + framer-motion)
   Dark-luxury theme · gold accent #DFBA73 · scroll-triggered motion.
   Exports: AreaChart, BarChart, DonutChart, Sparkline
   ──────────────────────────────────────────────────────────────────────── */

import { useId, useMemo, useRef, useState, useEffect } from 'react';
import { motion, useInView, useMotionValue, animate, useTransform } from 'framer-motion';

const GOLD = '#DFBA73';
const GOLD_DIM = '#C9A24B';
const EASE = [0.22, 1, 0.36, 1] as const;
const SLOW = [0.33, 1, 0.45, 1] as const;

export type Point = { label: string; value: number };

/* ── shared helpers ───────────────────────────────────────────────────── */
function niceMax(v: number): number {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}

function buildPath(pts: { x: number; y: number }[], smooth = true): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  if (!smooth) return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  // Catmull-Rom → cubic bezier for a smooth minimalist curve.
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/* ── count-up for labels ──────────────────────────────────────────────── */
function useCountUp(target: number, active: boolean, duration = 1.1) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString());
  useEffect(() => {
    if (!active) return;
    const controls = animate(mv, target, { duration, ease: EASE });
    return () => controls.stop();
  }, [active, target, duration, mv]);
  return text;
}

/* ═══ AreaChart ═══════════════════════════════════════════════════════════
    Smooth animated area + line with hover tooltip. Great for revenue / views.
    The line draws itself in, the area wipes up, and a glowing "comet" dot
    travels along the curve on first reveal.                              */
export function AreaChart({
  data,
  height = 220,
  format = (n) => `${n}`,
  color = GOLD,
  replayKey,
}: {
  data: Point[];
  height?: number;
  format?: (n: number) => string;
  color?: string;
  replayKey?: string | number;
}) {
  const gid = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const W = 720;
  const H = height;
  const padX = 8;
  const padTop = 16;
  const padBottom = 26;

  const max = useMemo(() => niceMax(Math.max(1, ...data.map((d) => d.value))), [data]);
  const innerH = H - padTop - padBottom;
  const innerW = W - padX * 2;

  const pts = data.map((d, i) => ({
    x: padX + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW),
    y: padTop + innerH - (d.value / max) * innerH,
  }));

  const line = buildPath(pts);
  const area = pts.length
    ? `${line} L ${pts[pts.length - 1].x} ${padTop + innerH} L ${pts[0].x} ${padTop + innerH} Z`
    : '';

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  // Comet dot position along the path (0 → 1 with the same draw timing).
  const comet = useMotionValue(0);
  const cometX = useTransform(comet, (t) => {
    const clamped = Math.min(1, Math.max(0, t));
    const i = clamped * (pts.length - 1);
    const lo = Math.floor(i);
    const hi = Math.min(pts.length - 1, lo + 1);
    const f = i - lo;
    return pts[lo].x + (pts[hi].x - pts[lo].x) * f;
  });
  const cometY = useTransform(comet, (t) => {
    const clamped = Math.min(1, Math.max(0, t));
    const i = clamped * (pts.length - 1);
    const lo = Math.floor(i);
    const hi = Math.min(pts.length - 1, lo + 1);
    const f = i - lo;
    return pts[lo].y + (pts[hi].y - pts[lo].y) * f;
  });

  useEffect(() => {
    if (inView) animate(comet, 1, { duration: 1.9, ease: SLOW });
  }, [inView, comet, replayKey]);

  return (
    <div className="relative w-full" ref={ref}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`area-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`line-${gid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={GOLD_DIM} />
          </linearGradient>
        </defs>

        {/* grid fades in */}
        {gridLines.map((g) => (
          <motion.line
            key={`${replayKey}-${g}`}
            x1={padX}
            x2={W - padX}
            y1={padTop + innerH * g}
            y2={padTop + innerH * g}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            strokeDasharray="2 4"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 1.0, ease: SLOW, delay: 0.15 + g * 0.12 }}
          />
        ))}

        {/* area fill wipes up */}
        <motion.path
          key={`${replayKey}-area`}
          d={area}
          fill={`url(#area-${gid})`}
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.5, ease: SLOW, delay: 0.6 }}
        />

        {/* line draws itself in */}
        <motion.path
          key={`${replayKey}-line`}
          d={line}
          fill="none"
          stroke={`url(#line-${gid})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.9, ease: SLOW }}
        />

        {/* glowing comet that travels the curve on reveal */}
        {inView && (
          <motion.g
            key={`${replayKey}-comet`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.7, delay: 1.9 }}
          >
            <motion.circle cx={cometX} cy={cometY} r="6" fill={color} opacity="0.25" />
            <motion.circle cx={cometX} cy={cometY} r="3" fill="#FAF9F6" />
          </motion.g>
        )}

        {/* hover interaction hitboxes + points */}
        {pts.map((p, i) => (
          <g key={i}>
            <rect
              x={p.x - innerW / Math.max(1, data.length) / 2}
              y={0}
              width={innerW / Math.max(1, data.length)}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
            {/* dot pops in once the comet has passed */}
            <motion.circle
              key={`${replayKey}-dot-${i}`}
              cx={p.x}
              cy={p.y}
              r="3"
              fill="#FAF9F6"
              stroke={color}
              strokeWidth="2"
              initial={{ scale: 0, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 0.6, ease: EASE, delay: 0.7 + (i / pts.length) * 1.1 }}
            />
            {hover === i && (
              <>
                <line x1={p.x} x2={p.x} y1={padTop} y2={padTop + innerH} stroke={color} strokeOpacity="0.3" strokeWidth="1" />
                <circle cx={p.x} cy={p.y} r="4.5" fill="#08080a" stroke={color} strokeWidth="2" />
              </>
            )}
          </g>
        ))}
      </svg>

      {/* x labels */}
      <div className="mt-1 flex justify-between px-1">
        {data.map((d, i) => (
          <span
            key={i}
            className={`text-[9px] font-mono uppercase tracking-wider transition-colors ${hover === i ? 'text-[#DFBA73]' : 'text-[#52525B]'}`}
            style={{ display: data.length > 12 && i % 2 !== 0 ? 'none' : 'block' }}
          >
            {d.label}
          </span>
        ))}
      </div>

      {/* tooltip */}
      {hover != null && data[hover] && (
        <div
          className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 rounded-lg border border-[#DFBA73]/25 bg-[#0A0A0D]/95 px-3 py-1.5 backdrop-blur-md shadow-xl"
          style={{ left: `${(pts[hover].x / W) * 100}%` }}
        >
          <p className="text-[9px] font-mono uppercase tracking-wider text-[#6B6B72]">{data[hover].label}</p>
          <p className="text-[13px] font-light text-[#FAF9F6] tabular-nums">{format(data[hover].value)}</p>
        </div>
      )}
    </div>
  );
}

/* ═══ BarChart ════════════════════════════════════════════════════════════
    Vertical animated bars with hover. Great for top products / units sold.   */
export function BarChart({
  data,
  height = 220,
  format = (n) => `${n}`,
  horizontal = false,
  replayKey,
}: {
  data: Point[];
  height?: number;
  format?: (n: number) => string;
  horizontal?: boolean;
  replayKey?: string | number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const max = Math.max(1, ...data.map((d) => d.value));

  if (horizontal) {
    return (
      <div className="space-y-2.5" ref={ref}>
        {data.map((d, i) => (
          <div
            key={i}
            className="group"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-[11px] font-light text-[#9A9AA0] group-hover:text-[#FAF9F6] transition-colors">{d.label}</span>
              <span className="shrink-0 text-[11px] font-mono tabular-nums text-[#DFBA73]">{format(d.value)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.04]">
              <motion.div
                key={`${replayKey}-bar-${i}`}
                className="relative h-full rounded-full bg-gradient-to-r from-[#DFBA73] to-[#C9A24B]"
                initial={{ width: 0 }}
                animate={inView ? { width: `${(d.value / max) * 100}%` } : {}}
                transition={{ duration: 1.5, ease: SLOW, delay: 0.25 + i * 0.14 }}
                style={{ boxShadow: hover === i ? '0 0 16px rgba(223,186,115,0.4)' : 'none' }}
              >
                {inView && (
                  <motion.span
                    key={`${replayKey}-cap-${i}`}
                    className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 translate-x-1/2 rounded-full bg-[#FAF9F6] opacity-0"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 0.9, scale: 1 }}
                    transition={{ duration: 0.6, ease: EASE, delay: 1.1 + i * 0.14 }}
                  />
                )}
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const W = 720;
  const H = height;
  const padBottom = 26;
  const innerH = H - padBottom - 8;
  const gap = 0.35;
  const band = W / data.length;
  const barW = band * (1 - gap);

  return (
    <div className="relative w-full" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="bargrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} />
            <stop offset="100%" stopColor={GOLD_DIM} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const x = i * band + (band - barW) / 2;
          const y = 8 + innerH - h;
          return (
            <g key={i} onMouseEnter={() => setHover(i)}>
              <rect x={i * band} y={0} width={band} height={H} fill="transparent" />
              <motion.rect
                key={`${replayKey}-bar-${i}`}
                x={x}
                width={barW}
                rx={4}
                fill="url(#bargrad)"
                initial={{ height: 0, y: 8 + innerH }}
                animate={inView ? { height: h, y } : {}}
                transition={{ duration: 1.4, ease: SLOW, delay: 0.25 + i * 0.12 }}
                style={{ opacity: hover == null || hover === i ? 1 : 0.4, transition: 'opacity 0.2s' }}
              />
              {inView && (
                <motion.circle
                  key={`${replayKey}-cap-${i}`}
                  cx={x + barW / 2}
                  cy={y}
                  r="2.5"
                  fill="#FAF9F6"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: hover == null || hover === i ? 0.9 : 0.3, scale: 1 }}
                  transition={{ duration: 0.6, ease: EASE, delay: 1.1 + i * 0.12 }}
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex">
        {data.map((d, i) => (
          <span
            key={i}
            className={`flex-1 truncate px-0.5 text-center text-[9px] font-mono uppercase tracking-wider transition-colors ${hover === i ? 'text-[#DFBA73]' : 'text-[#52525B]'}`}
          >
            {d.label}
          </span>
        ))}
      </div>
      {hover != null && data[hover] && (
        <div
          className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 rounded-lg border border-[#DFBA73]/25 bg-[#0A0A0D]/95 px-3 py-1.5 backdrop-blur-md shadow-xl"
          style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}
        >
          <p className="text-[9px] font-mono uppercase tracking-wider text-[#6B6B72]">{data[hover].label}</p>
          <p className="text-[13px] font-light text-[#FAF9F6] tabular-nums">{format(data[hover].value)}</p>
        </div>
      )}
    </div>
  );
}

/* ═══ DonutChart ══════════════════════════════════════════════════════════
    Animated donut with legend. Great for order-status breakdown. Segments
    sweep in sequentially; center value counts up on reveal.                  */
export type Segment = { label: string; value: number; color: string };

export function DonutChart({
  data,
  size = 180,
  thickness = 18,
  centerLabel,
  centerValue,
  replayKey,
}: {
  data: Segment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  replayKey?: string | number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  // count-up for the center number
  const target = hover != null ? data[hover].value : Number(centerValue ?? total);
  const count = useCountUp(hover != null ? target : total, inView, 1.8);

  let offset = 0;
  const segs = data.map((d) => {
    const frac = d.value / total;
    const seg = { ...d, frac, dash: frac * c, gap: c - frac * c, rot: (offset / total) * 360 };
    offset += d.value;
    return seg;
  });

  return (
    <div className="flex flex-wrap items-center gap-6" ref={ref}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={thickness} />
          {segs.map((s, i) => (
            <motion.circle
              key={`${replayKey}-seg-${i}`}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={hover === i ? thickness + 3 : thickness}
              strokeLinecap="round"
              strokeDasharray={`${s.dash} ${s.gap}`}
              transform={`rotate(${-90 + s.rot} ${cx} ${cy})`}
              initial={{ strokeDasharray: `0 ${c}` }}
              animate={inView ? { strokeDasharray: `${s.dash} ${s.gap}` } : {}}
              transition={{ duration: 1.6, ease: SLOW, delay: 0.25 + i * 0.16 }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer', transition: 'stroke-width 0.2s' }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.p
            key={`${replayKey}-center`}
            className="text-[22px] font-light text-[#FAF9F6] tabular-nums leading-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, ease: SLOW, delay: 0.5 }}
          >
            {hover != null ? data[hover].value : <motion.span>{count}</motion.span>}
          </motion.p>
          <p className="mt-1 text-[9px] font-mono uppercase tracking-widest text-[#6B6B72]">
            {hover != null ? data[hover].label : centerLabel}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-2 min-w-[140px]">
        {data.map((d, i) => (
          <motion.div
            key={`${replayKey}-leg-${i}`}
            initial={{ opacity: 0, x: 10 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: SLOW, delay: 0.35 + i * 0.12 }}
            className="flex items-center justify-between gap-3"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
              <span className={`text-[11px] font-light transition-colors ${hover === i ? 'text-[#FAF9F6]' : 'text-[#9A9AA0]'}`}>{d.label}</span>
            </div>
            <span className="text-[11px] font-mono tabular-nums text-[#52525B]">
              {d.value} · {Math.round((d.value / total) * 100)}%
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══ Sparkline ═══════════════════════════════════════════════════════════
    Tiny inline trend line for stat cards. Draws in when scrolled into view.   */
export function Sparkline({ data, color = GOLD, width = 90, height = 28, replayKey }: { data: number[]; color?: string; width?: number; height?: number; replayKey?: string | number }) {
  const gid = useId().replace(/:/g, '');
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));
  const line = buildPath(pts);
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  return (
    <div ref={ref} className="overflow-visible">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id={`spark-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          key={`${replayKey}-spark-area`}
          d={area}
          fill={`url(#spark-${gid})`}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 1.3, ease: SLOW, delay: 0.3 }}
        />
        <motion.path
          key={`${replayKey}-spark-line`}
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.6, ease: SLOW }}
        />
      </svg>
    </div>
  );
}
