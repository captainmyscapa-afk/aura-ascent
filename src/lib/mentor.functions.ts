import { createServerFn } from "@tanstack/react-start";
import { ai } from "@/lib/ai";

export const generateConversationTitle = createServerFn({ method: "POST" })
  .inputValidator((d: { firstMessage: string; industry: string }) => d)
  .handler(async ({ data }) => {
    const { text } = await ai.chat([
      {
        role: "user",
        content: `Generate a short conversation title (max 6 words) for a mentoring chat in the ${data.industry} luxury industry.\n\nFirst message: "${data.firstMessage}"\n\nReturn ONLY the title, no quotes, no punctuation at the end. Examples:\nBreaking into Monaco yacht brokerage\nBuilding my aviation network\nFirst steps in luxury real estate`,
      },
    ]);
    return { title: (text.trim().slice(0, 60)) || "New conversation" };
  });
