import { createServerFn } from "@tanstack/react-start";
import { ai } from "@/lib/ai";

type AiMessage = { role: "user" | "assistant"; text: string };

export const askGemini = createServerFn({ method: "POST" })
  .inputValidator((input: { messages: AiMessage[]; system?: string }) => input)
  .handler(async ({ data }) => {
    const messages = [
      ...(data.system ? [{ role: "system" as const, content: data.system }] : []),
      ...data.messages.map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.text,
      })),
    ];
    const { text } = await ai.chat(messages);
    return { text };
  });
