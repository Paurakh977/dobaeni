#!/usr/bin/env python3
"""Test harness for the Dobaeni chat agent.

Streams a prompt to /api/chat/stream, prints tool calls + the answer, and
verifies every markdown URL the model emits resolves to a real product/brand
slug in the DB (catches hallucinated links).
"""
import sys, json, re, asyncio, asyncpg
import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

DB = "postgresql://dobaeni:dobaeni@localhost:5432/dobaeni"
URL_RE = re.compile(r"\[([^\]]+)\]\((https?://[^)]+)\)")

def http_check(url: str) -> str:
    """Real HTTP verification against the running Next.js (Bun) server:
    200/3xx => the link resolves to an actual page; 404/500 => broken
    (likely a hallucinated/hand-built slug)."""
    try:
        r = requests.get(url, timeout=20, allow_redirects=True)
    except Exception as exc:  # noqa: BLE001
        return f"ERROR:{exc}"
    if r.status_code < 400:
        return f"OK({r.status_code})"
    return f"BROKEN({r.status_code})"

def run(prompt: str):
    print("\n" + "=" * 70)
    print(f"PROMPT: {prompt}")
    print("=" * 70)
    resp = requests.post(
        "http://localhost:8000/api/chat/stream",
        json={"messages": [{"role": "user", "content": prompt}]},
        stream=True, timeout=60,
    )
    answer_parts = []
    tool_calls = []
    for line in resp.iter_lines(decode_unicode=True):
        if not line or not line.startswith("data:"):
            continue
        payload = line[len("data:"):].strip()
        if not payload:
            continue
        try:
            ev = json.loads(payload)
        except json.JSONDecodeError:
            continue
        t = ev.get("type")
        if t == "tool_call":
            print(f"  [TOOL CALL] {ev['text']}")
        elif t == "tool_result":
            print(f"  [TOOL RESULT] {ev['text']}")
        elif t == "reasoning":
            pass
        elif t == "answer":
            answer_parts.append(ev["text"])
        elif t == "error":
            print(f"  [ERROR] {ev['text']}")
        elif t == "done":
            break
    answer = "".join(answer_parts)
    print("\n--- ANSWER ---")
    print(answer)

    # verify URLs via real HTTP against the running Next.js (Bun) server
    urls = URL_RE.findall(answer)
    if urls:
        print("\n--- URL CHECK (HTTP) ---")
        for label, u in urls:
            status = http_check(u)
            flag = "OK" if status.startswith("OK") else "!!! " + status
            print(f"  {flag}  {label} -> {u}")
    else:
        print("\n(no URLs in answer)")

if __name__ == "__main__":
    prompts = [
        "boho wedding dresses under 3000 rupees",
        "suggest something for a date night",
        "i need a gift for my sister, she likes vintage stuff",
        "what are some affordable streetwear brands in kathmandu?",
        "show me kurtas",
        "something for dashain festive season",
        "red carpet gown under 1000",
        "hi! who are you?",
    ]
    if len(sys.argv) > 1:
        prompts = [sys.argv[1]]
    for p in prompts:
        run(p)
