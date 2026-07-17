'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { formatDate } from '@/lib/format';
import type { CommentData } from '@/lib/queries';

export default function CommentSection({
  productId,
  initialComments,
  initialCount,
}: {
  productId: string;
  initialComments: CommentData[];
  initialCount: number;
}) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const value = text.trim();
    if (!value || busy) return;
    if (!session) {
      window.location.href = '/login';
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, content: value }),
      });
      if (res.ok) {
        const { comment } = await res.json();
        setComments((c) => [comment as CommentData, ...c]);
        setText('');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-end justify-between">
        <h2 className="text-xl font-light font-display text-[#FAF9F6]">
          Comments <span className="text-[#52525B]">({comments.length || initialCount})</span>
        </h2>
      </div>

      <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        {session ? (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Say something nice…"
              rows={3}
              maxLength={500}
              data-cursor="text"
              className="w-full resize-none rounded-xl border border-white/[0.08] bg-[#0E0E12] px-4 py-3 text-[13px] text-[#FAF9F6] outline-none placeholder:text-[#52525B] focus:border-[#DFBA73]/40"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={submit}
                disabled={busy || !text.trim()}
                className="rounded-xl bg-[#DFBA73] px-6 py-2.5 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#08080a] transition-all hover:bg-[#F0E2C3] disabled:opacity-40"
              >
                {busy ? 'Posting…' : 'Post comment'}
              </button>
            </div>
          </>
        ) : (
          <p className="text-[13px] text-[#52525B]">
            <a href="/login" className="text-[#DFBA73] hover:underline" data-cursor="hover">
              Sign in
            </a>{' '}
            to join the conversation.
          </p>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {comments.length === 0 ? (
          <p className="rounded-2xl border border-white/[0.06] bg-white/[0.01] py-10 text-center text-[13px] text-[#52525B]">
            No comments yet — be the first.
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DFBA73] text-[11px] font-bold text-[#08080a]">
                  {c.user.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-[13px] text-[#FAF9F6]">{c.user.name}</p>
                  <p className="text-[10px] text-[#52525B]">{formatDate(c.createdAt)}</p>
                </div>
              </div>
              <p className="mt-3 text-[13px] font-light leading-relaxed text-[#9A9AA0]">{c.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
