"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Drives the whole page with Lenis and ties its RAF loop into
 * GSAP's ticker so both stay perfectly in sync (no double rAF,
 * no jitter between scroll-linked GSAP work and Lenis easing).
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t: number) => Math.min(1, 1 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.05,
      touchMultiplier: 2,
    });
    lenisRef.current = lenis;

    // Sync Lenis scroll with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Pause Lenis while a modal (e.g. chat) is open so wheel/touch inside
    // it doesn't drive the page behind.
    const stop = () => lenis.stop();
    const start = () => lenis.start();
    window.addEventListener('lenis:stop', stop);
    window.addEventListener('lenis:start', start);

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // Refresh ScrollTrigger to ensure correct calculations after initial render
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    // Create an observer to refresh ScrollTrigger when DOM changes
    const resizeObserver = new ResizeObserver(() => {
      ScrollTrigger.refresh();
    });
    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('lenis:stop', stop);
      window.removeEventListener('lenis:start', start);
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}