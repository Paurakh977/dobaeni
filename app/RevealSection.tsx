"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useSpring, useMotionTemplate, useScroll, useTransform } from "framer-motion";

const IMAGES = [
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80",
];

export default function RevealSection() {
  const [active, setActive] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Raw coordinate motion values
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  // Smooth springs — tuned for a buttery yet responsive trail
  const smx = useSpring(mx, { stiffness: 180, damping: 28, mass: 0.5 });
  const smy = useSpring(my, { stiffness: 180, damping: 28, mass: 0.5 });

  // Spotlight radius: animates from 0 to full size on hover
  const spotlightRadius = useMotionValue(0);
  const smoothRadius = useSpring(spotlightRadius, { stiffness: 100, damping: 20, mass: 0.6 });

  // Center the spotlight by default when the section mounts
  useEffect(() => {
    if (sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect();
      mx.set(rect.width / 2);
      my.set(rect.height / 2);
    }
  }, [mx, my]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    mx.set(e.clientX - rect.left);
    my.set(e.clientY - rect.top);
  }, [mx, my]);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    setActive(true);
    // Jump coordinates to cursor position immediately to avoid spotlight
    // animating from center to cursor (which looks like a flash)
    if (sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect();
      const curX = e.clientX - rect.left;
      const curY = e.clientY - rect.top;
      // Set both raw and spring values immediately to prevent lag
      mx.set(curX);
      my.set(curY);
      smx.set(curX);
      smy.set(curY);
    }
    // Animate spotlight radius from 0 to full
    spotlightRadius.set(320);
  }, [mx, my, smx, smy, spotlightRadius]);

  const handleMouseLeave = useCallback(() => {
    setActive(false);
    // Smoothly shrink the spotlight to nothing
    spotlightRadius.set(0);
  }, [spotlightRadius]);

  // Build the mask using the animated radius so the spotlight
  // smoothly grows/shrinks on enter/leave
  const mask = useMotionTemplate`radial-gradient(${smoothRadius}px circle at ${smx}px ${smy}px, black 0%, black 35%, transparent 100%)`;

  // Framer Motion Parallax
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const baseImgY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const revealImgY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);

  return (
    <section
      ref={sectionRef}
      data-cursor="text"
      data-cursor-text="DECODE"
      className="relative h-[80vh] md:h-[90vh] flex items-center justify-center overflow-hidden bg-[#08080a] cursor-none select-none border-b border-[#FAF9F6]/5"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute top-8 left-6 md:left-12 z-30 flex items-center gap-2.5">
        <span
          className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
          style={{ backgroundColor: active ? "#DFBA73" : "#8E8E93" }}
        />
        <span className="font-mono text-[9px] uppercase tracking-[0.45em] text-[#8E8E93]">
          Moodboard — {active ? "Decoding" : "Locked"}
        </span>
      </div>

      {/* ── BASE LAYER ──
           Heavily obscured: very low opacity, grayscale, blurred.
           The text here is almost invisible (opacity 6%) to prevent
           the "already revealed" leak. */}
      <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full h-full p-6 md:p-12 opacity-[0.05] grayscale blur-[4px]">
          {IMAGES.map((src, i) => (
            <div
              key={`base-${i}`}
              className="relative w-full h-full overflow-hidden rounded-xl border border-white/5"
            >
              <motion.img style={{ y: baseImgY }} src={src} className="absolute top-[-15%] left-[-10%] w-[120%] h-[130%] object-cover" alt="" />
            </div>
          ))}
        </div>
        <motion.div style={{ y: textY }} className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h2 className="font-display text-4xl md:text-7xl leading-[0.95] tracking-tight text-[#FAF9F6]/[0.06]">
            Endless feeds.
            <br />
            Nowhere to buy.
          </h2>
        </motion.div>
      </div>

      {/* ── REVEALED LAYER ──
           This layer is only visible through the spotlight mask.
           Key fixes:
           - The motion.div background is solid #08080a so outside
             the mask circle it's identical to the section bg (invisible)
           - Inside the mask circle, the content (images + text) shows through
           - The mask gradient has a solid core (black 0%→35%) for full
             reveal at the cursor center, then feathers to transparent
           - Spotlight radius animates to 0 on leave, fully hiding content */}
      <motion.div
        className="absolute inset-0 z-20 w-full h-full pointer-events-none"
        style={{
          maskImage: mask,
          WebkitMaskImage: mask,
          // This background ensures non-masked areas match the section bg exactly
          backgroundColor: "#08080a",
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full h-full p-6 md:p-12 opacity-90">
          {IMAGES.map((src, i) => (
            <div
              key={`reveal-${i}`}
              className="relative w-full h-full overflow-hidden rounded-xl border border-[#DFBA73]/30 shadow-[0_0_20px_rgba(223,186,115,0.06)]"
            >
              <motion.img style={{ y: revealImgY }} src={src} className="absolute top-[-15%] left-[-10%] w-[120%] h-[130%] object-cover" alt="" />
              <div className="absolute inset-0 bg-[#08080a]/30" />
            </div>
          ))}
        </div>

        <motion.div style={{ y: textY }} className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          {/* Semi-transparent backdrop so text pops over images */}
          <div className="absolute inset-0 bg-[#08080a]/50" />
          <div className="relative z-10">
            <h2 className="font-display text-5xl md:text-8xl leading-[0.9] tracking-tight text-[#FAF9F6] mb-6">
              Save it.
              <br />
              <span className="italic text-[#DFBA73]">Find it. Wear it.</span>
            </h2>
            <p className="font-mono text-xs md:text-sm uppercase tracking-[0.35em] text-[#DFBA73] border-t border-[#DFBA73]/30 pt-6 inline-block font-bold">
              Every pin, sourced to a real store in Nepal.
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Soft gold glow that follows the cursor ── */}
      <motion.div
        className="absolute inset-0 z-[15] pointer-events-none"
        style={{
          background: useMotionTemplate`radial-gradient(${smoothRadius}px circle at ${smx}px ${smy}px, rgba(223,186,115,0.04) 0%, transparent 70%)`,
        }}
      />
    </section>
  );
}