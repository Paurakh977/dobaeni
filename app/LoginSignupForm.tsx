'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AnimatePresence,
  motion,
  type Variants,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

interface FormData {
  email: string;
  password: string;
  username: string;
}

type Mode = 'signin' | 'signup';
type MessageType = 'error' | 'success';
type Provider = 'manual' | 'google' | 'github';

// ---------------------------------------------------------------------------
// High-End Monochrome Brand Marks
// ---------------------------------------------------------------------------

const GoogleMark = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="opacity-70 group-hover:opacity-100 transition-opacity">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
  </svg>
);

const GithubMark = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="opacity-70 group-hover:opacity-100 transition-opacity">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

const PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2;
  const distance = 80 + (i % 3) * 20;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    delay: (i % 6) * 0.03,
    size: i % 2 === 0 ? 3 : 1.5,
  };
});

// ---------------------------------------------------------------------------
// Magnetic Dynamic Wrapper with Elastic Scaling
// ---------------------------------------------------------------------------

function Magnetic({ children, strength = 15 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 180, damping: 20, mass: 0.35 });
  const springY = useSpring(y, { stiffness: 180, damping: 20, mass: 0.35 });
  const reduceMotion = useReducedMotion();

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set((relX / (rect.width / 2)) * strength);
    y.set((relY / (rect.height / 2)) * strength * 0.7);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x: springX, y: springY }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function LoginSignupForm() {
  const reduceMotion = useReducedMotion();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: MessageType } | null>(null);
  const [loading, setLoading] = useState<Provider | null>(null);
  const [success, setSuccess] = useState<{ name: string } | null>(null);
  const [formData, setFormData] = useState<FormData>({ email: '', password: '', username: '' });

  const isSignUp = mode === 'signup';

  // Screen-wipe diagonal transition states
  const [tx, setTx] = useState<{ to: Mode; phase: 'cover' | 'reveal' } | null>(null);

  const applyMode = (next: Mode) => {
    setMode(next);
    setShowPassword(false);
    setMessage(null);
    setFormData({ email: '', password: '', username: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (message) setMessage(null);
  };

  const switchMode = (next: Mode) => {
    if (next === mode || loading || tx) return;
    if (reduceMotion) {
      applyMode(next);
      return;
    }
    setTx({ to: next, phase: 'cover' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading('manual');

    try {
      if (isSignUp) {
        const { error } = await authClient.signUp.email({
          email: formData.email,
          password: formData.password,
          name: formData.username || formData.email.split('@')[0],
          username: formData.username,
        });
        if (error) throw new Error(error.message);

        setMessage({
          type: 'success',
          text: 'Account created! Check your email to verify, then sign in.',
        });
        window.setTimeout(() => switchMode('signin'), 1800);
      } else {
        const { data, error } = await authClient.signIn.email({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw new Error(error.message);

        // 2FA required → twoFactorClient redirects to /2fa automatically.
        if ((data as { twoFactorRedirect?: boolean } | undefined)?.twoFactorRedirect)
          return;

        setSuccess({
          name: data?.user?.name || formData.email.split('@')[0] || 'Member',
        });
        window.setTimeout(() => {
          router.push('/dashboard');
        }, reduceMotion ? 200 : 1400);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Invalid email or password.',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setMessage(null);
    setLoading(provider);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: '/dashboard',
        errorCallbackURL: '/login',
      });
      // Provider handles the redirect (302) — keep loading until navigation.
    } catch {
      setMessage({ type: 'error', text: `Could not sign in with ${provider}.` });
      setLoading(null);
    }
  };

  return (
    <div className="auth-scope relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#030304] px-6 py-24 font-sans antialiased select-none">
      {/* Dynamic Backlit "Eclipse" Halo behind Card */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.12, 0.18, 0.12],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="h-[380px] w-[380px] rounded-full bg-[#E2D4C9] blur-[130px]"
        />
      </div>

      {/* Golden Aurora Mesh — slow drifting warm blooms */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.15, 0.95, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[12%] top-[18%] h-[340px] w-[340px] rounded-full bg-[#C9A24B]/16 blur-[120px] mix-blend-screen"
        />
        <motion.div
          animate={{ x: [0, -50, 30, 0], y: [0, 25, -25, 0], scale: [1, 0.9, 1.2, 1] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-[10%] top-[30%] h-[300px] w-[300px] rounded-full bg-[#E2D4C9]/14 blur-[120px] mix-blend-screen"
        />
        <motion.div
          animate={{ x: [0, 30, -35, 0], y: [0, 35, -15, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[12%] left-1/3 h-[260px] w-[260px] rounded-full bg-[#D4B572]/14 blur-[120px] mix-blend-screen"
        />
      </div>

      {/* Exquisite tactile film-grain noise texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-40 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative Technical UI Framing */}
      <div className="absolute inset-x-12 top-12 hidden md:flex items-center justify-between text-[8px] font-mono text-white/10 tracking-[0.4em] z-10 uppercase">
        <span>sys.connection // established</span>
        <span>edition: 2026 // stable-rev-4</span>
      </div>
      <div className="absolute inset-x-12 bottom-12 hidden md:flex items-center justify-between text-[8px] font-mono text-white/10 tracking-[0.4em] z-10 uppercase">
        <span>device: local_node_[88-x]</span>
        <span>[+] network.matrix.sync</span>
      </div>

      {/* 3D Interactive Card Component */}
      <motion.div
        key={mode}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 36, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -36, scale: 0.96 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[430px]"
      >
        <AuthFace
          message={message}
          onSubmit={handleSubmit}
          title={
            isSignUp ? (
              <>Create your <span className="bg-gradient-to-r from-[#E8D9B5] via-[#C9A24B] to-[#E2D4C9] bg-clip-text font-serif italic text-transparent">account</span></>
            ) : (
              <>Welcome <span className="bg-gradient-to-r from-[#E8D9B5] via-[#C9A24B] to-[#E2D4C9] bg-clip-text font-serif italic text-transparent">back</span></>
            )
          }
          subtitle={isSignUp ? "Sign up to create your account." : "Sign in to access your account."}
        >
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.06, delayChildren: 0.1 }
              }
            }}
            className="flex flex-col gap-6"
          >
            <FormFields
              mode={mode}
              formData={formData}
              onChange={handleInputChange}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((v) => !v)}
            />

            {!isSignUp && <ForgotPassword />}

            <SubmitButton loading={loading === 'manual'} label={isSignUp ? 'Sign Up' : 'Sign In'} />

            <Divider />

            <OAuthRow loading={loading} onOAuth={handleOAuth} />

            <SwitchLine
              prompt={isSignUp ? 'Already have an account?' : "Don't have an account?"}
              action={isSignUp ? 'Sign In' : 'Sign Up'}
              onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
            />
          </motion.div>
        </AuthFace>
      </motion.div>

      {/* Original Diagonal fluid sweep transition */}
      <AnimatePresence>
        {tx && (
          <div key="diagonal-transition" aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            <motion.div
              className="bg-gradient-to-br from-[#E2D4C9] via-[#FAF6F2] to-[#B3A193]"
              style={{
                width: '180vmax',
                height: '180vmax',
                position: 'absolute',
                top: '50%',
                left: '50%',
              }}
              initial={
                tx.phase === 'cover'
                  ? { x: '-150%', y: '-150%', borderRadius: '42% 58% 63% 37% / 48% 45% 55% 52%' }
                  : { x: '-50%', y: '-50%', borderRadius: '50%' }
              }
              animate={
                tx.phase === 'cover'
                  ? {
                      x: '-50%',
                      y: '-50%',
                      borderRadius: [
                        '42% 58% 63% 37% / 48% 45% 55% 52%',
                        '58% 42% 39% 61% / 57% 58% 42% 43%',
                        '50% 50% 50% 50% / 50% 50% 50% 50%',
                      ],
                    }
                  : {
                      x: '100%',
                      y: '100%',
                      borderRadius: '42% 58% 63% 37% / 48% 45% 55% 52%',
                    }
              }
              transition={{
                duration: tx.phase === 'cover' ? 1.4 : 2.0,
                ease: [0.33, 1, 0.45, 1],
                times: tx.phase === 'cover' ? [0, 0.9, 1] : undefined,
              }}
              onAnimationComplete={() => {
                if (tx.phase === 'cover') {
                  applyMode(tx.to);
                  setTx({ to: tx.to, phase: 'reveal' });
                } else {
                  setTx(null);
                }
              }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal Overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#030304]/95 backdrop-blur-xl"
          >
            <div className="relative flex flex-col items-center gap-7">
              {PARTICLES.map((p, i) => (
                <motion.span
                  key={i}
                  className="absolute rounded-full bg-[#E2D4C9]"
                  style={{ width: p.size, height: p.size, top: '50%', left: '50%' }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.2 }}
                  transition={{ duration: 1.2, delay: 0.2 + p.delay, ease: 'easeOut' }}
                />
              ))}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 20, delay: 0.15 }}
                className="relative flex items-center justify-center h-16 w-16 rounded-full border border-[#E2D4C9]/20 bg-white/[0.01]"
              >
                <motion.svg width="32" height="32" viewBox="0 0 56 56" fill="none">
                  <motion.circle
                    cx="28"
                    cy="28"
                    r="26"
                    stroke="#E2D4C9"
                    strokeWidth="1.25"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.75, ease: 'easeInOut' }}
                  />
                  <motion.path
                    d="M18 28.5L24.5 35L38 20"
                    stroke="#FAF9F6"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.5, ease: 'easeInOut' }}
                  />
                </motion.svg>
              </motion.div>
              <div className="text-center">
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="text-[9px] font-medium tracking-[0.25em] text-[#8E8E93] uppercase"
                >
                   You're signed in
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-2 text-xl font-light text-[#FAF9F6]"
                >
                   Welcome, <span className="bg-gradient-to-r from-[#E8D9B5] via-[#C9A24B] to-[#E2D4C9] bg-clip-text font-serif italic text-transparent">{success.name}</span>
                </motion.p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3D Parallax Tactile Card Component
// ---------------------------------------------------------------------------

function AuthFace({
  title,
  subtitle,
  message,
  onSubmit,
  children,
}: {
  title: React.ReactNode;
  subtitle: string;
  message: { text: string; type: MessageType } | null;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // Motion Values for cursor tracking
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth Springs for Parallax rotation
  const rotateX = useSpring(useTransform(y, [-200, 200], [10, -10]), { stiffness: 150, damping: 22 });
  const rotateY = useSpring(useTransform(x, [-200, 200], [-10, 10]), { stiffness: 150, damping: 22 });

  // Soft flashlight tracking vectors
  const bgX = useSpring(useTransform(x, [-200, 200], [0, 400]), { stiffness: 220, damping: 26 });
  const bgY = useSpring(useTransform(y, [-200, 200], [0, 400]), { stiffness: 220, damping: 26 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const halfWidth = rect.width / 2;
    const halfHeight = rect.height / 2;
    const clientX = e.clientX - rect.left - halfWidth;
    const clientY = e.clientY - rect.top - halfHeight;

    x.set(clientX);
    y.set(clientY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: reduceMotion ? 0 : rotateX,
        rotateY: reduceMotion ? 0 : rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1200,
      }}
      className="group relative overflow-hidden rounded-[28px] border border-white/[0.04] bg-[#070709]/80 p-9 shadow-[0_56px_110px_-32px_rgba(0,0,0,0.98)] backdrop-blur-3xl transition-colors duration-500 hover:border-white/[0.08]"
    >
      {/* Dynamic Cursor Spotlight Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: useTransform(
            [bgX, bgY],
            ([xCoord, yCoord]) => `radial-gradient(180px circle at ${xCoord}px ${yCoord}px, rgba(226, 212, 201, 0.11), transparent 85%)`
          ),
        }}
      />

      {/* Animated Golden Gradient Border on Hover */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[28px] opacity-0 transition-opacity duration-700 group-hover:opacity-100"
        style={{
          background: 'conic-gradient(from 180deg, #E8D9B5, #C9A24B, #E2D4C9, #D4B572, #E8D9B5)',
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1px',
        }}
      />

      {/* Fine-line luxury architectural details */}
      <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-[#E2D4C9]/40 to-transparent" />
      <div className="absolute top-4 left-4 text-[7px] font-mono text-white/5 uppercase tracking-widest">[ secure link ]</div>
      <div className="absolute top-4 right-4 text-[7px] font-mono text-white/5 uppercase tracking-widest">[ id: prx-9 ]</div>

      {/* 3D Floating Brand Logo Shield Area */}
      <div className="relative mb-8 flex flex-col items-center" style={{ transform: 'translateZ(40px)', transformStyle: 'preserve-3d' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.6, rotate: -18, y: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.15 }}
          className="absolute top-2 w-[110px] flex justify-between text-[7px] font-mono text-[#C9A24B]/30 select-none"
        >
          <span>◤</span>
          <span>◥</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -25 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 190, damping: 15, delay: 0.2 }}
        >
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="group/logo relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#0E0E12]/90 shadow-[inset_0_1px_2px_rgba(255,255,255,0.06),0_16px_32px_-8px_rgba(0,0,0,0.9)] backdrop-blur-md transition-shadow duration-500 hover:border-[#C9A24B]/40 hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),0_0_34px_-6px_rgba(201,162,75,0.55),0_16px_32px_-8px_rgba(0,0,0,0.9)]"
          >
            {/* Logo container area */}
            <img
              src="/logo.png"
              alt="Workspace Identifier Logo"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const textSymbol = document.createElement('span');
                  textSymbol.className = 'font-serif text-sm font-semibold tracking-wider text-[#E2D4C9]';
                  textSymbol.innerText = 'ℵ';
                  parent.appendChild(textSymbol);
                }
              }}
              className="h-7 w-7 object-contain brightness-95 contrast-125"
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.6, rotate: 18, y: 8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.25 }}
          className="absolute bottom-1 w-[110px] flex justify-between text-[7px] font-mono text-[#C9A24B]/30 select-none"
        >
          <span>◣</span>
          <span>◢</span>
        </motion.div>
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } } }}
        className="text-center"
        style={{ transform: 'translateZ(20px)' }}
      >
        <motion.h1
          variants={{
            hidden: { opacity: 0, y: 14, filter: 'blur(8px)' },
            show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 170, damping: 18 } },
          }}
          className="text-[21px] font-light tracking-wide text-[#FAF9F6]"
        >
          {title}
        </motion.h1>
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 10, filter: 'blur(6px)' },
            show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 170, damping: 18 } },
          }}
          className="mt-2 text-[12px] font-light text-[#7C7C83] leading-relaxed"
        >
          {subtitle}
        </motion.p>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className={`overflow-hidden rounded-xl border px-3.5 py-3 text-center text-[11.5px] leading-relaxed mt-5 ${
              message.type === 'success'
                ? 'border-[#E2D4C9]/25 bg-[#E2D4C9]/[0.02] text-[#FAF9F6]'
                : 'border-red-500/10 bg-red-500/[0.02] text-red-400'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={onSubmit} className="mt-8" style={{ transform: 'translateZ(15px)' }}>
        {children}
      </form>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Micro-Interactive Input Sub-components
// ---------------------------------------------------------------------------

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)', scale: 0.96 },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1, transition: { type: 'spring' as const, stiffness: 170, damping: 18, mass: 0.6 } }
};

function FormFields({
  mode,
  formData,
  onChange,
  showPassword,
  onTogglePassword,
}: {
  mode: Mode;
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
}) {
  return (
    <>
      <AnimatePresence mode="popLayout">
        {mode === 'signup' && (
          <motion.div key="signup-username" variants={fieldVariants} exit={{ opacity: 0, y: -6 }}>
               <Field icon={<User size={12} strokeWidth={1.5} />} label="Username" index="[01]">
              <input
                type="text"
                name="username"
                placeholder="John Doe"
                required
                value={formData.username}
                onChange={onChange}
                className="w-full bg-transparent px-3.5 py-3 text-[13px] font-light text-[#FAF9F6] outline-none placeholder:text-[#424247]"
              />
            </Field>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div key="email" variants={fieldVariants}>
        <Field icon={<Mail size={12} strokeWidth={1.5} />} label="Email" index={mode === 'signup' ? '[02]' : '[01]'}>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            required
            value={formData.email}
            onChange={onChange}
            className="w-full bg-transparent px-3.5 py-3 text-[13px] font-light text-[#FAF9F6] outline-none placeholder:text-[#424247]"
          />
        </Field>
      </motion.div>

      <motion.div key="password" variants={fieldVariants}>
        <Field icon={<Lock size={12} strokeWidth={1.5} />} label="Password" index={mode === 'signup' ? '[03]' : '[02]'}>
          <div className="flex w-full items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="••••••••••••"
              required
              value={formData.password}
              onChange={onChange}
              className="w-full bg-transparent px-3.5 py-3 text-[13px] font-light tracking-widest text-[#FAF9F6] outline-none placeholder:text-[#424247] placeholder:tracking-normal"
            />
            <button
              type="button"
              onClick={onTogglePassword}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="shrink-0 pr-3.5 text-[#52525B] transition-colors hover:text-[#FAF9F6]"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={showPassword ? 'hide' : 'show'}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  {showPassword ? <EyeOff size={12} strokeWidth={1.5} /> : <Eye size={12} strokeWidth={1.5} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </Field>
      </motion.div>
    </>
  );
}

function Field({ icon, label, index, children }: { icon: React.ReactNode; label: string; index: string; children: React.ReactNode }) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className="group flex flex-col gap-1.5 text-left"
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-[8.5px] font-semibold tracking-[0.2em] text-[#52525B] uppercase transition-colors group-focus-within:text-[#E2D4C9]">
          {label}
        </span>
        <span className="font-mono text-[8.5px] text-[#52525B]/60 transition-colors group-focus-within:text-[#E2D4C9]/60">
          {index}
        </span>
      </div>

      <div className="group/field relative flex items-center rounded-xl border border-white/[0.04] bg-[#0E0E12]/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)] transition-all duration-300 group-focus-within:border-[#E2D4C9]/25 group-focus-within:bg-[#0E0E12]/80 hover:border-white/[0.08] hover:bg-[#121218]/70">
        <span className="shrink-0 pl-3.5 text-[#52525B] transition-colors duration-300 group-focus-within:text-[#E2D4C9] group-hover/field:text-[#8A8A93]">
          {icon}
        </span>
        {children}

        {/* Soft golden ambient glow while focused */}
        <div
          className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-focus-within:opacity-100"
          style={{ boxShadow: '0 0 22px -4px rgba(201, 162, 75, 0.35), inset 0 0 14px -6px rgba(201, 162, 75, 0.4)' }}
        />

        {/* Dynamic Focus Border Laser Line */}
        <motion.div
          className="absolute -inset-[1px] pointer-events-none rounded-xl border border-[#E2D4C9]/35"
          initial={{ opacity: 0 }}
          animate={{ opacity: focused ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </div>
  );
}

function ForgotPassword() {
  return (
    <motion.div variants={fieldVariants} className="text-right -mt-2">
      <a href="/forgot-password" className="inline-block text-[11px] font-light text-[#52525B] transition-all hover:text-[#FAF9F6]">
        Forgot password?
      </a>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Magnetic Satin Interactive Button
// ---------------------------------------------------------------------------

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <motion.div variants={fieldVariants} className="mt-1">
      <Magnetic strength={12}>
        <button
          type="submit"
          disabled={loading}
          className="group/btn relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#FAF9F6] py-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#050507] transition-all active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {/* Golden gradient wash on hover */}
          <span className="absolute inset-0 z-0 translate-y-full bg-gradient-to-r from-[#E8D9B5] via-[#C9A24B] to-[#D4B572] opacity-0 transition-all duration-500 ease-[0.16,1,0.3,1] group-hover/btn:translate-y-0 group-hover/btn:opacity-100" />
          <span className="absolute -inset-y-0 left-[-100%] z-10 w-[50%] bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 transition-all duration-1000 group-hover/btn:left-[150%]" />

          {/* Golden outer glow on hover */}
          <span className="pointer-events-none absolute -inset-0.5 rounded-xl opacity-0 transition-opacity duration-500 group-hover/btn:opacity-100" style={{ boxShadow: '0 0 34px -6px rgba(201, 162, 75, 0.6)' }} />

          <span className="relative z-20 flex items-center justify-center gap-2 transition-colors duration-300 group-hover/btn:text-white">
            {loading ? <Loader2 size={12} className="animate-spin" /> : label}
          </span>
        </button>
      </Magnetic>
    </motion.div>
  );
}

function Divider() {
  return (
    <motion.div variants={fieldVariants} className="flex items-center gap-4 py-0.5">
      <span className="h-px flex-1 bg-white/[0.04]" />
      <span className="text-[9px] uppercase tracking-[0.2em] text-[#52525B]">Or continue with</span>
      <span className="h-px flex-1 bg-white/[0.04]" />
    </motion.div>
  );
}

function OAuthRow({
  loading,
  onOAuth,
}: {
  loading: Provider | null;
  onOAuth: (provider: 'google' | 'github') => void;
}) {
  return (
    <motion.div variants={fieldVariants} className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onOAuth('google')}
        disabled={loading !== null}
        className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.01] py-3 text-[12px] font-light text-[#FAF9F6] transition-all hover:border-[#C9A24B]/40 hover:bg-[#C9A24B]/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ boxShadow: '0 0 26px -6px rgba(201, 162, 75, 0.5)' }} />
        {loading === 'google' ? <Loader2 size={12} className="animate-spin" /> : <GoogleMark />}
        <span className="relative z-10">Google</span>
      </button>
      <button
        type="button"
        onClick={() => onOAuth('github')}
        disabled={loading !== null}
        className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.01] py-3 text-[12px] font-light text-[#FAF9F6] transition-all hover:border-[#C9A24B]/40 hover:bg-[#C9A24B]/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ boxShadow: '0 0 26px -6px rgba(201, 162, 75, 0.5)' }} />
        {loading === 'github' ? <Loader2 size={12} className="animate-spin" /> : <GithubMark />}
        <span className="relative z-10">GitHub</span>
      </button>
    </motion.div>
  );
}

function SwitchLine({ prompt, action, onClick }: { prompt: string; action: string; onClick: () => void }) {
  return (
    <motion.p variants={fieldVariants} className="text-center text-[11px] font-light text-[#52525B]">
      {prompt}{' '}
      <button
        type="button"
        onClick={onClick}
        className="font-normal text-[#FAF9F6] underline decoration-[#E2D4C9]/35 underline-offset-4 transition-colors hover:text-[#E2D4C9] hover:decoration-[#E2D4C9]"
      >
        {action}
      </button>
    </motion.p>
  );
}