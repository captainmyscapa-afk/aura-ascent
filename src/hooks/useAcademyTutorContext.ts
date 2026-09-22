import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { IndustryId } from "@/lib/industry/types";
import { parseExercise, type ExerciseAnswers } from "@/lib/academy/exercise";

type Mod = { id: string; phase_number: number; phase_title: string; module_number: number; title: string; description: string | null };
type Page = { id: string; module_id: string; page_number: number; heading: string; body_html: string; checkpoint_question_id: string | null; exercise?: unknown };
type Question = { id: string; module_id: string; question_text: string; order_index: number; stage: string };
type Option = { id: string; question_id: string; option_text: string; order_index: number };
type Progress = { module_id: string; quiz_passed: boolean; quiz_score: number | null; attempts: number };
type Response = { page_id: string; is_correct: boolean };

function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ");
  const doc = new DOMParser().parseFromString(withBreaks, "text/html");
  return (doc.body.textContent ?? "")
    .replace(/\[Captain's[^\]]*\]/g, "") // unfilled author placeholders
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const LETTERS = ["A", "B", "C", "D"];

/**
 * Builds a plain-text snapshot of the whole Academy track (every module's pages,
 * quick checks and final-quiz questions) plus this learner's own progress, for
 * the Tutor's system prompt. Correct answers are deliberately NOT included:
 * they never reach the client (only the public options view is readable), so the
 * Tutor teaches from the course content instead of handing out answers.
 */
export function useAcademyTutorContext(industryId: IndustryId, trackName: string) {
  const { user } = useAuth();
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const { data: modData } = await (supabase.from("academy_modules") as any)
          .select("id, phase_number, phase_title, module_number, title, description")
          .eq("track", industryId).order("module_number");
        const mods = (modData ?? []) as Mod[];
        if (mods.length === 0) { if (alive) { setContext(""); setLoading(false); } return; }
        const ids = mods.map((m) => m.id);

        const [{ data: pageData }, { data: qData }] = await Promise.all([
          (supabase.from("academy_module_pages") as any).select("*").in("module_id", ids).order("page_number"),
          (supabase.from("academy_quiz_questions") as any).select("id, module_id, question_text, order_index, stage").in("module_id", ids).order("order_index"),
        ]);
        const pages = (pageData ?? []) as Page[];
        const questions = (qData ?? []) as Question[];
        const qIds = questions.map((q) => q.id);

        const { data: oData } = qIds.length
          ? await (supabase.from("academy_quiz_options_public") as any).select("id, question_id, option_text, order_index").in("question_id", qIds).order("order_index")
          : { data: [] };
        const options = (oData ?? []) as Option[];

        let progress: Progress[] = [];
        let responses: Response[] = [];
        const exAnswers = new Map<string, { answers: ExerciseAnswers; completed: boolean }>();
        if (user) {
          const [{ data: pr }, { data: rs }, { data: ex }] = await Promise.all([
            (supabase.from("user_module_progress") as any).select("module_id, quiz_passed, quiz_score, attempts").eq("user_id", user.id).in("module_id", ids),
            (supabase.from("academy_checkpoint_responses") as any).select("page_id, is_correct").eq("user_id", user.id).in("module_id", ids),
            (supabase.from("academy_exercise_answers") as any).select("page_id, answers, completed").eq("user_id", user.id).in("module_id", ids),
          ]);
          for (const r of (ex ?? []) as { page_id: string; answers: ExerciseAnswers; completed: boolean }[]) exAnswers.set(r.page_id, { answers: r.answers ?? {}, completed: !!r.completed });
          progress = (pr ?? []) as Progress[];
          responses = (rs ?? []) as Response[];
        }

        const optsFor = (qid: string) =>
          options.filter((o) => o.question_id === qid).sort((a, b) => a.order_index - b.order_index)
            .map((o, i) => `${LETTERS[i] ?? i + 1}) ${o.option_text}`).join("  ");
        const totalFinal = (mid: string) => questions.filter((q) => q.module_id === mid && q.stage === "final").length;
        const qById = new Map(questions.map((q) => [q.id, q]));

        const out: string[] = [];
        for (const m of mods) {
          const pr = progress.find((p) => p.module_id === m.id);
          const status = pr?.quiz_passed
            ? `PASSED (score ${pr.quiz_score ?? "?"}/${totalFinal(m.id)}, ${pr.attempts} attempt${pr.attempts === 1 ? "" : "s"})`
            : pr && pr.attempts > 0
              ? `NOT YET PASSED (last score ${pr.quiz_score ?? "?"}/${totalFinal(m.id)}, ${pr.attempts} attempt${pr.attempts === 1 ? "" : "s"})`
              : "not passed yet";
          out.push(`\n=== MODULE ${m.module_number}: ${m.title} — Phase ${m.phase_number}: ${m.phase_title} — learner status: ${status} ===`);
          if (m.description) out.push(m.description);

          for (const pg of pages.filter((p) => p.module_id === m.id).sort((a, b) => a.page_number - b.page_number)) {
            out.push(`\n-- Page ${pg.page_number}: ${pg.heading} --\n${htmlToText(pg.body_html)}`);
            const cq = pg.checkpoint_question_id ? qById.get(pg.checkpoint_question_id) : null;
            if (cq) {
              const r = responses.find((x) => x.page_id === pg.id);
              const result = r ? (r.is_correct ? "learner answered correctly" : "learner answered INCORRECTLY") : "learner has not answered yet";
              out.push(`Quick check for page ${pg.page_number}: ${cq.question_text}\n  ${optsFor(cq.id)}\n  (${result})`);
            }
            const exDef = pg.exercise ? parseExercise(pg.exercise) : null;
            if (exDef) {
              const mine = exAnswers.get(pg.id);
              const lines: string[] = [`Exercise for page ${pg.page_number} (${mine?.completed ? "learner has completed it" : "learner has not completed it yet"}; answers are saved to the learner's Yacht Broker Portfolio):`];
              if (exDef.intro) lines.push(exDef.intro);
              for (const g of exDef.groups) {
                lines.push(`  [${g.title || "Notes"} → portfolio section: ${g.section}]`);
                for (const f of g.fields) {
                  const a = (mine?.answers?.[f.key] ?? "").trim();
                  lines.push(`   - ${f.label}${f.type === "rating" ? " (1-5)" : ""}: ${a ? (f.type === "rating" ? `${a}/5` : a) : "(no answer yet)"}`);
                }
              }
              out.push(lines.join("\n"));
            }
          }

          const finals = questions.filter((q) => q.module_id === m.id && q.stage === "final").sort((a, b) => a.order_index - b.order_index);
          if (finals.length) {
            out.push(`\n-- Module ${m.module_number} final quiz (pass mark ${Math.ceil(finals.length * 0.6)} of ${finals.length}) --`);
            finals.forEach((q, i) => out.push(`Q${i + 1}. ${q.question_text}\n  ${optsFor(q.id)}`));
          }
        }

        const header = `

=== ACADEMY KNOWLEDGE — ${trackName} curriculum ===
You know this course completely: every module, page, quick check and final quiz question below, plus this learner's own progress. Learners will ask you for help, explanations, summaries, study plans, feedback (including on their written exercise answers, which you can see below) and quiz preparation about the Academy. Use this material as the source of truth and refer to modules and pages by number and title.
Rules:
- Ground answers in the course content below. If something isn't covered by the course, say so and answer from general industry knowledge, clearly marked as beyond the course.
- You are not given the answer keys. Work out answers from the course content. For a FINAL QUIZ question of a module the learner has NOT yet passed, do not simply announce the correct letter: give a hint, explain the relevant concept from the pages, and let them decide. For modules they have already passed, you can discuss the quiz questions and answers openly.
- Use the learner's progress and quick-check results for personalised feedback (weak spots, what to revisit, what to do next). Don't invent scores or progress that isn't listed.
- The course pages are gated: learners must read every page and answer every quick check before the quiz unlocks. Encourage that flow rather than shortcuts.
`;
        if (alive) { setContext(header + out.join("\n") + "\n=== END ACADEMY KNOWLEDGE ==="); setLoading(false); }
      } catch (e) {
        console.error("Loading academy tutor context failed:", e);
        if (alive) { setContext(""); setLoading(false); }
      }
    })();
    return () => { alive = false; };
  }, [industryId, trackName, user?.id]);

  return { context, loading };
}
