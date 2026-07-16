'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export default function CartBadge({ className = '' }: { className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch('/api/cart')
      .then((r) => r.json())
      .then((d) => setCount(d.count || 0))
      .catch(() => {});
  }, []);

  return (
    <Link
      href="/cart"
      data-cursor="hover"
      className={`relative flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.12] bg-[#08080a]/80 text-[#FAF9F6] backdrop-blur-md transition-all hover:border-[#DFBA73]/50 ${className}`}
      aria-label="Cart"
    >
      <ShoppingBag size={15} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DFBA73] px-1 text-[9px] font-bold text-[#08080a]">
          {count}
        </span>
      )}
    </Link>
  );
}
