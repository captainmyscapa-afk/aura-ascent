import { createServerFn } from "@tanstack/react-start";
import { ai } from "@/lib/ai";
import { requireServerAuth } from "@/lib/serverAuth";

type IntroInput = {
  personName: string;
  personRole: string;
  personCity: string;
  industry: string;
  introContext: string;
  userGoal?: string;
  userName?: string;
  // CAP-80: generate the message in the user's selected language
  language?: "en" | "fr";
};

export const generateIntroMessage = createServerFn({ method: "POST" })
  .inputValidator((d: IntroInput) => d)
  .handler(async ({ data }) => {
    await requireServerAuth();
    const isFrench = data.language === "fr";
    const { text } = await ai.chat([
      {
        role: "system",
        content: isFrench
          ? `Vous êtes AURUM — un stratège relationnel d'élite pour les professionnels du secteur du luxe. Rédigez des messages d'introduction (LinkedIn/email) chaleureux, précis et non génériques, entièrement en français. Ton : confiant, direct, respectueux. Jamais doucereux. Jamais "j'espère que ce message vous trouve en bonne santé". Maximum 4 phrases.`
          : `You are AURUM — an elite relationship strategist for luxury-industry operators. Write warm, specific, non-generic LinkedIn/email introduction messages. Tone: confident, direct, respectful. Never sycophantic. Never "I hope this message finds you well." Maximum 4 sentences.`,
      },
      {
        role: "user",
        content: isFrench
          ? [
              `Rédigez un message d'introduction court et chaleureux pour ${data.personName} (${data.personRole}, basé(e) à ${data.personCity}).`,
              `Contexte sectoriel : ${data.industry}.`,
              data.introContext ? `Contexte commun : ${data.introContext}` : "",
              data.userGoal ? `Mon objectif : ${data.userGoal}` : "",
              data.userName ? `Mon nom : ${data.userName}` : "",
              `Limitez-vous à 3-4 phrases. Soyez précis sur la raison de votre prise de contact et la valeur que vous apportez. Pas de remplissage. Répondez entièrement en français.`,
            ]
              .filter(Boolean)
              .join("\n")
          : [
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
