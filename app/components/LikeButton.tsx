'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { formatNumber } from '@/lib/format';

export default function LikeButton({
  productId,
  initialLiked,
  initialCount,
  showCount = true,
  size = 16,
  className = '',
}: {
  productId: string;
  initialLiked: boolean;
  initialCount: number;
  showCount?: boolean;
  size?: number;
  className?: string;
}) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!session) {
      window.location.href = '/login';
      return;
    }
    if (busy) return;
    setBusy(true);
    // Optimistic update
    const next = !liked;
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      if (next) {
        const res = await fetch('/api/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.likeCount === 'number') setCount(data.likeCount);
        } else {
          throw new Error('failed');
        }
      } else {
        const res = await fetch(`/api/likes?productId=${productId}`, { method: 'DELETE' });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.likeCount === 'number') setCount(data.likeCount);
        } else {
          throw new Error('failed');
        }
      }
    } catch {
      // Roll back on failure
      setLiked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      disabled={busy}
      data-cursor="hover"
      aria-pressed={liked}
      aria-label={liked ? 'Unlike' : 'Like'}
      className={`group flex items-center gap-1.5 rounded-full transition-all disabled:opacity-60 ${className}`}
    >
      <Heart
        size={size}
        className={
          liked
            ? 'fill-[#E2574C] text-[#E2574C]'
            : 'text-[#8E8E93] transition-colors group-hover:text-[#E2574C]'
        }
      />
      {showCount && (
        <span className={liked ? 'text-[#E2574C]' : 'text-[#8E8E93]'}>
          {formatNumber(count)}
        </span>
      )}
    </button>
  );
}
