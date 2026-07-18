"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, LayoutDashboard, Heart, Settings, ChevronDown, Shield, UserCog, MessageCircle } from "lucide-react";
import Magnetic from "./Magnetic";
import CartBadge from "./components/CartBadge";
import { ChatModal } from "./components/ChatModal";

  const LINKS: { label: string; href: string }[] = [
    { label: "Discover", href: "/discover" },
    { label: "Boards", href: "/dashboard/boards" },
    { label: "Brands", href: "/brands" },
    { label: "Access", href: "#" },
  ];

export default function Navbar() {
  const { data: session, isPending } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "moderator";
  const impersonated = Boolean((session as { impersonatedBy?: string | null } | undefined)?.impersonatedBy);

  return (
    <>
      {impersonated && (
        <div className="relative z-[60] flex items-center justify-center gap-2 bg-[#DFBA73] px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.2em] text-[#08080a]">
          <UserCog size={13} />
          Impersonating {session?.user?.email}
          <button
            onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/admin/users"; } } })}
            className="ml-2 rounded-full bg-[#08080a]/15 px-2 py-0.5 font-bold uppercase tracking-wider hover:bg-[#08080a]/25"
          >
            Stop
          </button>
        </div>
      )}
    <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 pt-8 bg-transparent">
      <Magnetic>
        <Link href="/">
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
        </Link>
      </Magnetic>

      <div className="hidden md:flex items-center gap-10 font-mono text-[11px] uppercase tracking-[0.25em] text-[#FAF9F6]">
        {LINKS.map((item) => (
          <Magnetic key={item.label}>
            <Link
              href={item.href}
              data-cursor="hover"
              className="relative group py-1 text-[#FAF9F6]/80 hover:text-[#FAF9F6] transition-colors"
            >
              {item.label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#DFBA73] transition-all duration-300 group-hover:w-full" />
            </Link>
          </Magnetic>
        ))}
        {isAdmin && (
          <Magnetic>
            <Link
              href="/admin"
              data-cursor="hover"
              className="relative group flex items-center gap-1.5 py-1 text-[#DFBA73]/80 hover:text-[#DFBA73] transition-colors"
            >
              <Shield size={13} /> Admin
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#DFBA73] transition-all duration-300 group-hover:w-full" />
            </Link>
          </Magnetic>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Magnetic>
          <button
            onClick={() => setChatOpen(true)}
            data-cursor="hover"
            aria-label="Open chat"
            className="group flex h-9 w-9 items-center justify-center rounded-full border border-[#FAF9F6]/20 bg-[#08080a]/80 text-[#FAF9F6]/80 backdrop-blur-md transition-all duration-300 hover:border-[#DFBA73]/50 hover:text-[#DFBA73]"
          >
            <MessageCircle size={16} />
          </button>
        </Magnetic>
        {!isPending && session && <CartBadge />}
      <div className="relative">
        {isPending ? (
          <div className="h-9 w-24 animate-pulse rounded-full bg-white/5" />
        ) : session ? (
          <div
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <Magnetic>
              <button
                data-cursor="stick"
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#FAF9F6]/20 bg-[#08080a]/80 backdrop-blur-md hover:border-[#DFBA73]/50 transition-all duration-300"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DFBA73] text-[#08080a] text-[10px] font-bold uppercase">
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.user.image} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    session.user.name?.[0] || session.user.email?.[0] || "?"
                  )}
                </div>
                <span className="text-[11px] font-mono text-[#FAF9F6] hidden md:block">
                  {session.user.name?.split(' ')[0] || "Profile"}
                </span>
                <ChevronDown className={`w-3 h-3 text-[#FAF9F6]/60 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </Magnetic>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/[0.08] bg-[#121215]/90 backdrop-blur-xl p-2 shadow-2xl overflow-hidden"
                >
                  <div className="px-3 py-2.5 mb-2 border-b border-white/[0.08]">
                    <p className="text-[13px] font-medium text-[#FAF9F6] truncate">{session.user.name}</p>
                    <p className="text-[11px] text-[#7C7C83] truncate">{session.user.email}</p>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] font-light text-[#FAF9F6]/80 hover:text-[#DFBA73] hover:bg-white/[0.04] transition-colors">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link href="/dashboard/boards" className="flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] font-light text-[#FAF9F6]/80 hover:text-[#DFBA73] hover:bg-white/[0.04] transition-colors">
                      <Heart className="w-4 h-4" />
                      My Boards
                    </Link>
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] font-light text-[#FAF9F6]/80 hover:text-[#DFBA73] hover:bg-white/[0.04] transition-colors">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] font-light text-[#DFBA73]/90 hover:text-[#DFBA73] hover:bg-white/[0.04] transition-colors">
                        <Shield className="w-4 h-4" />
                        Admin Console
                      </Link>
                    )}
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/[0.08]">
                    <button
                      onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = '/'; } } })}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] font-light text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Magnetic>
            <Link href="/login" data-cursor="stick">
              <button
                className="px-5 md:px-6 py-2 rounded-full border border-[#FAF9F6]/20 text-[11px] font-mono uppercase tracking-[0.2em] text-[#FAF9F6] hover:bg-[#DFBA73] hover:text-[#08080a] hover:border-transparent transition-all duration-300"
              >
                Sign In
              </button>
            </Link>
          </Magnetic>
        )}
      </div>
      </div>
    </nav>
    <ChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}