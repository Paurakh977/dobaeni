"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Magnetic from "./Magnetic";

/* ─── Copy ────────────────────────────────────────────────────────── */
const HEADLINE = "We don't sell products. We curate identity.";
const PARAGRAPH =
  "Dobaeni is where aesthetics meet commerce. A space built for people who don't follow trends — they set them.";
const TAGLINE = "Built in Nepal — For the world";

/* ─── Accent words highlighted in gold ────────────────────────────── */
const HEADLINE_ACCENTS = ["products.", "identity."];
const PARAGRAPH_ACCENTS = ["aesthetics", "commerce.", "trends", "set"];

/* ─── Shared easing ───────────────────────────────────────────────── */
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ═══════════════════════════════════════════════════════════════════ */
/*  ScrollWord                                                        */
/* ═══════════════════════════════════════════════════════════════════ */
interface ScrollWordProps {
  children: string;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  range: [number, number];
  isAccent: boolean;
}

function ScrollWord({ children, progress, range, isAccent }: ScrollWordProps) {
  const opacity = useTransform(progress, range, [0.08, 1]);
  const scale = useTransform(progress, range, [0.97, 1]);
  const color = useTransform(
    progress,
    range,
    ["rgba(250, 249, 246, 0.08)", isAccent ? "#DFBA73" : "#FAF9F6"]
  );

  return (
    <motion.span
      style={{ opacity, color, scale, display: "inline-block" }}
      className={`mr-[0.22em] will-change-[opacity,transform,color] font-display ${
        isAccent ? "italic" : ""
      }`}
    >
      {children}
    </motion.span>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  ManifestoSection                                                  */
/* ═══════════════════════════════════════════════════════════════════ */
export default function ManifestoSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.3"],
  });

  /* ── Parallax for giant watermark ── */
  const watermarkY = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);

  /* ── 3D perspective rotateX driven by scroll ── */
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [4, 0, -4]);

  /* ── Ambient Glow Parallax ── */
  const glowY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const quoteY = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);

  /* ── Word arrays ── */
  const headlineWords = HEADLINE.split(" ");
  const paragraphWords = PARAGRAPH.split(" ");
  const taglineChars = TAGLINE.split("");

  return (
    <section
      ref={containerRef}
      className="relative py-36 md:py-56 overflow-hidden bg-[#08080a] border-t border-[#FAF9F6]/5"
    >
      {/* ── Ambient Background ─────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Primary centre glow */}
        <motion.div style={{ y: glowY }} className="absolute top-[18%] left-[50%] -translate-x-1/2 w-[75%] h-[70%] rounded-full bg-[#DFBA73]/[0.015] blur-[160px]" />
        {/* Secondary offset glow — right */}
        <motion.div style={{ y: glowY }} className="absolute top-[40%] left-[68%] -translate-x-1/2 w-[40%] h-[45%] rounded-full bg-[#DFBA73]/[0.012] blur-[120px]" />
        {/* Tint overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(8,8,10,0.82),rgba(8,8,10,0.82))]" />
      </div>

      {/* ── Giant Watermark ────────────────────────────────────────── */}
      <motion.div
        style={{ y: watermarkY }}
        className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        <span
          className="text-[18vw] font-display uppercase text-transparent leading-none whitespace-nowrap"
          style={{
            WebkitTextStroke: "1px rgba(223, 186, 115, 0.06)",
          }}
        >
          MANIFESTO
        </span>
      </motion.div>

      {/* ── Horizontal Line Wipe ───────────────────────────────────── */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.4, ease: EASE_OUT_EXPO }}
        className="absolute top-0 left-0 w-full h-px bg-[#DFBA73] origin-left z-10"
      />

      {/* ── Main Content (3D Perspective Wrapper) ──────────────────── */}
      <div className="relative z-10" style={{ perspective: "1200px" }}>
        <motion.div
          style={{ rotateX }}
          className="flex flex-col items-center text-center px-6 max-w-5xl mx-auto will-change-transform"
        >
          {/* Label */}
          <span className="font-mono text-[9px] uppercase tracking-[0.65em] text-[#DFBA73] mb-14">
            Our Manifesto
          </span>

          {/* ── Decorative Opening Quote ────────────────────────────── */}
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 1.2, ease: EASE_OUT_EXPO }}
            style={{ y: quoteY }}
            className="self-start ml-2 md:ml-8 text-[6rem] md:text-[10rem] text-[#DFBA73]/10 font-display italic leading-none select-none -mb-16 md:-mb-24 pointer-events-none"
            aria-hidden="true"
          >
            &ldquo;
          </motion.span>

          {/* ── Scroll-bound Headline ───────────────────────────────── */}
          <h2 className="text-4xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight max-w-4xl select-none mb-4">
            {headlineWords.map((word, i) => {
              const start = (i / headlineWords.length) * 0.4;
              const end = start + 0.15;
              const isAccent = HEADLINE_ACCENTS.some(
                (a) => word.toLowerCase() === a.toLowerCase()
              );
              return (
                <ScrollWord
                  key={`hw-${i}`}
                  progress={scrollYProgress}
                  range={[start, end]}
                  isAccent={isAccent}
                >
                  {word}
                </ScrollWord>
              );
            })}
          </h2>

          {/* ── Decorative Closing Quote ────────────────────────────── */}
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 1.2, delay: 0.15, ease: EASE_OUT_EXPO }}
            style={{ y: quoteY }}
            className="self-end mr-2 md:mr-8 text-[6rem] md:text-[10rem] text-[#DFBA73]/10 font-display italic leading-none select-none -mt-12 md:-mt-20 mb-10 pointer-events-none"
            aria-hidden="true"
          >
            &rdquo;
          </motion.span>

          {/* ── Animated Dot Separator ──────────────────────────────── */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}
            className="w-2 h-2 rounded-full bg-[#DFBA73] mb-12"
          />

          {/* ── Scroll-bound Paragraph ─────────────────────────────── */}
          <p className="text-base md:text-xl lg:text-2xl text-[#8E8E93] font-light max-w-2xl leading-relaxed select-none mb-20">
            {paragraphWords.map((word, i) => {
              const delayOffset = 0.45;
              const start = delayOffset + (i / paragraphWords.length) * 0.45;
              const end = start + 0.1;
              const isAccent = PARAGRAPH_ACCENTS.some(
                (a) => word.toLowerCase() === a.toLowerCase()
              );
              return (
                <ScrollWord
                  key={`pw-${i}`}
                  progress={scrollYProgress}
                  range={[start, end]}
                  isAccent={isAccent}
                >
                  {word}
                </ScrollWord>
              );
            })}
          </p>

          {/* ── Staggered Buttons ───────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <motion.div
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1, delay: 0.1, ease: EASE_OUT_EXPO }}
            >
              <Magnetic>
                <button
                  data-cursor="stick"
                  className="px-8 py-4 rounded-full bg-[#DFBA73] text-[#08080a] font-mono text-[10px] uppercase tracking-[0.25em] font-extrabold hover:bg-[#F0E2C3] transition-colors duration-300"
                >
                  Start Discovering
                </button>
              </Magnetic>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1, delay: 0.25, ease: EASE_OUT_EXPO }}
            >
              <Magnetic>
                <button
                  data-cursor="stick"
                  className="px-8 py-4 rounded-full border border-[#FAF9F6]/20 text-[#FAF9F6] font-mono text-[10px] uppercase tracking-[0.25em] hover:bg-[#FAF9F6]/[0.06] transition-colors duration-300"
                >
                  Partner With Us
                </button>
              </Magnetic>
            </motion.div>
          </div>

          {/* ── Bottom Tagline — Character-by-character reveal ──────── */}
          <div className="mt-28 md:mt-36 flex items-center gap-6">
            {/* Left gold line */}
            <motion.span
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 1, ease: EASE_OUT_EXPO }}
              className="w-10 h-px bg-[#DFBA73]/30 origin-right"
            />

            {/* Character stagger */}
            <span className="font-mono text-[8px] uppercase tracking-[0.45em] text-[#8E8E93]/40 flex">
              {taglineChars.map((char, index) => (
                <motion.span
                  key={`tc-${index}`}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.02,
                    ease: "easeOut",
                  }}
                  className="inline-block"
                  style={{ whiteSpace: "pre" }}
                >
                  {char}
                </motion.span>
              ))}
            </span>

            {/* Right gold line */}
            <motion.span
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 1, delay: 0.3, ease: EASE_OUT_EXPO }}
              className="w-10 h-px bg-[#DFBA73]/30 origin-left"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
