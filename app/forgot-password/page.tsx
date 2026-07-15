'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: '/reset-password',
      });
      if (error) throw new Error(error.message);
      setMessage({
        type: 'success',
        text: 'If that email exists, a reset link is on its way. Check your inbox.',
      });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-[#08080a] px-6 font-sans text-[#FAF9F6] antialiased overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-[#DFBA73]/10 blur-[140px] animate-dobaeni-spin" />
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-[420px] rounded-3xl border border-white/[0.08] bg-[#121215]/80 p-10 backdrop-blur-3xl shadow-2xl"
      >
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#DFBA73]/80">
          account // recovery
        </p>
        <h1 className="mt-4 text-2xl font-light tracking-wide font-display text-[#FAF9F6]">
          Reset your password
        </h1>
        <p className="mt-2 text-[13px] font-light text-[#7C7C83] leading-relaxed">
          Enter your email and we&apos;ll send a reset link to regain access.
        </p>

        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className={`mt-6 rounded-xl border px-4 py-3.5 text-center text-[12px] ${
              message.type === 'success'
                ? 'border-[#DFBA73]/20 bg-[#DFBA73]/[0.05] text-[#F0E2C3]'
                : 'border-red-500/20 bg-red-500/[0.05] text-red-400'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <div className="mt-8 space-y-4">
          <div className="relative group">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 text-[13px] text-[#FAF9F6] outline-none transition-all placeholder:text-[#52525B] focus:border-[#DFBA73]/50 focus:bg-white/[0.04]"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !email}
            className="w-full rounded-2xl bg-[#DFBA73] hover:bg-[#F0E2C3] py-3.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all disabled:opacity-50 disabled:hover:bg-[#DFBA73] shadow-[0_0_20px_rgba(223,186,115,0.15)]"
          >
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => router.push('/login')}
          className="mt-6 w-full text-center text-[12px] font-light text-[#7C7C83] transition-colors hover:text-[#DFBA73]"
        >
          Back to sign in
        </button>
      </motion.form>
    </main>
  );
}
