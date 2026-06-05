import { createServerFn } from "@tanstack/react-start";
import { ai } from "@/lib/ai";

type IntroInput = {
  personName: string;
  personRole: string;
  personCity: string;
  industry: string;
  introContext: string;
  userGoal?: string;
  userName?: string;
};

export const generateIntroMessage = createServerFn({ method: "POST" })
  .inputValidator((d: IntroInput) => d)
  .handler(async ({ data }) => {
    const { text } = await ai.chat([
      {
        role: "system",
        content: `You are AURUM — an elite relationship strategist for luxury-industry operators. Write warm, specific, non-generic LinkedIn/email introduction messages. Tone: confident, direct, respectful. Never sycophantic. Never "I hope this message finds you well." Maximum 4 sentences.`,
      },
      {
        role: "user",
        content: [
          `Write a short, warm introduction message to ${data.personName} (${data.personRole}, based in ${data.personCity}).`,
          `Industry context: ${data.industry}.`,
          data.introContext ? `Shared context: ${data.introContext}` : "",
          data.userGoal ? `My goal: ${data.userGoal}` : "",
          data.userName ? `My name: ${data.userName}` : "",
          `Keep it to 3-4 sentences. Be specific about why I'm reaching out and what value I bring. No fluff.`,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ]);
    return { message: text.trim() };
  });
