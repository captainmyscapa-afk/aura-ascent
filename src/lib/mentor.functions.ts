import { createServerFn } from "@tanstack/react-start";

export const generateConversationTitle = createServerFn({ method: "POST" })
  .inputValidator((d: { firstMessage: string; industry: string }) => d)
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Generate a short conversation title (max 6 words) for a mentoring chat in the ${data.industry} luxury industry.\n\nFirst message: "${data.firstMessage}"\n\nReturn ONLY the title, no quotes, no punctuation at the end. Examples:\nBreaking into Monaco yacht brokerage\nBuilding my aviation network\nFirst steps in luxury real estate`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!res.ok) return { title: "New conversation" };

    const json = (await res.json()) as any;
    const title =
      json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      "New conversation";

    return { title: title.slice(0, 60) };
  });
