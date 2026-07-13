"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import gsap from "gsap";
import Image from "next/image";

const WORD = "DOBAENI";

// Premium cubic-bezier for luxury transitions
const PREMIUM_EASE = [0.76, 0, 0.24, 1] as const;
// Total duration for the preloader counter before triggering exit
const COUNTER_DURATION_MS = 2000;
// Delay after counter hits 100% before exit animation begins
const EXIT_DELAY_MS = 500;

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");
  const lettersRef = useRef<HTMLSpanElement[]>([]);
  const lineRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLParagraphElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const gsapTlRef = useRef<gsap.core.Timeline | null>(null);

  // ─── 1. Counter logic ────────────────────────────────────────────────────
  useEffect(() => {
    let start = 0;
    const intervalTime = 16;
    const increment = 100 / (COUNTER_DURATION_MS / intervalTime);

    const timer = setInterval(() => {
      start += increment;
      if (start >= 100) {
        setProgress(100);
        clearInterval(timer);
        // Hold briefly at 100% so the user sees it, then trigger exit
        setTimeout(() => setPhase("exit"), EXIT_DELAY_MS);
      } else {
        setProgress(Math.floor(start));
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // ─── 2. GSAP intro timeline (runs once on mount) ─────────────────────────
  useEffect(() => {
    // Ensure elements are visible before GSAP animates them
    // (They start at opacity 0 via inline style, GSAP will reveal them)
    const tl = gsap.timeline({ delay: 0.15 });
    gsapTlRef.current = tl;

    tl.fromTo(
      markRef.current,
      { opacity: 0, scale: 0.8, rotate: -8, y: 12 },
      { opacity: 1, scale: 1, rotate: 0, y: 0, duration: 0.75, ease: "power3.out" }
    )
      .fromTo(
        lettersRef.current,
        { yPercent: 120, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power4.out",
          stagger: { amount: 0.28, from: "start" },
        },
        "-=0.4"
      )
      .fromTo(
        lineRef.current,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.9, ease: "power2.inOut", transformOrigin: "left center" },
        "-=0.25"
      )
      .fromTo(
        tagRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
        "-=0.5"
      );

    return () => {
      tl.kill();
    };
  }, []);

  // ─── 3. GSAP exit: scatter letters + dissolve elements ────────────────────
  useEffect(() => {
    if (phase !== "exit") return;

    const tl = gsap.timeline();

    // Scatter each letter with different directions for an organic feel
    const scatterDirections = [
      { x: -40, y: -60, rotate: -15 },
      { x: -20, y: -80, rotate: 8 },
      { x: 10, y: -70, rotate: -5 },
      { x: 0, y: -90, rotate: 12 },
      { x: -15, y: -65, rotate: -10 },
      { x: 25, y: -75, rotate: 6 },
      { x: 40, y: -55, rotate: -8 },
    ];

    // Letters scatter outward with stagger
    lettersRef.current.forEach((letter, i) => {
      if (!letter) return;
      const dir = scatterDirections[i % scatterDirections.length];
      tl.to(
        letter,
        {
          y: dir.y,
          x: dir.x,
          rotate: dir.rotate,
          opacity: 0,
          scale: 0.7,
          filter: "blur(6px)",
          duration: 0.55,
          ease: "power3.in",
        },
        i * 0.04 // staggered start
      );
    });

    // Fade out the decorative line by collapsing it
    tl.to(
      lineRef.current,
      {
        scaleX: 0,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
        transformOrigin: "center center",
      },
      0.05
    );

    // Tagline dissolves
    tl.to(
      tagRef.current,
      {
        y: -20,
        opacity: 0,
        filter: "blur(4px)",
        duration: 0.4,
        ease: "power2.in",
      },
      0.08
    );

    // Logo scales up and dissolves
    tl.to(
      markRef.current,
      {
        scale: 1.3,
        opacity: 0,
        filter: "blur(8px)",
        duration: 0.5,
        ease: "power2.in",
      },
      0.02
    );

    return () => {
      tl.kill();
    };
  }, [phase]);

  // ─── 4. Framer variants with fluid liquid exit ────────────────────────────

  // The main panel: slides up with scale + blur for cinematic exit
  const panelVariants = {
    initial: { y: "0%", scale: 1 },
    exit: {
      y: "-100%",
      scale: 1.05,
      transition: {
        y: {
          duration: 1.2,
          ease: PREMIUM_EASE,
          delay: 0.35, // wait for letters to scatter first
        },
        scale: {
          duration: 1.2,
          ease: PREMIUM_EASE,
          delay: 0.35,
        },
      },
    },
  };

  // Ticker (counter) fades out first, independently
  const tickerVariants = {
    initial: { opacity: 1, y: 0 },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3, ease: [0.4, 0, 1, 1], delay: 0 },
    },
  };

  // The liquid SVG wave — morphs through multiple organic shapes
  // for a truly fluid "dripping away" feel
  const pathVariants = {
    initial: {
      d: "M 0 0 L 100 0 L 100 100 Q 50 100 0 100 Z",
    },
    exit: {
      d: [
        // Stage 0: flat baseline
        "M 0 0 L 100 0 L 100 100 Q 50 100 0 100 Z",
        // Stage 1: initial bulge — liquid starts to drip
        "M 0 0 L 100 0 L 100 100 Q 50 118 0 100 Z",
        // Stage 2: deeper liquid pull — more dramatic drip
        "M 0 0 L 100 0 L 100 100 Q 50 130 0 100 Z",
        // Stage 3: snap back overshoot — elastic rebound
        "M 0 0 L 100 0 L 100 100 Q 50 88 0 100 Z",
        // Stage 4: settle to flat
        "M 0 0 L 100 0 L 100 100 Q 50 100 0 100 Z",
      ],
      transition: {
        duration: 1.2,
        times: [0, 0.2, 0.45, 0.72, 1],
        ease: PREMIUM_EASE,
        delay: 0.35,
      },
    },
  };

  // Gold glow pulse that appears during exit
  const glowVariants = {
    initial: { opacity: 0, scale: 0.8 },
    exit: {
      opacity: [0, 0.5, 0],
      scale: [0.8, 1.6, 2.2],
      transition: {
        duration: 1.0,
        ease: "easeOut",
        delay: 0.1,
      },
    },
  };

  return (
    <motion.div
      variants={panelVariants}
      initial="initial"
      animate={phase === "exit" ? "exit" : "initial"}
      onAnimationComplete={(definition) => {
        // Only call onComplete when the full panel exit animation finishes
        if (definition === "exit") {
          onComplete();
        }
      }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center select-none overflow-hidden"
      style={{ backgroundColor: "#003134" }}
    >
      {/* ── Elastic liquid SVG wave at bottom ── */}
      <svg
        className="absolute top-0 left-0 w-full h-[calc(100%+200px)] pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <motion.path
          variants={pathVariants}
          initial="initial"
          animate={phase === "exit" ? "exit" : "initial"}
          fill="#003134"
        />
      </svg>

      {/* ── Subtle background texture / gradient ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(201,162,75,0.07) 0%, transparent 70%)",
        }}
      />

      {/* ── Gold glow burst on exit ── */}
      <motion.div
        variants={glowVariants}
        initial="initial"
        animate={phase === "exit" ? "exit" : "initial"}
        className="absolute inset-0 pointer-events-none z-[5]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(201,162,75,0.25) 0%, rgba(201,162,75,0.05) 40%, transparent 70%)",
        }}
      />

      {/* ── Loading ticker (bottom-right) ── */}
      <motion.div
        variants={tickerVariants}
        initial="initial"
        animate={phase === "exit" ? "exit" : "initial"}
        className="absolute bottom-10 right-8 md:bottom-12 md:right-12 font-mono text-[10px] tracking-[0.25em]"
        style={{ color: "#c9a24b" }}
      >
        LDR // {String(progress).padStart(3, "0")}%
      </motion.div>

      {/* ── Core content: logo + wordmark + line + tagline ── */}
      <div
        ref={contentRef}
        className="relative z-10 flex flex-col items-center pointer-events-none"
      >
        {/* Logo mark */}
        <div
          ref={markRef}
          className="w-16 h-16 md:w-20 md:h-20 relative mb-8"
          style={{ opacity: 0 }} // GSAP controls visibility
        >
          <Image
            src="/logo.png"
            alt="Dobaeni"
            fill
            sizes="80px"
            className="object-contain"
            priority
          />
        </div>

        {/* Wordmark letters */}
        <div className="overflow-hidden flex" aria-label={WORD}>
          {WORD.split("").map((char, i) => (
            <span
              key={i}
              ref={(el) => {
                if (el) lettersRef.current[i] = el;
              }}
              className="inline-block font-display text-[13vw] md:text-[7vw] leading-[0.9] tracking-[0.02em] font-light"
              style={{ color: "#f4efe4", opacity: 0 }} // GSAP controls visibility
            >
              {char}
            </span>
          ))}
        </div>

        {/* Decorative line */}
        <div
          ref={lineRef}
          className="h-px w-40 md:w-56 mt-6"
          style={{ backgroundColor: "#c9a24b", opacity: 0, transformOrigin: "left center" }}
        />

        {/* Tagline */}
        <p
          ref={tagRef}
          className="mt-5 font-mono text-[9px] md:text-xs uppercase tracking-[0.45em]"
          style={{ color: "#c9a24b", opacity: 0 }}
        >
          Discover Your Aesthetic
        </p>
      </div>
    </motion.div>
  );
}