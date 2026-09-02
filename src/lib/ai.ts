/**
 * Aurum OS — AI Abstraction Layer
 *
 * Providers (set AI_PROVIDER in .env):
 *   groq    — default for testing. Free tier: 14,400 req/day, 30K tokens/min.
 *             Get free key at console.groq.com
 *   gemini  — Google Gemini. Free tier is very limited (15 RPM).
 *   openai  — OpenAI. Paid.
 *   anthropic — Anthropic. Paid.
 *
 * Env vars needed for Groq (recommended):
 *   AI_PROVIDER=groq
 *   GROQ_API_KEY=gsk_...
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type AiChatResponse = { text: string };

export type AiToolResponse =
  | { toolName: string; args: Record<string, unknown>; text: null }
  | { toolName: null; args: null; text: string };

// ─── Request queue ────────────────────────────────────────────────────────────
// Serialises all AI calls. Groq handles much higher concurrency but we still
// queue to avoid race conditions in the UI.

const MIN_GAP_MS = 300; // 300ms between calls — safe for Groq's high RPM
let _queue: Promise<unknown> = Promise.resolve();
let _lastCallAt = 0;

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  _queue = _queue.then(async () => {
    const gap = Date.now() - _lastCallAt;
    if (gap < MIN_GAP_MS) await new Promise((r) => setTimeout(r, MIN_GAP_MS - gap));
    _lastCallAt = Date.now();
    return fn();
  });
  return _queue as Promise<T>;
}

// ─── Groq provider (DEFAULT — free tier, high limits) ─────────────────────────

const GROQ_BASE = "https://api.groq.com/openai/v1";
// llama-3.1-8b-instant and llama-3.3-70b-versatile were retired by Groq on
// 2026-08-16 (decommission notice 2026-06-17) — calls now fail with
// model_not_found. Migrated to Groq's own recommended replacements:
// openai/gpt-oss-20b: fast small model, use for simple chat.
// openai/gpt-oss-120b: best quality, supports tool calling.
const GROQ_CHAT_MODEL    = process.env.GROQ_CHAT_MODEL    ?? "openai/gpt-oss-20b";
const GROQ_COMPLETE_MODEL = process.env.GROQ_COMPLETE_MODEL ?? "openai/gpt-oss-120b";

// Sentinel error so callers can detect rate-limit exhaustion and fall back
class RateLimitError extends Error {
  constructor() { super("rate_limit_exhausted"); }
}

async function groqRequest(
  messages: AiMessage[],
  tools?: AiTool[],
  forceTool?: string,
  model?: string,
): Promise<unknown> {
  const key = process.env.GROQ_API_KEY ?? "";
  if (!key) throw new Error("GROQ_API_KEY is not set. Get a free key at console.groq.com");

  const body: Record<string, unknown> = {
    model: model ?? (tools?.length ? GROQ_COMPLETE_MODEL : GROQ_CHAT_MODEL),
    messages,
    temperature: 0.4,
  };

  if (tools?.length) {
    body.tools = tools;
    if (forceTool) {
      body.tool_choice = { type: "function", function: { name: forceTool } };
    }
  }

  // Exponential backoff: 3 retries at 2s, 4s, 8s
  const RETRY_DELAYS = [2000, 4000, 8000];

  let lastErr = "";
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    const res = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });

    if (res.ok) return res.json();

    const errText = await res.text();

    if (res.status === 429) {
      if (attempt < RETRY_DELAYS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
        continue;
      }
      // All retries exhausted — signal for Gemini fallback
      throw new RateLimitError();
    }

    if (res.status === 401) throw new Error("Invalid GROQ_API_KEY. Check your .env file.");
    lastErr = errText;
    break;
  }

  throw new Error(`AI error: ${lastErr.slice(0, 200)}`);
}

async function groqChat(messages: AiMessage[]): Promise<AiChatResponse> {
  const json = (await groqRequest(messages)) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return { text: json.choices?.[0]?.message?.content?.trim() ?? "" };
}

async function groqComplete(
  messages: AiMessage[],
  tools: AiTool[],
  forceTool?: string,
): Promise<AiToolResponse> {
  const json = (await groqRequest(messages, tools, forceTool)) as {
    choices?: Array<{
      message?: {
        content?: string;
        tool_calls?: Array<{ function: { name: string; arguments: string } }>;
      };
    }>;
  };
  const msg = json.choices?.[0]?.message;
  const call = msg?.tool_calls?.[0];
  if (call) {
    try {
      return {
        toolName: call.function.name,
        args: JSON.parse(call.function.arguments ?? "{}"),
        text: null,
      };
    } catch {
      throw new Error("AI returned malformed tool call. Try again.");
    }
  }
  return { toolName: null, args: null, text: msg?.content?.trim() ?? "" };
}

// ─── Gemini provider (fallback) ───────────────────────────────────────────────

function stripAdditionalProperties(obj: unknown): void {
  if (obj && typeof obj === "object") {
    const o = obj as Record<string, unknown>;
    delete o.additionalProperties;
    for (const v of Object.values(o)) stripAdditionalProperties(v);
  }
}

function buildGeminiBody(messages: AiMessage[], tools?: AiTool[], forceTool?: string) {
  const systemMsg = messages.find((m) => m.role === "system");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

  const body: Record<string, unknown> = { contents };
  if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  if (tools?.length) {
    const declarations = tools.map((t) => {
      const params = JSON.parse(JSON.stringify(t.function.parameters));
      stripAdditionalProperties(params);
      return { name: t.function.name, description: t.function.description, parameters: params };
    });
    body.tools = [{ functionDeclarations: declarations }];
  }
  if (forceTool) body.toolConfig = { functionCallingConfig: { mode: "ANY", allowedFunctionNames: [forceTool] } };
  return body;
}

async function geminiFetch(body: Record<string, unknown>, retries = 3): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash-lite";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  if (!res.ok) {
    if (res.status === 429 && retries > 0) {
      await new Promise((r) => setTimeout(r, Math.pow(2, 4 - retries) * 2000));
      return geminiFetch(body, retries - 1);
    }
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err.slice(0, 200)}`);
  }
  return res.json();
}

async function geminiChat(messages: AiMessage[]): Promise<AiChatResponse> {
  const json = (await geminiFetch(buildGeminiBody(messages))) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return { text: json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "" };
}

async function geminiComplete(messages: AiMessage[], tools: AiTool[], forceTool?: string): Promise<AiToolResponse> {
  const json = (await geminiFetch(buildGeminiBody(messages, tools, forceTool))) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string; functionCall?: { name: string; args?: Record<string, unknown> } }> } }>;
  };
  const part = json.candidates?.[0]?.content?.parts?.[0];
  if (part?.functionCall) {
    return { toolName: part.functionCall.name, args: part.functionCall.args ?? {}, text: null };
  }
  return { toolName: null, args: null, text: part?.text?.trim() ?? "" };
}

// ─── OpenAI provider ──────────────────────────────────────────────────────────

async function openaiChat(messages: AiMessage[]): Promise<AiChatResponse> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return { text: json.choices?.[0]?.message?.content?.trim() ?? "" };
}

async function openaiComplete(messages: AiMessage[], tools: AiTool[], forceTool?: string): Promise<AiToolResponse> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const body: Record<string, unknown> = { model, messages, tools };
  if (forceTool) body.tool_choice = { type: "function", function: { name: forceTool } };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string; tool_calls?: Array<{ function: { name: string; arguments: string } }> } }> };
  const msg = json.choices?.[0]?.message;
  const call = msg?.tool_calls?.[0];
  if (call) return { toolName: call.function.name, args: JSON.parse(call.function.arguments ?? "{}"), text: null };
  return { toolName: null, args: null, text: msg?.content?.trim() ?? "" };
}

// ─── Public interface ─────────────────────────────────────────────────────────

const provider = (process.env.AI_PROVIDER ?? "groq") as "groq" | "gemini" | "openai" | "anthropic";

const hasGemini = !!process.env.GEMINI_API_KEY;

export const ai = {
  /**
   * Simple text completion.
   * Falls back to Gemini automatically if Groq is rate-limited.
   */
  chat: (messages: AiMessage[]): Promise<AiChatResponse> =>
    enqueue(async () => {
      switch (provider) {
        case "openai": return openaiChat(messages);
        case "gemini": return geminiChat(messages);
        default:
          try {
            return await groqChat(messages);
          } catch (e) {
            if (e instanceof RateLimitError && hasGemini) return geminiChat(messages);
            throw e instanceof RateLimitError
              ? new Error("AI rate limit reached. Please wait a moment and try again.")
              : e;
          }
      }
    }),

  /**
   * Structured output via tool calling.
   * Falls back to Gemini automatically if Groq is rate-limited.
   */
  complete: (messages: AiMessage[], tools: AiTool[], forceTool?: string): Promise<AiToolResponse> =>
    enqueue(async () => {
      switch (provider) {
        case "openai": return openaiComplete(messages, tools, forceTool);
        case "gemini": return geminiComplete(messages, tools, forceTool);
        default:
          try {
            return await groqComplete(messages, tools, forceTool);
          } catch (e) {
            if (e instanceof RateLimitError && hasGemini) return geminiComplete(messages, tools, forceTool);
            throw e instanceof RateLimitError
              ? new Error("AI rate limit reached. Please wait a moment and try again.")
              : e;
          }
      }
    }),
};
