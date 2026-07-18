#!/usr/bin/env python3
"""
app.py
======

A minimal FastAPI server that wraps the OpenCode Zen chat logic from
``main.py`` and exposes it to the Next.js frontend over HTTP streaming (SSE).

Endpoints
---------

  GET  /api/health
      Liveness check.

  POST /api/chat/stream
      Body: {"messages": [{"role": "user"|"assistant"|"system",
                            "content": "..."}, ...]}
      Returns a ``text/event-stream`` response. Each event is a JSON object
      sent as ``data: {json}\n\n`` with one of:
        {"type": "reasoning", "text": "..."}  # thinking content (partial)
        {"type": "answer",    "text": "..."}  # answer content (partial)
        {"type": "error",     "text": "..."}  # fatal error message
        {"type": "done",      "text": ""}      # stream finished

The model is fixed to ``deepseek-v4-flash-free`` (model #14 from the OpenCode
Zen list) per the project requirement; no model picker is exposed.

Run with:

    uv run uvicorn server.app:app --reload --port 8000

(or ``python -m uvicorn server.app:app --reload --port 8000``).
"""

from __future__ import annotations

import os
from typing import Any, Optional

import litellm
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Reused configuration / constants from main.py
# ---------------------------------------------------------------------------

OPENCODE_API_BASE = "https://opencode.ai/zen/v1"
OPENCODE_MODELS_URL = f"{OPENCODE_API_BASE}/models"
ENV_VAR_NAME = "OPENCODE_API_KEY"

# The single model we expose to the chat UI.
FIXED_MODEL_ID = "deepseek-v4-flash-free"

MAX_RETRIES = 3
RETRY_BASE_DELAY_SECONDS = 1.5
REQUEST_TIMEOUT_SECONDS = 30

SYSTEM_PROMPT = "You are a helpful assistant."

litellm.drop_params = True  # silently drop kwargs a given model doesn't accept

# ---------------------------------------------------------------------------
# Reasoning / thinking extraction (verbatim from main.py)
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

# Allow the Next.js dev server (and any preview) to call this API.
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
    return f"data: {__import__('json').dumps(event, ensure_ascii=False)}\n\n"


@app.post("/api/chat/stream")
def chat_stream(req: ChatRequest) -> StreamingResponse:
    api_key = _get_api_key()

    # Ensure there's always a system prompt at the head of the conversation.
    messages = req.messages
    if not messages or messages[0].get("role") != "system":
        messages = [{"role": "system", "content": SYSTEM_PROMPT}, *messages]

    def event_generator():
        litellm_model = f"openai/{FIXED_MODEL_ID}"
        last_error: Optional[Exception] = None

        for attempt in range(1, MAX_RETRIES + 1):
            answer_accum = ""
            try:
                response_stream = litellm.completion(
                    model=litellm_model,
                    api_key=api_key,
                    api_base=OPENCODE_API_BASE,
                    messages=messages,
                    stream=True,
                    timeout=REQUEST_TIMEOUT_SECONDS,
                )

                for chunk in response_stream:
                    choices = getattr(chunk, "choices", None)
                    if not choices:
                        continue
                    delta = choices[0].delta
                    if delta is None:
                        continue

                    answer_text, reasoning_text = extract_delta_parts(delta)

                    if reasoning_text:
                        yield _sse({"type": "reasoning", "text": reasoning_text})
                    if answer_text:
                        yield _sse({"type": "answer", "text": answer_text})
                        answer_accum += answer_text

                yield _sse({"type": "done", "text": ""})
                return

            except Exception as exc:  # noqa: BLE001 - surface any failure to the UI
                last_error = exc
                if answer_accum:
                    # We already streamed a partial answer; stop and report.
                    yield _sse(
                        {"type": "error", "text": f"Stream interrupted: {exc}"}
                    )
                    yield _sse({"type": "done", "text": ""})
                    return
                if attempt < MAX_RETRIES:
                    continue
                yield _sse({"type": "error", "text": str(exc)})
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
