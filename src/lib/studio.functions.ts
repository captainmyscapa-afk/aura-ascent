import { createServerFn } from "@tanstack/react-start";
import { ai, type AiTool } from "@/lib/ai";

export type StudioContentPlan = {
  title: string;
  viralHook: string;
  platforms: {
    instagram: string;
    tiktok: string;
    linkedin?: string;
  };
  script: string[];
  hashtags: string[];
  visualPrompt: string;
};

type Input = {
  industry: string;
  industryLabel: string;
  userLevel?: string;
  goal?: string;
  userIdea?: string;
  intelligenceContext?: string;
};

const contentTool: AiTool = {
  type: "function",
  function: {
    name: "emit_content_plan",
    description: "Return a viral-ready, platform-optimized luxury social post plan.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Bold attention-grabbing title" },
        hook: { type: "string", description: "First 2 seconds spoken/on-screen viral hook" },
        caption: {
          type: "object",
          description: "Per-platform captions",
          properties: {
            instagram: { type: "string" },
            tiktok: { type: "string" },
            linkedin: { type: "string" },
          },
          required: ["instagram", "tiktok"],
        },
        script: { type: "array", items: { type: "string" }, description: "Ordered beats / lines for the post" },
        hashtags: { type: "array", items: { type: "string" } },
        visual_prompt: {
          type: "string",
          description: "Cinematic prompt for AI image generation, luxury tone, mode-specific environment",
        },
        platform: {
          type: "array",
          items: { type: "string", enum: ["instagram", "tiktok", "linkedin"] },
          description: "Target platforms for this post",
        },
      },
      required: ["title", "hook", "caption", "script", "hashtags", "visual_prompt", "platform"],
    },
  },
};

export const generateStudioContent = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => d)
  .handler(async ({ data }) => {
    const userParts: string[] = [
      `MODE: ${data.industryLabel} (${data.industry})`,
      data.userLevel ? `USER LEVEL: ${data.userLevel}` : "",
      data.goal ? `GOAL: ${data.goal}` : "",
      `FORMAT: post`,
      data.userIdea ? `USER IDEA:\n${data.userIdea}` : "",
      data.intelligenceContext
        ? `LIVE INTELLIGENCE SIGNALS:\n${data.intelligenceContext}\n\nTurn these signals into a viral content angle.`
        : "",
      `Deliver a complete, post-ready plan: viral title, first 2s hook, Instagram + TikTok captions (LinkedIn only if relevant), step-by-step script, niche+reach hashtags, and a cinematic visual prompt for AI image generation specific to the ${data.industryLabel} world.`,
    ].filter(Boolean);

    const result = await ai.complete(
      [
        {
          role: "system",
          content: `You are an elite social media growth strategist and creative director for luxury industries (yachts, real estate, jets, cars). You craft viral, cinematic, platform-optimized POSTS for high-net-worth audiences. Tone is aspirational, restrained, premium — never generic, never cheesy. Every output must feel like it came from a top luxury brand agency. You ALWAYS call the emit_content_plan tool. Never reply in plain text.`,
        },
        {
          role: "user",
          content: userParts.join("\n\n"),
        },
      ],
      [contentTool],
      "emit_content_plan",
    );

    if (!result.args) throw new Error("AI did not return a structured plan.");

    const raw = result.args as {
      title: string;
      hook: string;
      caption: { instagram: string; tiktok: string; linkedin?: string };
      script: string[];
      hashtags: string[];
      visual_prompt: string;
    };

    const plan: StudioContentPlan = {
      title: raw.title,
      viralHook: raw.hook,
      platforms: raw.caption,
      script: raw.script,
      hashtags: raw.hashtags,
      visualPrompt: raw.visual_prompt,
    };

    return { plan };
  });
