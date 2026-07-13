"use client";

import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionTemplate,
  useReducedMotion,
} from "framer-motion";
import { useRef } from "react";
import Magnetic from "./Magnetic";

/* ─── Copy ────────────────────────────────────────────────────────── */
const HEADLINE = "We don't sell products. We curate identity.";
const PARAGRAPH =
  "Dobaeni is where aesthetics meet commerce. A space built for people who don't follow trends — they set them.";
const TAGLINE = "Built in Nepal — For the world";

const HEADLINE_ACCENTS = ["products.", "identity."];
const PARAGRAPH_ACCENTS = ["aesthetics", "commerce.", "trends", "set"];

/* ─── Easing ──────────────────────────────────────────────────────── */
const EASE_ENTER: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ═══════════════════════════════════════════════════════════════════ */
/*  ScrollWord — reveals, then a gold rule draws under emphasised words */
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
  const color = useTransform(progress, range, ["rgba(250, 249, 246, 0.08)", isAccent ? "#DFBA73" : "#FAF9F6"]);
  const underline = useTransform(progress, [range[1], Math.min(range[1] + 0.08, 1)], [0, 1]);

  return (
    <motion.span
      style={{ opacity, color, scale, display: "inline-block" }}
      className={`relative mr-[0.22em] will-change-[opacity,transform,color] font-display ${
        isAccent ? "italic" : ""
      }`}
    >
      {children}
      {isAccent && (
        <motion.span
          aria-hidden="true"
          style={{ scaleX: underline }}
          className="absolute left-0 -bottom-1 h-[1.5px] w-full bg-[#DFBA73] origin-left"
        />
      )}
    </motion.span>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Shimmer Button — foil-catch sweep on hover                        */
/* ═══════════════════════════════════════════════════════════════════ */
function ShimmerButton({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "solid" | "outline";
}) {
  const base =
    "relative overflow-hidden px-8 py-4 rounded-full font-mono text-[10px] uppercase tracking-[0.25em] transition-colors duration-300";
  const solid = "bg-[#DFBA73] text-[#08080a] font-extrabold hover:bg-[#F0E2C3]";
  const outline = "border border-[#FAF9F6]/20 text-[#FAF9F6] hover:bg-[#FAF9F6]/[0.06]";
  const sweep = variant === "solid" ? "via-white/50" : "via-[#DFBA73]/25";

  return (
    <button data-cursor="stick" className={`${base} ${variant === "solid" ? solid : outline} group`}>
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden="true"
        className={`absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent ${sweep} to-transparent`}
      />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  ManifestoSection                                                  */
/* ═══════════════════════════════════════════════════════════════════ */
export default function ManifestoSection() {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  /* Narrow window — paces the word-by-word reveal */
  const { scrollYProgress: revealProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.3"],
  });

  /* Full pass-through — drives ambient parallax, depth blur and the outro */
  const { scrollYProgress: fullProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const watermarkY = useTransform(fullProgress, [0, 1], ["15%", "-15%"]);
  const watermarkBlurVal = useTransform(fullProgress, [0, 0.5, 1], [2, 0, 3]);
  const watermarkFilter = useMotionTemplate`blur(${watermarkBlurVal}px)`;

  const rotateX = useTransform(fullProgress, [0, 0.5, 1], [5, 0, -5]);
  const glowY = useTransform(fullProgress, [0, 1], ["-10%", "25%"]);
  const quoteY = useTransform(fullProgress, [0, 1], ["12%", "-28%"]);

  const outroOpacityRaw = useTransform(fullProgress, [0.82, 1], [1, 0.55]);
  const outroScaleRaw = useTransform(fullProgress, [0.82, 1], [1, 0.93]);
  const outroBlurValRaw = useTransform(fullProgress, [0.82, 1], [0, 6]);
  const outroOpacity = useSpring(outroOpacityRaw, { stiffness: 110, damping: 30 });
  const outroScale = useSpring(outroScaleRaw, { stiffness: 110, damping: 30 });
  const outroBlurVal = useSpring(outroBlurValRaw, { stiffness: 110, damping: 30 });
  const outroFilter = useMotionTemplate`blur(${shouldReduceMotion ? 0 : outroBlurVal}px)`;

  const headlineWords = HEADLINE.split(" ");
  const paragraphWords = PARAGRAPH.split(" ");

  return (
    <section
      ref={containerRef}
      className="relative py-36 md:py-56 overflow-hidden bg-[#08080a] border-t border-[#FAF9F6]/5"
    >
      {/* ── Ambient Background ─────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div
          style={{ y: glowY }}
          className="absolute top-[18%] left-[50%] -translate-x-1/2 w-[75%] h-[70%] rounded-full bg-[#DFBA73]/[0.015] blur-[160px]"
        />
        <motion.div
          style={{ y: glowY }}
          className="absolute top-[40%] left-[68%] -translate-x-1/2 w-[40%] h-[45%] rounded-full bg-[#DFBA73]/[0.012] blur-[120px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(8,8,10,0.82),rgba(8,8,10,0.82))]" />
      </div>

      {/* ── Paper Grain (manuscript texture) ───────────────────────── */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <filter id="manifesto-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.06 0" />
        </filter>
      </svg>
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1] opacity-[0.5] mix-blend-overlay pointer-events-none"
        style={{ filter: "url(#manifesto-grain)" }}
      />

      {/* ── Giant Watermark ────────────────────────────────────────── */}
      <motion.div
        style={{ y: watermarkY, filter: shouldReduceMotion ? undefined : watermarkFilter }}
        className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        <span
          className="text-[18vw] font-display uppercase text-transparent leading-none whitespace-nowrap"
          style={{ WebkitTextStroke: "1px rgba(223, 186, 115, 0.06)" }}
        >
          MANIFESTO
        </span>
      </motion.div>

      {/* ── Horizontal Line Wipe ───────────────────────────────────── */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.4, ease: EASE_ENTER }}
        className="absolute top-0 left-0 w-full h-px bg-[#DFBA73] origin-left z-10"
      />

      {/* ── Main Content ────────────────────────────────────────────── */}
      <div className="relative z-10" style={{ perspective: "1200px" }}>
        <motion.div
          style={{
            rotateX: shouldReduceMotion ? 0 : rotateX,
            opacity: outroOpacity,
            scale: outroScale,
            filter: outroFilter,
          }}
          className="flex flex-col items-center text-center px-6 max-w-5xl mx-auto will-change-transform"
        >
          {/* Label */}
          <span className="font-mono text-[9px] uppercase tracking-[0.65em] text-[#DFBA73] mb-14">
            § Our Manifesto
          </span>

          {/* Decorative Opening Quote */}
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 1.2, ease: EASE_ENTER }}
            style={{ y: quoteY }}
            className="self-start ml-2 md:ml-8 text-[6rem] md:text-[10rem] text-[#DFBA73]/10 font-display italic leading-none select-none -mb-16 md:-mb-24 pointer-events-none"
            aria-hidden="true"
          >
            &ldquo;
          </motion.span>

          {/* Scroll-bound Headline with drawn underlines */}
          <h2 className="text-4xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight max-w-4xl select-none mb-4">
            {headlineWords.map((word, i) => {
              const start = (i / headlineWords.length) * 0.4;
              const end = start + 0.15;
              const isAccent = HEADLINE_ACCENTS.some((a) => word.toLowerCase() === a.toLowerCase());
              return (
                <ScrollWord key={`hw-${i}`} progress={revealProgress} range={[start, end]} isAccent={isAccent}>
                  {word}
                </ScrollWord>
              );
            })}
          </h2>

          {/* Decorative Closing Quote */}
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 1.2, delay: 0.15, ease: EASE_ENTER }}
            style={{ y: quoteY }}
            className="self-end mr-2 md:mr-8 text-[6rem] md:text-[10rem] text-[#DFBA73]/10 font-display italic leading-none select-none -mt-12 md:-mt-20 mb-10 pointer-events-none"
            aria-hidden="true"
          >
            &rdquo;
          </motion.span>

          {/* Animated Dot Separator */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.6 }}
            className="w-2 h-2 rounded-full bg-[#DFBA73] mb-12"
          />

          {/* Scroll-bound Paragraph */}
          <p className="text-base md:text-xl lg:text-2xl text-[#8E8E93] font-light max-w-2xl leading-relaxed select-none mb-20">
            {paragraphWords.map((word, i) => {
              const delayOffset = 0.45;
              const start = delayOffset + (i / paragraphWords.length) * 0.45;
              const end = start + 0.1;
              const isAccent = PARAGRAPH_ACCENTS.some((a) => word.toLowerCase() === a.toLowerCase());
              return (
                <ScrollWord key={`pw-${i}`} progress={revealProgress} range={[start, end]} isAccent={isAccent}>
                  {word}
                </ScrollWord>
              );
            })}
          </p>

          {/* Staggered Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <motion.div
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1, delay: 0.1, ease: EASE_ENTER }}
            >
              <Magnetic>
                <ShimmerButton variant="solid">Start Discovering</ShimmerButton>
              </Magnetic>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1, delay: 0.25, ease: EASE_ENTER }}
            >
              <Magnetic>
                <ShimmerButton variant="outline">Partner With Us</ShimmerButton>
              </Magnetic>
            </motion.div>
          </div>

          {/* Bottom Tagline — clip-path wipe reveal */}
          <div className="mt-28 md:mt-36 flex items-center gap-6">
            <motion.span
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 1, ease: EASE_ENTER }}
              className="w-10 h-px bg-[#DFBA73]/30 origin-right"
            />

            <motion.span
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              whileInView={{ clipPath: "inset(0 0% 0 0)" }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 1.1, delay: 0.15, ease: EASE_ENTER }}
              className="font-mono text-[8px] uppercase tracking-[0.45em] text-[#8E8E93]/50 inline-block"
            >
              {TAGLINE}
            </motion.span>

            <motion.span
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 1, delay: 0.3, ease: EASE_ENTER }}
              className="w-10 h-px bg-[#DFBA73]/30 origin-left"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}