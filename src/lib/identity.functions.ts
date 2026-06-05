import { createServerFn } from "@tanstack/react-start";
import { ai, type AiTool } from "@/lib/ai";

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

const auditTool: AiTool = {
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
              label: { type: "string", enum: ["HIGH IMPACT", "COMPOUNDING", "QUICK WIN"] },
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

const briefTool: AiTool = {
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

const dailyTasksTool: AiTool = {
  type: "function",
  function: {
    name: "emit_daily_tasks",
    description: "Return exactly 5 specific daily tasks.",
    parameters: {
      type: "object",
      properties: {
        tasks: {
          type: "array",
          minItems: 1,
          maxItems: 10,
          items: { type: "string" },
        },
      },
      required: ["tasks"],
      additionalProperties: false,
    },
  },
};

const upcomingTool: AiTool = {
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

type DashInput = {
  mode: string;
  level?: string;
  phase?: string;
  goal?: string;
  streak?: number;
  location?: string;
  taskCount?: number;
};

// ─── Server functions ─────────────────────────────────────────────────────────

export const generateIdentityAudit = createServerFn({ method: "POST" })
  .inputValidator((d: AuditInput) => d)
  .handler(async ({ data }) => {
    const result = await ai.complete(
      [
        {
          role: "system",
          content: `You are AURUM — an elite positioning strategist for ambitious operators entering luxury industries (yachts, jets, villas, cars). You produce sharp, personal, cinematic action items. No clichés. No motivational fluff. Always invoke the emit_positioning_audit tool.`,
        },
        {
          role: "user",
          content: [
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
            .join("\n"),
        },
      ],
      [auditTool],
      "emit_positioning_audit",
    );
    if (!result.args) throw new Error("AI did not return a structured audit.");
    return { audit: result.args as unknown as IdentityAudit };
  });

export const generateTodayBrief = createServerFn({ method: "POST" })
  .inputValidator((d: AuditInput) => d)
  .handler(async ({ data }) => {
    const result = await ai.complete(
      [
        {
          role: "system",
          content: `You are AURUM — produce a 3-line daily front-page brief for a luxury-industry operator. Confident, direct, cinematic. No filler. Always invoke emit_today_brief.`,
        },
        {
          role: "user",
          content: [
            `OPERATOR: ${data.name ?? "Operator"}`,
            `MODE: ${data.mode}`,
            data.level ? `LEVEL: ${data.level}` : null,
            data.location ? `LOCATION: ${data.location}` : null,
            data.goal ? `GOAL: ${data.goal}` : null,
            `Deliver: (1) #1 priority today, (2) one industry insight, (3) one network move.`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
      [briefTool],
      "emit_today_brief",
    );
    if (!result.args) throw new Error("AI did not return a structured brief.");
    return { brief: result.args as unknown as TodayBrief };
  });

export const generateRecommendation = createServerFn({ method: "POST" })
  .inputValidator((d: DashInput) => d)
  .handler(async ({ data }) => {
    const { text } = await ai.chat([
      {
        role: "system",
        content: `You are AURUM — give one specific, actionable recommendation. Maximum 2 sentences. Be direct and specific. No fluff.`,
      },
      {
        role: "user",
        content: [
          `MODE: ${data.mode}`,
          data.level ? `LEVEL: ${data.level}` : null,
          data.phase ? `PHASE: ${data.phase}` : null,
          data.goal ? `GOAL: ${data.goal}` : null,
          typeof data.streak === "number" ? `STREAK: ${data.streak} days` : null,
          data.location ? `LOCATION: ${data.location}` : null,
          `Give one specific, actionable recommendation for someone trying to break into the ${data.mode} industry. Maximum 2 sentences.`,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ]);
    return { recommendation: text.trim() };
  });

export const generateDailyTasks = createServerFn({ method: "POST" })
  .inputValidator((d: DashInput) => d)
  .handler(async ({ data }) => {
    const result = await ai.complete(
      [
        {
          role: "system",
          content: `You are AURUM — generate sharp, specific daily tasks for luxury-industry operators. No filler. Always invoke emit_daily_tasks.`,
        },
        {
          role: "user",
          content: [
            `MODE: ${data.mode}`,
            data.level ? `LEVEL: ${data.level}` : "LEVEL: beginner",
            data.phase ? `PHASE: ${data.phase}` : null,
            data.goal ? `GOAL: ${data.goal}` : null,
            typeof data.streak === "number" ? `STREAK: ${data.streak} days` : null,
            `Generate exactly ${data.taskCount ?? 5} specific daily tasks for someone breaking into the ${data.mode} industry at ${data.level ?? "beginner"} level. Tasks should cover: networking, content, learning, outreach and relationship building.`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
      [dailyTasksTool],
      "emit_daily_tasks",
    );
    if (!result.args) throw new Error("AI did not return daily tasks.");
    return { tasks: (result.args as { tasks: string[] }).tasks };
  });

export const generateUpcomingEvents = createServerFn({ method: "POST" })
  .inputValidator((d: { mode: string }) => d)
  .handler(async ({ data }) => {
    const result = await ai.complete(
      [
        {
          role: "system",
          content: `You are AURUM — list real, well-known upcoming industry events. Use real event names like Monaco Yacht Show, MIPIM, Geneva Motor Show, NBAA-BACE, EBACE, Cannes Yachting Festival, Pebble Beach Concours, Fort Lauderdale Boat Show. Always invoke emit_upcoming_events.`,
        },
        {
          role: "user",
          content: `List 3 upcoming real industry events relevant to the ${data.mode} industry in the next 3 months. Use short uppercase date format (e.g. "OCT 24").`,
        },
      ],
      [upcomingTool],
      "emit_upcoming_events",
    );
    if (!result.args) throw new Error("AI did not return events.");
    return { events: (result.args as { events: { date: string; title: string }[] }).events };
  });

// ─── 30-Day Roadmap ──────────────────────────────────────────────────────────

export type RoadmapTask = {
  id: string;
  type: "networking" | "content" | "learning" | "outreach" | "mindset";
  title: string;
  detail: string;
  duration: string;
};

export type RoadmapDay = {
  day: number;
  theme: string;
  tasks: RoadmapTask[];
  milestone?: string;
};

export type RoadmapWeek = {
  week: number;
  theme: string;
  focus: string;
  days: RoadmapDay[];
};

export type Roadmap = {
  headline: string;
  industry: string;
  level: string;
  weeks: RoadmapWeek[];
};

// Simplified week tool — one API call per week to stay within token limits
const weekTool: AiTool = {
  type: "function",
  function: {
    name: "emit_week",
    description: "Return one week of the 30-day roadmap.",
    parameters: {
      type: "object",
      properties: {
        week: { type: "number" },
        theme: { type: "string", description: "Week theme e.g. 'Foundation & Orientation'" },
        focus: { type: "string", description: "One sentence on the week's core intent" },
        days: {
          type: "array",
          minItems: 7,
          maxItems: 7,
          items: {
            type: "object",
            properties: {
              day: { type: "number", description: "1-7 within the week" },
              theme: { type: "string", description: "Day theme in 3-5 words" },
              milestone: { type: "string", description: "Only on day 7 — a short celebration statement" },
              tasks: {
                type: "array",
                minItems: 2,
                maxItems: 2,
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "unique slug e.g. w1d1-t1" },
                    type: { type: "string", enum: ["networking", "content", "learning", "outreach", "mindset"] },
                    title: { type: "string", description: "Action title, max 8 words" },
                    detail: { type: "string", description: "Specific how-to, 1 sentence" },
                    duration: { type: "string", description: "e.g. '30 min'" },
                  },
                  required: ["id", "type", "title", "detail", "duration"],
                  additionalProperties: false,
                },
              },
            },
            required: ["day", "theme", "tasks"],
            additionalProperties: false,
          },
        },
      },
      required: ["week", "theme", "focus", "days"],
      additionalProperties: false,
    },
  },
};

type RoadmapInput = {
  industry: string;
  level: string;
  goal?: string;
  ambitions?: string[];
};

const WEEK_THEMES = [
  "Foundation & Orientation",
  "First Moves & Network Entry",
  "Acceleration & Visibility",
  "Positioning & Closing",
];

// Parse roadmap JSON from plain text response (more reliable than tool calling on Llama)
function parseWeekJson(text: string, weekNum: number, baseDay: number): RoadmapWeek | null {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    // Find the first { ... } block
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as RoadmapWeek;
    if (!parsed.days?.length) return null;
    // Normalize day numbers to global (1-30)
    parsed.days = parsed.days.map((d, i) => ({
      ...d,
      day: baseDay + i,
      tasks: (d.tasks ?? []).map((t, ti) => ({
        ...t,
        id: t.id || `w${weekNum}d${i + 1}-t${ti + 1}`,
        type: (["networking","content","learning","outreach","mindset"].includes(t.type) ? t.type : "learning") as RoadmapTask["type"],
      })),
    }));
    parsed.week = weekNum;
    if (!parsed.theme) parsed.theme = WEEK_THEMES[weekNum - 1];
    if (!parsed.focus) parsed.focus = `Week ${weekNum} of your ${WEEK_THEMES[weekNum - 1]} journey.`;
    return parsed;
  } catch {
    return null;
  }
}

export const generateRoadmap = createServerFn({ method: "POST" })
  .inputValidator((d: RoadmapInput) => d)
  .handler(async ({ data }) => {
    const baseContext = [
      `INDUSTRY: ${data.industry}`,
      `LEVEL: ${data.level}`,
      data.goal ? `GOAL: ${data.goal}` : "",
    ].filter(Boolean).join("\n");

    const weeks: RoadmapWeek[] = [];

    for (let w = 1; w <= 4; w++) {
      const baseDay = (w - 1) * 7 + 1;
      // Use plain chat (no tool calling) — more reliable across all providers
      const { text } = await ai.chat([
        {
          role: "system",
          content: `You are AURUM — elite luxury industry strategist. Return ONLY valid JSON, no markdown, no explanation. Tasks must use real ${data.industry} industry terms, platforms, and actions.`,
        },
        {
          role: "user",
          content: `${baseContext}

Generate Week ${w} of 4: "${WEEK_THEMES[w - 1]}" (Days ${baseDay}–${baseDay + 6}).

Return this exact JSON structure:
{
  "week": ${w},
  "theme": "${WEEK_THEMES[w - 1]}",
  "focus": "one sentence on the week's core intent",
  "days": [
    {
      "day": ${baseDay},
      "theme": "day theme 3-5 words",
      "tasks": [
        {"id": "w${w}d1-t1", "type": "networking", "title": "action title max 8 words", "detail": "specific how-to 1 sentence", "duration": "30 min"},
        {"id": "w${w}d1-t2", "type": "learning", "title": "action title max 8 words", "detail": "specific how-to 1 sentence", "duration": "45 min"}
      ]
    }
    ... 7 days total, day ${baseDay + 6} must include "milestone": "achievement statement"
  ]
}

Types: networking, content, learning, outreach, mindset. Mix them. Be specific to ${data.industry}.`,
        },
      ]);

      const weekData = parseWeekJson(text, w, baseDay);
      if (!weekData) {
        // Fallback: create a basic week structure if parse fails
        const fallback: RoadmapWeek = {
          week: w,
          theme: WEEK_THEMES[w - 1],
          focus: `Build momentum in ${data.industry} through consistent daily action.`,
          days: Array.from({ length: 7 }, (_, i) => ({
            day: baseDay + i,
            theme: `Day ${baseDay + i}`,
            milestone: i === 6 ? `Week ${w} complete — you're building real momentum.` : undefined,
            tasks: [
              { id: `w${w}d${i + 1}-t1`, type: "learning" as const, title: `Study ${data.industry} fundamentals`, detail: `Research key players, terminology and deal structures in ${data.industry}.`, duration: "45 min" },
              { id: `w${w}d${i + 1}-t2`, type: "networking" as const, title: "Reach out to one industry professional", detail: `Find and connect with a ${data.industry} professional on LinkedIn with a personalised message.`, duration: "20 min" },
            ],
          })),
        };
        weeks.push(fallback);
      } else {
        weeks.push(weekData);
      }
    }

    const headline = `Your 30-Day Entry into ${data.industry}`;

    return {
      roadmap: {
        headline,
        industry: data.industry,
        level: data.level,
        weeks,
      } as Roadmap,
    };
  });
