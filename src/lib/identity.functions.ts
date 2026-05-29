import { createServerFn } from "@tanstack/react-start";

export type IdentityAction = {
  label: "HIGH IMPACT" | "COMPOUNDING" | "QUICK WIN";
  headline: string;
  explanation: string;
};
export type IdentityAudit = { actions: IdentityAction[] };

export type TodayBrief = {
  priority: string;
  insight: string;
  network_move: string;
};

type AuditInput = {
  name?: string;
  mode: string;
  profession?: string;
  goal?: string;
  location?: string;
  level?: string;
  streak?: number;
  aurumScore?: number;
};

const auditTool = {
  type: "function",
  function: {
    name: "emit_positioning_audit",
    description: "Return 3 personalised, cinematic positioning actions for the operator.",
    parameters: {
      type: "object",
      properties: {
        actions: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: {
            type: "object",
            properties: {
              label: {
                type: "string",
                enum: ["HIGH IMPACT", "COMPOUNDING", "QUICK WIN"],
              },
              headline: { type: "string" },
              explanation: { type: "string" },
            },
            required: ["label", "headline", "explanation"],
            additionalProperties: false,
          },
        },
      },
      required: ["actions"],
      additionalProperties: false,
    },
  },
};

const briefTool = {
  type: "function",
  function: {
    name: "emit_today_brief",
    description: "Return today's 3-line briefing for the operator.",
    parameters: {
      type: "object",
      properties: {
        priority: { type: "string", description: "#1 priority today" },
        insight: { type: "string", description: "One industry insight" },
        network_move: { type: "string", description: "One networking move" },
      },
      required: ["priority", "insight", "network_move"],
      additionalProperties: false,
    },
  },
};

async function callGateway(body: unknown) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) throw new Error("Rate limit reached. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
    throw new Error(`AI gateway error ${res.status}: ${errText}`);
  }
  return (await res.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
        tool_calls?: Array<{ function?: { arguments?: string } }>;
      };
    }>;
  };
}

export const generateIdentityAudit = createServerFn({ method: "POST" })
  .inputValidator((d: AuditInput) => d)
  .handler(async ({ data }) => {
    const system = `You are AURUM — an elite positioning strategist for ambitious operators entering luxury industries (yachts, jets, villas, cars). You produce sharp, personal, cinematic action items. No clichés. No motivational fluff. Always invoke the emit_positioning_audit tool.`;
    const user = [
      `OPERATOR: ${data.name ?? "Unnamed operator"}`,
      `MODE: ${data.mode}`,
      data.profession ? `PROFESSION: ${data.profession}` : null,
      data.location ? `LOCATION: ${data.location}` : null,
      data.level ? `LEVEL: ${data.level}` : null,
      data.goal ? `GOAL: ${data.goal}` : null,
      typeof data.streak === "number" ? `STREAK: ${data.streak} days` : null,
      typeof data.aurumScore === "number" ? `AURUM SCORE: ${data.aurumScore}` : null,
      `Return EXACTLY 3 actions, one with each label: HIGH IMPACT, COMPOUNDING, QUICK WIN. Each headline must be specific to this person's mode + level + location.`,
    ]
      .filter(Boolean)
      .join("\n");

    const json = await callGateway({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      tools: [auditTool],
      tool_choice: {
        type: "function",
        function: { name: "emit_positioning_audit" },
      },
    });
    const argStr = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argStr) throw new Error("AI did not return a structured audit.");
    const parsed = JSON.parse(argStr) as IdentityAudit;
    return { audit: parsed };
  });

export const generateTodayBrief = createServerFn({ method: "POST" })
  .inputValidator((d: AuditInput) => d)
  .handler(async ({ data }) => {
    const system = `You are AURUM — produce a 3-line daily front-page brief for a luxury-industry operator. Confident, direct, cinematic. No filler. Always invoke emit_today_brief.`;
    const user = [
      `OPERATOR: ${data.name ?? "Operator"}`,
      `MODE: ${data.mode}`,
      data.level ? `LEVEL: ${data.level}` : null,
      data.location ? `LOCATION: ${data.location}` : null,
      data.goal ? `GOAL: ${data.goal}` : null,
      `Deliver: (1) #1 priority today, (2) one industry insight, (3) one network move.`,
    ]
      .filter(Boolean)
      .join("\n");

    const json = await callGateway({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      tools: [briefTool],
      tool_choice: {
        type: "function",
        function: { name: "emit_today_brief" },
      },
    });
    const argStr = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argStr) throw new Error("AI did not return a structured brief.");
    const parsed = JSON.parse(argStr) as TodayBrief;
    return { brief: parsed };
  });

// ─────────── Dashboard AI ───────────

type DashInput = {
  mode: string;
  level?: string;
  phase?: string;
  goal?: string;
  streak?: number;
  location?: string;
  taskCount?: number;
};

const dailyTasksTool = {
  type: "function",
  function: {
    name: "emit_daily_tasks",
    description: "Return exactly 5 specific daily tasks.",
    parameters: {
      type: "object",
      properties: {
        tasks: {
          type: "array",
          minItems: 5,
          maxItems: 5,
          items: { type: "string" },
        },
      },
      required: ["tasks"],
      additionalProperties: false,
    },
  },
};

const upcomingTool = {
  type: "function",
  function: {
    name: "emit_upcoming_events",
    description: "Return 3 real upcoming industry events.",
    parameters: {
      type: "object",
      properties: {
        events: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: {
            type: "object",
            properties: {
              date: { type: "string", description: "Short date like 'OCT 24'" },
              title: { type: "string" },
            },
            required: ["date", "title"],
            additionalProperties: false,
          },
        },
      },
      required: ["events"],
      additionalProperties: false,
    },
  },
};

export const generateRecommendation = createServerFn({ method: "POST" })
  .inputValidator((d: DashInput) => d)
  .handler(async ({ data }) => {
    const system = `You are AURUM — give one specific, actionable recommendation. Maximum 2 sentences. Be direct and specific. No fluff.`;
    const user = [
      `MODE: ${data.mode}`,
      data.level ? `LEVEL: ${data.level}` : null,
      data.phase ? `PHASE: ${data.phase}` : null,
      data.goal ? `GOAL: ${data.goal}` : null,
      typeof data.streak === "number" ? `STREAK: ${data.streak} days` : null,
      data.location ? `LOCATION: ${data.location}` : null,
      `Give one specific, actionable recommendation for someone trying to break into the ${data.mode} industry. Maximum 2 sentences.`,
    ]
      .filter(Boolean)
      .join("\n");
    const json = await callGateway({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { recommendation: text };
  });

export const generateDailyTasks = createServerFn({ method: "POST" })
  .inputValidator((d: DashInput) => d)
  .handler(async ({ data }) => {
    const system = `You are AURUM — generate sharp, specific daily tasks for luxury-industry operators. No filler. Always invoke emit_daily_tasks.`;
    const user = [
      `MODE: ${data.mode}`,
      data.level ? `LEVEL: ${data.level}` : "LEVEL: beginner",
      data.phase ? `PHASE: ${data.phase}` : null,
      data.goal ? `GOAL: ${data.goal}` : null,
      typeof data.streak === "number" ? `STREAK: ${data.streak} days` : null,
      `Generate exactly 5 specific daily tasks for someone breaking into the ${data.mode} industry at ${data.level ?? "beginner"} level. Tasks should cover: networking, content, learning, outreach and relationship building.`,
    ]
      .filter(Boolean)
      .join("\n");
    const json = await callGateway({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      tools: [dailyTasksTool],
      tool_choice: { type: "function", function: { name: "emit_daily_tasks" } },
    });
    const argStr = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argStr) throw new Error("AI did not return daily tasks.");
    const parsed = JSON.parse(argStr) as { tasks: string[] };
    return { tasks: parsed.tasks };
  });

export const generateUpcomingEvents = createServerFn({ method: "POST" })
  .inputValidator((d: { mode: string }) => d)
  .handler(async ({ data }) => {
    const system = `You are AURUM — list real, well-known upcoming industry events. Use real event names like Monaco Yacht Show, MIPIM, Geneva Motor Show, NBAA-BACE, EBACE, Cannes Yachting Festival, Pebble Beach Concours, Fort Lauderdale Boat Show. Always invoke emit_upcoming_events.`;
    const user = `List 3 upcoming real industry events relevant to the ${data.mode} industry in the next 3 months. Use short uppercase date format (e.g. "OCT 24").`;
    const json = await callGateway({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      tools: [upcomingTool],
      tool_choice: {
        type: "function",
        function: { name: "emit_upcoming_events" },
      },
    });
    const argStr = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argStr) throw new Error("AI did not return events.");
    const parsed = JSON.parse(argStr) as {
      events: { date: string; title: string }[];
    };
    return { events: parsed.events };
  });
