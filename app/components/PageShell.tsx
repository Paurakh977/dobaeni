import Navbar from '@/app/Navbar';
import CustomCursor from '@/app/CustomCursor';

export default function PageShell({
  children,
  className = '',
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`dobaeni-page relative flex min-h-screen flex-col font-sans text-[#FAF9F6] ${className}`}
    >
      <div className="dobaeni-noise" />
      <CustomCursor />
      <Navbar />
      <main className={`relative z-10 flex-1 ${padded ? 'px-6 pb-16 pt-28 md:px-12' : ''}`}>
        {children}
      </main>
    </div>
  );
}
