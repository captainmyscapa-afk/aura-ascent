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
        script: {
          type: "array",
          items: { type: "string" },
          description: "Ordered beats / lines for the post",
        },
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

function stripAdditional(obj: any) {
  if (obj && typeof obj === "object") {
    delete obj.additionalProperties;
    for (const v of Object.values(obj)) stripAdditional(v);
  }
}

export const generateStudioContent = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => d)
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    const system = `You are an elite social media growth strategist and creative director for luxury industries (yachts, real estate, jets, cars). You craft viral, cinematic, platform-optimized POSTS for high-net-worth audiences. Tone is aspirational, restrained, premium — never generic, never cheesy. Every output must feel like it came from a top luxury brand agency. You ALWAYS call the emit_content_plan tool. Never reply in plain text.`;

    const userParts: string[] = [];
    userParts.push(`MODE: ${data.industryLabel} (${data.industry})`);
    if (data.userLevel) userParts.push(`USER LEVEL: ${data.userLevel}`);
    if (data.goal) userParts.push(`GOAL: ${data.goal}`);
    userParts.push(`FORMAT: post`);
    if (data.userIdea) userParts.push(`USER IDEA:\n${data.userIdea}`);
    if (data.intelligenceContext) {
      userParts.push(`LIVE INTELLIGENCE SIGNALS:\n${data.intelligenceContext}\n\nTurn these signals into a viral content angle.`);
    }
    userParts.push(
      `Deliver a complete, post-ready plan: viral title, first 2s hook, Instagram + TikTok captions (LinkedIn only if relevant), step-by-step script, niche+reach hashtags, and a cinematic visual prompt for AI image generation specific to the ${data.industryLabel} world.`,
    );

    const cleanParams = JSON.parse(JSON.stringify(tool.function.parameters));
    stripAdditional(cleanParams);

    const geminiBody: Record<string, unknown> = {
      contents: [
        {
          role: "user",
          parts: [{ text: userParts.join("\n\n") }],
        },
      ],
      systemInstruction: {
        parts: [{ text: system }],
      },
      tools: [{
        functionDeclarations: [{
          name: tool.function.name,
          description: tool.function.description,
          parameters: cleanParams,
        }],
      }],
      toolConfig: {
        functionCallingConfig: {
          mode: "ANY",
          allowedFunctionNames: ["emit_content_plan"],
        },
      },
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
      if (res.status === 403) throw new Error("Invalid Gemini API key.");
      throw new Error(`Gemini API error ${res.status}: ${errText}`);
    }

    const json = (await res.json()) as any;
    const part = json.candidates?.[0]?.content?.parts?.[0];

    if (!part?.functionCall) {
      throw new Error("AI did not return a structured plan.");
    }

    const raw = part.functionCall.args as {
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