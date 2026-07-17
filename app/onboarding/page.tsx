'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { authClient, useSession } from '@/lib/auth-client';
import { Loader2, Check, Store, User, Sparkles } from 'lucide-react';
import ImageUpload from '@/app/components/ImageUpload';
import {
  AESTHETICS,
  BUSINESS_TYPES,
  GENDER_OPTIONS,
  AGE_RANGES,
  BUDGET_RANGES,
  STYLE_INTENSITY,
} from '@/lib/format';

const OCCASIONS = [
  'Daily', 'Work', 'Party', 'Wedding', 'Festive', 'Date Night', 'Travel', 'Lounge',
];

const TOTAL_STEPS = 3;

function toggleMulti(list: string[], set: (v: string[]) => void, item: string, cap = 5) {
  if (list.includes(item)) set(list.filter((i) => i !== item));
  else if (list.length < cap) set([...list, item]);
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  // Buyer state
  const [avatar, setAvatar] = useState('');
  const [shopFor, setShopFor] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [intensity, setIntensity] = useState('');

  // Seller state
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [storeCity, setStoreCity] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [shippingPolicy, setShippingPolicy] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');

  useEffect(() => {
    if (!isPending && !session) router.push('/login');
  }, [isPending, session, router]);

  useEffect(() => {
    if (session?.user) {
      const r = (session.user as any).role;
      if (r === 'seller') setRole('seller');
      if (session.user.email && !contactEmail) setContactEmail(session.user.email);
    }
  }, [session, contactEmail]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08080a]">
        <Loader2 className="h-8 w-8 animate-spin text-[#DFBA73]" />
      </div>
    );
  }
  if (!session) return null;

  async function completeBuyer() {
    setBusy(true);
    try {
      await fetch('/api/buyer-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarUrl: avatar || null,
          preferredGenders: shopFor.length ? shopFor : null,
          ageRange: ageRange || null,
          city: city || null,
          bio: bio || null,
          preferredCategories: categories,
          preferredOccasions: occasions,
          budgetRange: budget || null,
          styleIntensity: intensity || null,
        }),
      });
      await authClient.updateUser({
        interests: JSON.stringify(categories),
        onboardingCompleted: true,
      } as never);
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function completeSeller() {
    setBusy(true);
    try {
      const { data, error } = await authClient.organization.create({
        name: storeName,
        slug: storeSlug || storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      });
      if (error) throw new Error(error.message);
      if (!data?.id) throw new Error('Store creation failed');

      await fetch(`/api/org/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logo: logo || null,
          banner: banner || null,
          description: description || null,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
          legalName: storeName,
          businessType: businessType || null,
          address: address || null,
          city: storeCity || null,
          websiteUrl: websiteUrl || null,
          shippingPolicy: shippingPolicy || null,
          returnPolicy: returnPolicy || null,
        }),
      });

      await authClient.updateUser({ onboardingCompleted: true } as never);
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to create store. The slug may already be taken.');
    } finally {
      setBusy(false);
    }
  }

  const canAdvance =
    role === 'buyer'
      ? step < 3
        ? true
        : categories.length > 0 && shopFor.length > 0 && ageRange && budget && intensity
      : step < 3
        ? storeName && logo
        : true;

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#08080a] px-6 py-16 font-sans text-[#FAF9F6] antialiased">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-[#DFBA73]/10 blur-[140px] animate-dobaeni-spin" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/[0.08] bg-[#121215]/80 p-8 shadow-2xl backdrop-blur-3xl md:p-12"
      >
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#DFBA73]/80">
            setup // step {step} of {TOTAL_STEPS}
          </p>
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <span
                key={i}
                className={`h-1 w-8 rounded-full transition-colors duration-500 ${
                  i < step ? 'bg-[#DFBA73]' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] ${
              role === 'seller' ? 'text-[#DFBA73]' : 'text-[#FAF9F6]'
            }`}
          >
            {role === 'seller' ? <Store size={18} /> : <User size={18} />}
          </span>
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#7C7C83]">
            {role === 'seller' ? 'Brand onboarding' : 'Personal onboarding'}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {role === 'buyer' ? (
            <BuyerSteps
              key={`b-${step}`}
              step={step}
              firstName={session.user.name?.split(' ')[0] || 'there'}
              avatar={avatar}
              setAvatar={setAvatar}
              shopFor={shopFor}
              setShopFor={setShopFor}
              ageRange={ageRange}
              setAgeRange={setAgeRange}
              city={city}
              setCity={setCity}
              bio={bio}
              setBio={setBio}
              categories={categories}
              occasions={occasions}
              setCategories={setCategories}
              setOccasions={setOccasions}
              budget={budget}
              setBudget={setBudget}
              intensity={intensity}
              setIntensity={setIntensity}
            />
          ) : (
            <SellerSteps
              key={`s-${step}`}
              step={step}
              storeName={storeName}
              setStoreName={setStoreName}
              storeSlug={storeSlug}
              setStoreSlug={setStoreSlug}
              logo={logo}
              setLogo={setLogo}
              banner={banner}
              setBanner={setBanner}
              businessType={businessType}
              setBusinessType={setBusinessType}
              description={description}
              setDescription={setDescription}
              contactEmail={contactEmail}
              setContactEmail={setContactEmail}
              contactPhone={contactPhone}
              setContactPhone={setContactPhone}
              address={address}
              setAddress={setAddress}
              storeCity={storeCity}
              setStoreCity={setStoreCity}
              websiteUrl={websiteUrl}
              setWebsiteUrl={setWebsiteUrl}
              shippingPolicy={shippingPolicy}
              setShippingPolicy={setShippingPolicy}
              returnPolicy={returnPolicy}
              setReturnPolicy={setReturnPolicy}
            />
          )}
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-between border-t border-white/[0.08] pt-6">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || busy}
            className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#7C7C83] transition-colors hover:text-[#FAF9F6] disabled:opacity-0"
          >
            ← Back
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance}
              className="rounded-2xl bg-[#DFBA73] px-8 py-3.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] shadow-[0_0_20px_rgba(223,186,115,0.15)] transition-all hover:bg-[#F0E2C3] disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={role === 'buyer' ? completeBuyer : completeSeller}
              disabled={busy || !canAdvance}
              className="flex items-center gap-2 rounded-2xl bg-[#DFBA73] px-8 py-3.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] shadow-[0_0_20px_rgba(223,186,115,0.15)] transition-all hover:bg-[#F0E2C3] disabled:opacity-40"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {busy ? 'Saving…' : 'Enter Dobaeni'}
            </button>
          )}
        </div>
      </motion.div>
    </main>
  );
}

// ── Small building blocks ────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-mono uppercase tracking-widest text-[#7C7C83]">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 text-[14px] text-[#FAF9F6] outline-none transition-all placeholder:text-[#52525B] focus:border-[#DFBA73]/50 focus:bg-white/[0.04]';

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-cursor="hover"
      aria-pressed={active}
      className={`relative overflow-hidden rounded-full border px-5 py-2.5 text-[12px] font-mono uppercase tracking-wider transition-all duration-300 ${
        active
          ? 'border-[#DFBA73] text-[#08080a]'
          : 'border-white/[0.08] bg-white/[0.02] text-[#FAF9F6] hover:border-white/[0.2]'
      }`}
    >
      {active && <span className="absolute inset-0 bg-[#DFBA73]" />}
      <span className="relative z-10 flex items-center gap-2">
        {active && <Check size={12} strokeWidth={3} />}
        {children}
      </span>
    </button>
  );
}

function StepTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-light tracking-wide font-display text-[#FAF9F6]">{title}</h1>
      <p className="mt-2 text-[14px] font-light leading-relaxed text-[#7C7C83]">{sub}</p>
    </div>
  );
}

// ── Buyer steps ──────────────────────────────────────────────────────────

function BuyerSteps(props: any) {
  const {
    step, firstName, avatar, setAvatar, shopFor, setShopFor, ageRange, setAgeRange,
    city, setCity, bio, setBio, categories, occasions, setCategories, setOccasions,
    budget, setBudget, intensity, setIntensity,
  } = props;

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {step === 1 && (
        <>
          <StepTitle title={`Welcome, ${firstName}`} sub="Let's put a face to your taste. Add an avatar and tell us a little about you." />
          <div className="space-y-6">
            <Field label="Profile photo">
              <ImageUpload value={avatar} onChange={setAvatar} label="Upload avatar" previewClass="h-24 w-24 rounded-full" />
            </Field>
            <Field label="City">
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Kathmandu" className={inputCls} />
            </Field>
            <Field label="A line about you (optional)">
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="I love quiet luxury and thrifted denim…" className={`${inputCls} resize-none`} />
            </Field>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <StepTitle title="About you" sub="This helps us tailor sizing, shipping and recommendations." />
          <div className="space-y-6">
            <Field label="I shop for">
              <div className="flex flex-wrap gap-3">
                {GENDER_OPTIONS.map((g) => (
                  <Pill
                    key={g.value}
                    active={shopFor.includes(g.value)}
                    onClick={() => toggleMulti(shopFor, setShopFor, g.value)}
                  >
                    {g.label}
                  </Pill>
                ))}
              </div>
            </Field>
            <Field label="Age range">
              <div className="flex flex-wrap gap-3">
                {AGE_RANGES.map((a) => (
                  <Pill key={a} active={ageRange === a} onClick={() => setAgeRange(a)}>
                    {a}
                  </Pill>
                ))}
              </div>
            </Field>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <StepTitle title="Your aesthetic" sub="Pick up to 5 aesthetics and the vibe you're after. You can change these anytime." />
          <div className="space-y-6">
            <Field label={`Aesthetics · ${categories.length}/5`}>
              <div className="flex flex-wrap gap-3">
                {AESTHETICS.map((a) => (
                  <Pill
                    key={a}
                    active={categories.includes(a)}
                    onClick={() => toggleMulti(categories, setCategories, a, 5)}
                  >
                    {a}
                  </Pill>
                ))}
              </div>
            </Field>
            <Field label="Occasions you dress for">
              <div className="flex flex-wrap gap-3">
                {OCCASIONS.map((o) => (
                  <Pill key={o} active={occasions.includes(o)} onClick={() => toggleMulti(occasions, setOccasions, o)}>
                    {o}
                  </Pill>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field label="Budget">
                <div className="flex flex-col gap-2">
                  {BUDGET_RANGES.map((b) => (
                    <Pill key={b.value} active={budget === b.value} onClick={() => setBudget(b.value)}>
                      {b.label}
                    </Pill>
                  ))}
                </div>
              </Field>
              <Field label="Style intensity">
                <div className="flex flex-col gap-2">
                  {STYLE_INTENSITY.map((s) => (
                    <Pill key={s.value} active={intensity === s.value} onClick={() => setIntensity(s.value)}>
                      {s.label}
                    </Pill>
                  ))}
                </div>
              </Field>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ── Seller steps ─────────────────────────────────────────────────────────

function SellerSteps(props: any) {
  const {
    step, storeName, setStoreName, storeSlug, setStoreSlug, logo, setLogo, banner,
    setBanner, businessType, setBusinessType, description, setDescription, contactEmail,
    setContactEmail, contactPhone, setContactPhone, address, setAddress, storeCity,
    setStoreCity, websiteUrl, setWebsiteUrl, shippingPolicy, setShippingPolicy,
    returnPolicy, setReturnPolicy,
  } = props;

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {step === 1 && (
        <>
          <StepTitle title="Brand identity" sub="Your logo and banner are the first impression buyers get. Make them count." />
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field label="Brand name">
                <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Dobaeni Official" className={inputCls} />
              </Field>
              <Field label="Store URL">
                <div className="flex items-center overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] focus-within:border-[#DFBA73]/50">
                  <span className="select-none px-4 py-3.5 text-[14px] text-[#52525B]">dobaeni.com/</span>
                  <input
                    value={storeSlug}
                    onChange={(e) => setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="store-name"
                    className="w-full bg-transparent py-3.5 pr-4 text-[14px] text-[#FAF9F6] outline-none placeholder:text-[#52525B]"
                  />
                </div>
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field label="Logo">
                <ImageUpload value={logo} onChange={setLogo} label="Upload logo" previewClass="h-24 w-24 rounded-2xl" />
              </Field>
              <Field label="Banner">
                <ImageUpload value={banner} onChange={setBanner} label="Upload banner" previewClass="h-24 w-full rounded-2xl" />
              </Field>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <StepTitle title="Business details" sub="The essentials buyers and Dobaeni need to know about your brand." />
          <div className="space-y-6">
            <Field label="Business type">
              <div className="flex flex-wrap gap-3">
                {BUSINESS_TYPES.map((b) => (
                  <Pill key={b} active={businessType === b} onClick={() => setBusinessType(b)}>
                    {b}
                  </Pill>
                ))}
              </div>
            </Field>
            <Field label="Description">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Tell buyers what makes your brand unique…" className={`${inputCls} resize-none`} />
            </Field>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field label="Contact email">
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="hello@brand.com" className={inputCls} />
              </Field>
              <Field label="Contact phone">
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+977 98XXXXXXXX" className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field label="City">
                <input value={storeCity} onChange={(e) => setStoreCity(e.target.value)} placeholder="Kathmandu" className={inputCls} />
              </Field>
              <Field label="Address">
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Thamel, Ward 12" className={inputCls} />
              </Field>
            </div>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <StepTitle title="Policies & links" sub="Set your shipping and return promises — these build buyer trust." />
          <div className="space-y-6">
            <Field label="Website (optional)">
              <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://yourbrand.com" className={inputCls} />
            </Field>
            <Field label="Shipping policy">
              <textarea value={shippingPolicy} onChange={(e) => setShippingPolicy(e.target.value)} rows={2} placeholder="2–4 business days within Kathmandu…" className={`${inputCls} resize-none`} />
            </Field>
            <Field label="Return policy">
              <textarea value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} rows={2} placeholder="7-day returns on unworn items…" className={`${inputCls} resize-none`} />
            </Field>
          </div>
        </>
      )}
    </motion.div>
  );
}
