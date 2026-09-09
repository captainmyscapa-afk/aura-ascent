import { createServerFn } from "@tanstack/react-start";
import { ai, type AiTool } from "@/lib/ai";
import { requireServerAuth } from "@/lib/serverAuth";

export const generateConversationTitle = createServerFn({ method: "POST" })
  .inputValidator((d: { firstMessage: string; industry: string }) => d)
  .handler(async ({ data }) => {
    await requireServerAuth();
    const { text } = await ai.chat([
      {
        role: "user",
        content: `Generate a short conversation title (max 6 words) for a mentoring chat in the ${data.industry} luxury industry.\n\nFirst message: "${data.firstMessage}"\n\nReturn ONLY the title, no quotes, no punctuation at the end. Examples:\nBreaking into Monaco yacht brokerage\nBuilding my aviation network\nFirst steps in luxury real estate`,
      },
    ]);
    return { title: (text.trim().slice(0, 60)) || "New conversation" };
  });

const quickInvocationsTool: AiTool = {
  type: "function",
  function: {
    name: "emit_quick_invocations",
    description: "Return 4 personalized mentor quick-invocation prompts.",
    parameters: {
      type: "object",
      properties: {
        prompts: {
          type: "array",
          minItems: 4,
          maxItems: 4,
          items: { type: "string" },
        },
      },
      required: ["prompts"],
      additionalProperties: false,
    },
  },
};

export type MentorQuickInvocationsInput = {
  mode: string;
  today: string; // e.g. "Wednesday, September 9, 2026"
  level?: string;
  phase?: string;
  goal?: string;
  streak?: number;
  executionScore?: number;
  daysSinceSignup?: number;
  recentTasks?: string[];
  // Previously-issued prompts for this mode, so the model doesn't repeat itself
  // batch after batch.
  avoidPrompts?: string[];
};

// CAP-131: "Quick Invocations" in Mentor used to be a static, hardcoded list per
// industry (e.g. yachts always said "Plan my Monaco Yacht Show week", even in
// September when Cannes Yachting Festival is the event actually happening).
// This generates 4 fresh, first-person prompts the user could tap to start a
// mentor conversation, grounded in: (1) what's actually happening right now in
// their industry's calendar, and (2) their real progress — level, phase,
// streak, execution score, time since signup, recent rituals — so day one
// looks different from day ninety.
export const generateMentorQuickInvocations = createServerFn({ method: "POST" })
  .inputValidator((d: MentorQuickInvocationsInput) => d)
  .handler(async ({ data }) => {
    await requireServerAuth();
    const signupContext =
      data.daysSinceSignup == null
        ? ""
        : data.daysSinceSignup <= 1
          ? "This is the user's first day — at least one prompt should help them get oriented and take a first concrete step."
          : `The user signed up ${data.daysSinceSignup} days ago.`;
    const result = await ai.complete(
      [
        {
          role: "system",
          content: `You are AURUM, a mentor for the ${data.mode} luxury industry. Generate 4 short, first-person "quick invocation" prompts a user could tap to instantly start a mentor conversation — the kind of thing THEY would say to a mentor, e.g. "Plan my week around the Cannes Yachting Festival" or "Coach me through my first cold outreach".

Ground the prompts in reality, not generic advice:
- At least one prompt must reference a REAL, currently-relevant event, season, or calendar moment for the ${data.mode} industry given today's date (${data.today}). Use real event names (Monaco Yacht Show, Cannes Yachting Festival, MIPIM, Geneva Motor Show, NBAA-BACE, EBACE, Pebble Beach Concours, Fort Lauderdale Boat Show, etc.) — pick whichever is ACTUALLY closest to or happening around today, not always the same one.
- At least one prompt must reflect the user's specific progress and next likely obstacle (level, phase, streak, execution score, recent activity) — reference it concretely, don't just say "keep going".
- Keep every prompt under 12 words, no quotes, no trailing punctuation, no emoji.
- Do not repeat any of the previously-used prompts listed below.

Always invoke emit_quick_invocations.`,
        },
        {
          role: "user",
          content: `Industry: ${data.mode}
${data.level ? `Level: ${data.level}` : ""}
${data.phase ? `Phase: ${data.phase}` : ""}
${data.goal ? `Goal: ${data.goal}` : ""}
${data.streak != null ? `Current streak: ${data.streak} days` : ""}
${data.executionScore != null ? `Execution score: ${data.executionScore}` : ""}
${signupContext}
${data.recentTasks?.length ? `Recently completed rituals: ${data.recentTasks.slice(-5).join("; ")}` : ""}
${data.avoidPrompts?.length ? `Previously used prompts — do not repeat: ${data.avoidPrompts.join(" | ")}` : ""}`,
        },
      ],
      [quickInvocationsTool],
      "emit_quick_invocations",
    );
    if (!result.args) throw new Error("AI did not return quick invocations.");
    return { prompts: (result.args as { prompts: string[] }).prompts };
  });

const lessonStartersTool: AiTool = {
  type: "function",
  function: {
    name: "emit_lesson_starters",
    description: "Return 4 personalized tutor lesson-starter prompts.",
    parameters: {
      type: "object",
      properties: {
        starters: {
          type: "array",
          minItems: 4,
          maxItems: 4,
          items: { type: "string" },
        },
      },
      required: ["starters"],
      additionalProperties: false,
    },
  },
};

export type TutorLessonStartersInput = {
  mode: string;
  trackName: string;
  completed: number;
  total: number;
  phaseNumber?: number;
  phaseTitle?: string;
  // Previously-issued starters for this mode, so the model doesn't repeat
  // itself batch after batch.
  avoidPrompts?: string[];
};

// CAP-132: "Lesson Starters" in Tutor used to be a static, hardcoded list per
// industry that always said "Walk me through module 1" -- even for a user
// who finished the whole track. This generates 4 fresh, first-person prompts
// grounded in the user's REAL academy progress, so a beginner and someone
// who's 90% through the track see different suggestions.
export const generateTutorLessonStarters = createServerFn({ method: "POST" })
  .inputValidator((d: TutorLessonStartersInput) => d)
  .handler(async ({ data }) => {
    await requireServerAuth();
    const progressContext =
      data.total === 0
        ? "The curriculum has no modules seeded yet -- keep starters generic to the industry."
        : data.completed === 0
          ? "The user hasn't completed any modules yet -- this is their first lesson."
          : data.completed >= data.total
            ? "The user has completed every module in this track -- treat them as advanced; suggest applying or deepening knowledge, not getting started."
            : `The user has completed ${data.completed} of ${data.total} modules. Their next unfinished topic area is "${data.phaseTitle ?? "unknown"}".`;
    const result = await ai.complete(
      [
        {
          role: "system",
          content: `You are AURUM Tutor, an educational assistant for the ${data.mode} industry (${data.trackName} curriculum). Generate 4 short, first-person "lesson starter" prompts a learner could tap to instantly start a tutoring lesson -- the kind of thing THEY would type, e.g. "Explain how yacht surveys work" or "Quiz me on brokerage commission structures".

Ground the prompts in the user's real progress, not a generic list:
- ${progressContext}
- At least one prompt must target that specific current topic/phase by name when one is given -- never default to "module 1" for a user who has already progressed past it.
- Vary the other prompts across styles: one foundational/definition, one practical example applied to ${data.mode.toLowerCase()}, one self-test/quiz-style question.
- Keep every prompt under 12 words, no quotes, no trailing punctuation, no emoji.
- Do not repeat any of the previously-used prompts listed below.

Always invoke emit_lesson_starters.`,
        },
        {
          role: "user",
          content: `Industry: ${data.mode}
Track: ${data.trackName}
Progress: ${data.completed}/${data.total} modules complete
${data.phaseTitle ? `Current phase: ${data.phaseTitle}` : ""}
${data.avoidPrompts?.length ? `Previously used prompts -- do not repeat: ${data.avoidPrompts.join(" | ")}` : ""}`,
        },
      ],
      [lessonStartersTool],
      "emit_lesson_starters",
    );
    if (!result.args) throw new Error("AI did not return lesson starters.");
    return { starters: (result.args as { starters: string[] }).starters };
  });
