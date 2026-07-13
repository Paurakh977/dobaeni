"use client";

import Image from "next/image";
import Magnetic from "./Magnetic";

const LINKS = ["Discover", "Boards", "Brands", "Access"];

export default function Navbar() {
  return (
    <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 pt-8 bg-[#08080a]">
      <Magnetic>
        <div
          className="flex items-center gap-3 cursor-pointer"
          data-cursor="stick"
        >
          <div className="relative w-7 h-7 md:w-8 md:h-8">
            <Image
              src="/logo.png"
              alt="Dobaeni"
              fill
              sizes="32px"
              className="object-contain"
            />
          </div>
          <span className="font-display text-xl tracking-wide text-[#FAF9F6]">
            Dobaeni
          </span>
        </div>
      </Magnetic>

      <div className="hidden md:flex items-center gap-10 font-mono text-[11px] uppercase tracking-[0.25em] text-[#FAF9F6]">
        {LINKS.map((item) => (
          <Magnetic key={item}>
            <a
              href="#"
              data-cursor="hover"
              className="relative group py-1 text-[#FAF9F6]/80 hover:text-[#FAF9F6] transition-colors"
            >
              {item}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#DFBA73] transition-all duration-300 group-hover:w-full" />
            </a>
          </Magnetic>
        ))}
      </div>

      <Magnetic>
        <button
          data-cursor="stick"
          className="px-5 md:px-6 py-2 rounded-full border border-[#FAF9F6]/20 text-[11px] font-mono uppercase tracking-[0.2em] text-[#FAF9F6] hover:bg-[#DFBA73] hover:text-[#08080a] hover:border-transparent transition-all duration-300"
        >
          Sign In
        </button>
      </Magnetic>
    </nav>
  );
}