"use client";

import { useRef, useLayoutEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Magnetic from "./Magnetic";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ─── Data ─────────────────────────────────────────────────────────── */

const BOARDS = [
  {
    num: "01",
    title: "Old Money",
    subtitle: "Quiet luxury, timeless silhouettes",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
    tag: "Heritage",
  },
  {
    num: "02",
    title: "Clean Girl",
    subtitle: "Effortless, dewy, minimal",
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
    tag: "Essentials",
  },
  {
    num: "03",
    title: "Streetwear",
    subtitle: "Bold layers, urban edge",
    img: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=800&auto=format&fit=crop&q=80",
    tag: "Culture",
  },
  {
    num: "04",
    title: "Coquette",
    subtitle: "Soft romance, ribbons & lace",
    img: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=80",
    tag: "Feminine",
  },
  {
    num: "05",
    title: "Korean",
    subtitle: "K-fashion, oversized proportions",
    img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
    tag: "Seoul",
  },
  {
    num: "06",
    title: "Vintage",
    subtitle: "Curated nostalgia, worn-in soul",
    img: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&auto=format&fit=crop&q=80",
    tag: "Archive",
  },
];

/* Stagger offset per card index (vh units) for the diagonal cascade */
const STAGGER_VH = 8;

/* ─── Component ────────────────────────────────────────────────────── */

export default function GallerySection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  /* Smooth the raw progress for buttery movement */
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 30,
    mass: 0.8,
  });

  /* Diagonal translation — moves left AND down simultaneously */
  const x = useTransform(smoothProgress, [0, 1], ["0%", "-75%"]);
  const y = useTransform(smoothProgress, [0, 1], ["0%", "-20%"]);

  /* Parallax for images inside the horizontally scrolling cards */
  const imgParallax = useTransform(smoothProgress, [0, 1], ["-10%", "10%"]);

  /* Parallax for the large background glows */
  const glow1Y = useTransform(smoothProgress, [0, 1], ["0%", "-30%"]);
  const glow2Y = useTransform(smoothProgress, [0, 1], ["0%", "30%"]);

  /* Progress bar width at the very top of the section */
  const progressWidth = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  return (
    <div ref={containerRef} className="relative bg-[#08080a]">
      {/* ═══════════════════════════════════════════════════════════
          DESKTOP — Diagonal Horizontal Scroll
          ═══════════════════════════════════════════════════════════ */}
      <div className="hidden md:block relative h-[400vh]">
        {/* Sticky viewport — locks the visual frame while scroll drives transforms */}
        <div className="sticky top-0 h-screen overflow-hidden bg-[#08080a]">
          {/* ── Progress indicator ── */}
          <motion.div
            style={{ width: progressWidth }}
            className="absolute top-0 left-0 h-px bg-gradient-to-r from-[#DFBA73]/0 via-[#DFBA73]/60 to-[#DFBA73]/0 z-50"
          />

          {/* ── Ambient glow layers ── */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <motion.div style={{ y: glow1Y }} className="absolute top-[15%] right-[-8%] w-[55%] h-[55%] rounded-full bg-[#DFBA73]/[0.015] blur-[180px]" />
            <motion.div style={{ y: glow2Y }} className="absolute bottom-[-20%] left-[10%] w-[40%] h-[40%] rounded-full bg-[#DFBA73]/[0.01] blur-[150px]" />
          </div>

          {/* ── Diagonal scrolling track ── */}
          <motion.div
            style={{ x, y }}
            className="relative z-10 flex items-start gap-10 lg:gap-14 pl-16 lg:pl-24 pt-[12vh] min-w-max select-none will-change-transform"
          >
            {/* ── Cinematic Intro Title Block ── */}
            <div
              className="w-[38vw] lg:w-[30vw] flex-shrink-0 flex flex-col justify-center pl-2"
              style={{ marginTop: "6vh" }}
            >
              <div className="flex gap-0">
                {/* Gold accent border-left */}
                <div className="w-[3px] bg-gradient-to-b from-[#DFBA73] via-[#DFBA73]/60 to-transparent rounded-full flex-shrink-0" />
                <div className="pl-8 flex flex-col">
                  <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-[#DFBA73] mb-5">
                    Curated Boards
                  </span>
                  <h2 className="font-display text-5xl lg:text-[3.8rem] xl:text-7xl text-[#FAF9F6] leading-[0.95] tracking-tight mb-10">
                    Every aesthetic,
                    <br />
                    <span className="italic text-[#DFBA73]">
                      sourced to
                      <br />
                      a store.
                    </span>
                  </h2>
                  <p className="text-[#8E8E93] text-sm font-light leading-relaxed max-w-[28ch] mb-10">
                    Discover curated style boards spanning the full spectrum of
                    modern fashion — each one shoppable.
                  </p>
                  <div className="flex items-center gap-4 text-[#8E8E93]/60">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
                      Scroll to explore
                    </span>
                    <motion.span
                      className="text-[#DFBA73] text-lg"
                      animate={{ x: [0, 8, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.8,
                        ease: "easeInOut",
                      }}
                    >
                      →
                    </motion.span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Board Cards with staggered marginTop ── */}
            {BOARDS.map((board, i) => (
              <div
                key={board.num}
                className="flex-shrink-0 relative"
                style={{ marginTop: `${(i + 1) * STAGGER_VH}vh` }}
              >
                {/* Giant floating number */}
                <span
                  className="absolute -bottom-6 -left-6 md:-bottom-10 md:-left-10 text-[8rem] md:text-[12rem] font-display italic text-white/10 group-hover:text-[#DFBA73]/40 leading-none pointer-events-none select-none z-0 transition-colors duration-700"
                  style={{ mixBlendMode: "difference" }}
                  aria-hidden="true"
                >
                  {board.num}
                </span>

                {/* Card */}
                <div
                  className="group relative w-[60vw] md:w-[45vw] h-[55vh] md:h-[70vh] rounded-2xl overflow-hidden border border-[#FAF9F6]/[0.06] hover:border-[#DFBA73]/30 transition-colors duration-500 z-10"
                  data-cursor="text"
                  data-cursor-text="VIEW"
                >
                  {/* Image */}
                  <div className="absolute inset-0 overflow-hidden">
                    <motion.img
                      style={{ x: imgParallax }}
                      src={board.img}
                      alt={board.title}
                      className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] object-cover scale-[1.15] group-hover:scale-100 grayscale group-hover:grayscale-0 transition-all duration-[900ms] ease-out"
                    />
                  </div>

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />

                  {/* Subtle inner glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-[#DFBA73]/[0.04] via-transparent to-transparent" />

                  {/* Tag badge */}
                  <div className="absolute top-5 left-5 z-20">
                    <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#DFBA73] bg-[#020202]/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/[0.06]">
                      {board.tag}
                    </span>
                  </div>

                  {/* Bottom content */}
                  <div className="absolute bottom-0 left-0 right-0 p-7 lg:p-9 z-20">
                    <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#DFBA73]/60 block mb-3">
                      Board {board.num}
                    </span>
                    <h3 className="font-display text-2xl lg:text-4xl text-[#FAF9F6] mb-1.5 tracking-tight">
                      {board.title}
                    </h3>
                    <p className="text-xs lg:text-sm text-[#8E8E93] font-light">
                      {board.subtitle}
                    </p>

                    {/* Explore CTA — slides up on hover */}
                    <div className="mt-6 flex items-center gap-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 ease-out">
                      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#FAF9F6]">
                        Explore
                      </span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-[#DFBA73]"
                      >
                        <path d="M7 17L17 7M17 7H7M17 7v10" />
                      </svg>
                    </div>
                  </div>

                  {/* Giant floating number (inside card for hover group) */}
                  <span
                    className="absolute -bottom-6 -left-6 md:-bottom-10 md:-left-10 text-[8rem] md:text-[12rem] font-display italic text-white/[0.06] group-hover:text-[#DFBA73]/30 leading-none pointer-events-none select-none z-30 transition-colors duration-700"
                    aria-hidden="true"
                  >
                    {board.num}
                  </span>
                </div>
              </div>
            ))}

            {/* ── End CTA Circle ── */}
            <div
              className="flex-shrink-0 flex items-center justify-center px-16 lg:px-24"
              style={{
                marginTop: `${(BOARDS.length + 1) * STAGGER_VH}vh`,
              }}
            >
              <Magnetic strength={0.2}>
                <div
                  data-cursor="stick"
                  className="w-52 h-52 lg:w-60 lg:h-60 rounded-full border border-[#FAF9F6]/10 flex flex-col items-center justify-center group relative overflow-hidden cursor-pointer transition-all duration-500 hover:border-[#DFBA73]/40"
                >
                  {/* Fill animation */}
                  <div className="absolute inset-0 bg-[#DFBA73] rounded-full translate-y-full group-hover:translate-y-0 transition-transform duration-600 ease-[cubic-bezier(0.76,0,0.24,1)]" />

                  {/* Circle content */}
                  <span className="relative z-10 text-[10px] font-mono uppercase tracking-[0.3em] text-[#FAF9F6] group-hover:text-[#08080a] font-bold transition-colors duration-500 text-center leading-relaxed">
                    View All
                    <br />
                    Boards
                  </span>
                  <span className="relative z-10 text-lg text-[#DFBA73] group-hover:text-[#08080a] mt-3 transition-colors duration-500">
                    →
                  </span>
                </div>
              </Magnetic>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MOBILE — Horizontal snap-scroll carousel
          ═══════════════════════════════════════════════════════════ */}
      <div className="md:hidden py-20 px-6 border-b border-[#FAF9F6]/5">
        {/* Header */}
        <div className="flex gap-0 mb-10">
          <div className="w-[2px] bg-gradient-to-b from-[#DFBA73] via-[#DFBA73]/50 to-transparent rounded-full flex-shrink-0" />
          <div className="pl-5">
            <span className="font-mono text-[8px] uppercase tracking-[0.45em] text-[#DFBA73] block mb-3">
              Curated Boards
            </span>
            <h2 className="font-display text-3xl text-[#FAF9F6] leading-[1.05] tracking-tight">
              Every aesthetic,
              <br />
              <span className="italic text-[#DFBA73]">sourced to a store.</span>
            </h2>
          </div>
        </div>

        {/* Snap-scroll track */}
        <div className="flex overflow-x-auto gap-5 pb-6 scroll-smooth snap-x snap-mandatory no-scrollbar select-none">
          {BOARDS.map((board) => (
            <div
              key={`mob-${board.num}`}
              className="w-[80vw] h-[55vh] shrink-0 snap-center group relative rounded-2xl overflow-hidden border border-[#FAF9F6]/[0.06] bg-[#121215]"
            >
              {/* Image */}
              <img
                src={board.img}
                alt={board.title}
                className="board-image absolute top-[-10%] left-[-10%] w-[120%] h-[120%] object-cover scale-[1.15] grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/40 to-transparent" />

              {/* Tag */}
              <div className="absolute top-4 left-4 z-10">
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#DFBA73] bg-[#020202]/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/[0.05]">
                  {board.tag}
                </span>
              </div>

              {/* Giant number */}
              <span
                className="absolute -bottom-4 -left-4 text-[7rem] font-display italic text-white/[0.05] leading-none pointer-events-none select-none z-10"
                aria-hidden="true"
              >
                {board.num}
              </span>

              {/* Bottom content */}
              <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-[#DFBA73]/60 block mb-1.5">
                  Board {board.num}
                </span>
                <h3 className="font-display text-xl text-[#FAF9F6] mb-1">
                  {board.title}
                </h3>
                <p className="text-[11px] text-[#8E8E93] font-light">
                  {board.subtitle}
                </p>
              </div>
            </div>
          ))}

          {/* End CTA card */}
          <div className="w-[80vw] h-[55vh] shrink-0 snap-center flex items-center justify-center rounded-2xl border border-[#FAF9F6]/[0.06] bg-[#121215]">
            <button className="flex flex-col items-center gap-3 px-8 py-5 rounded-full border border-[#DFBA73]/30 hover:bg-[#DFBA73]/10 transition-colors duration-300">
              <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-[#DFBA73]">
                Explore All Boards
              </span>
              <span className="text-[#FAF9F6]">→</span>
            </button>
          </div>
        </div>

        {/* Scroll dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {BOARDS.map((_, i) => (
            <div
              key={`dot-${i}`}
              className={`w-1.5 h-1.5 rounded-full ${
                i === 0 ? "bg-[#DFBA73]" : "bg-[#FAF9F6]/15"
              }`}
            />
          ))}
          <div className="w-1.5 h-1.5 rounded-full bg-[#FAF9F6]/15" />
        </div>
      </div>
    </div>
  );
}
