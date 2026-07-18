"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronDown,
  Minus,
  Square,
  X,
  Sparkles,
  ArrowDown,
  Copy,
  Check,
  Send,
} from "lucide-react";

const API_BASE = "/api/chat";
const MODEL = "deepseek-v4-flash-free";

type Role = "user" | "assistant";

type Message = {
  role: Role;
  content: string;
  reasoning: string;
  streaming: boolean;
  /** true only while reasoning tokens are actively arriving for this turn */
  reasoningActive: boolean;
  thinkingStartedAt: number | null;
  thinkingEndedAt: number | null;
};

function parseSSE(buffer: string): { events: any[]; rest: string } {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  const events: any[] = [];
  for (const part of parts) {
    const line = part.split("\n").find((l) => l.startsWith("data:"));
    if (!line) continue;
    const json = line.slice(5).trim();
    if (!json) continue;
    try {
      events.push(JSON.parse(json));
    } catch {
      /* ignore malformed */
    }
  }
  return { events, rest };
}

/* ----------------------------------------------------------------------- */
/* Bouncing dot loader                                                      */
/* ----------------------------------------------------------------------- */

// Ids are generated per-instance so two of these on a page never fight over
// the same SMIL animation timeline (the previous hardcoded ids collided
// whenever this rendered twice).
export function MessageLoading({ className = "text-[#E07A5F]" }: { className?: string }) {
  const uid = useId();
  const idA = `spinnerA-${uid}`;
  const idB = `spinnerB-${uid}`;

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="4" cy="12" r="2" fill="currentColor">
        <animate
          id={idA}
          begin={`0;${idB}.end+0.25s`}
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
      <circle cx="12" cy="12" r="2" fill="currentColor">
        <animate
          begin={`${idA}.begin+0.1s`}
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
      <circle cx="20" cy="12" r="2" fill="currentColor">
        <animate
          id={idB}
          begin={`${idA}.begin+0.2s`}
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
    </svg>
  );
}

/* ----------------------------------------------------------------------- */
/* Markdown                                                                 */
/* ----------------------------------------------------------------------- */

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.04] bg-[#0c0c0e] shadow-lg">
      <div className="flex items-center justify-between border-b border-white/[0.03] bg-white/[0.01] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-[#8E8E93]">
        <span>{language || "source"}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 transition-colors hover:text-[#E5C483]">
          {copied ? (
            <>
              <Check size={10} className="text-[#E5C483]" />
              <span className="text-[#E5C483]">Copied</span>
            </>
          ) : (
            <>
              <Copy size={10} />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>
      <pre className="custom-scroll overflow-x-auto p-4 font-mono text-[11.5px] leading-relaxed text-[#FAF9F6]/80">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Real markdown, via react-markdown + remark-gfm — replaces the old regex
 * splitter, which only understood `` ` `` / `**` inline and had no ordered
 * lists, tables, blockquotes, or links.
 *
 * Deliberately doesn't hardcode a text color anywhere except the
 * always-brand bits (links, inline code, table headers). Everything else
 * inherits from whatever wraps it, so the exact same renderer reads as
 * near-white prose inside the answer and as muted grey inside the
 * "contemplating" trace, with zero extra props.
 */
function Markdown({ content }: { content: string }) {
  if (!content) return null;

  return (
    <div className="space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E5C483] underline decoration-[#E5C483]/30 underline-offset-2 transition-colors hover:decoration-[#E5C483]/70"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-semibold tracking-wide">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          del: ({ children }) => <del className="opacity-60">{children}</del>,
          ul: ({ children }) => (
            <ul className="ml-5 list-disc space-y-1.5 marker:text-[#E5C483]/60">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="ml-5 list-decimal space-y-1.5 marker:text-[#E5C483]/60">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="pl-1.5 text-[13.5px] font-light leading-relaxed">{children}</li>
          ),
          h1: ({ children }) => (
            <h2 className="text-[17px] font-light uppercase tracking-wider">{children}</h2>
          ),
          h2: ({ children }) => (
            <h3 className="text-[15px] font-medium tracking-wide">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-[13px] font-semibold uppercase tracking-wider">{children}</h4>
          ),
          h4: ({ children }) => (
            <h4 className="text-[12.5px] font-semibold uppercase tracking-wider opacity-90">{children}</h4>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l border-[#E5C483]/30 pl-4 italic opacity-80">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-white/[0.06]" />,
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-md border border-white/[0.06]">
              <table className="w-full border-collapse text-[12.5px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-white/[0.02]">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-white/[0.08] px-3 py-1.5 text-left font-medium text-[#E5C483]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-t border-white/[0.05] px-3 py-1.5">{children}</td>
          ),
          // pre is a no-op wrapper; CodeBlock supplies its own <pre>, so we
          // don't end up with <pre><pre><code>.
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const text = String(children).replace(/\n$/, "");
            const match = /language-(\w+)/.exec(className || "");
            // No `inline` prop to rely on across react-markdown versions —
            // a fenced block always carries a language className OR
            // contains a newline; a real inline code span never does.
            const isBlock = Boolean(match) || text.includes("\n");
            if (!isBlock) {
              return (
                <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-[#E5C483]">
                  {children}
                </code>
              );
            }
            return <CodeBlock code={text} language={match?.[1]} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Thinking block                                                           */
/* ----------------------------------------------------------------------- */

function ThinkingBlock({
  text,
  active,
  elapsedMs,
}: {
  text: string;
  active: boolean;
  elapsedMs: number;
}) {
  // Unfolds automatically while reasoning is streaming in and folds back
  // ~0.5s after it wraps up — exactly once the user clicks the node or
  // label, their choice sticks for the rest of this turn.
  const [open, setOpen] = useState(active);
  const userSetRef = useRef(false);
  const wasActiveRef = useRef(active);
  const scrollBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userSetRef.current) {
      wasActiveRef.current = active;
      return;
    }
    if (active) {
      setOpen(true);
    } else if (wasActiveRef.current && !active) {
      const t = setTimeout(() => setOpen(false), 500);
      wasActiveRef.current = active;
      return () => clearTimeout(t);
    }
    wasActiveRef.current = active;
  }, [active]);

  useEffect(() => {
    if (active && open && scrollBoxRef.current) {
      scrollBoxRef.current.scrollTop = scrollBoxRef.current.scrollHeight;
    }
  }, [text, active, open]);

  const toggle = () => {
    userSetRef.current = true;
    setOpen((o) => !o);
  };

  if (!text) return null;

  const seconds = Math.max(1, Math.round(elapsedMs / 1000));

  return (
    <div className="relative pl-[26px]">
      <div className="absolute bottom-0 left-[7px] top-[18px] w-[1px] bg-neutral-800/80" />

      <button
        type="button"
        onClick={toggle}
        className="absolute left-0 top-[1px] flex h-[15px] w-[15px] items-center justify-center transition-transform active:scale-90"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5 text-[#E07A5F]">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-30" />
          <circle cx="12" cy="12" r="4.5" fill="currentColor" />
        </svg>
      </button>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 text-left font-mono text-[11px] uppercase tracking-[0.2em] text-[#E07A5F]/90 transition-colors hover:text-[#E07A5F]"
          >
            <span>{active ? "Contemplating" : `Contemplated · ${seconds}s`}</span>
            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="inline-flex"
            >
              <ChevronDown size={11} />
            </motion.span>
          </button>

          {/* Still visibly "alive" even when folded mid-stream */}
          {active && !open && (
            <div className="ml-1 flex h-3.5 items-center">
              <MessageLoading className="h-4 w-5 text-[#E07A5F]" />
            </div>
          )}
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div
                ref={scrollBoxRef}
                className="custom-scroll max-h-64 overflow-y-auto overscroll-contain pb-4 pr-4 pt-2.5 font-sans text-[13px] font-light leading-relaxed text-[#8E8E93]/85"
                data-lenis-prevent
              >
                <Markdown content={text} />
                {active && (
                  <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-[#E5C483]" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Messages                                                                  */
/* ----------------------------------------------------------------------- */

function AssistantMessage({
  content,
  reasoning,
  streaming,
  reasoningActive,
  elapsedMs,
}: {
  content: string;
  reasoning: string;
  streaming: boolean;
  reasoningActive: boolean;
  elapsedMs: number;
}) {
  // Only show the "weaving response" placeholder when there's genuinely
  // nothing else on screen yet — previously this rendered *alongside* the
  // "Contemplating" state too, so two loading indicators talked over each
  // other at once.
  const showWeaving = streaming && !content && !reasoningActive;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="w-full space-y-4 pr-10"
    >
      {/* 1. Cogitation Phase */}
      <ThinkingBlock text={reasoning} active={reasoningActive} elapsedMs={elapsedMs} />

      {/* 2. Response Node Phase */}
      <div className="relative pl-[26px]">
        {streaming && (
          <div className="absolute bottom-0 left-[7px] top-[18px] w-[1px] bg-neutral-800/80" />
        )}

        <div className="absolute left-0 top-[3px] flex h-[15px] w-[15px] items-center justify-center">
          <div className="h-1.5 w-1.5 rounded-full bg-[#E5C483] shadow-[0_0_8px_rgba(229,196,131,0.5)]" />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#E5C483]">
            Dobaeni
          </span>
          <div className="space-y-3 pr-4 pt-1 text-[14px] leading-relaxed text-[#FAF9F6]/95">
            {showWeaving ? (
              <div className="flex items-center gap-2 font-mono text-xs italic text-neutral-500">
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  weaving response...
                </motion.span>
              </div>
            ) : content ? (
              <Markdown content={content} />
            ) : null}
            {streaming && content && (
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="ml-1 inline-block h-3.5 w-1.5 bg-[#E5C483]"
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="flex w-full justify-end pl-10"
    >
      <div className="flex flex-col items-end gap-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#E5C483]/60">
          You
        </span>
        <div className="max-w-full whitespace-pre-wrap text-right text-[13.5px] font-light leading-relaxed text-[#FAF9F6]">
          {content}
        </div>
      </div>
    </motion.div>
  );
}

const SUGGESTIONS = [
  "Summarize the latest drop in one line",
  "What materials define DOBAENI's aesthetic?",
  "Help me write a product description",
];

export function ChatModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [dims, setDims] = useState({ width: 440, height: 640 });
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resizeRef = useRef<"w" | "h" | "both" | null>(null);
  const pinnedRef = useRef(true);

  // Tracks whether the user has scrolled away from the bottom, so we know
  // whether to keep auto-following new content.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      pinnedRef.current = isAtBottom;
      setShowScrollBottom((prev) => (prev === !isAtBottom ? prev : !isAtBottom));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [open]);

  // Land at the bottom whenever the panel opens.
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [open]);

  // Prevent the page behind the modal from scrolling (and the modal scroll
  // from chaining through to the root page) while the chat is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("lenis:stop"));
    return () => {
      document.body.style.overflow = prev;
      window.dispatchEvent(new CustomEvent("lenis:start"));
    };
  }, [open]);

  // This is the actual scroll fix: watch the *content* wrapper's real box
  // size instead of reacting to the `messages` array reference. That way
  // we keep pinned to the bottom continuously while text streams in token
  // by token, and while the thinking accordion is animating open/closed —
  // both of which change layout height *between* state updates, which a
  // `useEffect(..., [messages])` can't see.
  useEffect(() => {
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl || !contentEl) return;
    const ro = new ResizeObserver(() => {
      if (pinnedRef.current) {
        scrollEl.scrollTop = scrollEl.scrollHeight;
      }
    });
    ro.observe(contentEl);
    return () => ro.disconnect();
  }, [open]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
    }
  }, [input, open]);

  const startResize = useCallback(
    (e: React.MouseEvent, type: "w" | "h" | "both") => {
      e.preventDefault();
      resizeRef.current = type;
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = dims.width;
      const startH = dims.height;

      const onMove = (ev: MouseEvent) => {
        if (!resizeRef.current) return;
        const dW = startX - ev.clientX;
        const dH = startY - ev.clientY;
        setDims({
          width: Math.max(360, Math.min(window.innerWidth - 32, startW + dW)),
          height: Math.max(460, Math.min(window.innerHeight - 32, startH + dH)),
        });
      };
      const onUp = () => {
        resizeRef.current = null;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "default";
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.cursor =
        type === "both" ? "nwse-resize" : type === "w" ? "ew-resize" : "ns-resize";
    },
    [dims]
  );

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    const blank = {
      reasoning: "",
      streaming: false,
      reasoningActive: false,
      thinkingStartedAt: null,
      thinkingEndedAt: null,
    } as const;
    const next: Message[] = [
      ...messages,
      { role: "user", content: text, ...blank },
      { role: "assistant", content: "", ...blank, streaming: true },
    ];
    setMessages(next);
    setInput("");
    setBusy(true);

    // Sending is an explicit "take me to what happens next" — always
    // resume auto-follow even if the user had scrolled up mid-conversation.
    pinnedRef.current = true;
    setShowScrollBottom(false);
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });

    const idx = next.length - 1;

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { role: "user", content: text }],
        }),
      });
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { events, rest } = parseSSE(buffer);
        buffer = rest;

        for (const ev of events) {
          if (ev.type === "reasoning") {
            setMessages((prev) =>
              prev.map((m, i) => {
                if (i !== idx) return m;
                return {
                  ...m,
                  reasoning: m.reasoning + ev.text,
                  reasoningActive: true,
                  thinkingStartedAt: m.thinkingStartedAt ?? Date.now(),
                };
              })
            );
          } else if (ev.type === "answer") {
            setMessages((prev) =>
              prev.map((m, i) => {
                if (i !== idx) return m;
                const closingThinking = m.reasoningActive;
                return {
                  ...m,
                  content: m.content + ev.text,
                  reasoningActive: false,
                  thinkingEndedAt: closingThinking ? Date.now() : m.thinkingEndedAt,
                };
              })
            );
          } else if (ev.type === "error") {
            setMessages((prev) =>
              prev.map((m, i) => (i === idx ? { ...m, content: m.content || `⚠ ${ev.text}` } : m))
            );
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m, i) => (i === idx ? { ...m, content: m.content || `⚠ ${String(err)}` } : m))
      );
    } finally {
      setMessages((prev) =>
        prev.map((m, i) => {
          if (i !== idx) return m;
          return {
            ...m,
            streaming: false,
            reasoningActive: false,
            thinkingEndedAt: m.thinkingEndedAt ?? (m.thinkingStartedAt ? Date.now() : null),
          };
        })
      );
      setBusy(false);
    }
  }, [input, busy, messages]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const copyMessage = (i: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  const jumpToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    pinnedRef.current = true;
    setShowScrollBottom(false);
  };

  const header = (
    <div className="flex items-center justify-between border-b border-white/[0.04] bg-[#050505]/95 px-6 py-[18px] backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="font-serif text-[11px] font-bold uppercase tracking-[0.4em] text-[#E5C483]">
          Dobaeni
        </span>
        <span className="h-[3px] w-[3px] rounded-full bg-[#E5C483]/60" />
        <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-[#8E8E93]/70">
          {MODEL}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[#8E8E93]">
        <button
          onClick={() => setMaximized((m) => !m)}
          className="rounded-full p-1.5 transition-colors hover:bg-white/[0.04] hover:text-[#FAF9F6]"
          title={maximized ? "Restore" : "Maximize"}
        >
          {maximized ? <Minus size={13} /> : <Square size={11} />}
        </button>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 transition-colors hover:bg-white/[0.04] hover:text-[#FAF9F6]"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );

  const body = (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[#050505]">
      <div ref={scrollRef} data-lenis-prevent className="custom-scroll flex-1 overflow-y-auto overscroll-contain">
        <div ref={contentRef} className="space-y-8 px-6 py-6">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-[#E5C483]/15 bg-[#0a0a0c] text-[#E5C483] shadow-lg shadow-[#E5C483]/5"
              >
                <Sparkles size={18} className="stroke-[1.5]" />
              </motion.div>
              <h3 className="mt-2 font-serif text-sm font-bold uppercase tracking-[0.2em] text-[#FAF9F6]">
                Atelier Dobaeni
              </h3>
              <p className="mt-2 max-w-[280px] px-2 text-[12.5px] font-light leading-relaxed text-[#8E8E93]/80">
                Conversational framework designed for modern aesthetic evaluation and drafting.
              </p>

              <div className="mt-12 flex w-full max-w-[360px] flex-col gap-3.5">
                <span className="mb-1 border-b border-white/[0.04] pb-2 text-left font-mono text-[9px] uppercase tracking-[0.3em] text-[#E5C483]/50">
                  Suggested inquiries
                </span>
                {SUGGESTIONS.map((s, idx) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    whileHover={{ x: 2 }}
                    onClick={() => {
                      setInput(s);
                      textareaRef.current?.focus();
                    }}
                    className="group flex items-center justify-between border-b border-white/[0.03] py-2.5 text-left text-[13px] font-light text-neutral-400 transition-all duration-300 hover:border-[#E5C483]/30 hover:text-[#E5C483]"
                  >
                    <span className="line-clamp-1">{s}</span>
                    <span className="translate-x-[-4px] text-xs text-[#E5C483] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                      ↗
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m, i) =>
              m.role === "user" ? (
                <UserMessage key={i} content={m.content} />
              ) : (
                <div key={i} className="group/msg relative">
                  <AssistantMessage
                    content={m.content}
                    reasoning={m.reasoning}
                    streaming={m.streaming}
                    reasoningActive={m.reasoningActive}
                    elapsedMs={
                      m.thinkingStartedAt
                        ? (m.thinkingEndedAt ?? Date.now()) - m.thinkingStartedAt
                        : 0
                    }
                  />
                  {!m.streaming && m.content && (
                    <button
                      onClick={() => copyMessage(i, m.content)}
                      className="absolute right-0 top-0 rounded p-1.5 text-[#8E8E93]/60 opacity-0 transition-opacity hover:text-[#E5C483] group-hover/msg:opacity-100"
                      title="Copy reply"
                    >
                      {copiedIdx === i ? <Check size={12} className="text-[#E5C483]" /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showScrollBottom && (
          <motion.button
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            onClick={jumpToBottom}
            className="absolute bottom-5 right-6 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-[#0c0c0e]/90 text-white shadow-xl backdrop-blur-md transition-all hover:border-[#E5C483]/30 hover:text-[#E5C483]"
          >
            <ArrowDown size={13} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );

  const inputBar = (
    <div className="border-t border-white/[0.04] bg-[#050505] px-6 py-[22px]">
      <div className="flex items-end gap-3 border-b border-white/[0.06] bg-transparent pb-2.5 transition-all focus-within:border-[#E5C483]/50 focus-within:shadow-[0_4px_20px_-10px_rgba(229,196,131,0.08)]">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={busy ? "Contemplating stream active..." : "Weave your message here..."}
          disabled={busy}
          className="max-h-[140px] min-h-[34px] flex-1 resize-none bg-transparent py-1.5 text-[13.5px] font-light leading-relaxed text-[#FAF9F6] placeholder:text-neutral-500/80 focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={busy || !input.trim()}
          className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-gradient-to-tr from-[#E5C483] to-[#C29F5D] text-[#050505] shadow-md shadow-[#E5C483]/10 transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-20"
          title="Send"
        >
          <motion.span
            animate={busy ? { rotate: 360 } : { rotate: 0 }}
            transition={busy ? { duration: 1.2, repeat: Infinity, ease: "linear" } : { duration: 0.25 }}
            className="flex items-center justify-center"
          >
            {busy ? (
              <span className="block h-3.5 w-3.5 rounded-full border-2 border-[#050505]/40 border-t-[#050505]" />
            ) : (
              <Send size={11} className="ml-0.5" />
            )}
          </motion.span>
        </button>
      </div>
      <div className="mt-3.5 flex justify-between px-1">
        <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-[#8E8E93]/40">
          DESIGNED FOR AESTHETICS
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-[#E5C483]/70">
          {busy ? "Contemplating" : "system idle"}
        </span>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 9999px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(229, 196, 131, 0.15);
        }
        ::selection {
          background: rgba(229, 196, 131, 0.15);
          color: #FAF9F6;
        }
      `}</style>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 32, scale: 0.98, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={
              maximized
                ? "fixed bottom-0 right-0 z-[60] flex h-[90vh] w-full flex-col overflow-hidden border-l border-t border-white/[0.08] bg-[#050505] shadow-2xl shadow-black/90 sm:h-[90vh] sm:w-[860px] sm:rounded-tl-3xl"
                : "fixed bottom-0 right-0 z-[60] flex flex-col overflow-hidden rounded-none border-l border-t border-white/[0.08] bg-[#050505] shadow-2xl shadow-black/95 sm:rounded-tl-3xl"
            }
            style={
              maximized
                ? undefined
                : ({ width: `${dims.width}px`, height: `${dims.height}px` } as React.CSSProperties)
            }
          >
            {!maximized && (
              <>
                <div
                  onMouseDown={(e) => startResize(e, "both")}
                  className="absolute left-0 top-0 z-50 h-5 w-5 cursor-nwse-resize transition-colors hover:bg-white/[0.02]"
                />
                <div
                  onMouseDown={(e) => startResize(e, "h")}
                  className="absolute left-5 right-0 top-0 z-50 h-1.5 cursor-ns-resize transition-colors hover:bg-white/[0.02]"
                />
                <div
                  onMouseDown={(e) => startResize(e, "w")}
                  className="absolute bottom-0 left-0 top-5 z-50 w-1.5 cursor-ew-resize transition-colors hover:bg-white/[0.02]"
                />
              </>
            )}

            {header}
            {body}
            {inputBar}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}