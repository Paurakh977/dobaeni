import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import AdminSidebar from './AdminSidebar';
import { LogOut } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen bg-[#050507] text-[#FAF9F6] selection:bg-[#DFBA73]/30 selection:text-[#DFBA73] relative overflow-hidden">
      {/* High-fidelity fluid gradient glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-[25%] -right-[15%] h-[80%] w-[60%] rounded-full bg-[#DFBA73]/[0.025] blur-[140px]" />
        <div className="absolute -bottom-[15%] -left-[10%] h-[70%] w-[50%] rounded-full bg-[#8A2BE2]/[0.015] blur-[120px]" />
        <div className="absolute top-[30%] left-[25%] h-[50%] w-[40%] rounded-full bg-white/[0.005] blur-[100px]" />
      </div>

      <AdminSidebar />
      <div className="flex-1 md:ml-64 relative z-10">
        {/* Navigation Glass Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.04] bg-[#050507]/60 px-6 py-4 backdrop-blur-xl md:px-10">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.4em] text-[#DFBA73]/80">
              <span className="h-1.5 w-1.5 rounded-full bg-[#DFBA73] shadow-[0_0_8px_#DFBA73] animate-pulse" />
              dobaeni console
            </p>
            <p className="mt-1 text-[17px] font-light font-display text-[#FAF9F6] opacity-90">
              {session.user.name || session.user.email}
            </p>
          </div>
          
          {/* Logout Action */}
          <Link
            href="/dashboard"
            className="group relative flex items-center gap-2 overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.01] px-5 py-2.5 text-[11px] font-mono uppercase tracking-[0.2em] text-[#FAF9F6] transition-all hover:border-[#DFBA73]/40 hover:bg-[#DFBA73]/5 shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
          >
            <span className="relative z-10">Exit to app</span>
            <LogOut size={13} className="relative z-10 transition-transform group-hover:translate-x-0.5 text-[#DFBA73]" />
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#DFBA73]/0 via-[#DFBA73]/10 to-[#DFBA73]/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </Link>
        </header>
        
        <main className="px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}