"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  AnimatePresence,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Magnetic from "./Magnetic";

/* ─── Easing ──────────────────────────────────────────────────────── */
const EASE_ENTER: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_EXIT: [number, number, number, number] = [0.7, 0, 0.84, 0];

/* ─── Content ─────────────────────────────────────────────────────── */
const STEPS = [
  {
    fig: "I",
    verb: "See it.",
    title: "Discover",
    desc: "Browse infinite aesthetic boards curated by taste, not algorithms. Every feed is a moodboard.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    fig: "II",
    verb: "Keep it.",
    title: "Save",
    desc: "Pin what moves you to personal collections. Build your identity, one board at a time.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    fig: "III",
    verb: "Wear it.",
    title: "Shop",
    desc: "Every pin links to a real store. No dead ends. No 'search for this yourself.' Just buy.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
];

const BRANDS = [
  { name: "Nepal Threads", cat: "Contemporary" },
  { name: "Himal Atelier", cat: "Luxury" },
  { name: "Kathmandu Collective", cat: "Streetwear" },
  { name: "Pokhara Linen", cat: "Essentials" },
  { name: "Bhaktapur Craft", cat: "Artisan" },
  { name: "Lalitpur Silk", cat: "Heritage" },
];

const STEP_IMAGES = [
  "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80",
];

const BRAND_IMAGES = [
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&auto=format&fit=crop&q=80",
];

const ROMANS = ["I", "II", "III", "IV", "V", "VI"];
const CARD_LIFT = [0, 64, -28];
const CARD_ROTATE = [-3, 2.5, -1.75];
const CARD_PARALLAX_RANGE: [string, string][] = [
  ["120px", "-60px"],
  ["180px", "-100px"],
  ["80px", "-30px"],
];

const STATS = [
  { value: 6, label: "Curated Brands", sub: "Nepal's finest designers" },
  { value: 12, label: "Collections", sub: "Aesthetic drops updated daily" },
  { value: 500, suffix: "+", label: "Products", sub: "Sourced directly to stores" },
];

const MARQUEE_TEXT = BRANDS.map((b) => b.name).join("   ·   ") + "   ·   ";

/* ─── Animated Stats Counter ──────────────────────────────────────── */
function Counter({ value, duration = 1.8 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();
    const totalMs = duration * 1000;
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / totalMs, 1);
      const eased = progress * (2 - progress);
      setCount(Math.floor(eased * value));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [inView, value, duration]);

  return <span ref={ref}>{count}</span>;
}

/* ─── Pinned Gallery Card ─────────────────────────────────────────── */
function PinCard({
  step,
  index,
  reduceMotion,
  parallaxY,
}: {
  step: (typeof STEPS)[number];
  index: number;
  reduceMotion: boolean;
  parallaxY: MotionValue<string>;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const glow = useMotionTemplate`radial-gradient(220px circle at ${mouseX}px ${mouseY}px, rgba(223,186,115,0.18), transparent 75%)`;

  const lift = reduceMotion ? 0 : CARD_LIFT[index];
  const rest = reduceMotion ? 0 : CARD_ROTATE[index];
  const slideFrom = index % 2 === 0 ? -100 : 100;

  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start end", "center center"],
  });
  const x = useTransform(scrollYProgress, [0, 1], [slideFrom, 0]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const rotate = useTransform(scrollYProgress, [0, 1], [rest * 2, rest]);

  return (
    <motion.div
      style={!reduceMotion ? { y: parallaxY } : undefined}
      className="relative"
    >
      <motion.div
        ref={scrollRef}
        style={reduceMotion ? undefined : { x, opacity, rotate }}
        initial={reduceMotion ? { opacity: 1, x: 0, rotate: rest } : undefined}
        whileHover={reduceMotion ? undefined : { rotate: 0, scale: 1.045, y: lift - 8 }}
      >
      <div
        ref={cardRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative cursor-pointer"
        data-cursor="hover"
        tabIndex={0}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
      >
        {/* Pin */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <svg width="16" height="18" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_3px_4px_rgba(0,0,0,0.6)]">
            <circle cx="12" cy="7" r="6" fill="#DFBA73" />
            <line x1="12" y1="12" x2="12" y2="21" stroke="#DFBA73" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Photograph */}
        <div className="relative w-full max-w-[290px] mx-auto aspect-[4/5] overflow-hidden rounded-[2px] border border-[#FAF9F6]/10 bg-[#121215] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.75)]">
          <motion.img
            src={STEP_IMAGES[index]}
            alt=""
            initial={{ scale: 1, filter: "grayscale(1)" }}
            animate={{
              scale: isHovered ? 1.08 : 1,
              filter: isHovered ? "grayscale(0)" : "grayscale(1)",
            }}
            transition={{ duration: 1.3, ease: EASE_ENTER }}
            className="w-full h-full object-cover"
          />
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: glow }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080a]/75 via-transparent to-transparent" />
          <span className="absolute top-3 right-3 text-[#DFBA73]/70">{step.icon}</span>
        </div>

        {/* Museum-style placard */}
        <div className="max-w-[290px] mx-auto mt-5 pt-5 border-t border-[#DFBA73]/25 text-center">
          <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#DFBA73]/60 block mb-2">
            Fig. {step.fig} — {step.title}
          </span>
          <h3 className="font-display italic text-xl md:text-2xl text-[#FAF9F6]">{step.verb}</h3>
          <p className="text-[12px] md:text-[13px] text-[#8E8E93] font-light leading-relaxed mt-3">
            {step.desc}
          </p>
        </div>
      </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Section ────────────────────────────────────────────────── */
export default function FeaturesSection() {
  const shouldReduceMotion = useReducedMotion();
  const stepsRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const [hoveredBrand, setHoveredBrand] = useState<number | null>(null);

  /* Full-section scroll progress — drives ambient parallax + outro */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  /* Pinboard scroll progress — drives card-level parallax */
  const pinboardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: pinboardProgress } = useScroll({
    target: pinboardRef,
    offset: ["start end", "end start"],
  });
  const cardParallaxY = CARD_PARALLAX_RANGE.map((range) =>
    useTransform(pinboardProgress, [0, 1], range)
  );

  /* Heading scroll progress — drives label + title slide-in */
  const headingRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: headingProgress } = useScroll({
    target: headingRef,
    offset: ["start end", "center center"],
  });
  const labelX = useTransform(headingProgress, [0, 1], ["-40px", "0px"]);
  const labelOpacity = useTransform(headingProgress, [0, 1], [0, 1]);
  const headingLine0X = useTransform(headingProgress, [0, 1], ["-50px", "0px"]);
  const headingLine1X = useTransform(headingProgress, [0, 1], ["-65px", "0px"]);
  const headingLine2X = useTransform(headingProgress, [0, 1], ["-80px", "0px"]);
  const headingLineXs = [headingLine0X, headingLine1X, headingLine2X];
  const headingLineOpacity = useTransform(headingProgress, [0, 1], [0, 1]);

  const bgGlowY = useTransform(scrollYProgress, [0, 1], ["-10%", "30%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["6%", "-16%"]);
  const brandsListY = useTransform(scrollYProgress, [0, 1], ["4%", "-10%"]);
  const stickyPanelY = useTransform(scrollYProgress, [0, 1], ["-4%", "8%"]);

  const outroOpacityRaw = useTransform(scrollYProgress, [0.84, 1], [1, 0.75]);
  const outroScaleRaw = useTransform(scrollYProgress, [0.84, 1], [1, 0.97]);
  const outroOpacity = useSpring(outroOpacityRaw, { stiffness: 120, damping: 30 });
  const outroScale = useSpring(outroScaleRaw, { stiffness: 120, damping: 30 });

  /* Thread progress — draws the pin-to-pin string as the board scrolls in */
  const { scrollYProgress: threadProgress } = useScroll({
    target: stepsRef,
    offset: ["start 75%", "end 45%"],
  });
  const pathLength = useTransform(threadProgress, [0, 1], [0, 1]);

  return (
    <section
      ref={sectionRef}
      className="relative py-28 md:py-40 overflow-hidden bg-[#08080a] border-b border-[#FAF9F6]/5"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div
          style={{ y: bgGlowY }}
          className="absolute bottom-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full bg-[#DFBA73]/[0.015] blur-[140px]"
        />
      </div>

      {/* ── The Ritual ────────────────────────────────────────────── */}
      <div ref={stepsRef} className="relative z-10 px-6 md:px-12 mb-40 md:mb-56 max-w-7xl mx-auto">
        <motion.div ref={headingRef} style={{ y: textY }}>
          <motion.div
            style={!shouldReduceMotion ? { x: labelX, opacity: labelOpacity } : undefined}
            initial={!shouldReduceMotion ? { opacity: 1, x: 0 } : undefined}
            className="flex items-center gap-3 mb-8"
          >
            <span className="w-8 h-px bg-[#DFBA73]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.45em] text-[#DFBA73]">
              The Ritual
            </span>
          </motion.div>

          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-[#FAF9F6] leading-[0.95] tracking-tight max-w-2xl">
            {["See it.", "Keep it.", "Wear it."].map((phrase, i) => (
              <motion.span
                key={phrase}
                style={!shouldReduceMotion ? { x: headingLineXs[i], opacity: headingLineOpacity } : undefined}
                initial={!shouldReduceMotion ? { opacity: 1, x: 0 } : undefined}
                className={`block ${i === 2 ? "italic text-[#DFBA73]" : ""}`}
              >
                {phrase}
              </motion.span>
            ))}
          </h2>
        </motion.div>

        {/* The Pinboard */}
        <div ref={pinboardRef} className="relative grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-24 mt-24 md:mt-32">
          {/* Hand-drawn connecting thread (desktop only) */}
          <div className="hidden md:block absolute inset-x-0 -top-2 h-[420px] pointer-events-none z-0">
            <svg viewBox="0 0 1200 420" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <motion.path
                d="M200,190 Q400,50 600,300 Q800,540 1000,110"
                fill="none"
                stroke="#DFBA73"
                strokeWidth="1.5"
                strokeDasharray="2 10"
                strokeLinecap="round"
                opacity={0.5}
                style={{ pathLength: shouldReduceMotion ? 1 : pathLength }}
              />
            </svg>
          </div>

          {STEPS.map((step, i) => (
            <PinCard
              key={step.fig}
              step={step}
              index={i}
              reduceMotion={!!shouldReduceMotion}
              parallaxY={cardParallaxY[i]}
            />
          ))}
        </div>
      </div>

      {/* ── The Ateliers ──────────────────────────────────────────── */}
      <motion.div
        style={{ opacity: outroOpacity, scale: outroScale }}
        className="relative z-10 px-6 md:px-12 max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-6">
          <span className="w-8 h-px bg-[#DFBA73]" />
          <span className="font-mono text-[9px] uppercase tracking-[0.45em] text-[#DFBA73]">
            The Ateliers
          </span>
        </div>
        <h2 className="font-display text-3xl md:text-5xl text-[#FAF9F6] leading-[0.95] tracking-tight mb-14 md:mb-20 max-w-xl">
          Six houses,
          <br />
          <span className="italic text-[#DFBA73]">one address.</span>
        </h2>

        <div className="relative flex flex-col lg:flex-row gap-16 items-start brands-container">
          {/* Ambient marquee of house names — confined to this row, never the headline above */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 overflow-hidden flex items-center pointer-events-none select-none"
            style={{ opacity: 0.035 }}
          >
            <motion.div
              className="flex whitespace-nowrap font-display text-[5rem] md:text-[8rem] text-[#FAF9F6]"
              animate={shouldReduceMotion ? undefined : { x: ["0%", "-50%"] }}
              transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
            >
              <span className="pr-16">{MARQUEE_TEXT}</span>
              <span className="pr-16">{MARQUEE_TEXT}</span>
            </motion.div>
          </div>

          {/* Left: Brand list */}
          <motion.div style={{ y: brandsListY }} className="w-full lg:w-[60%] flex flex-col">
            {BRANDS.map((brand, i) => (
              <div
                key={brand.name}
                onMouseEnter={() => setHoveredBrand(i)}
                onFocus={() => setHoveredBrand(i)}
                tabIndex={0}
                className="group border-b border-[#FAF9F6]/[0.06] py-8 cursor-pointer transition-all duration-300 hover:pl-8 focus:pl-8 flex items-center justify-between outline-none focus-visible:ring-1 focus-visible:ring-[#DFBA73]/50"
                data-cursor="hover"
              >
                <div className="flex items-baseline gap-6">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#DFBA73]/50">
                    {ROMANS[i]}
                  </span>
                  <h4 className="relative font-display text-2xl md:text-3xl text-[#FAF9F6] group-hover:text-[#DFBA73] group-focus:text-[#DFBA73] transition-colors duration-300">
                    {brand.name}
                    <motion.span
                      aria-hidden="true"
                      initial={false}
                      animate={{ scaleX: hoveredBrand === i ? 1 : 0 }}
                      transition={{ duration: 0.5, ease: EASE_ENTER }}
                      className="absolute left-0 -bottom-1 h-px w-full bg-[#DFBA73] origin-left"
                    />
                  </h4>
                </div>

                <div className="flex items-center gap-6">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8E8E93] group-hover:text-[#FAF9F6] transition-colors duration-300">
                    {brand.cat}
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-[#FAF9F6]/30 group-hover:text-[#DFBA73] transition-all duration-300 transform group-hover:translate-x-1.5 group-hover:-translate-y-1.5"
                  >
                    <path d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </div>
              </div>
            ))}

            <div className="mt-12">
              <Magnetic>
                <a
                  href="#"
                  data-cursor="stick"
                  className="inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[#DFBA73] border border-[#DFBA73]/30 rounded-full px-6 py-3 hover:bg-[#DFBA73]/10 transition-colors duration-300"
                >
                  View Full Directory
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </a>
              </Magnetic>
            </div>
          </motion.div>

          {/* Right: Sticky image panel */}
          <motion.div style={{ y: stickyPanelY }} className="hidden lg:block w-[40%] relative self-stretch">
            <div className="sticky top-32 h-[480px] w-full overflow-hidden rounded-2xl border border-[#DFBA73]/15 shadow-[0_20px_40px_rgba(0,0,0,0.6)] bg-[#121215]/20 backdrop-blur-sm">
              <AnimatePresence mode="wait">
                {hoveredBrand !== null ? (
                  <motion.div
                    key={hoveredBrand}
                    initial={{ opacity: 0, scale: 1.08 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.35, ease: EASE_EXIT } }}
                    transition={{ duration: 6, ease: "linear" }}
                    className="absolute inset-0 w-full h-full bg-[#08080a]"
                  >
                    <img
                      src={BRAND_IMAGES[hoveredBrand]}
                      className="w-full h-full object-cover grayscale transition-all duration-500 hover:grayscale-0"
                      alt={BRANDS[hoveredBrand].name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020202]/90 via-[#020202]/30 to-transparent" />

                    <div className="absolute bottom-8 left-8 right-8">
                      <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#DFBA73] block mb-2">
                        {ROMANS[hoveredBrand]} — Featured House
                      </span>
                      <h4 className="font-display text-3xl text-[#FAF9F6] mb-1">
                        {BRANDS[hoveredBrand].name}
                      </h4>
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8E8E93]">
                        {BRANDS[hoveredBrand].cat} Collection
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.3, ease: EASE_EXIT } }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-[#121215]/10"
                  >
                    <div className="w-12 h-12 rounded-full border border-dashed border-[#DFBA73]/30 flex items-center justify-center mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#DFBA73] animate-pulse" />
                    </div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#8E8E93]/60">
                      Hover a house to preview
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Colophon / stats ledger */}
        <div className="border-t border-[#FAF9F6]/[0.05] mt-32 pt-16 grid grid-cols-1 md:grid-cols-3 gap-12">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left md:border-l md:border-[#FAF9F6]/5 md:pl-12 first:md:border-l-0 first:md:pl-0"
            >
              <div className="font-display text-5xl lg:text-6xl text-[#FAF9F6] font-bold min-w-[70px] flex items-baseline justify-center md:justify-start">
                <Counter value={s.value} />
                {s.suffix && <span className="text-[#DFBA73] font-light font-display ml-1">{s.suffix}</span>}
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#DFBA73] mb-1">
                  {ROMANS[i]}. {s.label}
                </span>
                <span className="text-xs text-[#8E8E93] font-light">{s.sub}</span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.9, delay: 0.2 + i * 0.1, ease: EASE_ENTER }}
                  className="mt-3 h-px w-10 bg-[#DFBA73]/50 origin-left"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}