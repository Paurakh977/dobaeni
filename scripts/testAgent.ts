#!/usr/bin/env bun
/**
 * TS equivalent of server/test_agent.py — streams prompts to the in-process
 * ADK agent (now served at /api/chat by the Next.js Bun route), prints tool
 * calls + answers, and verifies every markdown URL emits a real HTTP 200/3xx
 * against the running Next.js (Bun) server.
 */

const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";
const CHAT_URL = `${BASE}/api/chat`;

const URL_RE = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;

function httpCheck(url: string): Promise<string> {
  return fetch(url, { redirect: "follow" })
    .then((r) => (r.status < 400 ? `OK(${r.status})` : `BROKEN(${r.status})`))
    .catch((e) => `ERROR:${e.message}`);
}

async function run(prompt: string) {
  console.log("\n" + "=".repeat(70));
  console.log(`PROMPT: ${prompt}`);
  console.log("=".repeat(70));

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
  });

  if (!resp.body) {
    console.log("NO RESPONSE BODY");
    return;
  }

  const answerParts: string[] = [];
  let reasoningCount = 0;
  let reasoningSample = "";
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload) continue;
      let ev: any;
      try {
        ev = JSON.parse(payload);
      } catch {
        continue;
      }
      const t = ev.type;
      if (t === "tool_call") console.log(`  [TOOL CALL] ${ev.text}`);
      else if (t === "tool_result") console.log(`  [TOOL RESULT] ${ev.text}`);
      else       if (t === "reasoning") {
        reasoningCount++;
        if (reasoningSample.length < 240) reasoningSample += ev.text;
      } else if (t === "answer") answerParts.push(ev.text);
      else if (t === "error") console.log(`  [ERROR] ${ev.text}`);
      else if (t === "done") {
        // consume rest by breaking after flushing buffer
      }
    }
  }

  const answer = answerParts.join("");
  console.log(`\n--- REASONING (${reasoningCount} chunks) ---`);
  console.log(reasoningSample || "(none)");
  console.log("\n--- ANSWER ---");
  console.log(answer);

  URL_RE.lastIndex = 0;
  const urls: [string, string][] = [];
  let m: RegExpExecArray | null;
  while ((m = URL_RE.exec(answer))) urls.push([m[1], m[2]]);

  if (urls.length) {
    console.log("\n--- URL CHECK (HTTP) ---");
    for (const [label, u] of urls) {
      const status = await httpCheck(u);
      const flag = status.startsWith("OK") ? "OK" : "!!! " + status;
      console.log(`  ${flag}  ${label} -> ${u}`);
    }
  } else {
    console.log("\n(no URLs in answer)");
  }
}

const prompts =
  process.argv.length > 2
    ? [process.argv[2]]
    : [
        "boho wedding dresses under 3000 rupees",
        "suggest something for a date night",
        "i need a gift for my sister, she likes vintage stuff",
        "what are some affordable streetwear brands in kathmandu?",
        "show me kurtas",
        "something for dashain festive season",
        "red carpet gown under 1000",
        "hi! who are you?",
      ];

for (const p of prompts) {
  await run(p);
}
console.log("\nDONE");
