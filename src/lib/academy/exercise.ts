// Shared types + helpers for Academy exercises and the Yacht Broker Portfolio.
// An exercise is stored as JSON on academy_module_pages.exercise; a learner's
// answers live in academy_exercise_answers (one row per user + page).

export type PortfolioSectionId = "profile" | "yachts" | "sales" | "market" | "services" | "testimonials";

export const PORTFOLIO_SECTIONS: { id: PortfolioSectionId; title: string; eyebrow: string; empty: string }[] = [
  { id: "profile", title: "Broker Profile", eyebrow: "01 · ABOUT", empty: "Your background, strengths and career thesis appear here as you complete exercises." },
  { id: "yachts", title: "Yacht Portfolio", eyebrow: "02 · VESSELS", empty: "The yachts you study and shortlist appear here as you progress through the Academy." },
  { id: "sales", title: "Recent Sales & Charters", eyebrow: "03 · TRACK RECORD", empty: "Your deal write-ups and case studies appear here in later modules." },
  { id: "market", title: "Market Expertise", eyebrow: "04 · MARKETS", empty: "The areas, yacht types and client segments you know appear here." },
  { id: "services", title: "Services & Approach", eyebrow: "05 · HOW I WORK", empty: "How you advise buyers, sellers and charter clients appears here." },
  { id: "testimonials", title: "Client Testimonials", eyebrow: "06 · REFERENCES", empty: "Testimonials and references appear here once you have them." },
];

export type ExerciseFieldType = "short" | "long" | "rating" | "choice";

export type ExerciseField = {
  key: string;
  label: string;
  type: ExerciseFieldType;
  min?: number;
  placeholder?: string;
  options?: string[];
};

export type ExerciseGroup = {
  title: string;
  section: PortfolioSectionId;
  fields: ExerciseField[];
};

export type ExerciseDef = {
  intro?: string;
  groups: ExerciseGroup[];
};

export type ExerciseAnswers = Record<string, string>;

const SECTION_IDS = PORTFOLIO_SECTIONS.map((s) => s.id);

export function parseExercise(raw: unknown): ExerciseDef | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { intro?: unknown; groups?: unknown };
  if (!Array.isArray(r.groups)) return null;
  const groups: ExerciseGroup[] = [];
  for (const g of r.groups as any[]) {
    if (!g || !Array.isArray(g.fields)) continue;
    const fields: ExerciseField[] = [];
    for (const f of g.fields as any[]) {
      if (!f || typeof f.key !== "string" || typeof f.label !== "string") continue;
      const type: ExerciseFieldType = ["short", "long", "rating", "choice"].includes(f.type) ? f.type : "short";
      fields.push({
        key: f.key,
        label: f.label,
        type,
        min: typeof f.min === "number" ? f.min : undefined,
        placeholder: typeof f.placeholder === "string" ? f.placeholder : undefined,
        options: Array.isArray(f.options) ? f.options.filter((o: unknown) => typeof o === "string") : undefined,
      });
    }
    groups.push({
      title: typeof g.title === "string" ? g.title : "",
      section: SECTION_IDS.includes(g.section) ? g.section : "profile",
      fields,
    });
  }
  return { intro: typeof r.intro === "string" ? r.intro : undefined, groups };
}

export function isFieldValid(f: ExerciseField, value: string | undefined): boolean {
  const v = (value ?? "").trim();
  if (f.type === "rating") return /^[1-5]$/.test(v);
  if (f.type === "choice") return !!f.options?.includes(v);
  return v.length >= (f.min ?? 3);
}

export function missingFieldKeys(def: ExerciseDef, answers: ExerciseAnswers): string[] {
  const out: string[] = [];
  for (const g of def.groups) for (const f of g.fields) if (!isFieldValid(f, answers[f.key])) out.push(f.key);
  return out;
}

export function countFields(def: ExerciseDef): number {
  return def.groups.reduce((n, g) => n + g.fields.length, 0);
}
