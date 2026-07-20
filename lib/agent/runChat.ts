// Ported from server/main.py — the request orchestration + SSE event loop.
// Instead of litellm + a hand-rolled tool loop, this drives the official
// ADK TypeScript Runner and translates its event stream into the SAME SSE
// event protocol the Next.js ChatModal already understands:
//   {type:"reasoning", text} | {type:"answer", text}
//   {type:"tool_call", text} | {type:"tool_result", text}
//   {type:"error", text} | {type:"done", text}
//
// ADK streams incremental tokens as `partial: true` events (reasoning tokens
// arrive as parts with `thought: true`, answer tokens as plain `text` parts).
// A final non-partial event repeats the FULL accumulated text — we dedupe so
// the client never renders the answer twice.

import {
  Runner,
  InMemorySessionService,
  getFunctionCalls,
  getFunctionResponses,
} from "@google/adk";
import { rootAgent, AGENT_NAME } from "./agent";

type SSEEvent = { type: string; text: string };

const APP_NAME = "dobaeni_chat";

function describeCall(name: string, args: Record<string, unknown>): string {
  const label = name === "find_products" ? "Searching products" : "Searching brands";
  const shown: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args || {})) {
    if (v === null || v === undefined || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    shown[k] = v;
  }
  return Object.keys(shown).length
    ? `${label} — ${JSON.stringify(shown)}`
    : label;
}

export async function runChat(
  messages: { role: string; content: string }[],
  emit: (e: SSEEvent) => void
): Promise<void> {
  if (!process.env.OPENCODE_API_KEY) {
    emit({
      type: "error",
      text: "OPENCODE_API_KEY is not set. Add it to your environment.",
    });
    emit({ type: "done", text: "" });
    return;
  }

  const userId = "dobaeni_user";
  const sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const sessionService = new InMemorySessionService();
  const runner = new Runner({ agent: rootAgent, appName: APP_NAME, sessionService });

  const session = await sessionService.createSession({ appName: APP_NAME, userId, sessionId });

  // The client sends the FULL history every request (system + turns). Replay
  // everything except the final user turn into the fresh session so the model
  // sees the same context the Python server gave it each call.
  const history = messages.filter((m) => m.role !== "system");
  const lastUser = history.length ? history[history.length - 1] : null;
  const seedMessages = lastUser ? history.slice(0, -1) : history;

  for (const m of seedMessages) {
    const isAssistant = m.role === "assistant";
    await sessionService.appendEvent({
      session,
      event: {
        author: isAssistant ? AGENT_NAME : "user",
        content: {
          role: isAssistant ? "model" : "user",
          parts: [{ text: m.content }],
        },
      } as any,
    });
  }

  const newMessage = {
    role: "user" as const,
    parts: [{ text: lastUser ? lastUser.content : "" }],
  };

  // Tracks whether we've streamed any answer text in the current turn segment.
  // Reset after each tool result so a later non-streaming fallback can fire.
  let anyAnswerEmitted = false;

  try {
    for await (const event of runner.runAsync({
      userId,
      sessionId,
      newMessage: newMessage as any,
      // "sse" makes the LlmAgent call the model with stream=true so we get
      // token-by-token partial events (ADK defaults to "none" = no streaming).
      runConfig: { streamingMode: "sse" } as any,
    })) {
      const ev: any = event;

      // Fatal error surfaced by the framework.
      if (ev.errorMessage) {
        emit({ type: "error", text: String(ev.errorMessage) });
        continue;
      }

      const calls = getFunctionCalls(ev);
      if (calls.length) {
        for (const call of calls) {
          emit({ type: "tool_call", text: describeCall(call.name ?? "unknown", call.args as any) });
        }
      }

      const responses = getFunctionResponses(ev);
      if (responses.length) {
        for (const r of responses) {
          const resp: any = r.response;
          const ok = resp && resp.status === "success";
          const count = resp && typeof resp.count === "number" ? resp.count : 0;
          emit({
            type: "tool_result",
            text: ok ? `Found ${count} result(s)` : "No results",
          });
        }
        // A tool result starts a fresh answer segment — allow a non-streaming
        // fallback for whatever the model says next.
        anyAnswerEmitted = false;
      }

      const isPartial = ev?.partial === true;
      const parts: any[] = ev?.content?.parts || [];
      for (const p of parts) {
        if (p.functionCall || p.functionResponse) continue;

        if (p.thought && typeof p.text === "string" && p.text) {
          // Reasoning tokens only ever arrive as streaming partials.
          if (isPartial) emit({ type: "reasoning", text: p.text });
          continue;
        }
        if (typeof p.text === "string" && p.text) {
          // ADK re-emits the full consolidated text on the final non-partial
          // event — skip it to avoid duplicating the streamed deltas (this is
          // how the Python server behaved: it only concatenated delta.content).
          if (isPartial) {
            anyAnswerEmitted = true;
            emit({ type: "answer", text: p.text });
          } else if (!anyAnswerEmitted) {
            // Fallback: only if nothing streamed at all this segment.
            anyAnswerEmitted = true;
            emit({ type: "answer", text: p.text });
          }
        }
      }
    }
  } catch (exc: any) {
    emit({ type: "error", text: String(exc?.message || exc) });
  }

  emit({ type: "done", text: "" });
}
