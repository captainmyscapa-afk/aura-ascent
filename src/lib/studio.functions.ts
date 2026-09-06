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
  goal?: string;
  userIdea?: string;
  intelligenceContext?: string;
  // CAP-80: generate the content in the user's selected language
  language?: "en" | "fr";
};

// CAP-128: content used to target ONE of two platform trios depending on a
// "format" the person picked upfront (post -> facebook/twitter/linkedin,
// image/video -> tiktok/instagram/youtube_shorts). Per Captain, every
// generation now targets every platform at once -- there's no format choice
// left in the UI (see studio.tsx) -- so this is always the full union.
const ALL_PLATFORM_KEYS = ["facebook", "twitter", "linkedin", "tiktok", "instagram", "youtube_shorts"];

function getPlatformGuidance(): string {
  return [
    "facebook: 250-400 words. Storytelling. End with a question or CTA.",
    "twitter: Max 280 chars. Hook in first 5 words. One decisive statement.",
    "linkedin: 250-350 words. Insight-driven. Bold claim, industry context, forward-looking close.",
    "tiktok: 100-200 chars. Hook in first 2-3 words. Energetic, action-driven. CTA at end.",
    "instagram: 200-300 words. Aesthetic, aspirational. Paragraphs with line breaks. Question at end.",
    "youtube_shorts: 80-150 chars. Title-style hook. Curiosity gap, SEO-conscious.",
  ].join("\n");
}

export const generateStudioContent = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => d)
  .handler(async ({ data }) => {
    await requireServerAuth();
    const platformKeys = ALL_PLATFORM_KEYS;
    const isFrench = data.language === "fr";

    const systemPrompt = isFrench
      ? `Vous \u00eates un directeur de cr\u00e9ation \u00e9lite sp\u00e9cialis\u00e9 dans les r\u00e9seaux sociaux pour le luxe \u2014 yachts, immobilier de prestige, jets priv\u00e9s et voitures de collection. Vous r\u00e9digez du contenu viral de classe mondiale pour une audience UHNW.

Vous DEVEZ r\u00e9pondre UNIQUEMENT avec un objet JSON valide \u2014 pas de balises markdown, pas de texte suppl\u00e9mentaire, rien d'autre. Le JSON doit comporter exactement ces cl\u00e9s :
{
  "title": "string \u2014 titre de contenu percutant (10-15 mots), en fran\u00e7ais",
  "hook": "string \u2014 accroche virale des 2 premi\u00e8res secondes, impossible \u00e0 ignorer, en fran\u00e7ais",
  ${platformKeys.map(k => `"${k}": "string \u2014 l\u00e9gende pour ${k}, en fran\u00e7ais"`).join(",\n  ")},
  "script": ["tableau de strings \u2014 8-10 s\u00e9quences ordonn\u00e9es, pr\u00e9cises et cin\u00e9matographiques, en fran\u00e7ais"],
  "hashtags": ["tableau de strings \u2014 18-24 hashtags combinant ultra-niche + secteur + g\u00e9n\u00e9raux, en fran\u00e7ais quand pertinent"],
  "visual_prompt": "string \u2014 prompt d'image IA cin\u00e9matographique, 60-100 mots, qualit\u00e9 marque de luxe (peut rester en anglais pour le mod\u00e8le d'image)"
}

Chaque l\u00e9gende doit avoir un ton et une longueur sensiblement diff\u00e9rents. Aucun remplissage. Qualit\u00e9 d'\u00e9lite uniquement. Tout le contenu textuel (title, hook, l\u00e9gendes, script, hashtags) doit \u00eatre r\u00e9dig\u00e9 en fran\u00e7ais naturel, pas une traduction litt\u00e9rale.`
      : `You are an elite luxury social media creative director for yachts, real estate, private jets, and exotic cars. You write world-class viral content for UHNW audiences.

You MUST respond with ONLY a valid JSON object \u2014 no markdown fences, no extra text, nothing else. The JSON must have exactly these keys:
{
  "title": "string \u2014 bold content title (10-15 words)",
  "hook": "string \u2014 first 2-second viral hook, impossible to scroll past",
  ${platformKeys.map(k => `"${k}": "string \u2014 caption for ${k}"`).join(",\n  ")},
  "script": ["string array \u2014 8-10 ordered beats, specific and cinematic"],
  "hashtags": ["string array \u2014 18-24 hashtags mixing ultra-niche + industry + broad"],
  "visual_prompt": "string \u2014 cinematic AI image prompt, 60-100 words, luxury brand quality"
}

Each platform caption must be meaningfully different in voice and length. No filler. Elite quality only.`;

    const userParts = isFrench
      ? [
          `SECTEUR : ${data.industryLabel}`,
          data.goal ? `OBJECTIF : ${data.goal}` : "",
          data.userIdea ? `ID\u00c9E : ${data.userIdea}` : "",
          data.intelligenceContext ? `SIGNAUX :\n${data.intelligenceContext}` : "",
          `INDICATIONS PAR PLATEFORME :\n${getPlatformGuidance()}`,
          `R\u00e9pondez UNIQUEMENT avec un JSON valide, enti\u00e8rement en fran\u00e7ais. Pas de markdown. Pas d'explication.`,
        ].filter(Boolean).join("\n\n")
      : [
          `MODE: ${data.industryLabel}`,
          data.goal ? `GOAL: ${data.goal}` : "",
          data.userIdea ? `IDEA: ${data.userIdea}` : "",
          data.intelligenceContext ? `SIGNALS:\n${data.intelligenceContext}` : "",
          `PLATFORM GUIDANCE:\n${getPlatformGuidance()}`,
          `Return ONLY valid JSON. No markdown. No explanation.`,
        ].filter(Boolean).join("\n\n");

    // Full content plan (title, hook, 6 platform captions, 8-10 script
    // beats, 18-24 hashtags, visual prompt) easily runs past ai.chat's default
    // short-reply budget -- give it real headroom explicitly. Bumped from
    // 3000 to 5000 for CAP-128: generation now always covers all 6 platform
    // captions (previously only 3 at a time), roughly doubling output length.
    const { text } = await ai.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userParts },
    ], { maxTokens: 5000 });

    // Parse the JSON response. Strip accidental markdown fences, then take the
    // first {...} block rather than parsing the whole string -- the same
    // approach identity.functions.ts's parseWeekJson uses, because
    // instruction-following models (esp. reasoning models like gpt-oss) often
    // wrap the JSON in a sentence or two ("Here's the plan:\n\n{...}") even
    // when told not to, which broke a strict JSON.parse(cleaned) here.
    let raw: Record<string, unknown>;
    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("no JSON object found in AI response");
      raw = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    } catch (e) {
      console.error("generateStudioContent: failed to parse AI response as JSON:", e, "\nraw text:", text.slice(0, 500));
      throw new Error(
        isFrench
          ? "La g\u00e9n\u00e9ration de contenu a \u00e9chou\u00e9 \u2014 r\u00e9ponse invalide. Veuillez r\u00e9essayer."
          : "Content generation failed \u2014 invalid response. Please try again.",
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
        format: "all",
      } as StudioContentPlan,
    };
  });
