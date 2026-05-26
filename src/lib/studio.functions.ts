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
};

type Input = {
  industry: string;
  industryLabel: string;
  userLevel?: string;
  goal?: string;
  userIdea?: string;
  intelligenceContext?: string;
};

const tool = {
  type: "function",
  function: {
    name: "emit_content_plan",
    description:
      "Return a viral-ready, platform-optimized luxury social post plan.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Bold attention-grabbing title" },
        hook: {
          type: "string",
          description: "First 2 seconds spoken/on-screen viral hook",
        },
        caption: {
          type: "object",
          description: "Per-platform captions",
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
          description: "Ordered beats / lines for the post",
        },
        hashtags: { type: "array", items: { type: "string" } },
        visual_prompt: {
          type: "string",
          description:
            "Cinematic prompt for AI image generation, luxury tone, mode-specific environment",
        },
        platform: {
          type: "array",
          items: { type: "string", enum: ["instagram", "tiktok", "linkedin"] },
          description: "Target platforms for this post",
        },
      },
      required: [
        "title",
        "hook",
        "caption",
        "script",
        "hashtags",
        "visual_prompt",
        "platform",
      ],
      additionalProperties: false,
    },
  },
};

export const generateStudioContent = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => d)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const system = `You are an elite social media growth strategist and creative director for luxury industries (yachts, real estate, jets, cars). You craft viral, cinematic, platform-optimized POSTS for high-net-worth audiences. Tone is aspirational, restrained, premium — never generic, never cheesy. Every output must feel like it came from a top luxury brand agency. You ALWAYS call the emit_content_plan tool. Never reply in plain text.`;

    const userParts: string[] = [];
    userParts.push(`MODE: ${data.industryLabel} (${data.industry})`);
    if (data.userLevel) userParts.push(`USER LEVEL: ${data.userLevel}`);
    if (data.goal) userParts.push(`GOAL: ${data.goal}`);
    userParts.push(`FORMAT: post`);
    if (data.userIdea) userParts.push(`USER IDEA:\n${data.userIdea}`);
    if (data.intelligenceContext) {
      userParts.push(
        `LIVE INTELLIGENCE SIGNALS:\n${data.intelligenceContext}\n\nTurn these signals into a viral content angle.`,
      );
    }
    userParts.push(
      `Deliver a complete, post-ready plan: viral title, first 2s hook, Instagram + TikTok captions (LinkedIn only if relevant), step-by-step script, niche+reach hashtags, and a cinematic visual prompt for AI image generation specific to the ${data.industryLabel} world.`,
    );

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userParts.join("\n\n") },
      ],
      tools: [tool],
      tool_choice: {
        type: "function",
        function: { name: "emit_content_plan" },
      },
    };

    console.log(
      "[studio] Gemini tool schema:",
      JSON.stringify(tool, null, 2),
    );

    const res = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 429)
        throw new Error("Rate limit reached. Try again in a moment.");
      if (res.status === 402)
        throw new Error(
          "AI credits exhausted. Add credits in workspace settings.",
        );
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

    const argStr =
      json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argStr) {
      const fallback = json.choices?.[0]?.message?.content ?? "";
      throw new Error(fallback || "AI did not return a structured plan.");
    }
    const raw = JSON.parse(argStr) as {
      title: string;
      hook: string;
      caption: { instagram: string; tiktok: string; linkedin?: string };
      script: string[];
      hashtags: string[];
      visual_prompt: string;
      platform: string[];
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
