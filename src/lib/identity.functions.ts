import { createServerFn } from "@tanstack/react-start";
import { ai, type AiTool } from "@/lib/ai";
import { requireServerAuth } from "@/lib/serverAuth";

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
  ritualProfile?: RitualProfileInput;
  // Recently-generated ritual task strings for this user+mode, so the model doesn't
  // repeat or lightly reword something it already gave them on a previous day.
  avoidTasks?: string[];
};

// CAP-78: the 5 daily-ritual onboarding answers, used to personalise daily tasks
export type RitualProfileInput = {
  timeBudget?: "15min" | "30min" | "1hr" | "2hr+";
  preferredTime?: "morning" | "midday" | "evening" | "late_night";
  background?: string;
  focusAreas?: string[];
  biggestChallenge?: string;
};

const TIME_BUDGET_LABEL: Record<string, string> = {
  "15min": "about 15 minutes total — each task should be a 2-4 minute micro-action",
  "30min": "about 30 minutes total — each task should take roughly 5-8 minutes",
  "1hr": "about 1 hour total — each task should take roughly 10-15 minutes",
  "2hr+": "2+ hours total — tasks can be more substantial, roughly 20-30 minutes each",
};

const PREFERRED_TIME_LABEL: Record<string, string> = {
  morning: "early morning, before the day gets busy",
  midday: "during the day, in short breaks",
  evening: "in the evening, after work",
  late_night: "late at night, when things wind down",
};

// ─── Server functions ─────────────────────────────────────────────────────────

export const generateIdentityAudit = createServerFn({ method: "POST" })
  .inputValidator((d: AuditInput) => d)
  .handler(async ({ data }) => {
    await requireServerAuth();
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
    await requireServerAuth();
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
    await requireServerAuth();
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
    await requireServerAuth();
    const ritual = data.ritualProfile;
    const taskCount = data.taskCount ?? 5;

    const result = await ai.complete(
      [
        {
          role: "system",
          content: `You are AURUM — generate sharp, specific daily tasks ("daily rituals") for luxury-industry operators. Tasks must feel achievable in the time the person actually has, relevant to their real life and experience, and like they genuinely move the person forward — not generic busywork. No filler. Always invoke emit_daily_tasks.`,
        },
        {
          role: "user",
          content: [
            `MODE: ${data.mode}`,
            data.level ? `LEVEL: ${data.level}` : "LEVEL: beginner",
            data.phase ? `PHASE: ${data.phase}` : null,
            data.goal ? `GOAL: ${data.goal}` : null,
            typeof data.streak === "number" ? `STREAK: ${data.streak} days` : null,
            ritual?.timeBudget ? `DAILY TIME BUDGET: ${TIME_BUDGET_LABEL[ritual.timeBudget] ?? ritual.timeBudget}` : null,
            ritual?.preferredTime ? `WHEN THEY DO THIS: ${PREFERRED_TIME_LABEL[ritual.preferredTime] ?? ritual.preferredTime}` : null,
            ritual?.background ? `THEIR BACKGROUND: ${ritual.background}` : null,
            ritual?.focusAreas?.length ? `PRIORITY FOCUS AREAS (weight tasks toward these): ${ritual.focusAreas.join(", ")}` : null,
            ritual?.biggestChallenge ? `THEIR BIGGEST OBSTACLE RIGHT NOW: "${ritual.biggestChallenge}" — at least one task should directly help with this.` : null,
            `Generate exactly ${taskCount} self-directed research and study tasks for someone breaking into the ${data.mode} industry at ${data.level ?? "beginner"} level. These are desk-based learning assignments — never outreach, cold messaging, or asking the person to contact real people.`,
            // CAP-124: the AI's own default framing had drifted toward outreach/DM-style
            // tasks ("map out your contacts", "draft a DM to a broker"), which Captain
            // flagged as feeling far less coherent than the research/study format he'd
            // been getting before. Locking the format to that proven rotation instead
            // of leaving it to loose categories ("networking, outreach, ...").
            `Cycle through exactly this rotation of task formats (repeat the cycle if ${taskCount} isn't 5):
1. "Research [a specific concept/practice] and its role in [context], including [a specific sub-angle]"
2. "Create a list of 5 notable [companies/models/professionals/terms], including [a specific detail to capture for each]" — or a timeline of key milestones
3. "Write a short summary/case study/analysis, 100-150 words, on [a specific topic], including [a specific angle]"
4. "Develop a 2-point plan to learn about [a specific topic]" — or a list of 5 key factors that influence something specific
5. "Identify and explore one [industry-specific course, webinar, publication, or notable figure], such as [a concrete real example], to [a specific learning goal]"
Every task must read in this research/study register.`,
            ritual?.focusAreas?.length
              ? `Weight the SUBJECT MATTER of the tasks toward these priority focus areas, but keep the exact task-format rotation above: ${ritual.focusAreas.join(", ")}.`
              : null,
            ritual?.background
              ? `Where possible, connect tasks to their background/experience above so they feel personal and relatable, not generic.`
              : null,
            `Each task must fit within the daily time budget given above — do not propose tasks that would take longer than the person has.`,
            data.avoidTasks?.length
              ? `ALREADY USED RECENTLY — do not repeat, and do not lightly reword or reorder any of these:\n${data.avoidTasks.map((t) => `- ${t}`).join("\n")}\nGenerate genuinely different tasks that cover new ground.`
              : null,
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
    await requireServerAuth();
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
  // CAP-78: personalize the 30-day roadmap with the same ritual profile used for daily rituals
  ritualProfile?: RitualProfileInput;
  // CAP-80: generate the roadmap content in the user's selected language
  language?: "en" | "fr";
};

// CAP-78: how many tasks/day and roughly how long each should take, given the user's daily time budget
const ROADMAP_TIME_CONFIG: Record<string, { tasksPerDay: number; duration: string; total: string }> = {
  "15min": { tasksPerDay: 1, duration: "10-15 min", total: "about 15 minutes" },
  "30min": { tasksPerDay: 2, duration: "12-18 min", total: "about 30 minutes" },
  "1hr":   { tasksPerDay: 2, duration: "25-35 min", total: "about 1 hour" },
  "2hr+":  { tasksPerDay: 3, duration: "30-45 min", total: "2+ hours" },
};
const DEFAULT_ROADMAP_TIME = { tasksPerDay: 2, duration: "20-45 min", total: "about an hour" };

const WEEK_THEMES = [
  "Foundation & Orientation",
  "First Moves & Network Entry",
  "Acceleration & Visibility",
  "Positioning & Closing",
];

// CAP-80: French versions of the week themes, used when language === "fr"
const WEEK_THEMES_FR = [
  "Fondations & Orientation",
  "Premiers Pas & Entrée en Réseau",
  "Accélération & Visibilité",
  "Positionnement & Conclusion",
];

// Parse roadmap JSON from plain text response (more reliable than tool calling on Llama)
function parseWeekJson(text: string, weekNum: number, baseDay: number, themes: string[], isFrench: boolean): RoadmapWeek | null {
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
    if (!parsed.theme) parsed.theme = themes[weekNum - 1];
    if (!parsed.focus) parsed.focus = isFrench
      ? `Semaine ${weekNum} de votre parcours « ${themes[weekNum - 1]} ».`
      : `Week ${weekNum} of your ${themes[weekNum - 1]} journey.`;
    return parsed;
  } catch {
    return null;
  }
}

export const generateRoadmap = createServerFn({ method: "POST" })
  .inputValidator((d: RoadmapInput) => d)
  .handler(async ({ data }) => {
    await requireServerAuth();
    const ritual = data.ritualProfile;
    const isFrench = data.language === "fr";
    const themes = isFrench ? WEEK_THEMES_FR : WEEK_THEMES;
    const timeConfig = (ritual?.timeBudget && ROADMAP_TIME_CONFIG[ritual.timeBudget]) || DEFAULT_ROADMAP_TIME;

    const baseContext = [
      `INDUSTRY: ${data.industry}`,
      `LEVEL: ${data.level}`,
      data.goal ? `GOAL: ${data.goal}` : "",
      ritual?.timeBudget ? `DAILY TIME BUDGET: ${TIME_BUDGET_LABEL[ritual.timeBudget] ?? ritual.timeBudget}` : "",
      ritual?.preferredTime ? `WHEN THEY DO THIS: ${PREFERRED_TIME_LABEL[ritual.preferredTime] ?? ritual.preferredTime}` : "",
      ritual?.background ? `THEIR BACKGROUND: ${ritual.background}` : "",
      ritual?.focusAreas?.length ? `PRIORITY FOCUS AREAS (weight tasks toward these): ${ritual.focusAreas.join(", ")}` : "",
      ritual?.biggestChallenge ? `THEIR BIGGEST OBSTACLE: "${ritual.biggestChallenge}" — some tasks across the roadmap should help with this.` : "",
    ].filter(Boolean).join("\n");

    const weeks: RoadmapWeek[] = [];

    for (let w = 1; w <= 4; w++) {
      const baseDay = (w - 1) * 7 + 1;
      const taskLines = Array.from({ length: timeConfig.tasksPerDay }, (_, ti) =>
        `        {"id": "w${w}d1-t${ti + 1}", "type": "${ti === 0 ? "networking" : ti === 1 ? "learning" : "content"}", "title": "action title max 8 words", "detail": "specific how-to 1 sentence", "duration": "${timeConfig.duration}"}`,
      ).join(",\n");

      // Use plain chat (no tool calling) — more reliable across all providers
      const { text } = await ai.chat([
        {
          role: "system",
          content: `You are AURUM — elite luxury industry strategist. Return ONLY valid JSON, no markdown, no explanation. Tasks must use real ${data.industry} industry terms, platforms, and actions. Tasks must feel achievable in the time the person actually has, and relevant to their real life and experience — not generic busywork.${isFrench ? " Write every text value (theme, focus, day theme, task title, task detail, milestone) in natural, native French — not a literal word-for-word translation. JSON keys and the \"type\" enum values must remain in English exactly as specified." : ""}`,
        },
        {
          role: "user",
          content: `${baseContext}

Generate Week ${w} of 4: "${themes[w - 1]}" (Days ${baseDay}–${baseDay + 6}).

Return this exact JSON structure:
{
  "week": ${w},
  "theme": "${themes[w - 1]}",
  "focus": "one sentence on the week's core intent",
  "days": [
    {
      "day": ${baseDay},
      "theme": "day theme 3-5 words",
      "tasks": [
${taskLines}
      ]
    }
    ... 7 days total, day ${baseDay + 6} must include "milestone": "achievement statement"
  ]
}

Each day must have exactly ${timeConfig.tasksPerDay} task${timeConfig.tasksPerDay === 1 ? "" : "s"}, each taking roughly ${timeConfig.duration}, so the whole day's rituals fit within ${timeConfig.total}.
Types: networking, content, learning, outreach, mindset (keep these "type" values in English). Mix them across the week${ritual?.focusAreas?.length ? `, leaning toward: ${ritual.focusAreas.join(", ")}` : ""}. Be specific to ${data.industry}${ritual?.background ? `, and where natural connect tasks to their background (${ritual.background})` : ""}.`,
        },
      ], { maxTokens: 3000 }); // a full week is 7 days of structured JSON — ai.chat's
      // default short-reply budget (800 tokens) was truncating this mid-object,
      // which parseWeekJson then silently swallowed as a parse failure, falling
      // back to the same generic 3-task template for every day of the week.
      // That's almost certainly what "the roadmap isn't right" was describing.

      const weekData = parseWeekJson(text, w, baseDay, themes, isFrench);
      if (!weekData) {
        // Fallback: create a basic week structure if parse fails
        const fallbackTasks = isFrench ? [
          { id: "t1", type: "learning" as const, title: `Étudier les fondamentaux du secteur ${data.industry}`, detail: `Renseignez-vous sur les acteurs clés, le vocabulaire et les types d'accords dans le secteur ${data.industry}.`, duration: timeConfig.duration },
          { id: "t2", type: "networking" as const, title: "Contacter un professionnel du secteur", detail: `Trouvez un professionnel du secteur ${data.industry} sur LinkedIn et envoyez-lui un message personnalisé.`, duration: timeConfig.duration },
          { id: "t3", type: "content" as const, title: "Partager une observation sur le secteur", detail: `Publiez une courte réflexion sur ce que vous avez appris cette semaine dans le secteur ${data.industry}.`, duration: timeConfig.duration },
        ].slice(0, timeConfig.tasksPerDay) : [
          { id: "t1", type: "learning" as const, title: `Study ${data.industry} fundamentals`, detail: `Research key players, terminology and deal structures in ${data.industry}.`, duration: timeConfig.duration },
          { id: "t2", type: "networking" as const, title: "Reach out to one industry professional", detail: `Find and connect with a ${data.industry} professional on LinkedIn with a personalised message.`, duration: timeConfig.duration },
          { id: "t3", type: "content" as const, title: "Share an industry observation", detail: `Post a short, thoughtful note about something you learned in ${data.industry} this week.`, duration: timeConfig.duration },
        ].slice(0, timeConfig.tasksPerDay);

        const fallback: RoadmapWeek = {
          week: w,
          theme: themes[w - 1],
          focus: isFrench
            ? `Construisez votre élan dans le secteur ${data.industry} grâce à des actions quotidiennes régulières.`
            : `Build momentum in ${data.industry} through consistent daily action.`,
          days: Array.from({ length: 7 }, (_, i) => ({
            day: baseDay + i,
            theme: isFrench ? `Jour ${baseDay + i}` : `Day ${baseDay + i}`,
            milestone: i === 6 ? (isFrench ? `Semaine ${w} terminée — votre élan est bien réel.` : `Week ${w} complete — you're building real momentum.`) : undefined,
            tasks: fallbackTasks.map((t, ti) => ({ ...t, id: `w${w}d${i + 1}-t${ti + 1}` })),
          })),
        };
        weeks.push(fallback);
      } else {
        weeks.push(weekData);
      }
    }

    const headline = isFrench
      ? `Votre programme de 30 jours dans le secteur ${data.industry}`
      : `Your 30-Day Entry into ${data.industry}`;

    return {
      roadmap: {
        headline,
        industry: data.industry,
        level: data.level,
        weeks,
      } as Roadmap,
    };
  });
