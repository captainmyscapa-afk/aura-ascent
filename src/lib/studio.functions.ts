import { createServerFn } from "@tanstack/react-start";
import { ai } from "@/lib/ai";
import { requireServerAuth } from "@/lib/serverAuth";

export type StudioContentPlan = {
  title: string;
  viralHook: string;
  platforms: Record<string, string>;
  script: string[];
  hashtags: string[];
  visualPrompt: string;
  format: string;
};

type Input = {
  industry: string;
  industryLabel: string;
  format?: string;
  orientation?: string;
  goal?: string;
  userIdea?: string;
  intelligenceContext?: string;
  // CAP-80: generate the content in the user's selected language
  language?: "en" | "fr";
};

function getPlatformKeys(format: string): string[] {
  return format === "post"
    ? ["facebook", "twitter", "linkedin"]
    : ["tiktok", "instagram", "youtube_shorts"];
}

function getPlatformGuidance(format: string): string {
  if (format === "post") return [
    "facebook: 250-400 words. Storytelling. End with a question or CTA.",
    "twitter: Max 280 chars. Hook in first 5 words. One decisive statement.",
    "linkedin: 250-350 words. Insight-driven. Bold claim, industry context, forward-looking close.",
  ].join("\n");

  if (format === "image") return [
    "tiktok: 150-200 chars. Hook in first 3 words. Energetic. CTA at end.",
    "instagram: 200-300 words. Aesthetic, aspirational. Paragraphs with line breaks. Question at end.",
    "youtube_shorts: 80-120 chars. Title-style hook. Curiosity gap.",
  ].join("\n");

  return [
    "tiktok: 100-180 chars. Action-driven. Hook in 2 seconds.",
    "instagram: 180-260 words. Cinematic scene-setting. Aspirational.",
    "youtube_shorts: 100-150 chars. SEO-conscious. Curiosity gap.",
  ].join("\n");
}

export const generateStudioContent = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => d)
  .handler(async ({ data }) => {
    await requireServerAuth();
    const format = data.format ?? "post";
    const orientation = data.orientation ?? "auto";
    const platformKeys = getPlatformKeys(format);
    const isFrench = data.language === "fr";

    const orientationNote =
      (format === "image" || format === "video") && orientation !== "auto"
        ? `ORIENTATION: ${orientation === "portrait" ? "9:16 portrait" : "16:9 landscape"}.`
        : "";

    const systemPrompt = isFrench
      ? `Vous êtes un directeur de création élite spécialisé dans les réseaux sociaux pour le luxe — yachts, immobilier de prestige, jets privés et voitures de collection. Vous rédigez du contenu viral de classe mondiale pour une audience UHNW.

Vous DEVEZ répondre UNIQUEMENT avec un objet JSON valide — pas de balises markdown, pas de texte supplémentaire, rien d'autre. Le JSON doit comporter exactement ces clés :
{
  "title": "string — titre de contenu percutant (10-15 mots), en français",
  "hook": "string — accroche virale des 2 premières secondes, impossible à ignorer, en français",
  ${platformKeys.map(k => `"${k}": "string — légende pour ${k}, en français"`).join(",\n  ")},
  "script": ["tableau de strings — 8-10 séquences ordonnées, précises et cinématographiques, en français"],
  "hashtags": ["tableau de strings — 18-24 hashtags combinant ultra-niche + secteur + généraux, en français quand pertinent"],
  "visual_prompt": "string — prompt d'image IA cinématographique, 60-100 mots, qualité marque de luxe (peut rester en anglais pour le modèle d'image)"
}

Chaque légende doit avoir un ton et une longueur sensiblement différents. Aucun remplissage. Qualité d'élite uniquement. Tout le contenu textuel (title, hook, légendes, script, hashtags) doit être rédigé en français naturel, pas une traduction littérale.`
      : `You are an elite luxury social media creative director for yachts, real estate, private jets, and exotic cars. You write world-class viral content for UHNW audiences.

You MUST respond with ONLY a valid JSON object — no markdown fences, no extra text, nothing else. The JSON must have exactly these keys:
{
  "title": "string — bold content title (10-15 words)",
  "hook": "string — first 2-second viral hook, impossible to scroll past",
  ${platformKeys.map(k => `"${k}": "string — caption for ${k}"`).join(",\n  ")},
  "script": ["string array — 8-10 ordered beats, specific and cinematic"],
  "hashtags": ["string array — 18-24 hashtags mixing ultra-niche + industry + broad"],
  "visual_prompt": "string — cinematic AI image prompt, 60-100 words, luxury brand quality"
}

Each platform caption must be meaningfully different in voice and length. No filler. Elite quality only.`;

    const userParts = isFrench
      ? [
          `SECTEUR : ${data.industryLabel}`,
          `FORMAT : ${format.toUpperCase()}`,
          orientationNote,
          data.goal ? `OBJECTIF : ${data.goal}` : "",
          data.userIdea ? `IDÉE : ${data.userIdea}` : "",
          data.intelligenceContext ? `SIGNAUX :\n${data.intelligenceContext}` : "",
          `INDICATIONS PAR PLATEFORME :\n${getPlatformGuidance(format)}`,
          `Répondez UNIQUEMENT avec un JSON valide, entièrement en français. Pas de markdown. Pas d'explication.`,
        ].filter(Boolean).join("\n\n")
      : [
          `MODE: ${data.industryLabel}`,
          `FORMAT: ${format.toUpperCase()}`,
          orientationNote,
          data.goal ? `GOAL: ${data.goal}` : "",
          data.userIdea ? `IDEA: ${data.userIdea}` : "",
          data.intelligenceContext ? `SIGNALS:\n${data.intelligenceContext}` : "",
          `PLATFORM GUIDANCE:\n${getPlatformGuidance(format)}`,
          `Return ONLY valid JSON. No markdown. No explanation.`,
        ].filter(Boolean).join("\n\n");

    const { text } = await ai.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userParts },
    ]);

    // Parse the JSON response
    let raw: Record<string, unknown>;
    try {
      // Strip any accidental markdown fences
      const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
      raw = JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      throw new Error(
        isFrench
          ? "La génération de contenu a échoué — réponse invalide. Veuillez réessayer."
          : "Content generation failed — invalid response. Please try again.",
      );
    }

    const platforms: Record<string, string> = {};
    for (const key of platformKeys) {
      if (typeof raw[key] === "string" && (raw[key] as string).trim()) {
        platforms[key] = (raw[key] as string).trim();
      }
    }

    return {
      plan: {
        title: String(raw.title ?? ""),
        viralHook: String(raw.hook ?? ""),
        platforms,
        script: Array.isArray(raw.script) ? raw.script.map(String) : [],
        hashtags: Array.isArray(raw.hashtags) ? raw.hashtags.map(String) : [],
        visualPrompt: String(raw.visual_prompt ?? ""),
        format,
      } as StudioContentPlan,
    };
  });
