"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
  useReducedMotion,
  AnimatePresence,
} from "framer-motion"
import { Maximize2, X, Move, ArrowUpRight, Compass } from "lucide-react"

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

// Elegant high-density archive of editorial, brutalist, and modern lifestyle images
const ARCHIVE_ITEMS = [
  { id: 1, title: "MINIMAL LUXURY", category: "OUTFIT", src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80" },
  { id: 2, title: "CITY VIBES", category: "STREET", src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80" },
  { id: 3, title: "BRUTALIST ARCH", category: "SPACE", src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80" },
  { id: 4, title: "VIOLET DUSK", category: "GRAPHIC", src: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80" },
  { id: 5, title: "DARK MONOCHROME", category: "DESIGN", src: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80" },
  { id: 6, title: "ORGANIC LINES", category: "ART", src: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80" },
  { id: 7, title: "CLASSIC SHAPES", category: "STYLE", src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80" },
  { id: 8, title: "SOFT GLASS", category: "PRODUCT", src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80" },
  { id: 9, title: "DARK HORIZON", category: "AUTO", src: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80" },
  { id: 10, title: "CHROME WAVE", category: "MINIMAL", src: "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=600&q=80" },
  { id: 11, title: "MEADOW VIBE", category: "ANIME", src: "https://images.unsplash.com/photo-1500627869374-13cd993b1115?auto=format&fit=crop&w=600&q=80" },
  { id: 12, title: "COASTAL ARCH", category: "ECO", src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80" },
  { id: 13, title: "NEON DRIFT", category: "NIGHT", src: "https://picsum.photos/seed/dob13/600/800" },
  { id: 14, title: "SILK FORMS", category: "ART", src: "https://picsum.photos/seed/dob14/600/800" },
  { id: 15, title: "TERRA NULL", category: "STYLE", src: "https://picsum.photos/seed/dob15/600/800" },
  { id: 16, title: "GLASS TIDE", category: "PRODUCT", src: "https://picsum.photos/seed/dob16/600/800" },
  { id: 17, title: "COBALT BEAM", category: "GRAPHIC", src: "https://picsum.photos/seed/dob17/600/800" },
  { id: 18, title: "PAPER MOON", category: "DESIGN", src: "https://picsum.photos/seed/dob18/600/800" },
  { id: 19, title: "RUST LANE", category: "STREET", src: "https://picsum.photos/seed/dob19/600/800" },
  { id: 20, title: "AZURE PEAK", category: "SPACE", src: "https://picsum.photos/seed/dob20/600/800" },
]

// Expand the grid to create a massive exploreable map
const EXPANDED_GRID = [
  ...ARCHIVE_ITEMS, ...ARCHIVE_ITEMS, ...ARCHIVE_ITEMS,
]

export default function PremiumInteractiveGallery() {
  const containerRef = useRef<HTMLDivElement>(null)

  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 800 })
  const [activeItem, setActiveItem] = useState<typeof ARCHIVE_ITEMS[0] | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // 1. GRID DESIGN DIMENSIONS (Highly curated & small, widened for a sideways feel)
  const columns = 10
  const cardWidth = 158
  const cardHeight = 214
  const gap = 18

  // Calculate exact canvas boundaries based on coordinates
  const gridWidth = columns * (cardWidth + gap) - gap
  const gridHeight = Math.ceil(EXPANDED_GRID.length / columns) * (cardHeight + gap) - gap

  // Center alignment limits
  const padding = 140
  const maxX = padding
  const minX = viewportSize.width - gridWidth - padding
  const maxY = padding
  const minY = viewportSize.height - gridHeight - padding

  // 2. STABLE SPRINGS (Damped to eliminate scrolling jitter and vibrations)
  const x = useMotionValue(maxX - 200)
  const y = useMotionValue(maxY - 100)

  const springConfig = { damping: 46, stiffness: 210, mass: 0.85 }
  const smoothX = useSpring(x, springConfig)
  const smoothY = useSpring(y, springConfig)

  // 3. VELOCITY-BASED MOTION SKEW (Decoupled to prevent layout loops)
  const xVelocity = useVelocity(smoothX)
  const yVelocity = useVelocity(smoothY)

  const rawSkewX = useTransform(xVelocity, [-2500, 2500], [-7, 7])
  const rawSkewY = useTransform(yVelocity, [-2500, 2500], [-7, 7])

  const skewSpringX = useSpring(rawSkewX, { damping: 28, stiffness: 130 })
  const skewSpringY = useSpring(rawSkewY, { damping: 28, stiffness: 130 })

  const reduceMotion = useReducedMotion()
  // When the user prefers reduced motion, neutralise the velocity skew entirely.
  const skewXFinal: number | ReturnType<typeof useSpring> = reduceMotion ? 0 : skewSpringX
  const skewYFinal: number | ReturnType<typeof useSpring> = reduceMotion ? 0 : skewSpringY

  // Live viewport ref so per-card parallax reads fresh dimensions (updated in effects, never during render)
  const viewportRef = useRef(viewportSize)

  // Measure screen scale on mount & resize
  useEffect(() => {
    if (typeof window === "undefined") return
    const handleResize = () => {
      const next = { width: window.innerWidth, height: window.innerHeight }
      viewportRef.current = next
      setViewportSize(next)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // 4. COORDINATED OMNIDIRECTIONAL WHEEL PANNING (smooth diagonal flow)
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()

    const dX = e.deltaX
    const dY = e.deltaY

    // Omnidirectional panning: horizontal gestures move sideways, vertical
    // gestures move up/down — so you can explore in straight lines and never
    // miss content. A tiny cross-coupling keeps the signature diagonal "flow"
    // feel when scrolling, without forcing every gesture off-axis.
    const targetX = clamp(x.get() - (dX * 1.0 + dY * 0.18), minX, maxX)
    const targetY = clamp(y.get() - (dY * 1.0 + dX * 0.18), minY, maxY)

    x.set(targetX)
    y.set(targetY)
  }, [x, y, minX, maxX, minY, maxY])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  // Close the preview modal with the Escape key (UX)
  useEffect(() => {
    if (!activeItem) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveItem(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [activeItem])

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#070709] text-white selection:bg-stone-200 selection:text-black cursor-none">
      <Cursor />

      {/* MINIMAL EDITORIAL NAV BANNER */}
      <header className="pointer-events-none fixed left-0 right-0 top-0 z-40 flex items-center justify-between px-8 py-6">
        <div className="flex flex-col">
          <span className="font-mono text-[9px] tracking-[0.4em] text-neutral-500">MUSEUM ARCHIVE</span>
          <h1 className="font-serif text-sm font-bold tracking-widest text-neutral-200">CURATED SELECTION</h1>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono tracking-widest text-neutral-400">
          <span className="hidden md:inline">DRAG OR SCROLL — ANY DIRECTION — TO DISCOVER TILE PATHS</span>
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/5 bg-neutral-900/40 px-3 py-1 backdrop-blur-md">
            <Compass className="h-3 w-3 text-emerald-400" />
            <span className="text-[9px]">FREE FLOW ON</span>
          </div>
        </div>
      </header>

      {/* DEPTH VIGNETTE — adds cinematic falloff so cards melt into the edges */}
      <div className="pointer-events-none fixed inset-0 z-20 bg-[radial-gradient(ellipse_at_center,transparent_52%,rgba(0,0,0,0.55)_100%)]" />

      {/* DRAG-BOUNDED CANVAS */}
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full cursor-none"
      >
        <motion.div
          drag
          dragConstraints={{ left: minX, right: maxX, top: minY, bottom: maxY }}
          dragTransition={{ bounceStiffness: 380, bounceDamping: 42 }}
          dragElastic={0.06}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          style={{
            width: gridWidth,
            height: gridHeight,
            x: smoothX,
            y: smoothY,
            willChange: "transform",
          }}
          className="absolute flex touch-none p-[120px]"
        >
          {EXPANDED_GRID.map((item, index) => (
            <GalleryCard
              key={`${item.id}-${index}`}
              item={item}
              index={index}
              columns={columns}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              gap={gap}
              smoothX={smoothX}
              smoothY={smoothY}
              viewportRef={viewportRef}
              skewSpringX={skewXFinal}
              skewSpringY={skewYFinal}
              reduceMotion={reduceMotion ?? false}
              isDragging={isDragging}
              onActivate={setActiveItem}
            />
          ))}
        </motion.div>
      </div>

      {/* FLOAT INSTRUCTION CARD */}
      <div className="pointer-events-none absolute bottom-32 left-8 z-30 flex items-center gap-3.5 rounded-full border border-white/5 bg-black/40 px-4 py-2.5 text-xs text-neutral-400 backdrop-blur-md shadow-lg">
        <Move className="h-3.5 w-3.5 animate-bounce text-stone-400" />
        <span className="font-mono text-[9px] tracking-widest text-neutral-300">EXPLORE ARCHIVE CANVAS</span>
      </div>

      {/* MAGNETIC CAROUSEL DOCK (Floating at viewport base) */}
      <div className="absolute bottom-8 left-0 right-0 z-40 flex justify-center">
        <MagneticDock />
      </div>

      {/* CINEMATIC PREVIEW MODAL */}
      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-md cursor-auto"
            onClick={() => setActiveItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 28, stiffness: 250 }}
              className="relative max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-[#0c0c0e] p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveItem(null)}
                className="absolute right-5 top-5 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white backdrop-blur-md transition-all hover:bg-white/15 border border-white/10"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="overflow-hidden rounded-lg border border-white/5 bg-neutral-950">
                  <img src={activeItem.src} alt={activeItem.title} className="w-full h-full object-cover max-h-[360px]" />
                </div>
                <div className="flex flex-col justify-between py-2">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-[9px] text-stone-500">
                      <span>STILL FILE / 0{activeItem.id}</span>
                      <span>•</span>
                      <span className="uppercase text-neutral-300 font-bold">{activeItem.category}</span>
                    </div>
                    <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-white">{activeItem.title}</h2>

                    <p className="mt-4 text-xs leading-relaxed text-neutral-400 font-light">
                      A visual exploration displaying minimalist grids, architectural alignment and high-density interface aesthetics. Crafted to capture raw luxury and pristine texture.
                    </p>
                  </div>

                  <div className="mt-6 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between text-[9px] font-mono">
                      <span className="text-neutral-500">OUTPUT RESOLUTION</span>
                      <span className="text-neutral-200">RAW CINEMATIC</span>
                    </div>
                    <a
                      href="#"
                      className="mt-4 flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-center text-xs font-semibold text-black transition-all hover:bg-neutral-200"
                    >
                      <span>VIEW HIGH RESOLUTION</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

/* ==========================================
   GALLERY CARD — parallax + magnetic hover
   ========================================== */
type CardProps = {
  item: { id: number; title: string; category: string; src: string }
  index: number
  columns: number
  cardWidth: number
  cardHeight: number
  gap: number
  smoothX: ReturnType<typeof useSpring>
  smoothY: ReturnType<typeof useSpring>
  viewportRef: React.MutableRefObject<{ width: number; height: number }>
  skewSpringX: number | ReturnType<typeof useSpring>
  skewSpringY: number | ReturnType<typeof useSpring>
  reduceMotion: boolean
  isDragging: boolean
  onActivate: (item: CardProps["item"]) => void
}

function GalleryCard({
  item, index, columns, cardWidth, cardHeight, gap,
  smoothX, smoothY, viewportRef, skewSpringX, skewSpringY, reduceMotion, isDragging, onActivate,
}: CardProps) {
  const colIndex = index % columns
  // Progressive mathematical stagger offsets for natural diagonal flow
  const diagonalOffset = colIndex * 38

  const left = colIndex * (cardWidth + gap)
  const top = Math.floor(index / columns) * (cardHeight + gap) + diagonalOffset

  // Screen-space center of the card (driven by the panned canvas)
  const screenCX = useTransform(smoothX, (sx) => sx + left + cardWidth / 2)
  const screenCY = useTransform(smoothY, (sy) => sy + top + cardHeight / 2)

  // Depth factor: 1 near viewport center, 0 far off-screen
  const depth = useTransform([screenCX, screenCY], (vals: number[]) => {
    const [cx, cy] = vals
    const vp = viewportRef.current
    const dx = (cx - vp.width / 2) / (vp.width / 2 + 300)
    const dy = (cy - vp.height / 2) / (vp.height / 2 + 300)
    return Math.max(0, 1 - Math.hypot(dx, dy))
  })

  // Cards fade, shrink and drift as they enter / leave the screen (parallax).
  // If reduced motion is preferred, collapse every effect to a neutral state.
  const opacity = useTransform(depth, [0, 0.35, 1], reduceMotion ? [1, 1, 1] : [0.12, 0.6, 1])
  const scale = useTransform(depth, [0, 1], reduceMotion ? [1, 1] : [0.78, 1])
  const parallaxY = useTransform(depth, [0, 1], reduceMotion ? [0, 0] : [80, 0])

  // Magnetic pull toward the cursor on hover
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const smx = useSpring(mx, { stiffness: 260, damping: 18, mass: 0.35 })
  const smy = useSpring(my, { stiffness: 260, damping: 18, mass: 0.35 })

  const [loaded, setLoaded] = useState(false)

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - (r.left + r.width / 2)) * 0.22)
    my.set((e.clientY - (r.top + r.height / 2)) * 0.3)
  }
  const handleLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.div
      className="absolute"
      style={{
        left,
        top,
        width: cardWidth,
        height: cardHeight,
        y: parallaxY,
        opacity,
        scale,
        willChange: "transform, opacity",
      }}
    >
      <motion.div
        style={{
          x: smx,
          y: smy,
          skewX: skewSpringX,
          skewY: skewSpringY,
          willChange: "transform",
        }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        whileHover={reduceMotion ? undefined : { scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 26 }}
        onClick={() => {
          if (!isDragging) onActivate(item)
        }}
        className="group relative h-full w-full overflow-hidden rounded-lg border border-white/5 bg-neutral-900/60 p-2.5 backdrop-blur-sm transition-colors duration-300 hover:border-white/20"
      >
        <div className="relative h-[148px] w-full overflow-hidden rounded-md bg-neutral-800">
          <img
            src={item.src}
            alt={item.title}
            draggable={false}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={`h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-110 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        {/* Card Title & Info */}
        <div className="mt-2.5 flex items-center justify-between px-1">
          <div className="truncate pr-2">
            <h3 className="truncate font-serif text-[11px] font-medium tracking-tight text-neutral-200">
              {item.title}
            </h3>
            <p className="mt-0.5 font-mono text-[8px] text-neutral-500 tracking-wider">
              {item.category} • 0{item.id}
            </p>
          </div>
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 opacity-0 transition-all duration-300 group-hover:opacity-100">
            <Maximize2 className="h-2 w-2 text-neutral-300" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ==========================================
   MAGNETIC DOCK CAROUSEL COMPONENT
   ========================================== */
function MagneticDock() {
  const dockItems = [
    { src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80", tag: "LUXURY" },
    { src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=300&q=80", tag: "STREET" },
    { src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80", tag: "SPACE" },
    { src: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=300&q=80", tag: "VIOLET" },
    { src: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=300&q=80", tag: "STYLE" },
    { src: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=300&q=80", tag: "LINES" },
    { src: "https://picsum.photos/seed/dob16/300/300", tag: "TIDE" },
    { src: "https://picsum.photos/seed/dob19/300/300", tag: "LANE" },
  ]

  const containerRef = useRef<HTMLDivElement>(null)

  const baseWidth = 44
  const maxMultiplier = 2.1
  const influenceRange = 140

  const [factors, setFactors] = useState<number[]>(() => dockItems.map(() => 0))
  const targetRef = useRef<number[]>(dockItems.map(() => 0))
  const curRef = useRef<number[]>(dockItems.map(() => 0))
  const loopRef = useRef(0)

  const startLoop = useCallback(() => {
    if (loopRef.current) return
    const step = () => {
      const tgt = targetRef.current
      const cur = curRef.current
      let moving = false
      for (let i = 0; i < cur.length; i++) {
        const diff = (tgt[i] ?? 0) - cur[i]
        if (Math.abs(diff) > 0.001) {
          cur[i] += diff * 0.18 // Smooth exponential translation
          moving = true
        } else {
          cur[i] = tgt[i] ?? 0
        }
      }
      setFactors([...cur])
      loopRef.current = moving ? requestAnimationFrame(step) : 0
    }
    loopRef.current = requestAnimationFrame(step)
  }, [])

  const handleMouseMove = (clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const mouseX = clientX - rect.left

    const newTargets = dockItems.map((_, i) => {
      const itemCenter = i * (baseWidth + 10) + baseWidth / 2
      const dist = Math.abs(mouseX - itemCenter)
      const factor = Math.max(0, 1 - dist / influenceRange)
      return factor * factor * (3 - 2 * factor) // Cubic Bezier approximation
    })

    targetRef.current = newTargets
    startLoop()
  }

  const handleMouseLeave = () => {
    targetRef.current = dockItems.map(() => 0)
    startLoop()
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={(e) => handleMouseMove(e.clientX)}
      onMouseLeave={handleMouseLeave}
      className="flex h-16 items-end gap-2.5 rounded-xl border border-white/5 bg-black/35 px-3 pb-2 pt-2 backdrop-blur-md shadow-2xl cursor-auto"
    >
      {dockItems.map((item, i) => {
        const factor = factors[i] ?? 0
        const calculatedSize = baseWidth + (baseWidth * maxMultiplier - baseWidth) * factor

        return (
          <motion.div
            key={i}
            style={{
              width: calculatedSize,
              height: calculatedSize,
            }}
            className="group relative cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-neutral-900 transition-all"
          >
            <img
              src={item.src}
              alt={item.tag}
              draggable={false}
              className="h-full w-full object-cover transition-transform duration-300"
            />

            {/* Minimalist Micro Tooltip */}
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 scale-75 rounded bg-black/90 px-1.5 py-0.5 text-[7px] font-mono tracking-widest text-neutral-300 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 border border-white/5">
              {item.tag}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ==========================================
   CUSTOM MAGNETIC CURSOR (polish touch)
   ========================================== */
function Cursor() {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, { damping: 28, stiffness: 320, mass: 0.4 })
  const sy = useSpring(y, { damping: 28, stiffness: 320, mass: 0.4 })

  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      const el = e.target as HTMLElement | null
      setHovering(!!el?.closest("a, button, [role='button'], .group"))
    }
    window.addEventListener("mousemove", move)
    return () => window.removeEventListener("mousemove", move)
  }, [x, y])

  return (
    <motion.div
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed left-0 top-0 z-[60] hidden md:block"
    >
      <motion.div
        animate={{
          width: hovering ? 46 : 14,
          height: hovering ? 46 : 14,
          opacity: hovering ? 0.5 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="-translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 mix-blend-difference"
        style={{ marginLeft: 0 }}
      />
    </motion.div>
  )
}
