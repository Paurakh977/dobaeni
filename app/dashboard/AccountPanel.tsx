'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { authClient } from '@/lib/auth-client';
import { motion } from 'framer-motion';

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.04] bg-[#121215]/40 p-6 backdrop-blur-xl transition-colors hover:bg-[#121215]/60">
      <h2 className="text-[13px] font-mono uppercase tracking-[0.2em] text-[#DFBA73]">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-[12px] font-light text-[#7C7C83]">{description}</p>
      )}
      <div className="mt-6">{children}</div>
    </section>
  );
}

const inputClass =
  'w-full rounded-xl border border-white/[0.06] bg-[#0E0E12]/80 px-4 py-3.5 text-[13px] font-light text-[#FAF9F6] outline-none transition-all placeholder:text-[#52525B] focus:border-[#DFBA73]/40 focus:bg-white/[0.02]';
const btnClass =
  'rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-3 text-[11px] font-mono uppercase tracking-[0.2em] text-[#FAF9F6] transition-all hover:border-[#DFBA73]/40 hover:bg-[#DFBA73]/[0.06] disabled:cursor-not-allowed disabled:opacity-40';
const primaryBtnClass = 
  'rounded-xl bg-[#DFBA73] hover:bg-[#F0E2C3] px-5 py-3 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all disabled:opacity-50 disabled:hover:bg-[#DFBA73] shadow-[0_0_15px_rgba(223,186,115,0.15)]';

export default function AccountPanel({
  initialTwoFactorEnabled,
  emailVerified,
}: {
  initialTwoFactorEnabled: boolean;
  emailVerified: boolean;
}) {
  const router = useRouter();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialTwoFactorEnabled);

  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(
    null,
  );

  const [hasPasswordAccount, setHasPasswordAccount] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    authClient
      .listAccounts()
      .then((res) => {
        if (!active) return;
        const accounts = (res.data ?? []) as Array<{ providerId?: string }>;
        setHasPasswordAccount(
          accounts.some((a) => a.providerId === 'credential'),
        );
      })
      .catch(() => active && setHasPasswordAccount(false));
    return () => {
      active = false;
    };
  }, []);

  const [password, setPassword] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState('');
  const [busy, setBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const twoFactorPassword = hasPasswordAccount ? { password } : {};

  async function handleEnable() {
    setMessage(null);
    setBusy(true);
    try {
      const { data, error } = await authClient.twoFactor.enable(twoFactorPassword);
      if (error) throw new Error(error.message);
      setTotpURI(data?.totpURI ?? null);
      setBackupCodes(data?.backupCodes ?? []);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed.' });
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    setMessage(null);
    setBusy(true);
    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: verifyCode,
        trustDevice: true,
      });
      if (error) throw new Error(error.message);
      setTwoFactorEnabled(true);
      setTotpURI(null);
      setBackupCodes([]);
      setVerifyCode('');
      setMessage({ type: 'success', text: 'Two-factor authentication enabled.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Invalid code.' });
    } finally {
      setBusy(false);
    }
  }

  const disableTwoFactorPassword = hasPasswordAccount ? { password: disablePassword } : {};

  async function handleDisable() {
    setMessage(null);
    setBusy(true);
    try {
      const { error } = await authClient.twoFactor.disable(disableTwoFactorPassword);
      if (error) throw new Error(error.message);
      setTwoFactorEnabled(false);
      setDisablePassword('');
      setBackupCodes([]);
      setMessage({ type: 'success', text: 'Two-factor authentication disabled.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed.' });
    } finally {
      setBusy(false);
    }
  }

  async function handleRegenerate() {
    setMessage(null);
    setBusy(true);
    try {
      const { data, error } = await authClient.twoFactor.generateBackupCodes(disableTwoFactorPassword);
      if (error) throw new Error(error.message);
      setBackupCodes(data?.backupCodes ?? []);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed.' });
    } finally {
      setBusy(false);
    }
  }

  async function handleChangePassword() {
    setMessage(null);
    setBusy(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (error) throw new Error(error.message);
      setCurrentPassword('');
      setNewPassword('');
      setMessage({ type: 'success', text: 'Password updated.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed.' });
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push('/login'),
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border px-4 py-3.5 text-center text-[12px] ${
            message.type === 'success'
              ? 'border-[#DFBA73]/20 bg-[#DFBA73]/[0.05] text-[#F0E2C3]'
              : 'border-red-500/20 bg-red-500/[0.05] text-red-400'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <Section title="Session Status">
        <div className="flex flex-wrap items-center gap-4">
          <span
            className={`rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-mono ${
              emailVerified
                ? 'bg-[#DFBA73]/10 text-[#DFBA73] border border-[#DFBA73]/20'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            }`}
          >
            {emailVerified ? 'Email verified' : 'Email unverified'}
          </span>
          <button onClick={handleSignOut} className={btnClass}>
            Sign out everywhere
          </button>
        </div>
      </Section>

      <Section
        title="Two-Factor Auth"
        description={
          twoFactorEnabled
            ? 'Your account is currently protected with an authenticator app.'
            : 'Add a second step at sign-in using an authenticator app to secure your account.'
        }
      >
        {!twoFactorEnabled && !totpURI && (
          <div className="flex flex-col gap-4 max-w-sm">
            {hasPasswordAccount === true && (
              <input
                type="password"
                placeholder="Confirm password to continue"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            )}
            {hasPasswordAccount === false && (
              <p className="text-[11px] font-light text-[#7C7C83] bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                You signed in with a social provider. Enable 2FA to protect this
                account — no password required.
              </p>
            )}
            <button
              onClick={handleEnable}
              disabled={busy || (hasPasswordAccount === true && !password)}
              className={primaryBtnClass}
            >
              {busy ? 'Working…' : 'Enable 2FA'}
            </button>
          </div>
        )}

        {totpURI && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="rounded-2xl bg-white p-4 shadow-xl">
                <QRCode value={totpURI} size={140} />
              </div>
              <div className="text-[12px] font-light leading-relaxed text-[#7C7C83] max-w-sm">
                Scan this QR code with your authenticator app (like Google Authenticator or Authy), then enter the 6-digit
                code below to finish enabling 2FA.
              </div>
            </div>

            {backupCodes.length > 0 && (
              <div className="bg-[#0E0E12]/80 p-4 rounded-2xl border border-white/[0.04]">
                <p className="text-[11px] font-mono text-[#DFBA73] uppercase tracking-widest mb-3">Save these backup codes</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {backupCodes.map((c) => (
                    <code
                      key={c}
                      className="rounded-lg border border-white/[0.06] bg-[#121215] px-2 py-1.5 text-center text-[11px] text-[#FAF9F6] font-mono"
                    >
                      {c}
                    </code>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 max-w-sm">
              <input
                placeholder="123456"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className={`${inputClass} font-mono tracking-[0.3em] text-center sm:text-left`}
              />
              <button onClick={handleVerify} disabled={busy || verifyCode.length < 6} className={primaryBtnClass}>
                {busy ? 'Verifying…' : 'Confirm'}
              </button>
            </div>
          </motion.div>
        )}

        {twoFactorEnabled && (
          <div className="flex flex-col gap-4 max-w-sm">
            <div className="flex items-center gap-3">
              <span className="w-fit rounded-full bg-emerald-500/10 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-emerald-400 border border-emerald-500/20 font-mono">
                Enabled
              </span>
            </div>
            {hasPasswordAccount === true && (
              <input
                type="password"
                placeholder="Confirm password to disable"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className={inputClass}
              />
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRegenerate}
                disabled={busy || (hasPasswordAccount === true && !disablePassword)}
                className={btnClass}
              >
                Regenerate codes
              </button>
              <button
                onClick={handleDisable}
                disabled={busy || (hasPasswordAccount === true && !disablePassword)}
                className={`${btnClass} !text-red-400 hover:!bg-red-500/10 hover:!border-red-500/30`}
              >
                Disable 2FA
              </button>
            </div>
          </div>
        )}

        {twoFactorEnabled && backupCodes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-[#0E0E12]/80 p-4 rounded-2xl border border-white/[0.04]">
            <p className="text-[11px] font-mono text-[#DFBA73] uppercase tracking-widest mb-3">New backup codes (save these)</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {backupCodes.map((c) => (
                <code
                  key={c}
                  className="rounded-lg border border-white/[0.06] bg-[#121215] px-2 py-1.5 text-center text-[11px] text-[#FAF9F6] font-mono"
                >
                  {c}
                </code>
              ))}
            </div>
          </motion.div>
        )}
      </Section>

      <Section title="Security">
        <div className="flex flex-col gap-4 max-w-sm">
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            placeholder="New password (min 8 chars)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
          <button
            onClick={handleChangePassword}
            disabled={busy || !currentPassword || newPassword.length < 8}
            className={primaryBtnClass}
          >
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </Section>
    </div>
  );
}
