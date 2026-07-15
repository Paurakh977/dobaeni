'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-[#08080a] px-6 font-sans text-[#FAF9F6] antialiased overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-[#DFBA73]/10 blur-[140px] animate-dobaeni-spin" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px] rounded-3xl border border-white/[0.08] bg-[#121215]/80 p-10 text-center backdrop-blur-3xl shadow-2xl flex flex-col items-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
          className="w-16 h-16 rounded-full bg-[#DFBA73]/10 flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-8 h-8 text-[#DFBA73]" />
        </motion.div>

        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#DFBA73]/80">
          email // verified
        </p>
        <h1 className="mt-4 text-2xl font-light tracking-wide font-display text-[#FAF9F6]">
          You&apos;re all set
        </h1>
        <p className="mt-2 text-[13px] font-light text-[#7C7C83] leading-relaxed">
          Your email has been verified. You can now access your Dobaeni account.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="mt-8 w-full rounded-2xl bg-[#DFBA73] hover:bg-[#F0E2C3] py-3.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all shadow-[0_0_20px_rgba(223,186,115,0.15)]"
        >
          Continue to sign in
        </button>
      </motion.div>
    </main>
  );
}
