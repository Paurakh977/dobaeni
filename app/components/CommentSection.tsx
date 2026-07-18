'use client';

import { useState } from 'react';
import { Send, User } from 'lucide-react';
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
  const [visible, setVisible] = useState(5);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
        setIsExpanded(false);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Discussion Input Console */}
      <div className="rounded-xl border border-white/[0.08] bg-[#08080A]/40 p-3 transition-all duration-200 focus-within:border-white/20">
        {session ? (
          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder="Ask a question or contribute to the thread..."
              rows={isExpanded ? 3 : 1}
              maxLength={500}
              className="w-full resize-none bg-transparent text-xs text-[#FAF9F6] outline-none placeholder:text-[#52525B] transition-all duration-200"
            />
            {isExpanded && (
              <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.06] pt-2.5">
                <span className="font-mono text-[9px] text-[#52525B]">
                  {text.length}/500 characters
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsExpanded(false);
                      setText('');
                    }}
                    className="rounded-lg px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-[#8E8E93] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={busy || !text.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-[#DFBA73] px-4 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#08080A] disabled:opacity-40"
                  >
                    Post <Send size={10} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="py-1 text-center text-xs text-[#52525B]">
            <a href="/login" className="font-semibold text-[#DFBA73] hover:underline">
              Sign in
            </a>{' '}
            to participate.
          </p>
        )}
      </div>

      {/* Discussion Thread Timeline */}
      <div className="relative pl-2">
        {/* Subtle timeline track guide line */}
        {comments.length > 0 && (
          <div className="absolute bottom-4 left-6 top-4 w-px bg-white/[0.04]" />
        )}

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#52525B]">
              No discussion points yet. Be the first to start the thread.
            </p>
          ) : (
            comments.slice(0, visible).map((c) => (
              <div
                key={c.id}
                className="relative flex gap-3 text-xs"
              >
                {/* User node */}
                <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#18181B] border border-white/[0.08] font-mono text-[10px] font-semibold text-[#DFBA73]">
                  {c.user.name?.[0]?.toUpperCase() || <User size={10} />}
                </div>

                {/* Bubble frame card */}
                <div className="flex-1 rounded-xl border border-white/[0.04] bg-white/[0.01] p-3.5 hover:border-white/[0.08] transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[#FAF9F6]">{c.user.name}</p>
                    <p className="font-mono text-[9px] text-[#52525B]">{formatDate(c.createdAt)}</p>
                  </div>
                  <p className="mt-2 text-xs font-light leading-relaxed text-[#9A9AA0]">
                    {c.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {comments.length > visible && (
        <button
          onClick={() => setVisible((v) => v + 5)}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.01] py-2 text-center font-mono text-[10px] uppercase text-[#FAF9F6] hover:border-white/20"
        >
          Load More Comments
        </button>
      )}
    </div>
  );
}