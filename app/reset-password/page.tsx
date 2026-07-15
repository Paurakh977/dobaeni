'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (password !== confirm) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (!token) {
      setMessage({ type: 'error', text: 'Missing or invalid reset token.' });
      return;
    }
    setBusy(true);
    try {
      const { error } = await authClient.resetPassword({ newPassword: password, token });
      if (error) throw new Error(error.message);
      setMessage({ type: 'success', text: 'Password updated. Redirecting to sign in…' });
      window.setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative z-10 w-full max-w-[400px] rounded-2xl border border-white/[0.06] bg-[#070709]/80 p-8 backdrop-blur-2xl"
    >
      <p className="text-[9px] font-mono uppercase tracking-[0.4em] text-[#52525B]">
        account // new password
      </p>
      <h1 className="mt-3 text-xl font-light tracking-wide">Choose a new password</h1>

      {message && (
        <div
          className={`mt-4 rounded-xl border px-3.5 py-3 text-center text-[11.5px] ${
            message.type === 'success'
              ? 'border-[#E2D4C9]/25 bg-[#E2D4C9]/[0.02] text-[#FAF9F6]'
              : 'border-red-500/10 bg-red-500/[0.02] text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <input
        type="password"
        required
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-5 w-full rounded-xl border border-white/[0.06] bg-[#0E0E12]/60 px-3.5 py-3 text-[13px] text-[#FAF9F6] outline-none focus:border-[#C9A24B]/40"
      />
      <input
        type="password"
        required
        placeholder="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="mt-3 w-full rounded-xl border border-white/[0.06] bg-[#0E0E12]/60 px-3.5 py-3 text-[13px] text-[#FAF9F6] outline-none focus:border-[#C9A24B]/40"
      />
      <button
        type="submit"
        disabled={busy || password.length < 8}
        className="mt-4 w-full rounded-xl bg-[#FAF9F6] py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#050507] transition-opacity disabled:opacity-40"
      >
        {busy ? 'Updating…' : 'Reset password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-[#030304] px-6 font-sans text-[#FAF9F6] antialiased">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[360px] w-[360px] rounded-full bg-[#C9A24B]/12 blur-[130px]" />
      </div>
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </main>
  );
}
