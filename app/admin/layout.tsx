import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import AdminSidebar from './AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen bg-[#050507] text-[#FAF9F6]">
      <AdminSidebar />
      <div className="flex-1 md:ml-64">
        <header className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4 md:px-10">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#DFBA73]/80">
              dobaeni console
            </p>
            <p className="mt-1 text-lg font-light font-display">
              {session.user.name || session.user.email}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-full border border-white/[0.08] px-4 py-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#FAF9F6] transition-colors hover:border-[#DFBA73]/50"
          >
            Exit to app
          </Link>
        </header>
        <main className="px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
