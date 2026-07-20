// Replaces the old proxy that forwarded to the Python FastAPI server.
// Now runs the Google ADK TypeScript agent IN-PROCESS and streams
// the same SSE protocol the ChatModal already consumes. This makes the
// whole app (Next.js + agent) a single `next build` deployable on Vercel
// — no separate Python server required.

import { NextRequest } from "next/server";
import { runChat } from "@/lib/agent/runChat";

// Next.js 16 only supports "nodejs" | "edge" | "experimental-edge" as runtime.
// The agent (pg + @google/adk + adk-llm-bridge) runs fine on the Node.js
// runtime — no "bun" runtime exists in Next. The project still uses Bun as
// its package manager / dev server; this only controls the route's JS host.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel Hobby ceiling; raise on Pro

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({ messages: [] }));
  const messages: { role: string; content: string }[] = Array.isArray(
    body?.messages
  )
    ? body.messages
    : [];

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)
        );
      };
      try {
        await runChat(messages, send);
      } catch (e: any) {
        send({ type: "error", text: String(e?.message || e) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
