import { createServerFn } from "@tanstack/react-start";

type GeminiMessage = { role: "user" | "assistant"; text: string };

export const askGemini = createServerFn({ method: "POST" })
  .inputValidator((input: { messages: GeminiMessage[]; system?: string }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    const contents = data.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    const body: Record<string, unknown> = { contents };

    if (data.system) {
      body.systemInstruction = {
        parts: [{ text: data.system }],
      };
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 429) {
        throw new Error("Rate limit reached. Please try again in a moment.");
      }
      if (res.status === 403) {
        throw new Error("Invalid Gemini API key. Check your GEMINI_API_KEY.");
      }
      throw new Error(`Gemini API error ${res.status}: ${errText}`);
    }

    const json = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { text };
  });
