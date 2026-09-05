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
  maxTokens?: number,
): Promise<unknown> {
  const key = process.env.GROQ_API_KEY ?? "";
  if (!key) throw new Error("GROQ_API_KEY is not set. Get a free key at console.groq.com");

  const effectiveModel = model ?? (tools?.length ? GROQ_COMPLETE_MODEL : GROQ_CHAT_MODEL);

  const body: Record<string, unknown> = {
    model: effectiveModel,
    messages,
    temperature: 0.4,
  };

  // gpt-oss models (the replacements for the models Groq retired 2026-08-16)
  // are reasoning models: by default they think through a hidden
  // chain-of-thought before answering. include_reasoning:false only hides
  // that trace from the response — it doesn't stop the model from doing the
  // reasoning, which is most of why responses felt slow and roundabout
  // compared to the old plain instruct model (llama-3.1-8b-instant, which
  // Groq retired — there's no equivalent small non-reasoning Llama left on
  // Groq to go back to). reasoning_effort:"low" cuts that internal work down
  // for what are simple generation tasks (a mentor reply, a list of tasks),
  // which should also make answers more direct instead of hedged/circuitous.
  // Chat replies (no tools) are short by nature, so cap them tighter than
  // structured tool-calling output (Studio's content plan, the roadmap
  // generator) — a smaller cap also forces more concise phrasing, since the
  // model can't pad its way to the old cap.
  if (effectiveModel.startsWith("openai/gpt-oss")) {
    body.include_reasoning = false;
    body.reasoning_effort = "low";
    // Default budget assumes a short conversational reply. Callers building
    // something bigger (a multi-day roadmap week, Studio's content plan)
    // must pass an explicit maxTokens — the 800 default badly truncated
    // generateRoadmap's per-week JSON, which was silently falling back to
    // its generic 3-task template every time it failed to parse.
    body.max_completion_tokens = maxTokens ?? (tools?.length ? 4096 : 800);
  }

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

async function groqChat(messages: AiMessage[], maxTokens?: number): Promise<AiChatResponse> {
  const json = (await groqRequest(messages, undefined, undefined, undefined, maxTokens)) as {
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

function buildGeminiBody(messages: AiMessage[], tools?: AiTool[], forceTool?: string, maxOutputTokens?: number) {
  const systemMsg = messages.find((m) => m.role === "system");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

  const body: Record<string, unknown> = { contents };
  if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  if (maxOutputTokens) body.generationConfig = { maxOutputTokens };
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
  // gemini-2.0-flash-lite was retired by Google — its 404 response pointed
  // directly at gemini-3.5-flash-lite as the replacement (same tier: fast,
  // cheap, multimodal, meant for exactly this kind of fallback text call).
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  if (!res.ok) {
    // 429 = rate limited; 503 = Google's own "model overloaded, try again"
    // (this is the fallback path for when Groq itself is rate-limited, so it
    // needs to tolerate Gemini being transiently busy too, not just Groq).
    if ((res.status === 429 || res.status === 503) && retries > 0) {
      await new Promise((r) => setTimeout(r, Math.pow(2, 4 - retries) * 2000));
      return geminiFetch(body, retries - 1);
    }
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err.slice(0, 200)}`);
  }
  return res.json();
}

async function geminiChat(messages: AiMessage[], maxOutputTokens?: number): Promise<AiChatResponse> {
  const json = (await geminiFetch(buildGeminiBody(messages, undefined, undefined, maxOutputTokens))) as {
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

// Groq has retired multiple free-tier models out from under us this year
// (llama-3.1-8b-instant, llama-3.3-70b-versatile, gemini-2.0-flash-lite —
// three separate incidents in one week of testing alone). A dead/renamed
// model on Groq's side used to only trigger the Gemini fallback when it was
// specifically a 429 rate limit — any other failure (model deprecated,
// Groq outage, bad request) skipped the fallback entirely and took the
// whole app down. Falling back to Gemini on ANY Groq failure (not just
// RateLimitError) means a single provider's model going stale degrades
// service instead of breaking it outright. Only surfaces an error to the
// user if both providers fail.
function describeGroqFailure(e: unknown): string {
  if (e instanceof RateLimitError) return "AI rate limit reached. Please wait a moment and try again.";
  return e instanceof Error ? e.message : String(e);
}

export const ai = {
  /**
   * Simple text completion.
   * Falls back to Gemini automatically if Groq fails for any reason
   * (rate limit, retired/invalid model, transient outage, etc).
   */
  chat: (messages: AiMessage[], opts?: { maxTokens?: number }): Promise<AiChatResponse> =>
    enqueue(async () => {
      switch (provider) {
        case "openai": return openaiChat(messages);
        case "gemini": return geminiChat(messages, opts?.maxTokens);
        default:
          try {
            return await groqChat(messages, opts?.maxTokens);
          } catch (e) {
            if (hasGemini) {
              try {
                return await geminiChat(messages, opts?.maxTokens);
              } catch {
                // Both providers failed — surface the original Groq error,
                // it's usually the more actionable one.
              }
            }
            throw new Error(describeGroqFailure(e));
          }
      }
    }),

  /**
   * Structured output via tool calling.
   * Falls back to Gemini automatically if Groq fails for any reason
   * (rate limit, retired/invalid model, transient outage, etc).
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
            if (hasGemini) {
              try {
                return await geminiComplete(messages, tools, forceTool);
              } catch {
                // Both providers failed — surface the original Groq error.
              }
            }
            throw new Error(describeGroqFailure(e));
          }
      }
    }),
};
