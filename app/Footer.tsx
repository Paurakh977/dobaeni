"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Magnetic from "./Magnetic";

const CITIES = ["Kathmandu", "Pokhara", "Lalitpur", "Bhaktapur", "Butwal", "Chitwan"];

const SOCIALS = [
  { name: "Instagram", href: "#" },
  { name: "TikTok", href: "#" },
  { name: "Twitter", href: "#" },
  { name: "Pinterest", href: "#" },
];

export default function Footer() {
  const [time, setTime] = useState("");

  // Live Kathmandu time clock (UTC +5:45)
  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kathmandu",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      const formatter = new Intl.DateTimeFormat("en-US", options);
      setTime(formatter.format(new Date()));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const giantWord = "DOBAENI";

  return (
    <footer
      className="relative pt-24 pb-8 overflow-hidden bg-[#08080a]"
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-[#DFBA73]/20 to-transparent" />
      </div>

      <div className="relative z-10 px-6 md:px-12">
        {/* Top row: brand details + newsletter + nav */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20 md:mb-28">
          
          {/* Brand details + Newsletter */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-10">
            <div>
              <Magnetic>
                <div className="flex items-center gap-3 mb-5 cursor-pointer" data-cursor="stick">
                  <div className="relative w-8 h-8">
                    <Image
                      src="/logo.png"
                      alt="Dobaeni"
                      fill
                      sizes="32px"
                      className="object-contain"
                    />
                  </div>
                  <span className="font-display text-2xl tracking-wide text-[#FAF9F6]">
                    Dobaeni
                  </span>
                </div>
              </Magnetic>
              <p className="text-sm text-[#8E8E93] font-light max-w-xs leading-relaxed">
                Visual commerce for the aesthetically minded.
                <br />
                Discover your aesthetic. Buy it in the scroll.
              </p>
            </div>

            {/* Newsletter signup form */}
            <div className="max-w-md w-full">
              <h5 className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#DFBA73] mb-4">
                Subscribe to taste
              </h5>
              <div className="relative flex items-center border-b border-[#FAF9F6]/10 focus-within:border-[#DFBA73] transition-colors duration-300 pb-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-transparent border-none outline-none text-sm text-[#FAF9F6] w-full font-light placeholder:text-zinc-600"
                />
                <button className="text-[#FAF9F6] hover:text-[#DFBA73] transition-colors pl-3 font-mono text-xs uppercase tracking-widest">
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Links Grid */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-10">
            <div>
              <h5 className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#DFBA73] mb-5">
                Platform
              </h5>
              <ul className="space-y-3">
                {["Discover", "Boards", "Brands", "Shop"].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      data-cursor="hover"
                      className="text-[13px] text-[#8E8E93] hover:text-[#FAF9F6] transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#DFBA73] mb-5">
                Company
              </h5>
              <ul className="space-y-3">
                {["About", "Careers", "Press", "Contact"].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      data-cursor="hover"
                      className="text-[13px] text-[#8E8E93] hover:text-[#FAF9F6] transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#DFBA73] mb-5">
                Connect
              </h5>
              <ul className="space-y-3">
                {SOCIALS.map((s) => (
                  <li key={s.name}>
                    <a
                      href={s.href}
                      data-cursor="hover"
                      className="text-[13px] text-[#8E8E93] hover:text-[#FAF9F6] transition-colors"
                    >
                      {s.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Cities */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-16 border-t border-[#FAF9F6]/[0.05] pt-8">
          <span className="font-mono text-[8px] uppercase tracking-[0.35em] text-[#8E8E93]/50 mr-2">
            Available in
          </span>
          {CITIES.map((city) => (
            <span
              key={city}
              className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#FAF9F6]/40"
            >
              {city}
            </span>
          ))}
        </div>

        {/* Monumental Interactive Wordmark */}
        <div className="w-full overflow-hidden select-none border-b border-[#FAF9F6]/[0.05] pb-8 mb-8 flex justify-center">
          <h1 className="text-[14.5vw] leading-[0.75] font-black tracking-tighter flex gap-1 justify-center w-full">
            {giantWord.split("").map((letter, i) => (
              <motion.span
                key={i}
                className="inline-block font-display text-[#FAF9F6] cursor-pointer"
                whileHover={{
                  scale: 1.08,
                  skewX: -12,
                  color: "#DFBA73",
                }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 11,
                }}
              >
                {letter}
              </motion.span>
            ))}
          </h1>
        </div>

        {/* Bottom bar with clock */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-2">
          <span className="font-mono text-[9px] tracking-[0.2em] text-[#8E8E93]/50 order-2 md:order-1">
            &copy; {new Date().getFullYear()} Dobaeni. All rights reserved.
          </span>

          {/* Live NPT clock */}
          <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#DFBA73] order-1 md:order-2">
            Kathmandu, NP // {time || "00:00:00 NPT"} NPT
          </div>

          <div className="flex items-center gap-6 order-3">
            <a
              href="#"
              className="font-mono text-[9px] tracking-[0.2em] text-[#8E8E93]/50 hover:text-[#FAF9F6] transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="font-mono text-[9px] tracking-[0.2em] text-[#8E8E93]/50 hover:text-[#FAF9F6] transition-colors"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
