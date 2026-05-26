import { createServerFn } from "@tanstack/react-start";

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
  video?: {
    duration: number;
    scenes: Array<{ time: string; description: string; camera: string }>;
    motion: string;
  };
};

type Input = {
  industry: string;
  industryLabel: string;
  userLevel?: string;
  goal?: string;
  userIdea?: string;
  intelligenceContext?: string;
  format: "post" | "reel" | "video";
  videoDuration?: 5 | 10 | 15 | 30;
};

const tool = {
  type: "function",
  function: {
    name: "emit_content_plan",
    description: "Return a viral-ready, platform-optimized luxury content plan.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Bold attention-grabbing title" },
        viralHook: { type: "string", description: "First 2 seconds spoken/on-screen hook" },
        platforms: {
          type: "object",
          properties: {
            instagram: { type: "string" },
            tiktok: { type: "string" },
            linkedin: { type: "string" },
          },
          required: ["instagram", "tiktok"],
          additionalProperties: false,
        },
        script: {
          type: "array",
          items: { type: "string" },
          description: "Ordered beats / lines for the video or reel",
        },
        hashtags: { type: "array", items: { type: "string" } },
        visualPrompt: {
          type: "string",
          description: "Cinematic prompt for AI image/video generation, luxury tone, mode-specific environment",
        },
        video: {
          type: "object",
          properties: {
            duration: { type: "number", enum: [5, 10, 15, 30] },
            motion: { type: "string" },
            scenes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  time: { type: "string" },
                  description: { type: "string" },
                  camera: { type: "string" },
                },
                required: ["time", "description", "camera"],
                additionalProperties: false,
              },
            },
          },
          required: ["duration", "motion", "scenes"],
          additionalProperties: false,
        },
      },
      required: ["title", "viralHook", "platforms", "script", "hashtags", "visualPrompt"],
      additionalProperties: false,
    },
  },
};

export const generateStudioContent = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => d)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const system = `You are an elite social media growth strategist and creative director for luxury industries (yachts, real estate, jets, cars). You craft viral, cinematic, platform-optimized content for high-net-worth audiences. Tone is aspirational, restrained, premium — never generic, never cheesy. Every output must feel like it came from a top luxury brand agency. You ALWAYS call the emit_content_plan tool. Never reply in plain text.`;

    const userParts: string[] = [];
    userParts.push(`MODE: ${data.industryLabel} (${data.industry})`);
    if (data.userLevel) userParts.push(`USER LEVEL: ${data.userLevel}`);
    if (data.goal) userParts.push(`GOAL: ${data.goal}`);
    userParts.push(`FORMAT: ${data.format}`);
    if (data.format === "video" && data.videoDuration) {
      userParts.push(`VIDEO DURATION: ${data.videoDuration}s — include video scene breakdown, motion description, and camera style (cinematic / drone / handheld / dolly / etc.).`);
    }
    if (data.userIdea) userParts.push(`USER IDEA:\n${data.userIdea}`);
    if (data.intelligenceContext) {
      userParts.push(`LIVE INTELLIGENCE SIGNALS:\n${data.intelligenceContext}\n\nTurn these signals into a viral content angle.`);
    }
    userParts.push(
      `Deliver a complete, post-ready plan: viral title, first 2s hook, Instagram + TikTok captions (LinkedIn only if relevant), step-by-step script, niche+reach hashtags, and a cinematic visual prompt for AI image/video generation specific to the ${data.industryLabel} world.`,
    );

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userParts.join("\n\n") },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "emit_content_plan" } },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
      throw new Error(`AI gateway error ${res.status}: ${errText}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
          tool_calls?: Array<{ function?: { arguments?: string } }>;
        };
      }>;
    };

    const argStr = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argStr) {
      const fallback = json.choices?.[0]?.message?.content ?? "";
      throw new Error(fallback || "AI did not return a structured plan.");
    }
    const plan = JSON.parse(argStr) as StudioContentPlan;
    return { plan };
  });
