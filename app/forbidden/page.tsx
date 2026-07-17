import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050507] px-6 text-center text-[#FAF9F6]">
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#DFBA73]/80">403</p>
      <h1 className="mt-4 text-3xl font-light font-display">Access denied</h1>
      <p className="mt-3 max-w-sm text-[13px] text-[#7C7C83]">
        You don't have permission to view this page. If you believe this is a mistake, contact a platform
        administrator.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-full border border-white/[0.08] px-5 py-2.5 text-[12px] font-mono uppercase tracking-[0.2em] transition-colors hover:border-[#DFBA73]/50"
        >
          Back to app
        </Link>
        <Link
          href="/"
          className="rounded-full border border-[#DFBA73]/30 px-5 py-2.5 text-[12px] font-mono uppercase tracking-[0.2em] text-[#DFBA73] transition-colors hover:bg-[#DFBA73]/10"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
