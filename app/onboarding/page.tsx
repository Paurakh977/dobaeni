'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { authClient, useSession } from '@/lib/auth-client';
import { Loader2, Check, Store } from 'lucide-react';

const AESTHETICS = [
  "Old Money", "Clean Girl", "Y2K", "Streetwear", "Coquette", 
  "Minimalist", "Korean", "Cottagecore", "Vintage", "Office Wear"
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  
  const [selected, setSelected] = useState<string[]>([]);
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#DFBA73] animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const role = (session.user as any).role || 'buyer';

  const toggleSelection = (item: string) => {
    if (selected.includes(item)) {
      setSelected(selected.filter(i => i !== item));
    } else if (selected.length < 5) {
      setSelected([...selected, item]);
    }
  };

  const handleCompleteBuyer = async () => {
    setBusy(true);
    try {
      await authClient.updateUser({
        interests: JSON.stringify(selected),
        onboardingCompleted: true
      });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const handleCompleteSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      // Create Store Organization
      const { data, error } = await authClient.organization.create({
        name: storeName,
        slug: storeSlug || storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      });

      if (error) throw new Error(error.message);
      
      if (data?.id) {
        // Update the organization with custom fields since Better Auth's create doesn't support custom fields natively during creation yet
        await authClient.organization.update({
          organizationId: data.id,
          data: {
            description: storeDescription,
            contactEmail: storeEmail,
          }
        });

        await authClient.organization.setActive({
          organizationId: data.id,
        });
      }

      // Mark onboarding as complete
      await authClient.updateUser({
        onboardingCompleted: true
      });
      
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      alert("Failed to create store. Slug might be taken.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-[#08080a] px-6 font-sans text-[#FAF9F6] antialiased overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-[#DFBA73]/10 blur-[140px] animate-dobaeni-spin" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/[0.08] bg-[#121215]/80 p-8 md:p-12 backdrop-blur-3xl shadow-2xl"
      >
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#DFBA73]/80">
          setup // step 1
        </p>
        <h1 className="mt-4 text-3xl font-light tracking-wide font-display text-[#FAF9F6]">
          {role === 'seller' ? 'Set up your store' : 'Curate your feed'}
        </h1>
        <p className="mt-2 text-[14px] font-light text-[#7C7C83] leading-relaxed">
          {role === 'seller' 
            ? "Let's create your digital storefront. You can change these details later." 
            : "Choose up to 5 aesthetics to personalize your Dobaeni discovery experience."}
        </p>

        {role === 'buyer' && (
          <div className="mt-10">
            <div className="flex flex-wrap gap-3">
              {AESTHETICS.map((item) => {
                const isSelected = selected.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleSelection(item)}
                    className={`relative overflow-hidden px-5 py-2.5 rounded-full border transition-all duration-300 ${
                      isSelected 
                        ? 'border-[#DFBA73] text-[#08080a]' 
                        : 'border-white/[0.08] bg-white/[0.02] text-[#FAF9F6] hover:border-white/[0.2]'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activePill"
                        className="absolute inset-0 bg-[#DFBA73]"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2 text-[12px] font-mono uppercase tracking-wider">
                      {item}
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-12 flex items-center justify-between border-t border-white/[0.08] pt-6">
              <span className="text-[12px] text-[#7C7C83] font-mono">
                {selected.length}/5 selected
              </span>
              <button
                onClick={handleCompleteBuyer}
                disabled={busy || selected.length === 0}
                className="rounded-2xl bg-[#DFBA73] hover:bg-[#F0E2C3] px-8 py-3.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all disabled:opacity-50 disabled:hover:bg-[#DFBA73] shadow-[0_0_20px_rgba(223,186,115,0.15)]"
              >
                {busy ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {role === 'seller' && (
          <form onSubmit={handleCompleteSeller} className="mt-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest text-[#7C7C83] mb-2">
                  Store Name
                </label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
                  <input
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Dobaeni Official"
                    className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] pl-11 pr-4 py-3.5 text-[14px] text-[#FAF9F6] outline-none transition-all placeholder:text-[#52525B] focus:border-[#DFBA73]/50 focus:bg-white/[0.04]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest text-[#7C7C83] mb-2">
                  Store URL (Slug)
                </label>
                <div className="flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden focus-within:border-[#DFBA73]/50 focus-within:bg-white/[0.04] transition-all">
                  <span className="pl-4 py-3.5 text-[14px] text-[#52525B] select-none">dobaeni.com/</span>
                  <input
                    value={storeSlug}
                    onChange={(e) => setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="store-name"
                    className="w-full bg-transparent pr-4 py-3.5 text-[14px] text-[#FAF9F6] outline-none placeholder:text-[#52525B]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-[#7C7C83] mb-2">
                Contact Email
              </label>
              <input
                type="email"
                required
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
                placeholder="hello@yourbrand.com"
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 text-[14px] text-[#FAF9F6] outline-none transition-all placeholder:text-[#52525B] focus:border-[#DFBA73]/50 focus:bg-white/[0.04]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-[#7C7C83] mb-2">
                Brand Description
              </label>
              <textarea
                required
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                placeholder="Tell buyers what makes your brand unique..."
                rows={3}
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 text-[14px] text-[#FAF9F6] outline-none transition-all placeholder:text-[#52525B] focus:border-[#DFBA73]/50 focus:bg-white/[0.04] resize-none"
              />
            </div>

            <div className="mt-12 flex justify-end border-t border-white/[0.08] pt-6">
              <button
                type="submit"
                disabled={busy || !storeName}
                className="rounded-2xl bg-[#DFBA73] hover:bg-[#F0E2C3] px-8 py-3.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all disabled:opacity-50 disabled:hover:bg-[#DFBA73] shadow-[0_0_20px_rgba(223,186,115,0.15)]"
              >
                {busy ? 'Creating...' : 'Create Store'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </main>
  );
}