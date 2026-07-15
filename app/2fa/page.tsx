'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { motion } from 'framer-motion';

type Tab = 'totp' | 'otp' | 'backup';

export default function TwoFactorPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('totp');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  async function finish(verify: () => Promise<{ error: unknown }>, label: string) {
    setMessage(null);
    setBusy(true);
    try {
      const { error } = await verify();
      if (error) throw new Error((error as { message?: string })?.message || 'Invalid code.');
      router.push('/dashboard');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : `${label} failed.`,
      });
    } finally {
      setBusy(false);
    }
  }

  async function sendOtp() {
    setMessage(null);
    setBusy(true);
    try {
      const { error } = await authClient.twoFactor.sendOtp();
      if (error) throw new Error((error as { message?: string })?.message || 'Failed.');
      setMessage({ type: 'success', text: 'A code was sent to your email.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed.' });
    } finally {
      setBusy(false);
    }
  }

  const tabBtn = (t: Tab, label: string) =>
    `relative rounded-xl px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition-all duration-300 font-mono ${
      tab === t ? 'text-[#08080a]' : 'text-[#7C7C83] hover:text-[#FAF9F6]'
    }`;

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-[#08080a] px-6 font-sans text-[#FAF9F6] antialiased overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-[#DFBA73]/10 blur-[140px] animate-dobaeni-spin" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px] rounded-3xl border border-white/[0.08] bg-[#121215]/80 p-10 backdrop-blur-3xl shadow-2xl"
      >
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#DFBA73]/80">
          step 2 // verification
        </p>
        <h1 className="mt-4 text-2xl font-light tracking-wide font-display text-[#FAF9F6]">
          Two-factor auth
        </h1>
        <p className="mt-2 text-[13px] font-light text-[#7C7C83] leading-relaxed">
          Confirm it&apos;s you to finish signing in securely.
        </p>

        <div className="mt-8 flex gap-1 bg-[#08080a]/50 p-1 rounded-2xl border border-white/[0.04]">
          {(['totp', 'otp', 'backup'] as Tab[]).map((t) => (
            <button key={t} className={tabBtn(t, t)} onClick={() => setTab(t)}>
              {tab === t && (
                <motion.div
                  layoutId="active2FATab"
                  className="absolute inset-0 rounded-xl bg-[#DFBA73]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{t === 'totp' ? 'App' : t === 'otp' ? 'Email' : 'Backup'}</span>
            </button>
          ))}
        </div>

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

        <div className="mt-6">
          {tab === 'totp' && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-4"
            >
              <input
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 text-center text-[18px] tracking-[0.5em] text-[#FAF9F6] outline-none transition-all placeholder:text-[#52525B] focus:border-[#DFBA73]/50 focus:bg-white/[0.04] font-mono"
              />
              <button
                disabled={busy || code.length < 6}
                onClick={() =>
                  finish(() => authClient.twoFactor.verifyTotp({ code, trustDevice: true }), 'Verification')
                }
                className="w-full rounded-2xl bg-[#DFBA73] hover:bg-[#F0E2C3] py-3.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all disabled:opacity-50 disabled:hover:bg-[#DFBA73] shadow-[0_0_20px_rgba(223,186,115,0.15)]"
              >
                {busy ? 'Verifying…' : 'Verify App Code'}
              </button>
            </motion.div>
          )}

          {tab === 'otp' && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-4"
            >
              <button
                onClick={sendOtp}
                disabled={busy}
                className="w-full rounded-2xl border border-[#DFBA73]/30 bg-[#DFBA73]/[0.05] hover:bg-[#DFBA73]/10 py-3 text-[11px] uppercase tracking-[0.2em] text-[#DFBA73] transition-colors disabled:opacity-40 font-mono"
              >
                {busy ? 'Sending…' : 'Send email code'}
              </button>
              <input
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 text-center text-[18px] tracking-[0.5em] text-[#FAF9F6] outline-none transition-all placeholder:text-[#52525B] focus:border-[#DFBA73]/50 focus:bg-white/[0.04] font-mono"
              />
              <button
                disabled={busy || code.length < 6}
                onClick={() =>
                  finish(() => authClient.twoFactor.verifyOtp({ code, trustDevice: true }), 'Verification')
                }
                className="w-full rounded-2xl bg-[#DFBA73] hover:bg-[#F0E2C3] py-3.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all disabled:opacity-50 disabled:hover:bg-[#DFBA73] shadow-[0_0_20px_rgba(223,186,115,0.15)]"
              >
                {busy ? 'Verifying…' : 'Verify Email Code'}
              </button>
            </motion.div>
          )}

          {tab === 'backup' && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-4"
            >
              <input
                placeholder="Backup code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 text-center text-[14px] tracking-[0.2em] text-[#FAF9F6] outline-none transition-all placeholder:text-[#52525B] focus:border-[#DFBA73]/50 focus:bg-white/[0.04] font-mono"
              />
              <button
                disabled={busy || !code}
                onClick={() =>
                  finish(() => authClient.twoFactor.verifyBackupCode({ code, trustDevice: true }), 'Verification')
                }
                className="w-full rounded-2xl bg-[#DFBA73] hover:bg-[#F0E2C3] py-3.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all disabled:opacity-50 disabled:hover:bg-[#DFBA73] shadow-[0_0_20px_rgba(223,186,115,0.15)]"
              >
                {busy ? 'Verifying…' : 'Verify Backup Code'}
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </main>
  );
}
