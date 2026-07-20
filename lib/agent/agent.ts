// Ported from server/main.py — the agent itself.
// Uses the official @google/adk LlmAgent, but points the model at your
// existing OpenCode Zen endpoint (deepseek-v4-flash-free) through the
// adk-llm-bridge `Custom` provider, which is OpenAI-compatible. This
// keeps the EXACT same model + reasoning behaviour as the Python server.

import { LlmAgent } from "@google/adk";
import { Custom } from "adk-llm-bridge";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { findProductsTool, findBrandsTool } from "./tools";

const OPENCODE_API_BASE = "https://opencode.ai/zen/v1";
const FIXED_MODEL_ID = "deepseek-v4-flash-free";

// The single model exposed to the chat UI (same as the Python server).
const model = Custom(FIXED_MODEL_ID, {
  baseURL: process.env.OPENCODE_API_BASE || OPENCODE_API_BASE,
  apiKey: process.env.OPENCODE_API_KEY,
  name: "opencode-zen",
});

export const AGENT_NAME = "dobaeni_chat_agent";

export const rootAgent = new LlmAgent({
  name: AGENT_NAME,
  model,
  description:
    "Dobaeni's in-app shopping assistant for a Nepali fashion marketplace.",
  instruction: SYSTEM_PROMPT,
  tools: [findProductsTool, findBrandsTool],
});

export { FIXED_MODEL_ID };
