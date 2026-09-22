import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  PORTFOLIO_SECTIONS,
  missingFieldKeys,
  type ExerciseAnswers,
  type ExerciseDef,
  type ExerciseField,
  type ExerciseFieldType,
  type PortfolioSectionId,
} from "@/lib/academy/exercise";

// ─── Learner form ────────────────────────────────────────────────────────────
// Answers autosave as a draft; "Save & complete" validates server-side
// (save_exercise_answers RPC) and marks the exercise done, which is what the
// module quiz gate looks at. Everything saved here appears in the Broker Portfolio.

export function ExerciseForm({
  pageId,
  heading,
  def,
  initial,
  completed,
  onSaved,
}: {
  pageId: string;
  heading: string;
  def: ExerciseDef;
  initial: ExerciseAnswers;
  completed: boolean;
  onSaved: (answers: ExerciseAnswers, completed: boolean) => void;
}) {
  const [answers, setAnswers] = useState<ExerciseAnswers>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [completing, setCompleting] = useState(false);
  const [missing, setMissing] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(answers);
  latest.current = answers;

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const rpc = async (payload: ExerciseAnswers, complete: boolean) => {
    const { data, error } = await (supabase as any).rpc("save_exercise_answers", {
      p_page_id: pageId,
      p_answers: payload,
      p_complete: complete,
    });
    if (error) throw error;
    return data as { completed: boolean; missing: string[]; answers: ExerciseAnswers };
  };

  const setValue = (key: string, value: string) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setMissing((m) => { if (!m.has(key)) return m; const n = new Set(m); n.delete(key); return n; });
    setStatus("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setStatus("saving");
      try {
        const res = await rpc(latest.current, false);
        setStatus("saved");
        onSaved(res.answers, res.completed);
      } catch (e) {
        console.error("Exercise draft save failed:", e);
        setStatus("error");
      }
    }, 1200);
  };

  const complete = async () => {
    if (timer.current) clearTimeout(timer.current);
    setError(null);
    const localMissing = missingFieldKeys(def, answers);
    if (localMissing.length > 0) {
      setMissing(new Set(localMissing));
      setError(`${localMissing.length} field${localMissing.length === 1 ? " still needs" : "s still need"} an answer.`);
      document.getElementById(`ex-${localMissing[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setCompleting(true);
    try {
      const res = await rpc(answers, true);
      if (!res.completed) {
        setMissing(new Set(res.missing));
        setError("Some answers are too short. Add a little more detail.");
      } else {
        setStatus("saved");
      }
      onSaved(res.answers, res.completed);
    } catch (e) {
      console.error("Exercise save failed:", e);
      setError((e as { message?: string })?.message ?? "Could not save. Try again.");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="glass rounded-xl p-6 sm:p-8 mb-6 border border-primary/20 animate-fade-up">
      <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-1">EXERCISE · SAVED TO YOUR BROKER PORTFOLIO</div>
      <div className="text-xs text-muted-foreground mb-4">{heading}</div>
      {def.intro && <p className="text-sm leading-relaxed text-foreground/90 mb-6">{def.intro}</p>}

      <div className="space-y-8">
        {def.groups.map((g, gi) => (
          <div key={gi}>
            {g.title && <h4 className="font-serif text-lg mb-3">{g.title}</h4>}
            <div className={g.fields.every((f) => f.type === "rating") ? "grid sm:grid-cols-2 gap-x-6 gap-y-4" : "space-y-4"}>
              {g.fields.map((f) => (
                <FieldInput key={f.key} field={f} value={answers[f.key] ?? ""} invalid={missing.has(f.key)} onChange={(v) => setValue(f.key, v)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-xs">{error}</div>
      )}

      <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-[11px] text-muted-foreground min-h-[1rem]">
          {status === "saving" && "Saving draft…"}
          {status === "saved" && "Draft saved"}
          {status === "error" && "Couldn't save your draft — check your connection."}
        </div>
        <button
          onClick={complete}
          disabled={completing}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-primary-foreground text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--gradient-gold)" }}
        >
          {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {completed ? "Update exercise" : "Save & complete exercise"}
        </button>
      </div>
    </div>
  );
}

export function FieldInput({
  field, value, invalid, onChange, compact,
}: {
  field: ExerciseField;
  value: string;
  invalid?: boolean;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  const border = invalid ? "border-destructive/60" : "border-border focus:border-primary/50";
  const label = <label htmlFor={`ex-${field.key}`} className="block text-sm text-foreground/90 mb-1.5">{field.label}</label>;

  if (field.type === "rating") {
    return (
      <div id={`ex-${field.key}`}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-foreground/90">{field.label}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={`${n}-${value === String(n)}`}
                type="button"
                onClick={() => onChange(String(n))}
                className={`h-8 w-8 rounded-full border text-xs transition-all hover:scale-110 active:scale-95 ${
                  value === String(n)
                    ? "border-primary bg-primary text-primary-foreground animate-pop shadow-[var(--shadow-gold)]"
                    : value && Number(value) >= n
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : invalid ? "border-destructive/60 hover:border-primary/40" : "border-border hover:border-primary/40"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (field.type === "choice") {
    return (
      <div id={`ex-${field.key}`}>
        {label}
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              className={`px-3.5 py-1.5 rounded-full border text-xs transition-colors ${
                value === o ? "border-primary bg-primary/10 text-primary" : invalid ? "border-destructive/60" : "border-border hover:border-primary/40"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "long") {
    const need = field.min ?? 3;
    const have = value.trim().length;
    const pct = Math.min(1, need > 0 ? have / need : 1);
    const reached = have >= need;
    const R = 8, C = 2 * Math.PI * R;
    return (
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">{label}</div>
          {need >= 20 && (
            <span className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-mono ${reached ? "text-primary" : "text-muted-foreground"}`}>
              <svg width="20" height="20" viewBox="0 0 20 20" className={reached ? "animate-pop" : ""}>
                <circle cx="10" cy="10" r={R} fill="none" strokeWidth="2" className="stroke-secondary/60" />
                <circle cx="10" cy="10" r={R} fill="none" strokeWidth="2" strokeLinecap="round" className="stroke-primary transition-all duration-500"
                  strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 10 10)" />
              </svg>
              {reached ? "Great" : `${have}/${need}`}
            </span>
          )}
        </div>
        <textarea
          id={`ex-${field.key}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={compact ? 4 : 5}
          maxLength={4000}
          className={`w-full bg-transparent border rounded-lg px-3 py-2 text-sm leading-relaxed outline-none resize-y transition-colors ${border}`}
        />
      </div>
    );
  }

  return (
    <div>
      {label}
      <input
        id={`ex-${field.key}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        maxLength={4000}
        className={`w-full bg-transparent border rounded-lg px-3 py-2 text-sm outline-none transition-colors ${border}`}
      />
    </div>
  );
}

// ─── Admin editor ────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<ExerciseFieldType, string> = {
  short: "Short answer",
  long: "Long answer",
  rating: "Rating 1–5",
  choice: "Choice",
};

export function ExerciseEditor({ value, onChange }: { value: ExerciseDef; onChange: (v: ExerciseDef) => void }) {
  const setGroup = (gi: number, patch: Partial<ExerciseDef["groups"][number]>) =>
    onChange({ ...value, groups: value.groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)) });
  const setField = (gi: number, fi: number, patch: Partial<ExerciseField>) =>
    setGroup(gi, { fields: value.groups[gi].fields.map((f, i) => (i === fi ? { ...f, ...patch } : f)) });
  const newKey = () => `f_${Math.random().toString(36).slice(2, 8)}`;

  const inputCls = "bg-transparent border border-border rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-primary/50 transition-colors";

  return (
    <div className="space-y-5">
      <textarea
        value={value.intro ?? ""}
        onChange={(e) => onChange({ ...value, intro: e.target.value })}
        placeholder="Exercise intro shown above the fields"
        rows={2}
        className={`w-full resize-none ${inputCls}`}
      />
      {value.groups.map((g, gi) => (
        <div key={gi} className="rounded-lg border border-border p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={g.title}
              onChange={(e) => setGroup(gi, { title: e.target.value })}
              placeholder="Group title"
              className={`flex-1 min-w-[10rem] ${inputCls}`}
            />
            <select
              value={g.section}
              onChange={(e) => setGroup(gi, { section: e.target.value as PortfolioSectionId })}
              className={`${inputCls} bg-background`}
              title="Portfolio section these answers appear in"
            >
              {PORTFOLIO_SECTIONS.map((s) => <option key={s.id} value={s.id}>Portfolio: {s.title}</option>)}
            </select>
            <button
              type="button"
              onClick={() => onChange({ ...value, groups: value.groups.filter((_, i) => i !== gi) })}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Delete group"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          {g.fields.map((f, fi) => (
            <div key={f.key} className="flex flex-wrap items-center gap-2">
              <input
                value={f.label}
                onChange={(e) => setField(gi, fi, { label: e.target.value })}
                placeholder="Field label / prompt"
                className={`flex-1 min-w-[12rem] ${inputCls}`}
              />
              <select
                value={f.type}
                onChange={(e) => setField(gi, fi, { type: e.target.value as ExerciseFieldType, options: e.target.value === "choice" ? f.options ?? ["Yes", "No"] : undefined })}
                className={`${inputCls} bg-background`}
              >
                {(Object.keys(TYPE_LABEL) as ExerciseFieldType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
              </select>
              {(f.type === "short" || f.type === "long") && (
                <input
                  type="number"
                  min={1}
                  value={f.min ?? 3}
                  onChange={(e) => setField(gi, fi, { min: Math.max(1, Number(e.target.value) || 1) })}
                  title="Minimum characters"
                  className={`w-16 ${inputCls}`}
                />
              )}
              {f.type === "choice" && (
                <input
                  value={(f.options ?? []).join(", ")}
                  onChange={(e) => setField(gi, fi, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
                  placeholder="Options, comma separated"
                  className={`flex-1 min-w-[10rem] ${inputCls}`}
                />
              )}
              <button
                type="button"
                onClick={() => setGroup(gi, { fields: g.fields.filter((_, i) => i !== fi) })}
                className="text-muted-foreground hover:text-destructive transition-colors"
                title="Delete field"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setGroup(gi, { fields: [...g.fields, { key: newKey(), label: "", type: "short", min: 3 }] })}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> Add field
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange({ ...value, groups: [...value.groups, { title: "", section: "profile", fields: [{ key: newKey(), label: "", type: "short", min: 3 }] }] })}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <Plus className="h-3 w-3" /> Add group
      </button>
      <p className="text-[11px] text-muted-foreground">
        Changing a field's label keeps learners' saved answers. Deleting a field hides its answers. Only the section a group is tied to decides where it shows in the Broker Portfolio.
      </p>
    </div>
  );
}

