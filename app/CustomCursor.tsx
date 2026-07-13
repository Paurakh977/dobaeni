"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

type Variant = "default" | "hover" | "text" | "stick";

export default function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  // Custom springs tuned for a ultra-premium smooth yet responsive trail
  const sx = useSpring(x, { stiffness: 450, damping: 35, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 450, damping: 35, mass: 0.35 });

  const [variant, setVariant] = useState<Variant>("default");
  const [label, setLabel] = useState("");
  const [visible, setVisible] = useState(false);
  const [activeStickEl, setActiveStickEl] = useState<HTMLElement | null>(null);

  // Use refs to keep track of mouse coordinates in scroll handlers
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const updatePosition = (clientX: number, clientY: number) => {
      if (activeStickEl) {
        const rect = activeStickEl.getBoundingClientRect();
        // Snaps directly to the visual center of the hovered element
        x.set(rect.left + rect.width / 2);
        y.set(rect.top + rect.height / 2);
      } else {
        x.set(clientX);
        y.set(clientY);
      }
    };

    const move = (e: MouseEvent) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      updatePosition(e.clientX, e.clientY);
      if (!visible) setVisible(true);
    };

    const handleScroll = () => {
      // Recalculates snap coordinate during scroll to prevent the cursor from detached lag
      updatePosition(lastMousePos.current.x, lastMousePos.current.y);
    };

    const over = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const textEl = target.closest("[data-cursor='text']");
      const stickEl = target.closest("[data-cursor='stick']");

      if (textEl) {
        setVariant("text");
        setLabel(textEl.getAttribute("data-cursor-text") || "VIEW");
        setActiveStickEl(null);
      } else if (stickEl) {
        setVariant("stick");
        setLabel("");
        setActiveStickEl(stickEl as HTMLElement);
      } else if (target.closest("a, button, [role='button']")) {
        setVariant("hover");
        setLabel("");
        setActiveStickEl(null);
      } else {
        setVariant("default");
        setLabel("");
        setActiveStickEl(null);
      }
    };

    const leave = () => setVisible(false);

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("scroll", handleScroll);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, [visible, activeStickEl, x, y]);

  const sizes: Record<Variant, number> = {
    default: 10,
    hover: 60,
    text: 96,
    stick: 70,
  };
  const size = sizes[variant];

  // We determine the active dimensions of the snapped stick element to frame it
  useEffect(() => {
    if (activeStickEl) {
      // Snapped frame size can dynamically match the button
    }
  }, [activeStickEl]);

  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 z-[9999] pointer-events-none hidden md:flex items-center justify-center rounded-full"
      style={{
        x: sx,
        y: sy,
        translateX: "-50%",
        translateY: "-50%",
        opacity: visible ? 1 : 0,
      }}
      animate={{
        width: size,
        height: size,
        backgroundColor: variant === "stick" ? "rgba(223, 186, 115, 0)" : "#DFBA73",
        border: variant === "stick" ? "1.5px solid #DFBA73" : "1.5px solid rgba(223, 186, 115, 0)",
        mixBlendMode: variant === "stick" ? "normal" : "difference",
      }}
      transition={{ type: "spring", stiffness: 450, damping: 30 }}
    >
      {variant === "text" && (
        <span className="font-mono text-[9px] tracking-[0.25em] text-[#08080a] font-black uppercase">
          {label}
        </span>
      )}
    </motion.div>
  );
}