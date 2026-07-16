'use client';

import { useState } from 'react';
import { Check, UserPlus } from 'lucide-react';
import { useSession } from '@/lib/auth-client';

export default function FollowButton({
  orgId,
  initialFollowing,
  initialCount,
  showCount = true,
  className = '',
}: {
  orgId: string;
  initialFollowing: boolean;
  initialCount: number;
  showCount?: boolean;
  className?: string;
}) {
  const { data: session } = useSession();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!session) {
      window.location.href = '/login';
      return;
    }
    setBusy(true);
    try {
      if (following) {
        const res = await fetch(`/api/follow?orgId=${orgId}`, { method: 'DELETE' });
        if (res.ok) {
          setFollowing(false);
          setCount((c) => Math.max(0, c - 1));
        }
      } else {
        const res = await fetch('/api/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orgId }),
        });
        if (res.ok) {
          setFollowing(true);
          setCount((c) => c + 1);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      data-cursor="hover"
      className={`group flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-mono uppercase tracking-[0.2em] transition-all disabled:opacity-60 ${
        following
          ? 'border border-white/[0.12] bg-white/[0.04] text-[#FAF9F6] hover:border-red-400/40 hover:text-red-400'
          : 'bg-[#DFBA73] text-[#08080a] hover:bg-[#F0E2C3]'
      } ${className}`}
    >
      {following ? <Check size={13} /> : <UserPlus size={13} />}
      <span>{following ? 'Following' : 'Follow'}</span>
      {showCount && (
        <span className={following ? 'text-[#8E8E93]' : 'text-[#08080a]/70'}>{count}</span>
      )}
    </button>
  );
}
