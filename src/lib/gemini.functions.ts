import { createServerFn } from "@tanstack/react-start";

type GeminiMessage = { role: "user" | "assistant"; text: string };

export const askGemini = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { messages: GeminiMessage[]; system?: string }) => input,
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const messages = [
      ...(data.system ? [{ role: "system", content: data.system }] : []),
      ...data.messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.text,
      })),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 429) {
        throw new Error("Rate limit reached. Please try again in a moment.");
      }
      if (res.status === 402) {
        throw new Error("AI credits exhausted. Please add credits in your workspace settings.");
      }
      throw new Error(`AI gateway error ${res.status}: ${errText}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content ?? "";
    return { text };
  });
