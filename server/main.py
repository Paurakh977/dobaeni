#!/usr/bin/env python3
"""
app.py
======

A minimal FastAPI server that wraps the OpenCode Zen chat logic and exposes
it to the Next.js frontend over HTTP streaming (SSE).

This version adds tool calling: the model can call `find_products` /
`find_brands` (server/db_tools.py) to look up Dobaeni's real, read-only
catalog before recommending anything, then keeps streaming its answer once
the tool result comes back. See server/tool_specs.py for the tool schemas
and server/system_prompt.py for the instructions that tell the model when
to use them.

Everything below is async (litellm.acompletion + asyncpg), deliberately —
the DB tools keep one lazily-created connection pool alive for the life of
the process, and that pool is bound to whichever event loop first creates
it. Mixing in `asyncio.run()` per-call (spinning up a fresh loop each time)
would eventually hand the pool to a closed loop and break. Running the whole
request path on FastAPI/uvicorn's single event loop avoids that.

Endpoints
---------

  GET  /api/health
      Liveness check.

  POST /api/chat/stream
      Body: {"messages": [{"role": "user"|"assistant"|"system",
                            "content": "..."}, ...]}
      Returns a ``text/event-stream`` response. Each event is a JSON object
      sent as ``data: {json}\n\n`` with one of:
        {"type": "reasoning",   "text": "..."}  # thinking content (partial)
        {"type": "answer",      "text": "..."}  # answer content (partial)
        {"type": "tool_call",   "text": "..."}  # a tool is being run (name + args)
        {"type": "tool_result", "text": "..."}  # that tool's result count
        {"type": "error",       "text": "..."}  # fatal error message
        {"type": "done",        "text": ""}      # stream finished

The model is fixed to ``deepseek-v4-flash-free`` (model #14 from the OpenCode
Zen list) per the project requirement; no model picker is exposed.

Run with:

    uv run uvicorn server.app:app --reload --port 8000

(or ``python -m uvicorn server.app:app --reload --port 8000``).
"""

from __future__ import annotations

import json
import os
from typing import Any, AsyncGenerator, Optional

import litellm
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from system_prompt import SYSTEM_PROMPT
from tool_specs import TOOL_IMPL, TOOLS

# ---------------------------------------------------------------------------
# Reused configuration / constants
# ---------------------------------------------------------------------------

OPENCODE_API_BASE = "https://opencode.ai/zen/v1"
OPENCODE_MODELS_URL = f"{OPENCODE_API_BASE}/models"
ENV_VAR_NAME = "OPENCODE_API_KEY"

# The single model we expose to the chat UI.
FIXED_MODEL_ID = "deepseek-v4-flash-free"

MAX_RETRIES = 3
RETRY_BASE_DELAY_SECONDS = 1.5
REQUEST_TIMEOUT_SECONDS = 30

# Caps how many "model calls a tool -> we run it -> model calls again" hops
# a single turn can take, so a confused model can't loop forever burning
# requests. On the last round we drop `tools` from the request so the model
# is forced to answer in plain text using whatever it already fetched.
MAX_TOOL_ROUNDS = 5

litellm.drop_params = True  # silently drop kwargs a given model doesn't accept

# ---------------------------------------------------------------------------
# Reasoning / thinking extraction
# ---------------------------------------------------------------------------


def _extract_thinking_text(blocks: Any) -> str:
    """Pull plain text out of a ``thinking_blocks``-style structure."""
    if not blocks:
        return ""
    text = ""
    try:
        for block in blocks:
            if isinstance(block, dict):
                text += block.get("thinking") or block.get("text") or ""
            else:
                text += getattr(block, "thinking", "") or getattr(block, "text", "") or ""
    except TypeError:
        return ""
    return text


def extract_delta_parts(delta: Any) -> tuple[str, str]:
    """Given a streamed chunk's ``delta`` object, return
    ``(answer_text, reasoning_text)``.
    """
    answer_text = getattr(delta, "content", None) or ""

    reasoning_text = getattr(delta, "reasoning_content", None) or ""

    if not reasoning_text:
        reasoning_text = getattr(delta, "reasoning", None) or ""

    if not reasoning_text:
        thinking_attr = getattr(delta, "thinking", None)
        if isinstance(thinking_attr, str):
            reasoning_text = thinking_attr

    if not reasoning_text:
        reasoning_text = _extract_thinking_text(getattr(delta, "thinking_blocks", None))

    if not reasoning_text:
        provider_fields = getattr(delta, "provider_specific_fields", None)
        if isinstance(provider_fields, dict):
            reasoning_text = (
                provider_fields.get("reasoning_content")
                or provider_fields.get("reasoning")
                or _extract_thinking_text(provider_fields.get("thinking_blocks"))
                or ""
            )

    return answer_text, reasoning_text


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

load_dotenv()

app = FastAPI(title="Dobaeni Chat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    messages: list[dict[str, str]] = Field(
        default_factory=lambda: [{"role": "system", "content": SYSTEM_PROMPT}]
    )


def _get_api_key() -> str:
    api_key = os.getenv(ENV_VAR_NAME)
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail=f"{ENV_VAR_NAME} is not set. Add it to server/.env.",
        )
    return api_key


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model": FIXED_MODEL_ID}


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


def _log_tool_call(name: str, args: dict) -> None:
    """Print to the server console whenever a tool actually runs: its name and
    the arguments the model passed. Flushed so it shows up live in the logs."""
    print(
        f"\n[TOOL CALL] {name}\n  args: {json.dumps(args, ensure_ascii=False)}",
        flush=True,
    )


def _log_tool_output(name: str, result: Any) -> None:
    """Print the tool's return value to the server console."""
    preview = json.dumps(result, default=str, ensure_ascii=False)
    if len(preview) > 1000:
        preview = preview[:1000] + "...(truncated)"
    print(f"[TOOL RESULT] {name}\n  output: {preview}\n", flush=True)


def _describe_call(name: str, args: dict) -> str:
    """Short human-readable line for the tool_call SSE event, e.g.
    "Searching products — {'aesthetics': ['Boho'], 'sort_by': 'trending'}"."""
    label = "Searching products" if name == "find_products" else "Searching brands"
    shown = {k: v for k, v in args.items() if v not in (None, "", [])}
    return f"{label} — {json.dumps(shown, ensure_ascii=False)}" if shown else label


@app.post("/api/chat/stream")
async def chat_stream(req: ChatRequest) -> StreamingResponse:
    api_key = _get_api_key()

    # Ensure there's always a system prompt at the head of the conversation.
    messages: list[dict] = list(req.messages)
    if not messages or messages[0].get("role") != "system":
        messages = [{"role": "system", "content": SYSTEM_PROMPT}, *messages]

    async def event_generator() -> AsyncGenerator[str, None]:
        litellm_model = f"openai/{FIXED_MODEL_ID}"

        for tool_round in range(MAX_TOOL_ROUNDS + 1):
            use_tools = tool_round < MAX_TOOL_ROUNDS
            answer_accum = ""
            reasoning_accum = ""
            tool_calls_acc: dict[int, dict] = {}
            finish_reason: Optional[str] = None
            last_error: Optional[Exception] = None

            for attempt in range(1, MAX_RETRIES + 1):
                answer_accum = ""
                reasoning_accum = ""
                tool_calls_acc = {}
                finish_reason = None
                try:
                    kwargs: dict[str, Any] = dict(
                        model=litellm_model,
                        api_key=api_key,
                        api_base=OPENCODE_API_BASE,
                        messages=messages,
                        stream=True,
                        timeout=REQUEST_TIMEOUT_SECONDS,
                    )
                    if use_tools:
                        kwargs["tools"] = TOOLS
                        kwargs["tool_choice"] = "auto"

                    response_stream = await litellm.acompletion(**kwargs)

                    async for chunk in response_stream:
                        choices = getattr(chunk, "choices", None)
                        if not choices:
                            continue
                        choice = choices[0]
                        finish_reason = choice.finish_reason or finish_reason
                        delta = choice.delta
                        if delta is None:
                            continue

                        answer_text, reasoning_text = extract_delta_parts(delta)
                        if reasoning_text:
                            reasoning_accum += reasoning_text
                            yield _sse({"type": "reasoning", "text": reasoning_text})
                        if answer_text:
                            answer_accum += answer_text
                            yield _sse({"type": "answer", "text": answer_text})

                        for tc in getattr(delta, "tool_calls", None) or []:
                            idx = getattr(tc, "index", 0)
                            entry = tool_calls_acc.setdefault(
                                idx, {"id": None, "name": None, "arguments": ""}
                            )
                            if getattr(tc, "id", None):
                                entry["id"] = tc.id
                            fn = getattr(tc, "function", None)
                            if fn is not None:
                                if getattr(fn, "name", None):
                                    entry["name"] = fn.name
                                if getattr(fn, "arguments", None):
                                    entry["arguments"] += fn.arguments

                    last_error = None
                    break  # this round streamed successfully, stop retrying

                except Exception as exc:  # noqa: BLE001 - surface failures to the UI
                    last_error = exc
                    if answer_accum or tool_calls_acc:
                        # Partial content already streamed this round — don't
                        # retry (would duplicate what the user already saw).
                        break
                    if attempt < MAX_RETRIES:
                        continue
                    break

            if last_error is not None and not answer_accum and not tool_calls_acc:
                yield _sse({"type": "error", "text": str(last_error)})
                yield _sse({"type": "done", "text": ""})
                return

            if finish_reason == "tool_calls" and tool_calls_acc:
                assistant_tool_calls = []
                for idx in sorted(tool_calls_acc):
                    tc = tool_calls_acc[idx]
                    assistant_tool_calls.append(
                        {
                            "id": tc["id"] or f"call_{idx}",
                            "type": "function",
                            "function": {
                                "name": tc["name"],
                                "arguments": tc["arguments"] or "{}",
                            },
                        }
                    )

                # NOTE: deepseek-v4-flash-free requires the assistant's
                # reasoning_content from a tool-calling turn to be replayed
                # back on the follow-up request (OpenCode Zen otherwise
                # returns a 400 and the turn stalls) — keep this field even
                # though the plain OpenAI schema doesn't have it.
                assistant_msg: dict[str, Any] = {
                    "role": "assistant",
                    "content": answer_accum or None,
                    "tool_calls": assistant_tool_calls,
                }
                if reasoning_accum:
                    assistant_msg["reasoning_content"] = reasoning_accum
                messages.append(assistant_msg)

                for tc in assistant_tool_calls:
                    name = tc["function"]["name"]
                    raw_args = tc["function"]["arguments"]
                    try:
                        args = json.loads(raw_args) if raw_args else {}
                    except json.JSONDecodeError:
                        args = {}

                    yield _sse({"type": "tool_call", "text": _describe_call(name, args)})

                    impl = TOOL_IMPL.get(name)
                    if impl is None:
                        result: dict[str, Any] = {
                            "status": "error",
                            "error_message": f"Unknown tool '{name}'",
                        }
                    else:
                        _log_tool_call(name, args)
                        try:
                            result = await impl(**args)
                        except Exception as exc:  # noqa: BLE001
                            result = {"status": "error", "error_message": str(exc)}
                        _log_tool_output(name, result)

                    ok = isinstance(result, dict) and result.get("status") == "success"
                    count = result.get("count", 0) if isinstance(result, dict) else 0
                    yield _sse(
                        {
                            "type": "tool_result",
                            "text": f"Found {count} result(s)" if ok else "No results",
                        }
                    )

                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tc["id"],
                            "name": name,
                            "content": json.dumps(result, default=str, ensure_ascii=False),
                        }
                    )

                continue  # next tool_round: call the model again with tool results

            # No further tool calls — this is the final answer.
            yield _sse({"type": "done", "text": ""})
            return

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)