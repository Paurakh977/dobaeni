import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHAT_BACKEND =
  process.env.CHAT_BACKEND_URL ?? "http://localhost:8000/api/chat/stream";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const upstream = await fetch(CHAT_BACKEND, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!upstream.ok || !upstream.body) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", text: "Chat backend unavailable" })}\n\n` +
        `data: ${JSON.stringify({ type: "done", text: "" })}\n\n`,
      {
        status: 502,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }

  // Pipe the FastAPI SSE stream straight through to the browser.
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
