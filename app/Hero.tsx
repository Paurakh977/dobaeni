"use client";

import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from "framer-motion";
import { useRef } from "react";
import InkReveal from "./InkReveal";

const AESTHETICS = [
  "Old Money",
  "Clean Girl",
  "Y2K",
  "Streetwear",
  "Coquette",
  "Minimalist",
  "Korean",
  "Vintage",
];

interface HeroProps {
  isIntro?: boolean;
}

// Premium luxury ease-out — a touch softer than the old curve.
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const radius = 240;

export default function Hero({ isIntro = false }: HeroProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // ─── Scroll-linked outro parallax (multi-layer) ────────────────────────────
  const fade = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const rise = useTransform(scrollYProgress, [0, 1], ["0%", "-26%"]);
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);
  const titleScale = useTransform(scrollYProgress, [0, 1], [1, 1.16]);
  const titleBlur = useTransform(scrollYProgress, [0, 1], [0, 16]);
  const titleFilter = useMotionTemplate`blur(${titleBlur}px)`;
  const orbitScale = useTransform(scrollYProgress, [0, 1], [1, 1.5]);
  const orbitOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const bgGlow1Y = useTransform(scrollYProgress, [0, 1], ["0%", "45%"]);
  const bgGlow2Y = useTransform(scrollYProgress, [0, 1], ["0%", "-35%"]);
  const watermarkY = useTransform(scrollYProgress, [0, 1], ["12%", "-46%"]);
  const watermarkX = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);
  const watermarkOpacity = useTransform(scrollYProgress, [0, 0.7], [0.5, 0]);
  const footerFade = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const footerY = useTransform(scrollYProgress, [0, 0.35], ["0%", "40%"]);

  // ─── Pointer parallax (entrance + ambient life) ────────────────────────────
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 15, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 60, damping: 15, mass: 0.4 });
  const titleParallaxX = useTransform(sx, [-0.5, 0.5], ["-14px", "14px"]);
  const titleParallaxY = useTransform(sy, [-0.5, 0.5], ["-10px", "10px"]);
  const orbitRotate = useTransform(sx, [-0.5, 0.5], [-12, 12]);

  // Cursor-tracking spotlight
  const spotX = useTransform(sx, [-0.5, 0.5], ["25%", "75%"]);
  const spotY = useTransform(sy, [-0.5, 0.5], ["20%", "80%"]);
  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${spotX} ${spotY}, rgba(223,186,115,0.10), transparent 60%)`;
  const spotlightOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const handleHeroMove = (e: React.MouseEvent) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const resetHero = () => {
    mx.set(0);
    my.set(0);
  };

  // ─── Entrance variants ──────────────────────────────────────────────────────
  const containerVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.09, delayChildren: 0.15 },
    },
  };

  // Retained the cinematic text reveal as requested
  const maskRevealVariants = {
    hidden: { y: "118%", rotate: 4, filter: "blur(18px)", scale: 0.92 },
    show: {
      y: 0,
      rotate: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: { duration: 1.6, ease: EASE },
    },
  };

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 22, filter: "blur(8px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 1.1, ease: EASE },
    },
  };

  const orbitEntranceVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: 1.9, ease: EASE, delay: 0.45 },
    },
  };

  return (
    <section
      ref={sectionRef}
      data-cursor="reveal"
      data-cursor-text="DISCOVER"
      onMouseMove={handleHeroMove}
      onMouseLeave={resetHero}
      className="relative min-h-[100svh] flex flex-col justify-between overflow-hidden border-b border-[#FAF9F6]/5 bg-[#08080a]"
    >
      {/* Hidden "discovery" visual — revealed by the ink wipe */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 44%, rgba(223,186,115,0.22) 0%, rgba(223,186,115,0.05) 38%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-screen"
          style={{
            backgroundImage:
              "radial-gradient(rgba(250,249,246,0.6) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>

      {/* Ink-reveal mask — wipes the darkness to unveil the layer above */}
      <InkReveal maskColor={[8, 8, 10]} className="!z-[2]" />

      {/* Ambient glow + cursor spotlight + watermark (always-visible wash) */}
      <div className="absolute inset-0 z-[3] pointer-events-none">
        {/* Minimal golden gradient effect at top left */}
        <motion.div
          style={{ y: bgGlow1Y }}
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-[#DFBA73]/25 blur-[90px] mix-blend-screen"
        />
        <motion.div
          style={{ y: bgGlow2Y }}
          className="absolute bottom-[-15%] right-[-5%] w-[50%] h-[50%] rounded-full bg-[#DFBA73]/[0.04] blur-[150px]"
        />
        <motion.div
          style={{ backgroundImage: spotlight, opacity: spotlightOpacity }}
          className="absolute inset-0"
        />
        <motion.div
          style={{
            y: watermarkY,
            x: watermarkX,
            opacity: watermarkOpacity,
          }}
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
        >
          <span className="font-display italic text-[34vw] leading-none text-stroke-gold select-none">
            Aesthetic
          </span>
        </motion.div>
      </div>

      {/* Foreground content */}
      <motion.div
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 mt-8 pb-[16vh] md:pb-[9vh] pointer-events-none"
        style={{ opacity: fade }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isIntro ? "show" : "hidden"}
          className="flex flex-col items-center justify-center w-full"
        >
          <div className="overflow-hidden mb-5">
            <motion.span
              variants={maskRevealVariants}
              className="block font-mono text-[10px] md:text-xs uppercase tracking-[0.65em] text-[#DFBA73]"
            >
              Visual Commerce — Nepal
            </motion.span>
          </div>

          <motion.div
            style={{ y: rise }}
            className="relative flex items-center justify-center w-full max-w-4xl py-6"
          >
            <motion.div
              style={{ x: titleParallaxX, y: titleParallaxY }}
              className="relative flex flex-col items-center w-full max-w-4xl"
            >
              <div className="relative flex flex-col items-center">
                {/* Desktop Orbiting Signature Element — centred on the title */}
                <motion.div
                  variants={orbitEntranceVariants}
                  className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none z-0"
                >
                  <motion.div
                    style={{
                      rotate: orbitRotate,
                      scale: orbitScale,
                      opacity: orbitOpacity,
                    }}
                    className="relative"
                  >
                      <div
                        style={{ width: radius * 2, height: radius * 2 }}
                        className="relative"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 75, repeat: Infinity, ease: "linear" }}
                          className="w-full h-full relative border border-[#FAF9F6]/10 rounded-full"
                        >
                          {AESTHETICS.map((tag, i) => {
                            const angle = (i / AESTHETICS.length) * Math.PI * 2;
                            const x = radius + radius * Math.cos(angle);
                            const y = radius + radius * Math.sin(angle);
                            return (
                              <motion.div
                                key={tag}
                                animate={{ rotate: -360 }}
                                transition={{ duration: 75, repeat: Infinity, ease: "linear" }}
                                className="absolute font-mono text-[9px] uppercase tracking-[0.2em] text-[#FAF9F6]/45 whitespace-nowrap"
                                style={{
                                  left: x,
                                  top: y,
                                  translateX: "-50%",
                                  translateY: "-50%",
                                }}
                              >
                                {tag}
                              </motion.div>
                            );
                          })}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#DFBA73] shadow-[0_0_15px_#DFBA73]" />
                        </motion.div>
                      </div>
                  </motion.div>
                </motion.div>

                <motion.h1
                  style={{ y: titleY, scale: titleScale, filter: titleFilter }}
                  className="text-center relative z-10 pointer-events-none select-none hero-title"
                >
                <div className="overflow-hidden py-1 md:py-2">
                  <motion.span
                    variants={maskRevealVariants}
                    className="block font-display font-light text-[14vw] md:text-[6.8vw] leading-[0.9] tracking-tight text-[#FAF9F6]"
                  >
                    Discover Your
                  </motion.span>
                </div>
                <div className="overflow-hidden py-1 md:py-2">
                  <motion.span
                    variants={maskRevealVariants}
                    className="block font-display italic font-light text-[14vw] md:text-[6.8vw] leading-[0.9] tracking-tight text-[#DFBA73]"
                  >
                    Aesthetics.
                  </motion.span>
                </div>
              </motion.h1>
              </div>
            </motion.div>
          </motion.div>

          {/* Mobile aesthetic scroll tags */}
          <motion.div
            variants={fadeUpVariants}
            className="md:hidden mt-10 flex gap-2 overflow-x-auto max-w-full px-4 pb-1 no-scrollbar z-10"
          >
            {AESTHETICS.slice(0, 6).map((tag) => (
              <span
                key={tag}
                className="shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-[#FAF9F6]/60 border border-[#FAF9F6]/10 rounded-full px-4 py-2 bg-[#121215]/50 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Hero Footer Info */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.6 },
          },
        }}
        initial="hidden"
        animate={isIntro ? "show" : "hidden"}
        style={{ opacity: footerFade, y: footerY }}
        className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-6 md:px-12 pb-12 w-full pointer-events-none"
      >
        <motion.div
          variants={fadeUpVariants}
          className="flex items-center gap-3 font-mono text-[10px] tracking-[0.25em] text-[#FAF9F6]/50 uppercase"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#DFBA73] animate-pulse" />
          Scroll to explore
        </motion.div>
        <motion.p
          variants={fadeUpVariants}
          className="max-w-sm text-[13px] md:text-sm text-[#FAF9F6]/60 font-light leading-relaxed md:text-right"
        >
          A feed built on taste, not algorithms. Save what moves you.
          <br />
          <span className="text-[#FAF9F6] font-normal">Buy it without leaving the scroll.</span>
        </motion.p>
      </motion.div>
    </section>
  );
}
