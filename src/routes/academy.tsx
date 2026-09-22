import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/aurum/AppShell";
import { SectionHeading } from "@/components/aurum/SectionHeading";
import { AcademyReader, type ExerciseState } from "@/components/aurum/AcademyReader";
import type { ExerciseAnswers } from "@/lib/academy/exercise";
import {
  Play, Lock, Sparkles, CheckCircle2, ChevronLeft, Download,
  Settings, Plus, Trash2, Save, FileText, X, Check, RefreshCw, Trophy, GraduationCap,
  RotateCcw, ChevronRight,
} from "lucide-react";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { INDUSTRY_LIST } from "@/lib/industry/config";
import type { IndustryId } from "@/lib/industry/types";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { celebrate } from "@/lib/celebration";
import type { T } from "@/lib/i18n/translations";

// Admin status comes from user_profiles.is_admin in Supabase — no email in client bundle
// Pass mark is 60% of a module's final-quiz questions, rounded up (3 of 5, 5 of 7, ...) — mirrors submit_module_quiz in the DB
const passMarkFor = (total: number) => Math.max(1, Math.ceil(total * 0.6));

// Several translation strings hard-code "5 questions" / "3/5"; adapt them to the module's real question count.
function fitTotal(s: string, total: number) {
  if (total === 5 || total <= 0) return s;
  return s
    .replace(/\b3\/5\b/, `${passMarkFor(total)}/${total}`)
    .replace(/\b5 questions\b/, `${total} questions`)
    .replace(/\/5\b/g, `/${total}`);
}

// ─── Types ─────────────────────────────────────────────────────────────────

type DbModule = {
  id: string;
  track: string;
  phase_number: number;
  phase_title: string;
  module_number: number;
  title: string;
  video_url: string | null;
  description: string | null;
};

type DbPdf = {
  id: string;
  module_id: string;
  title: string;
  url: string;
  order_index: number;
};

type DbOption = {
  id: string;
  question_id: string;
  option_text: string;
  // Only populated for admins (fetched from the base table when editing a
  // question) or after a quiz submission (derived from the RPC response).
  // Regular reads go through academy_quiz_options_public, which never
  // exposes this column.
  is_correct?: boolean;
  order_index: number;
};

type DbQuestion = {
  id: string;
  module_id: string;
  question_text: string;
  order_index: number;
  options: DbOption[];
};

type DbPage = {
  id: string;
  module_id: string;
  page_number: number;
  heading: string;
  body_html: string;
  checkpoint_question_id: string | null;
  exercise?: unknown | null;
};

type ModuleProgress = {
  module_id: string;
  video_watched: boolean;
  quiz_passed: boolean;
  quiz_score: number | null;
  attempts: number;
  last_page?: number | null;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getEmbedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?color=c9a84c`;
  return url;
}

const TRACK_TO_INDUSTRY: Record<string, IndustryId> = {
  yachting: "yachts",
  property: "villas",
  aviation: "jets",
  automotive: "cars",
};

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/academy")({
  validateSearch: (s: Record<string, unknown>) => ({
    track: typeof s.track === "string" ? s.track : undefined,
  }),
  component: Academy,
});

// ─── Main Component ─────────────────────────────────────────────────────────

function Academy() {
  const { t } = useLanguage();
  const { industry, industryId, setIndustry } = useIndustry();
  const { user } = useAuth();
  const { track } = Route.useSearch();
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch admin status from DB — never trust client-side email checks
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setIsAdmin((data as { is_admin: boolean } | null)?.is_admin ?? false));
  }, [user]);

  const [modules, setModules] = useState<DbModule[]>([]);
  const [pdfs, setPdfs] = useState<Record<string, DbPdf[]>>({});
  const [questions, setQuestions] = useState<Record<string, DbQuestion[]>>({});
  const [pages, setPages] = useState<Record<string, DbPage[]>>({});
  const [checkpointQuestionsById, setCheckpointQuestionsById] = useState<Record<string, DbQuestion>>({});
  const [progress, setProgress] = useState<Record<string, ModuleProgress>>({});
  // Pages whose quick check this user has answered (server-side source of truth: academy_checkpoint_responses)
  const [answeredPageIds, setAnsweredPageIds] = useState<Set<string>>(new Set());
  // Exercise answers (academy_exercise_answers) — feed the reader, the quiz gate and the Broker Portfolio
  const [exerciseState, setExerciseState] = useState<ExerciseState>({});
  // Real DB counts for all tracks (for the track selector cards)
  const [allTracksStats, setAllTracksStats] = useState<Record<string, { total: number; completed: number }>>({});
  const [loading, setLoading] = useState(true);

  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "module" | "reader" | "quiz">("list");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    correctOptions: Record<string, string>;
  } | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [editingModule, setEditingModule] = useState<string | null>(null);

  useEffect(() => {
    if (track && TRACK_TO_INDUSTRY[track] && TRACK_TO_INDUSTRY[track] !== industryId) {
      setIndustry(TRACK_TO_INDUSTRY[track]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const trackName = industryId === "villas" ? "villas" : industryId === "jets" ? "jets" : industryId === "cars" ? "cars" : "yachts";
    const { data: mods } = await (supabase.from("academy_modules") as any)
      .select("*").eq("track", trackName).order("module_number");
    if (!mods) { setLoading(false); return; }
    setModules(mods as DbModule[]);

    const ids = (mods as DbModule[]).map((m) => m.id);
    const [{ data: pdfData }, { data: qData }, { data: oData }, { data: pageData }, { data: cpQData }] = await Promise.all([
      (supabase.from("academy_module_pdfs") as any).select("*").in("module_id", ids).order("order_index"),
      (supabase.from("academy_quiz_questions") as any).select("*").in("module_id", ids).eq("stage", "final").order("order_index"),
      // Public view — never exposes is_correct. Admin editing fetches that
      // separately, on demand, from the base table (which is admin-gated).
      (supabase.from("academy_quiz_options_public") as any).select("*").order("order_index"),
      (supabase.from("academy_module_pages") as any).select("*").in("module_id", ids).order("page_number"),
      // Checkpoint questions fetched separately from final ones — same public
      // view, so is_correct still never reaches the client here.
      (supabase.from("academy_quiz_questions") as any).select("*").in("module_id", ids).eq("stage", "checkpoint").order("page_number"),
    ]);

    const pdfMap: Record<string, DbPdf[]> = {};
    for (const p of (pdfData || []) as DbPdf[]) {
      if (!pdfMap[p.module_id]) pdfMap[p.module_id] = [];
      pdfMap[p.module_id].push(p);
    }
    setPdfs(pdfMap);

    const optMap: Record<string, DbOption[]> = {};
    for (const o of (oData || []) as DbOption[]) {
      if (!optMap[o.question_id]) optMap[o.question_id] = [];
      optMap[o.question_id].push(o);
    }
    const qMap: Record<string, DbQuestion[]> = {};
    for (const q of (qData || []) as DbQuestion[]) {
      if (!qMap[q.module_id]) qMap[q.module_id] = [];
      qMap[q.module_id].push({ ...q, options: optMap[q.id] || [] });
    }
    setQuestions(qMap);

    const pageMap: Record<string, DbPage[]> = {};
    for (const p of (pageData || []) as DbPage[]) {
      if (!pageMap[p.module_id]) pageMap[p.module_id] = [];
      pageMap[p.module_id].push(p);
    }
    setPages(pageMap);

    const cpMap: Record<string, DbQuestion> = {};
    for (const q of (cpQData || []) as DbQuestion[]) {
      cpMap[q.id] = { ...q, options: optMap[q.id] || [] };
    }
    setCheckpointQuestionsById(cpMap);

    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!user || modules.length === 0) return;
    (async () => {
      const { data } = await (supabase.from("user_module_progress") as any)
        .select("*").eq("user_id", user.id);
      const map: Record<string, ModuleProgress> = {};
      for (const p of (data || []) as ModuleProgress[]) map[p.module_id] = p;
      setProgress(map);
    })();
  }, [user, modules]);

  useEffect(() => {
    if (!user || modules.length === 0) { setAnsweredPageIds(new Set()); return; }
    (async () => {
      const { data } = await (supabase.from("academy_checkpoint_responses") as any)
        .select("page_id").eq("user_id", user.id).in("module_id", modules.map((m) => m.id));
      setAnsweredPageIds(new Set(((data ?? []) as { page_id: string }[]).map((r) => r.page_id)));
    })();
  }, [user, modules, pages]);

  useEffect(() => {
    if (!user || modules.length === 0) { setExerciseState({}); return; }
    (async () => {
      const { data } = await (supabase.from("academy_exercise_answers") as any)
        .select("page_id, answers, completed").eq("user_id", user.id).in("module_id", modules.map((m) => m.id));
      const map: ExerciseState = {};
      for (const r of (data ?? []) as { page_id: string; answers: ExerciseAnswers; completed: boolean }[]) {
        map[r.page_id] = { answers: r.answers ?? {}, completed: !!r.completed };
      }
      setExerciseState(map);
    })();
  }, [user, modules]);

  const onExerciseSaved = useCallback((pageId: string, answers: ExerciseAnswers, completed: boolean) => {
    setExerciseState((prev) => ({ ...prev, [pageId]: { answers, completed: completed || !!prev[pageId]?.completed } }));
  }, []);

  // Load real total + completed counts for ALL tracks (for the track selector cards)
  useEffect(() => {
    (async () => {
      // Total per track
      const { data: allMods } = await (supabase.from("academy_modules") as any).select("id, track");
      const totals: Record<string, number> = {};
      const modIdToTrack: Record<string, string> = {};
      for (const m of (allMods ?? []) as { id: string; track: string }[]) {
        totals[m.track] = (totals[m.track] ?? 0) + 1;
        modIdToTrack[m.id] = m.track;
      }

      // Completed per track for this user
      const completed: Record<string, number> = {};
      if (user) {
        const { data: progData } = await (supabase.from("user_module_progress") as any)
          .select("module_id").eq("user_id", user.id).eq("quiz_passed", true);
        for (const p of (progData ?? []) as { module_id: string }[]) {
          const t = modIdToTrack[p.module_id];
          if (t) completed[t] = (completed[t] ?? 0) + 1;
        }
      }

      const stats: Record<string, { total: number; completed: number }> = {};
      for (const track of Object.keys(totals)) {
        stats[track] = { total: totals[track], completed: completed[track] ?? 0 };
      }
      setAllTracksStats(stats);
    })();
  }, [user]);

  // Non-yachts tracks are locked for regular users — admin can still access to add content
  const isTrackLocked = industryId !== "yachts" && !isAdmin;

  const isUnlocked = (mod: DbModule) => {
    if (isTrackLocked) return false;
    if (mod.module_number === 1) return true;
    const prev = modules.find((m) => m.module_number === mod.module_number - 1);
    return !!prev && !!progress[prev.id]?.quiz_passed;
  };

  const getState = (mod: DbModule): "done" | "current" | "locked" => {
    if (isTrackLocked) return "locked";
    if (progress[mod.id]?.quiz_passed) return "done";
    if (isUnlocked(mod)) return "current";
    return "locked";
  };

  // Opening a module (or switching between overview / module / quiz) starts at the top of the page
  useEffect(() => { window.scrollTo({ top: 0 }); }, [view, activeModuleId]);

  const activeModule = modules.find((m) => m.id === activeModuleId) ?? null;
  const activeQuestions = activeModuleId ? (questions[activeModuleId] ?? []) : [];
  const activePdfs = activeModuleId ? (pdfs[activeModuleId] ?? []) : [];
  const activePages = activeModuleId ? (pages[activeModuleId] ?? []) : [];
  const activeProgress = activeModuleId ? (progress[activeModuleId] ?? null) : null;

  const openModule = (mod: DbModule) => {
    if (isTrackLocked) return; // whole track locked for regular users
    if (getState(mod) === "locked" && !isAdmin) return;
    setActiveModuleId(mod.id);
    setView("module");
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
    setQuizError(null);
  };

  // "Continue learning": jump to the module (and page, via last_page) the learner left off at.
  const continueLearning = () => {
    const open = modules
      .filter((m) => getState(m) !== "locked" && !progress[m.id]?.quiz_passed)
      .sort((x, y) => x.module_number - y.module_number);
    const started = open.filter((m) => (progress[m.id]?.last_page ?? 0) > 0);
    const target = started.length > 0 ? started[started.length - 1] : open[0];
    if (target) openModule(target);
    else goBack(); // everything finished: stay on the module list
  };

  const goBack = () => {
    setActiveModuleId(null);
    setView("list");
    setEditingModule(null);
  };

  const markWatched = async () => {
    if (!user || !activeModuleId) return;
    await (supabase.from("user_module_progress") as any).upsert(
      { user_id: user.id, module_id: activeModuleId, video_watched: true },
      { onConflict: "user_id,module_id" }
    );
    setProgress((p) => ({
      ...p,
      [activeModuleId]: {
        module_id: activeModuleId,
        video_watched: true,
        quiz_passed: p[activeModuleId]?.quiz_passed ?? false,
        quiz_score: p[activeModuleId]?.quiz_score ?? null,
        attempts: p[activeModuleId]?.attempts ?? 0,
        last_page: p[activeModuleId]?.last_page ?? null,
      },
    }));
  };

  // Remember which reader page the learner is on so the module resumes there
  const saveLastPage = async (page: number) => {
    if (!user || !activeModuleId) return;
    const moduleId = activeModuleId;
    setProgress((p) => ({
      ...p,
      [moduleId]: {
        module_id: moduleId,
        video_watched: p[moduleId]?.video_watched ?? false,
        quiz_passed: p[moduleId]?.quiz_passed ?? false,
        quiz_score: p[moduleId]?.quiz_score ?? null,
        attempts: p[moduleId]?.attempts ?? 0,
        last_page: page,
      },
    }));
    await (supabase.from("user_module_progress") as any).upsert(
      { user_id: user.id, module_id: moduleId, last_page: page },
      { onConflict: "user_id,module_id" }
    );
  };

  const submitQuiz = async () => {
    if (!user || !activeModuleId || activeQuestions.length === 0) return;
    setQuizError(null);
    setQuizSubmitting(true);

    // Grading happens server-side (submit_module_quiz RPC) — the client never
    // computes pass/fail or writes user_module_progress directly, since that
    // would let anyone unlock a module without passing the quiz.
    const { data, error } = await supabase.rpc("submit_module_quiz", {
      p_module_id: activeModuleId,
      p_answers: quizAnswers,
    });
    setQuizSubmitting(false);
    if (error || !data) {
      console.error("submit_module_quiz failed:", error);
      setQuizError(t.acadSubmitFailed);
      return;
    }

    const result = data as unknown as { score: number; passed: boolean; correctOptions: Record<string, string> };
    setQuizResult(result);
    setQuizSubmitted(true);

    const attempts = (progress[activeModuleId]?.attempts ?? 0) + 1;
    const wasAlreadyPassed = !!progress[activeModuleId]?.quiz_passed;
    setProgress((p) => ({
      ...p,
      [activeModuleId]: {
        module_id: activeModuleId,
        video_watched: true,
        quiz_passed: result.passed || !!p[activeModuleId]?.quiz_passed,
        quiz_score: result.score,
        attempts,
      },
    }));

    if (result.passed && !wasAlreadyPassed) {
      const passedModule = modules.find((m) => m.id === activeModuleId);
      if (passedModule) {
        const passedIds = new Set(
          Object.keys(progress).filter((id) => progress[id]?.quiz_passed)
        );
        passedIds.add(activeModuleId);
        const phaseModules = modules.filter((m) => m.phase_number === passedModule.phase_number);
        const trackComplete = modules.every((m) => passedIds.has(m.id));
        const phaseComplete = !trackComplete && phaseModules.every((m) => passedIds.has(m.id));

        if (trackComplete) {
          celebrate({ icon: GraduationCap, title: t.celebrationTrackTitle(industry.trackName), subtitle: t.celebrationTrackSubtitle });
        } else if (phaseComplete) {
          const phaseLabel = passedModule.phase_title.trim().toUpperCase() === "BONUS" ? "Bonus" : t.acadPhase(passedModule.phase_number, t.acadPhaseTitle(passedModule.phase_number, passedModule.phase_title));
          celebrate({ icon: Trophy, title: t.celebrationPhaseTitle(phaseLabel) });
        } else {
          celebrate({ icon: CheckCircle2, title: t.celebrationModuleTitle });
        }
      }
    }
  };

  const currentTrack = industryId === "villas" ? "villas" : industryId === "jets" ? "jets" : industryId === "cars" ? "cars" : "yachts";

  // Admin: add a module to an existing phase (placed after that phase's last module, later modules shift down)
  // or start a new phase at the end of the track. phaseNumber = null means "new phase".
  const addModule = async (input: { phaseNumber: number | null; phaseTitle: string; title: string }) => {
    const trackName = modules[0]?.track ?? currentTrack;
    const maxModule = modules.reduce((m, x) => Math.max(m, x.module_number), 0);
    let phase_number: number;
    let phase_title: string;
    let module_number: number;

    if (input.phaseNumber === null) {
      phase_number = modules.reduce((m, x) => Math.max(m, x.phase_number), 0) + 1;
      phase_title = input.phaseTitle;
      module_number = maxModule + 1;
    } else {
      const inPhase = modules.filter((m) => m.phase_number === input.phaseNumber);
      phase_number = input.phaseNumber;
      phase_title = inPhase[0]?.phase_title ?? input.phaseTitle;
      module_number = inPhase.reduce((m, x) => Math.max(m, x.module_number), 0) + 1;
      // Make room: shift every later module up by one, highest first
      const later = modules.filter((m) => m.module_number >= module_number).sort((a, b) => b.module_number - a.module_number);
      for (const m of later) {
        const { error: e2 } = await (supabase.from("academy_modules") as any).update({ module_number: m.module_number + 1 }).eq("id", m.id);
        if (e2) throw e2;
      }
    }

    const { error } = await (supabase.from("academy_modules") as any).insert({
      track: trackName, phase_number, phase_title, module_number, title: input.title,
    });
    if (error) throw error;
    await loadAll();
  };

  // Admin: rename a phase (every module in it carries the title)
  const renamePhase = async (phaseNumber: number, title: string) => {
    const trackName = modules[0]?.track ?? currentTrack;
    const { error } = await (supabase.from("academy_modules") as any)
      .update({ phase_title: title }).eq("track", trackName).eq("phase_number", phaseNumber);
    if (error) throw error;
    await loadAll();
  };

  // Admin: delete a module (pages, quiz, PDFs and learner progress cascade), then close the gap in numbering
  const deleteModule = async (mod: DbModule) => {
    const { error } = await (supabase.from("academy_modules") as any).delete().eq("id", mod.id);
    if (error) throw error;
    const later = modules.filter((m) => m.module_number > mod.module_number).sort((a, b) => a.module_number - b.module_number);
    for (const m of later) {
      const { error: e2 } = await (supabase.from("academy_modules") as any).update({ module_number: m.module_number - 1 }).eq("id", m.id);
      if (e2) throw e2;
    }
    goBack();
    await loadAll();
  };

  const phases = modules.reduce((acc, mod) => {
    const k = mod.phase_number;
    if (!acc[k]) acc[k] = { title: mod.phase_title, mods: [] };
    acc[k].mods.push(mod);
    return acc;
  }, {} as Record<number, { title: string; mods: DbModule[] }>);

  const totalDone = modules.filter((m) => progress[m.id]?.quiz_passed).length;

  return (
    <AppShell>
      {/* Hero + track cards only on the Academy overview; an open module gets its own clean page */}
      {(view === "list" || isTrackLocked) && (
        <>
      <div className="mb-10 animate-fade-up">
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">
          {t.acadEyebrow(industry.modeLabel.toUpperCase())}
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl">
          {t.acadHeroPre} <span className="italic text-gold-gradient">{t.acadHeroEm}</span>
        </h1>
      </div>

      {/* Track selector — unchanged */}
      <SectionHeading eyebrow={t.acadTracks} title={t.acadIndustryCurricula} />
      <div className={INDUSTRY_LIST.length === 1 ? "grid grid-cols-1 gap-4 mb-14" : "grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14"}>
        {INDUSTRY_LIST.length === 1 && (() => {
          const ind = INDUSTRY_LIST[0];
          const total = allTracksStats["yachts"]?.total ?? 10;
          const pct = total > 0 ? (totalDone / total) * 100 : 0;
          const R = 34, C = 2 * Math.PI * R;
          return (
            <button
              key={ind.id}
              onClick={() => { setIndustry(ind.id); continueLearning(); }}
              className="relative text-left rounded-2xl overflow-hidden group cursor-pointer ring-gold hero-sheen min-h-[260px]"
            >
              <img src={ind.ambientImage} alt={ind.trackName} className="absolute inset-0 h-full w-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-[1200ms]" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-r from-card via-card/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
              <div className="relative p-6 sm:p-10 flex items-center justify-between gap-6 h-full min-h-[260px]">
                <div className="max-w-xl">
                  <div className="text-[10px] tracking-[0.34em] text-primary/90 mb-3 flex items-center gap-2">
                    <span className="relative flex h-1.5 w-1.5 text-emerald-400"><span className="live-dot absolute inset-0 rounded-full" /><span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" /></span>
                    NOW ENROLLING
                  </div>
                  <div className="font-serif text-3xl sm:text-4xl leading-tight">{ind.trackName}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{ind.tagline}</div>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase px-5 py-2.5 rounded-full text-primary-foreground group-hover:gap-3 transition-all" style={{ background: "var(--gradient-gold)" }}>
                      {totalDone > 0 ? "Continue learning" : "Start the academy"} <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">{t.acadModules(total)}</span>
                  </div>
                </div>
                <div className="relative shrink-0 hidden sm:block">
                  <svg width="96" height="96" viewBox="0 0 80 80" className="-rotate-90">
                    <circle cx="40" cy="40" r={R} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="5" />
                    <circle cx="40" cy="40" r={R} fill="none" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} className="ring-anim" style={{ ["--ring-c" as never]: C }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-serif text-xl leading-none">{totalDone}<span className="text-muted-foreground text-sm">/{total}</span></div>
                    <div className="text-[8px] tracking-[0.25em] text-muted-foreground mt-1">MODULES</div>
                  </div>
                </div>
              </div>
            </button>
          );
        })()}
        {INDUSTRY_LIST.length > 1 && INDUSTRY_LIST.map((ind) => {
          const active = ind.id === industryId;
          return (
            <button
              key={ind.id}
              onClick={() => { setIndustry(ind.id); goBack(); }}
              className={`text-left glass rounded-xl overflow-hidden group cursor-pointer ${active ? "ring-gold" : ""}`}
            >
              <div className="relative h-40 overflow-hidden">
                <img src={ind.ambientImage} alt={ind.trackName} className="h-full w-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" loading="lazy" width={800} height={600} />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              </div>
              <div className="p-5">
                {(() => {
                  const yachtsStats = allTracksStats["yachts"];
                  const total = yachtsStats?.total ?? 0;
                  const pct = total > 0 ? (totalDone / total) * 100 : 0;
                  return (
                    <>
                      <div className="font-serif text-lg">{ind.trackName}</div>
                      {ind.id === "yachts" ? (
                        <>
                          <div className="mt-1 text-xs text-muted-foreground">{t.acadModules(total > 0 ? total : 10)}</div>
                          <div className="mt-4 h-1 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--gradient-gold)]" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="mt-2 text-[11px] text-muted-foreground font-mono">{t.acadComplete(totalDone, total || 10)}</div>
                        </>
                      ) : (
                        <>
                          <div className="mt-1 text-xs text-muted-foreground">{t.acadComingSoon}</div>
                          <div className="mt-4 h-1 bg-secondary/40 rounded-full overflow-hidden" />
                          <div className="mt-2 text-[11px] text-muted-foreground font-mono">—</div>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            </button>
          );
        })}
      </div>

        </>
      )}

      {/* Content area */}
      {/* Non-yachts: regular users see Coming Soon only. Admin sees module list. */}
      {isTrackLocked ? (
        <div className="glass rounded-2xl p-16 text-center animate-fade-up">
          <div className="relative h-16 w-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping" />
            <div className="absolute inset-2 rounded-full flex items-center justify-center" style={{ background: "var(--gradient-gold)" }}>
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <p className="font-serif text-2xl mb-2">{t.acadComingSoonTitle(industry.trackName)}</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {t.acadComingSoonDesc}
          </p>
        </div>
      ) : view === "list" ? (
        <>
          <ModuleList
            t={t}
            phases={phases}
            modules={modules}
            progress={progress}
            getState={getState}
            isAdmin={isAdmin}
            adminMode={adminMode}
            isTrackLocked={isTrackLocked}
            onToggleAdmin={() => setAdminMode((v) => !v)}
            onOpenModule={openModule}
            onAddModule={addModule}
            onRenamePhase={renamePhase}
            loading={loading}
            totalDone={totalDone}
          />
          <div className="glass rounded-xl mt-8 p-6 flex items-start gap-4">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="font-serif text-lg">{t.acadAiTutorTitle}</div>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{t.acadTutorBlurb(industryId)}</p>
              <Link to="/tutor" className="mt-3 inline-block text-sm text-primary hover:underline">{t.acadBeginRolePlay}</Link>
            </div>
          </div>
        </>
      ) : view === "reader" ? (
        <AcademyReader
          pages={activePages}
          checkpointQuestionsById={checkpointQuestionsById}
          exerciseState={exerciseState}
          onExerciseSaved={onExerciseSaved}
          onFinish={() => setView("quiz")}
          onExit={() => setView("module")}
          initialPage={activeProgress?.last_page ?? 0}
          onPageChange={saveLastPage}
          reviewMode={!!activeProgress?.quiz_passed}
        />
      ) : view === "quiz" ? (
        <QuizView
          t={t}
          module={activeModule!}
          questions={activeQuestions}
          answers={quizAnswers}
          submitted={quizSubmitted}
          submitting={quizSubmitting}
          error={quizError}
          result={quizResult}
          onAnswer={(qId, optId) => setQuizAnswers((a) => ({ ...a, [qId]: optId }))}
          onSubmit={submitQuiz}
          onRetry={() => { setQuizAnswers({}); setQuizSubmitted(false); setQuizResult(null); setQuizError(null); }}
          onBack={() => setView("module")}
          onContinue={goBack}
        />
      ) : (
        <ModuleDetail
          t={t}
          module={activeModule!}
          pdfs={activePdfs}
          questions={activeQuestions}
          pages={activePages}
          progress={activeProgress}
          isAdmin={isAdmin}
          adminMode={adminMode}
          editingModule={editingModule}
          onSetEditing={setEditingModule}
          onBack={goBack}
          onStartQuiz={() => setView("quiz")}
          onPageChange={saveLastPage}
          checkpointQuestionsById={checkpointQuestionsById}
          answeredPageIds={answeredPageIds}
          exerciseState={exerciseState}
          onExerciseSaved={onExerciseSaved}
          onCheckpointAnswered={(id) => setAnsweredPageIds((prev) => new Set(prev).add(id))}
          onMarkWatched={markWatched}
          onReloadAll={loadAll}
          onDeleteModule={() => deleteModule(activeModule!)}
        />
      )}
    </AppShell>
  );
}

// ─── Coming Soon ─────────────────────────────────────────────────────────────

function ComingSoon({ trackName }: { trackName: string }) {
  return (
    <div className="glass rounded-2xl p-16 text-center animate-fade-up">
      <div className="relative h-16 w-16 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping" />
        <div className="absolute inset-2 rounded-full flex items-center justify-center" style={{ background: "var(--gradient-gold)" }}>
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
      <p className="font-serif text-2xl mb-2">{trackName} — Coming Soon</p>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        This curriculum is being crafted by industry insiders. Switch to the Yacht Brokerage track to start learning now.
      </p>
    </div>
  );
}

// ─── Module List ─────────────────────────────────────────────────────────────

function ModuleList({
  t, phases, modules, progress, getState, isAdmin, adminMode, isTrackLocked, onToggleAdmin, onOpenModule, onAddModule, onRenamePhase, loading, totalDone,
}: {
  t: T;
  phases: Record<number, { title: string; mods: DbModule[] }>;
  modules: DbModule[];
  progress: Record<string, ModuleProgress>;
  getState: (m: DbModule) => "done" | "current" | "locked";
  isAdmin: boolean;
  adminMode: boolean;
  isTrackLocked: boolean;
  onToggleAdmin: () => void;
  onOpenModule: (m: DbModule) => void;
  onAddModule: (input: { phaseNumber: number | null; phaseTitle: string; title: string }) => Promise<void>;
  onRenamePhase: (phaseNumber: number, title: string) => Promise<void>;
  loading: boolean;
  totalDone: number;
}) {
  return (
    <>
      {/* Coming soon banner for locked tracks (regular users) */}
      {isTrackLocked && (
        <div className="glass rounded-xl p-5 mb-5 border border-primary/20 flex items-center gap-4 animate-fade-up">
          <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--gradient-gold)" }}>
            <Lock className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <div className="font-medium text-sm">{t.acadCourseComingSoon}</div>
            <p className="text-xs text-muted-foreground mt-0.5">{t.acadCourseComingSoonDesc}</p>
          </div>
        </div>
      )}

      {/* Admin notice for non-yacht tracks */}
      {isAdmin && adminMode && modules.length > 0 && modules[0].track !== "yachts" && (
        <div className="glass rounded-xl p-4 mb-5 border border-amber-400/30 bg-amber-400/5 text-xs text-amber-400/90 animate-fade-up">
          {t.acadAdminViewNotice}
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-1">{t.acadActiveTrack(modules.length > 0 ? modules[0].track.toUpperCase() : t.acadYachtBrokerage)}</div>
          <h2 className="font-serif text-xl sm:text-[22px] leading-tight">{t.acadYourProgramme}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono">{t.acadOfTenComplete(totalDone)}</span>
          {isAdmin && (
            <button
              onClick={onToggleAdmin}
              className={`flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-lg border transition-all ${adminMode ? "border-primary/60 text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              <Settings className="h-3 w-3" /> {t.acadAdmin}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[0,1,2,3].map((i) => <div key={i} className="h-16 rounded-xl bg-secondary/20 animate-pulse" />)}</div>
      ) : Object.keys(phases).length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center animate-fade-up">
          <div className="relative h-16 w-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping" />
            <div className="absolute inset-2 rounded-full flex items-center justify-center" style={{ background: "var(--gradient-gold)" }}>
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <p className="font-serif text-2xl mb-2">{t.acadComingSoon}</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {t.acadComingSoonDesc}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(phases).sort(([a], [b]) => +a - +b).map(([phaseNum, { title, mods }]) => (
            <div key={phaseNum}>
              <PhaseHeader
                label={title.trim().toUpperCase() === "BONUS" ? "Bonus" : t.acadPhase(phaseNum, t.acadPhaseTitle(+phaseNum, title))}
                rawTitle={title}
                canEdit={isAdmin && adminMode}
                onRename={(newTitle) => onRenamePhase(+phaseNum, newTitle)}
              />
              <div className="glass rounded-xl divide-y divide-border/60">
                {mods.map((mod) => {
                  const state = getState(mod);
                  return (
                    <button
                      key={mod.id}
                      onClick={() => onOpenModule(mod)}
                      disabled={state === "locked" && !isAdmin}
                      className={`w-full flex items-center gap-5 p-5 text-left transition-colors ${
                        state === "locked" && !isAdmin ? "opacity-40 cursor-default" : "hover:bg-secondary/30 cursor-pointer"
                      } ${state === "current" ? "bg-secondary/30" : ""}`}
                    >
                      <div className={`font-mono text-xs w-8 shrink-0 ${state === "done" ? "text-primary" : "text-muted-foreground"}`}>
                        {String(mod.module_number).padStart(2, "0")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-foreground text-sm">{t.acadModuleTitle(mod.track, mod.module_number, mod.title)}</div>
                        {mod.video_url && <div className="text-[11px] text-muted-foreground mt-0.5">{t.acadVideoAvailable}</div>}
                        {!mod.video_url && adminMode && <div className="text-[11px] text-amber-400/80 mt-0.5">{t.acadNoVideoYet}</div>}
                      </div>
                      {state === "done" && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                      {state === "current" && !adminMode && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-primary shrink-0">
                          <Play className="h-3 w-3" /> {t.acadStart}
                        </span>
                      )}
                      {state === "locked" && !isAdmin && <Lock className="h-4 w-4 text-muted-foreground shrink-0" />}
                      {adminMode && <Settings className="h-3.5 w-3.5 text-primary/60 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && adminMode && <AddModuleForm phases={phases} onAddModule={onAddModule} />}
    </>
  );
}

function PhaseHeader({
  label, rawTitle, canEdit, onRename,
}: {
  label: string;
  rawTitle: string;
  canEdit: boolean;
  onRename: (title: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rawTitle);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    if (!draft.trim()) return;
    setBusy(true); setErr(null);
    try { await onRename(draft.trim()); setEditing(false); }
    catch (e) { console.error("Renaming phase failed:", e); setErr((e as { message?: string })?.message ?? "Could not rename phase"); }
    finally { setBusy(false); }
  };

  if (editing) {
    return (
      <div className="mb-2 px-1">
        <div className="flex gap-2">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1 bg-transparent border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary/50 transition-colors" />
          <button onClick={save} disabled={busy || !draft.trim()} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-primary-foreground text-xs disabled:opacity-50" style={{ background: "var(--gradient-gold)" }}>
            {busy ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
          </button>
          <button onClick={() => { setEditing(false); setDraft(rawTitle); setErr(null); }} className="shrink-0 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:border-primary/40 transition-colors">Cancel</button>
        </div>
        {err && <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 mb-2 px-1">
      <div className="text-[10px] tracking-[0.34em] text-primary/70 uppercase">{label}</div>
      {canEdit && (
        <button onClick={() => { setDraft(rawTitle); setEditing(true); }} title="Rename phase" className="text-muted-foreground hover:text-primary transition-colors">
          <Settings className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function AddModuleForm({
  phases, onAddModule,
}: {
  phases: Record<number, { title: string; mods: DbModule[] }>;
  onAddModule: (input: { phaseNumber: number | null; phaseTitle: string; title: string }) => Promise<void>;
}) {
  const nums = Object.keys(phases).map(Number).sort((a, b) => a - b);
  const lastNum = nums.length ? nums[nums.length - 1] : null;
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  // "new" = start a new phase at the end; otherwise a phase number
  const [choice, setChoice] = useState<string>(lastNum === null ? "new" : String(lastNum));
  const [phaseTitle, setPhaseTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isNew = choice === "new" || nums.length === 0;
  const insertsInMiddle = !isNew && +choice !== lastNum;

  const submit = async () => {
    if (!title.trim()) { setErr("Module title is required."); return; }
    if (isNew && !phaseTitle.trim()) { setErr("Give the new phase a title."); return; }
    setBusy(true); setErr(null);
    try {
      await onAddModule({ phaseNumber: isNew ? null : +choice, phaseTitle: phaseTitle.trim(), title: title.trim() });
      setTitle(""); setPhaseTitle(""); setChoice(String(lastNum ?? "new")); setOpen(false);
    } catch (e) {
      console.error("Adding module failed:", e);
      setErr((e as { message?: string })?.message ?? "Could not add module");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => { setChoice(lastNum === null ? "new" : String(lastNum)); setOpen(true); }} className="mt-6 flex items-center gap-1.5 text-sm text-primary hover:underline">
        <Plus className="h-4 w-4" /> Add module or phase
      </button>
    );
  }
  return (
    <div className="glass rounded-xl p-5 mt-6 border border-primary/20 space-y-3">
      <div className="text-[10px] tracking-[0.2em] text-primary/80">NEW MODULE</div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Module title" className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors" />
      <div>
        <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">Phase</div>
        <select
          value={isNew ? "new" : choice}
          onChange={(e) => setChoice(e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
        >
          {nums.map((n) => <option key={n} value={String(n)}>Phase {n}: {phases[n].title}</option>)}
          <option value="new">+ New phase (added at the end)</option>
        </select>
      </div>
      {isNew && (
        <input value={phaseTitle} onChange={(e) => setPhaseTitle(e.target.value)} placeholder="New phase title" className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors" />
      )}
      <p className="text-[11px] text-muted-foreground">
        {insertsInMiddle
          ? "The module goes at the end of that phase. Modules after it are renumbered and stay locked until learners pass the new one. "
          : ""}
        After adding it, open the module and use Edit to add pages, a video, PDFs and quiz questions. Rename a phase any time with the cog next to its name.
      </p>
      {err && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={busy} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-primary-foreground text-sm disabled:opacity-50" style={{ background: "var(--gradient-gold)" }}>
          {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add module
        </button>
        <button onClick={() => { setOpen(false); setErr(null); }} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:border-primary/40 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

// ─── Module Detail ────────────────────────────────────────────────────────────

function ModuleDetail({
  t, module, pdfs, questions, pages, progress, isAdmin, adminMode, editingModule,
  onSetEditing, onBack, onStartQuiz, onPageChange, checkpointQuestionsById, answeredPageIds, exerciseState, onExerciseSaved, onCheckpointAnswered, onMarkWatched, onReloadAll, onDeleteModule,
}: {
  t: T;
  module: DbModule;
  pdfs: DbPdf[];
  questions: DbQuestion[];
  pages: DbPage[];
  progress: ModuleProgress | null;
  isAdmin: boolean;
  adminMode: boolean;
  editingModule: string | null;
  onSetEditing: (id: string | null) => void;
  onBack: () => void;
  onStartQuiz: () => void;
  onPageChange: (page: number) => void;
  checkpointQuestionsById: Record<string, DbQuestion>;
  answeredPageIds: Set<string>;
  exerciseState: ExerciseState;
  onExerciseSaved: (pageId: string, answers: ExerciseAnswers, completed: boolean) => void;
  onCheckpointAnswered: (pageId: string) => void;
  onMarkWatched: () => void;
  onReloadAll: () => void;
  onDeleteModule: () => Promise<void>;
}) {
  const [showVideo, setShowVideo] = useState(false);
  if (!module) return null;
  const embedUrl = module.video_url ? getEmbedUrl(module.video_url) : null;
  const hasQuiz = questions.length >= 5;
  const quizPassed = !!progress?.quiz_passed;
  const videoWatched = !!progress?.video_watched;
  const isEditing = editingModule === module.id;
  // A page's step is either a quick check or an exercise; both must be done before the quiz
  const checkpointPages = pages.filter((p) => p.checkpoint_question_id || p.exercise);
  const checkpointsDone = checkpointPages.filter((p) =>
    p.checkpoint_question_id ? answeredPageIds.has(p.id) : !!exerciseState[p.id]?.completed
  ).length;
  // Admins only skip the gate while Admin mode is switched on, so they can see what learners see
  const readingComplete = isAdmin || checkpointsDone >= checkpointPages.length;

  return (
    <div className="animate-fade-up">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ChevronLeft className="h-4 w-4" /> {t.acadBackToModules}
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-1">
            {module.phase_title.trim().toUpperCase() === "BONUS" ? `BONUS · MODULE ${String(module.module_number).padStart(2, "0")}` : t.acadModuleOf(String(module.module_number).padStart(2, "0"), module.phase_number)}
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl leading-tight">{t.acadModuleTitle(module.track, module.module_number, module.title)}</h2>
          {module.phase_title.trim().toUpperCase() !== "BONUS" && <div className="text-xs text-muted-foreground mt-1 tracking-wider uppercase">{t.acadPhaseTitle(module.phase_number, module.phase_title)}</div>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {quizPassed && (
            <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.2em] text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" /> {t.acadCompleted}
            </span>
          )}
          {isAdmin && quizPassed && (
            <button
              onClick={async () => {
                if (!window.confirm("Restart this module? Your progress, quick checks and quiz result will be reset (admin only).")) return;
                const { error } = await supabase.rpc("admin_reset_module_progress" as never, { p_module_id: module.id } as never);
                if (error) { alert(error.message); return; }
                onReloadAll();
              }}
              className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-primary/40 transition-all"
            >
              <RotateCcw className="h-3 w-3" /> Restart module
            </button>
          )}
          {isAdmin && adminMode && (
            <button
              onClick={() => onSetEditing(isEditing ? null : module.id)}
              className={`flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-lg border transition-all ${isEditing ? "border-primary/60 text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              <Settings className="h-3 w-3" /> {isEditing ? t.acadClose : t.acadEdit}
            </button>
          )}
        </div>
      </div>

      {isAdmin && adminMode && isEditing && (
        <AdminEditPanel module={module} pdfs={pdfs} questions={questions} pages={pages} checkpointQuestionsById={checkpointQuestionsById} onSaved={onReloadAll} onDelete={onDeleteModule} />
      )}

      {/* Inline reader — replaces the old "Read this module" card */}
      {pages.length > 0 && (
        <div className="mb-6">
          <AcademyReader
            key={module.id}
            pages={pages}
            checkpointQuestionsById={checkpointQuestionsById}
            onFinish={onStartQuiz}
            onExit={onBack}
            reviewMode={quizPassed}
            initialPage={progress?.last_page ?? 0}
            onPageChange={onPageChange}
            onCheckpointAnswered={onCheckpointAnswered}
            exerciseState={exerciseState}
            onExerciseSaved={onExerciseSaved}
            adminEdit={isAdmin && adminMode ? { onSaved: onReloadAll } : undefined}
            adminSkip={isAdmin}
          />
        </div>
      )}

      {/* Video — hidden until clicked */}
      {embedUrl ? (
        <div className="mb-6">
          <button
            onClick={() => setShowVideo((v) => !v)}
            className="w-full glass rounded-xl p-4 flex items-center justify-center gap-2 text-sm hover:border-primary/40 border border-transparent transition-all"
          >
            <Play className="h-4 w-4 text-primary" /> {showVideo ? "Hide video" : "Watch video"}
          </button>
          {showVideo && (
            <div className="glass rounded-xl overflow-hidden mt-3">
              <div className="relative" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  src={embedUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={t.acadModuleTitle(module.track, module.module_number, module.title)}
                />
              </div>
            </div>
          )}
          {showVideo && !videoWatched && (
            <button
              onClick={onMarkWatched}
              className="w-full mt-3 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all"
            >
              {t.acadMarkWatched}
            </button>
          )}
        </div>
      ) : (
        isAdmin && adminMode && <p className="text-[11px] text-amber-400/80 mb-6">{t.acadAddVideoUrlHint}</p>
      )}

      {/* PDFs */}
      {pdfs.length > 0 && (
        <div className="glass rounded-xl p-5 mb-6">
          <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-3">{t.acadDownloads}</div>
          <div className="space-y-2">
            {pdfs.map((pdf) => (
              <a
                key={pdf.id}
                href={pdf.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 transition-all group"
              >
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm flex-1">{pdf.title}</span>
                <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Quiz */}
      <div className="glass rounded-xl p-6">
        <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-3">{t.acadModuleQuiz}</div>
        {quizPassed ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            <div>
              <div className="font-medium text-sm">{t.acadQuizPassed}</div>
              <div className="text-[11px] text-muted-foreground">{fitTotal(t.acadScoreNextUnlocked(progress?.quiz_score ?? 0), questions.length)}</div>
            </div>
          </div>
        ) : !hasQuiz ? (
          <p className="text-sm text-muted-foreground">
            {isAdmin ? t.acadAddQuestionsHint : t.acadQuizComingSoon}
          </p>
        ) : (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm">{fitTotal(t.acadQuizInstructions, questions.length)}</p>
              {!readingComplete && (
                <p className="text-[11px] text-primary/80 mt-1">
                  Complete every page, quick check and exercise above to unlock the quiz ({checkpointsDone}/{checkpointPages.length} done).
                </p>
              )}
              {(progress?.attempts ?? 0) > 0 && (
                <p className="text-[11px] text-muted-foreground mt-1">{fitTotal(t.acadLastScore(progress?.quiz_score ?? 0, progress?.attempts), questions.length)}</p>
              )}
            </div>
            <button
              onClick={onStartQuiz}
              disabled={!readingComplete}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-primary-foreground text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--gradient-gold)" }}
            >
              <Play className="h-3.5 w-3.5" />
              {(progress?.attempts ?? 0) > 0 ? t.acadRetryQuiz : t.acadTakeQuiz}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Quiz View ────────────────────────────────────────────────────────────────

function QuizView({
  t, module, questions, answers, submitted, submitting, error, result,
  onAnswer, onSubmit, onRetry, onBack, onContinue,
}: {
  t: T;
  module: DbModule;
  questions: DbQuestion[];
  answers: Record<string, string>;
  submitted: boolean;
  submitting: boolean;
  error: string | null;
  result: { score: number; passed: boolean; correctOptions: Record<string, string> } | null;
  onAnswer: (qId: string, optId: string) => void;
  onSubmit: () => void;
  onRetry: () => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [step, setStep] = useState(0);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [step, submitted]);
  if (!module) return null;
  const allAnswered = questions.length > 0 && questions.every((q) => !!answers[q.id]);

  return (
    <div className="animate-fade-up">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ChevronLeft className="h-4 w-4" /> {t.acadBackToModule}
      </button>

      <div className="mb-6">
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-1">{t.acadQuizModule(String(module.module_number).padStart(2, "0"))}</div>
        <h2 className="font-serif text-2xl">{t.acadModuleTitle(module.track, module.module_number, module.title)}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t.acadAnswerAll}</p>
      </div>

      {submitted && result && (
        <div className={`glass rounded-xl p-8 text-center mb-6 border ${result.passed ? "border-primary/40" : "border-destructive/30"}`}>
          {result.passed ? (
            <>
              <div className="text-4xl mb-3">🏆</div>
              <div className="font-serif text-2xl mb-1">{t.acadModuleComplete}</div>
              <div className="text-sm text-muted-foreground mb-5">{fitTotal(t.acadScoredUnlocked(result.score), questions.length)}</div>
              <button onClick={onContinue} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-primary-foreground text-sm font-medium" style={{ background: "var(--gradient-gold)" }}>
                {t.acadContinue}
              </button>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">📚</div>
              <div className="font-serif text-2xl mb-1">{t.acadNotQuite}</div>
              <div className="text-sm text-muted-foreground mb-5">{fitTotal(t.acadScoredRetry(result.score, passMarkFor(questions.length)), questions.length)}</div>
              <button onClick={() => { setStep(0); onRetry(); }} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border text-sm hover:border-primary/40 transition-colors">
                <RefreshCw className="h-4 w-4" /> {t.acadTryAgain}
              </button>
            </>
          )}
        </div>
      )}

      {submitted && (
      <div className="space-y-5">
        {questions.map((q, qi) => {
          const correctOptionId = result?.correctOptions?.[q.id];
          return (
            <div key={q.id} className="glass rounded-xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-[10px] tracking-[0.2em] text-primary/80 font-mono shrink-0 mt-0.5">Q{qi + 1}</span>
                <p className="text-sm font-medium leading-relaxed">{q.question_text}</p>
              </div>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const isSelected = answers[q.id] === opt.id;
                  const isCorrect = submitted && opt.id === correctOptionId;
                  const isWrong = submitted && isSelected && opt.id !== correctOptionId;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => !submitted && onAnswer(q.id, opt.id)}
                      disabled={submitted}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-all text-sm disabled:cursor-default ${
                        isCorrect ? "border-primary/60 bg-primary/10 text-primary"
                        : isWrong ? "border-destructive/60 bg-destructive/10 text-destructive"
                        : isSelected ? "border-primary/60 bg-primary/5"
                        : "border-border hover:border-primary/30"
                      }`}
                    >
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0 w-4">{["A","B","C","D"][oi]}</span>
                      <span className="flex-1">{opt.option_text}</span>
                      {isCorrect && <Check className="h-4 w-4 shrink-0" />}
                      {isWrong && <X className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* One question at a time until submitted */}
      {!submitted && questions.length > 0 && (() => {
        const q = questions[Math.min(step, questions.length - 1)];
        const isLast = step >= questions.length - 1;
        const answered = !!answers[q.id];
        return (
          <div>
            <div className="flex items-center gap-1.5 mb-4">
              {questions.map((qq, i) => (
                <div
                  key={qq.id}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    answers[qq.id] ? "bg-primary" : i === step ? "bg-primary/40" : "bg-secondary/40"
                  }`}
                />
              ))}
            </div>
            <div className="glass rounded-xl p-5 sm:p-6">
              <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-3">QUESTION {step + 1} OF {questions.length}</div>
              <p className="text-base font-medium leading-relaxed mb-5">{q.question_text}</p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const isSelected = answers[q.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => onAnswer(q.id, opt.id)}
                      className={`w-full text-left flex items-center gap-3 p-3.5 rounded-lg border transition-all text-sm ${
                        isSelected ? "border-primary/60 bg-primary/10" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0 w-4">{["A","B","C","D"][oi]}</span>
                      <span className="flex-1">{opt.option_text}</span>
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              {step > 0 && (
                <button
                  onClick={() => setStep((n) => Math.max(0, n - 1))}
                  disabled={submitting}
                  className="h-12 px-5 rounded-xl border border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-50 transition-all"
                >
                  Back
                </button>
              )}
              {isLast ? (
                <button
                  onClick={onSubmit}
                  disabled={!allAnswered || submitting}
                  className="flex-1 h-12 rounded-xl text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  style={{ background: "var(--gradient-gold)" }}
                >
                  {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                  {submitting ? t.acadSubmitting : t.acadSubmitAnswers}
                </button>
              ) : (
                <button
                  onClick={() => setStep((n) => n + 1)}
                  disabled={!answered}
                  className="flex-1 h-12 rounded-xl text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                  style={{ background: "var(--gradient-gold)" }}
                >
                  Next question
                </button>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Admin Edit Panel ─────────────────────────────────────────────────────────

function AdminEditPanel({
  module, pdfs, questions, pages, checkpointQuestionsById, onSaved, onDelete,
}: {
  module: DbModule;
  pdfs: DbPdf[];
  questions: DbQuestion[];
  pages: DbPage[];
  checkpointQuestionsById: Record<string, DbQuestion>;
  onSaved: () => void;
  onDelete: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState(module.title);
  const [savingTitle, setSavingTitle] = useState(false);
  const saveTitle = async () => {
    if (!titleDraft.trim()) return;
    setSavingTitle(true);
    await (supabase.from("academy_modules") as any).update({ title: titleDraft.trim() }).eq("id", module.id);
    setSavingTitle(false);
    onSaved();
  };
  const [videoUrl, setVideoUrl] = useState(module.video_url ?? "");
  const [savingVideo, setSavingVideo] = useState(false);
  const [newPdfTitle, setNewPdfTitle] = useState("");
  const [newPdfUrl, setNewPdfUrl] = useState("");
  const [savingPdf, setSavingPdf] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<DbQuestion | null>(null);
  const [qText, setQText] = useState("");
  const [opts, setOpts] = useState(["", "", "", ""]);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [savingQ, setSavingQ] = useState(false);

  const saveVideo = async () => {
    setSavingVideo(true);
    await (supabase.from("academy_modules") as any).update({ video_url: videoUrl || null }).eq("id", module.id);
    setSavingVideo(false);
    onSaved();
  };

  const addPdf = async () => {
    if (!newPdfTitle.trim() || !newPdfUrl.trim()) return;
    setSavingPdf(true);
    await (supabase.from("academy_module_pdfs") as any).insert({
      module_id: module.id, title: newPdfTitle.trim(), url: newPdfUrl.trim(), order_index: pdfs.length,
    });
    setNewPdfTitle(""); setNewPdfUrl("");
    setSavingPdf(false);
    onSaved();
  };

  const deletePdf = async (id: string) => {
    await (supabase.from("academy_module_pdfs") as any).delete().eq("id", id);
    onSaved();
  };

  const openQuestionForm = async (q?: DbQuestion) => {
    if (q) {
      setEditingQuestion(q);
      setQText(q.question_text);
      setOpts(q.options.slice(0,4).map((o) => o.option_text).concat(["","","",""]).slice(0, 4));
      // The shared question list comes from the public view (no is_correct).
      // Admins are RLS-permitted to read the base table directly, so fetch
      // the real flag here, on demand, just for the options being edited.
      const { data } = await (supabase.from("academy_quiz_options") as any)
        .select("id, is_correct")
        .eq("question_id", q.id)
        .order("order_index");
      const correctRow = ((data ?? []) as { id: string; is_correct: boolean }[]).findIndex((o) => o.is_correct);
      setCorrectIdx(Math.max(0, correctRow));
    } else {
      setEditingQuestion(null); setQText(""); setOpts(["","","",""]); setCorrectIdx(0);
    }
    setShowQuestionForm(true);
  };

  const saveQuestion = async () => {
    if (!qText.trim() || opts.some((o) => !o.trim())) return;
    setSavingQ(true);
    if (editingQuestion) {
      await (supabase.from("academy_quiz_questions") as any).update({ question_text: qText.trim() }).eq("id", editingQuestion.id);
      for (let i = 0; i < 4; i++) {
        const opt = editingQuestion.options[i];
        if (opt) await (supabase.from("academy_quiz_options") as any).update({ option_text: opts[i].trim(), is_correct: i === correctIdx }).eq("id", opt.id);
      }
    } else {
      const { data: newQ } = await (supabase.from("academy_quiz_questions") as any)
        .insert({ module_id: module.id, question_text: qText.trim(), order_index: questions.length })
        .select().single();
      if (newQ) {
        for (let i = 0; i < 4; i++) {
          await (supabase.from("academy_quiz_options") as any).insert({
            question_id: (newQ as DbQuestion).id, option_text: opts[i].trim(), is_correct: i === correctIdx, order_index: i,
          });
        }
      }
    }
    setSavingQ(false);
    setShowQuestionForm(false);
    setEditingQuestion(null);
    onSaved();
  };

  const deleteQuestion = async (id: string) => {
    await (supabase.from("academy_quiz_questions") as any).delete().eq("id", id);
    onSaved();
  };

  return (
    <div className="glass rounded-xl p-6 mb-6 border border-primary/20 space-y-6">
      <div className="text-[10px] tracking-[0.34em] text-primary/80">ADMIN · EDIT MODULE CONTENT</div>

      {/* Module title */}
      <div>
        <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Module title</div>
        <div className="flex gap-2">
          <input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} className="flex-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors" />
          <button onClick={saveTitle} disabled={savingTitle || !titleDraft.trim()} className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-primary-foreground text-sm disabled:opacity-50" style={{ background: "var(--gradient-gold)" }}>
            {savingTitle ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
          </button>
        </div>
      </div>

      {/* Video URL */}
      <div>
        <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Video URL (YouTube, Vimeo, or direct link)</div>
        <div className="flex gap-2">
          <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="flex-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors" />
          <button onClick={saveVideo} disabled={savingVideo} className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-primary-foreground text-sm disabled:opacity-50" style={{ background: "var(--gradient-gold)" }}>
            {savingVideo ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
          </button>
        </div>
      </div>

      {/* PDFs */}
      <div>
        <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">PDF Downloads ({pdfs.length})</div>
        {pdfs.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {pdfs.map((pdf) => (
              <div key={pdf.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border">
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 text-sm truncate">{pdf.title}</span>
                <button onClick={() => deletePdf(pdf.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <input value={newPdfTitle} onChange={(e) => setNewPdfTitle(e.target.value)} placeholder="PDF title" className="bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors" />
          <input value={newPdfUrl} onChange={(e) => setNewPdfUrl(e.target.value)} placeholder="https://..." className="bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors" />
          <button onClick={addPdf} disabled={savingPdf || !newPdfTitle.trim() || !newPdfUrl.trim()} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-40 transition-all">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>

      {/* Reader pages + quick checks */}
      <PageEditor module={module} pages={pages} checkpointQuestionsById={checkpointQuestionsById} onSaved={onSaved} />

      {/* Quiz questions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Quiz Questions ({questions.length})</div>
          {questions.length < 10 && !showQuestionForm && (
            <button onClick={() => openQuestionForm()} className="flex items-center gap-1 text-[11px] text-primary hover:underline">
              <Plus className="h-3 w-3" /> Add question
            </button>
          )}
        </div>

        {questions.length > 0 && (
          <div className="space-y-2 mb-3">
            {questions.map((q, i) => (
              <div key={q.id} className="flex items-start gap-2 p-3 rounded-lg border border-border">
                <span className="text-[10px] font-mono text-muted-foreground mt-0.5 w-4 shrink-0">Q{i+1}</span>
                <span className="flex-1 text-sm leading-snug">{q.question_text}</span>
                <button onClick={() => openQuestionForm(q)} className="text-muted-foreground hover:text-primary transition-colors shrink-0"><Settings className="h-3.5 w-3.5" /></button>
                <button onClick={() => deleteQuestion(q.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        )}

        {showQuestionForm && (
          <div className="border border-primary/20 rounded-xl p-4 space-y-3 bg-secondary/10">
            <div className="text-[10px] tracking-[0.2em] text-primary/80">{editingQuestion ? "EDIT QUESTION" : "NEW QUESTION"}</div>
            <textarea value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Enter your question..." rows={2} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none transition-colors" />
            <div className="space-y-2">
              {opts.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button onClick={() => setCorrectIdx(i)} className={`shrink-0 h-4 w-4 rounded-full border-2 transition-colors ${correctIdx === i ? "border-primary bg-primary" : "border-border"}`} />
                  <span className="text-[10px] font-mono text-muted-foreground w-4">{["A","B","C","D"][i]}</span>
                  <input value={opt} onChange={(e) => setOpts((o) => { const n=[...o]; n[i]=e.target.value; return n; })} placeholder={`Option ${["A","B","C","D"][i]}`} className="flex-1 bg-transparent border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary/50 transition-colors" />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">Filled circle = correct answer</p>
            <div className="flex gap-2">
              <button onClick={saveQuestion} disabled={savingQ || !qText.trim() || opts.some((o) => !o.trim())} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-primary-foreground text-sm disabled:opacity-50" style={{ background: "var(--gradient-gold)" }}>
                {savingQ ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
              </button>
              <button onClick={() => { setShowQuestionForm(false); setEditingQuestion(null); }} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:border-primary/40 transition-colors">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="pt-4 border-t border-destructive/20">
        <div className="text-xs text-destructive/80 mb-2 uppercase tracking-wider">Danger zone</div>
        <button
          onClick={async () => {
            if (!window.confirm(`Delete module "${module.title}"? Its pages, quiz questions, PDFs and every learner's progress for it will be permanently removed.`)) return;
            setDeleting(true); setDeleteErr(null);
            try { await onDelete(); }
            catch (e) { console.error("Deleting module failed:", e); setDeleteErr((e as { message?: string })?.message ?? "Delete failed"); setDeleting(false); }
          }}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-destructive/40 text-destructive text-sm hover:bg-destructive/10 disabled:opacity-50 transition-colors"
        >
          {deleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete this module
        </button>
        {deleteErr && <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{deleteErr}</div>}
      </div>
    </div>
  );
}

// ─── Admin: reader pages + quick checks ───────────────────────────────────────

function PageEditor({
  module, pages, checkpointQuestionsById, onSaved,
}: {
  module: DbModule;
  pages: DbPage[];
  checkpointQuestionsById: Record<string, DbQuestion>;
  onSaved: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null); // page id, or "new"
  const [heading, setHeading] = useState("");
  const [body, setBody] = useState("");
  const [qText, setQText] = useState("");
  const [opts, setOpts] = useState(["", "", "", ""]);
  const [optIds, setOptIds] = useState<(string | null)[]>([null, null, null, null]);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const check = async (p: PromiseLike<{ error: any }>) => {
    const { error } = await p;
    if (error) throw error;
  };

  const blank = () => {
    setHeading(""); setBody(""); setQText("");
    setOpts(["", "", "", ""]); setOptIds([null, null, null, null]); setCorrectIdx(0);
  };

  const openEditor = async (page?: DbPage) => {
    setErr(null);
    if (!page) { blank(); setEditingId("new"); return; }
    blank();
    setHeading(page.heading);
    setBody(page.body_html);
    const q = page.checkpoint_question_id ? checkpointQuestionsById[page.checkpoint_question_id] : null;
    if (q) {
      setQText(q.question_text);
      // Admins can read the base table, which includes is_correct
      const { data } = await (supabase.from("academy_quiz_options") as any)
        .select("id, option_text, is_correct").eq("question_id", q.id).order("order_index");
      const rows = (data ?? []) as { id: string; option_text: string; is_correct: boolean }[];
      setOpts([0, 1, 2, 3].map((i) => rows[i]?.option_text ?? ""));
      setOptIds([0, 1, 2, 3].map((i) => rows[i]?.id ?? null));
      setCorrectIdx(Math.max(0, rows.findIndex((o) => o.is_correct)));
    }
    setEditingId(page.id);
  };

  const save = async () => {
    if (!heading.trim() || !body.trim()) { setErr("Heading and body are required."); return; }
    const existing = editingId && editingId !== "new" ? pages.find((p) => p.id === editingId) ?? null : null;
    const hasQ = qText.trim() !== "" || opts.some((o) => o.trim() !== "");
    if (hasQ && (!qText.trim() || opts.some((o) => !o.trim()))) {
      setErr("Fill in the question and all four options, or clear them all."); return;
    }
    if (existing?.checkpoint_question_id && !hasQ) {
      setErr("This page already has a quick check — edit it rather than clearing it."); return;
    }
    setSaving(true); setErr(null);
    try {
      let pageId: string;
      let pageNumber: number;
      if (!existing) {
        pageNumber = pages.reduce((m, p) => Math.max(m, p.page_number), 0) + 1;
        const { data, error } = await (supabase.from("academy_module_pages") as any)
          .insert({ module_id: module.id, page_number: pageNumber, heading: heading.trim(), body_html: body })
          .select().single();
        if (error || !data) throw error ?? new Error("Could not create page");
        pageId = (data as { id: string }).id;
      } else {
        pageId = existing.id;
        pageNumber = existing.page_number;
        await check((supabase.from("academy_module_pages") as any)
          .update({ heading: heading.trim(), body_html: body }).eq("id", pageId));
      }

      if (hasQ) {
        const questionId = existing?.checkpoint_question_id ?? null;
        if (questionId) {
          await check((supabase.from("academy_quiz_questions") as any)
            .update({ question_text: qText.trim() }).eq("id", questionId));
          for (let i = 0; i < 4; i++) {
            const row = { option_text: opts[i].trim(), is_correct: i === correctIdx };
            if (optIds[i]) await check((supabase.from("academy_quiz_options") as any).update(row).eq("id", optIds[i]));
            else await check((supabase.from("academy_quiz_options") as any).insert({ ...row, question_id: questionId, order_index: i }));
          }
        } else {
          const { data: newQ, error } = await (supabase.from("academy_quiz_questions") as any)
            .insert({ module_id: module.id, question_text: qText.trim(), stage: "checkpoint", page_number: pageNumber, order_index: 0 })
            .select().single();
          if (error || !newQ) throw error ?? new Error("Could not create question");
          const newQId = (newQ as { id: string }).id;
          for (let i = 0; i < 4; i++) {
            await check((supabase.from("academy_quiz_options") as any).insert({
              question_id: newQId, option_text: opts[i].trim(), is_correct: i === correctIdx, order_index: i,
            }));
          }
          await check((supabase.from("academy_module_pages") as any).update({ checkpoint_question_id: newQId }).eq("id", pageId));
        }
      }
      setEditingId(null);
      onSaved();
    } catch (e) {
      console.error("Saving page failed:", e);
      setErr((e as { message?: string })?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const removePage = async (page: DbPage) => {
    if (!window.confirm(`Delete page "${page.heading}"? Learners' answers for it will be removed too.`)) return;
    try {
      await check((supabase.from("academy_module_pages") as any).delete().eq("id", page.id));
      if (page.checkpoint_question_id) {
        await check((supabase.from("academy_quiz_questions") as any).delete().eq("id", page.checkpoint_question_id));
      }
      // Close the gap so page numbers stay 1..N (ascending order keeps the unique constraint happy)
      const rest = pages.filter((p) => p.id !== page.id).sort((a, b) => a.page_number - b.page_number);
      for (let i = 0; i < rest.length; i++) {
        if (rest[i].page_number !== i + 1) {
          await check((supabase.from("academy_module_pages") as any).update({ page_number: i + 1 }).eq("id", rest[i].id));
        }
      }
      onSaved();
    } catch (e) {
      console.error("Deleting page failed:", e);
      setErr((e as { message?: string })?.message ?? "Delete failed");
    }
  };

  const movePage = async (page: DbPage, dir: -1 | 1) => {
    const sorted = [...pages].sort((a, b) => a.page_number - b.page_number);
    const idx = sorted.findIndex((p) => p.id === page.id);
    const other = sorted[idx + dir];
    if (!other) return;
    try {
      // three-step swap through a temporary number to respect UNIQUE (module_id, page_number)
      await check((supabase.from("academy_module_pages") as any).update({ page_number: -1 }).eq("id", page.id));
      await check((supabase.from("academy_module_pages") as any).update({ page_number: page.page_number }).eq("id", other.id));
      await check((supabase.from("academy_module_pages") as any).update({ page_number: other.page_number }).eq("id", page.id));
      onSaved();
    } catch (e) {
      console.error("Moving page failed:", e);
      setErr((e as { message?: string })?.message ?? "Move failed");
    }
  };

  const sortedPages = [...pages].sort((a, b) => a.page_number - b.page_number);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">Reader pages ({pages.length})</div>
        {editingId === null && (
          <button onClick={() => openEditor()} className="flex items-center gap-1 text-[11px] text-primary hover:underline">
            <Plus className="h-3 w-3" /> Add page
          </button>
        )}
      </div>

      {sortedPages.length > 0 && (
        <div className="space-y-2 mb-3">
          {sortedPages.map((pg, i) => (
            <div key={pg.id} className="flex items-center gap-2 p-3 rounded-lg border border-border">
              <span className="text-[10px] font-mono text-muted-foreground w-5 shrink-0">{i + 1}</span>
              <span className="flex-1 text-sm leading-snug truncate">{pg.heading}</span>
              {pg.exercise ? <span className="text-[10px] text-primary/80 shrink-0">exercise</span> : !pg.checkpoint_question_id && <span className="text-[10px] text-amber-400/80 shrink-0">no quick check</span>}
              <button onClick={() => movePage(pg, -1)} disabled={i === 0} className="text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors shrink-0 text-xs px-1">↑</button>
              <button onClick={() => movePage(pg, 1)} disabled={i === sortedPages.length - 1} className="text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors shrink-0 text-xs px-1">↓</button>
              <button onClick={() => openEditor(pg)} className="text-muted-foreground hover:text-primary transition-colors shrink-0"><Settings className="h-3.5 w-3.5" /></button>
              <button onClick={() => removePage(pg)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      {editingId !== null && (
        <div className="border border-primary/20 rounded-xl p-4 space-y-3 bg-secondary/10">
          <div className="text-[10px] tracking-[0.2em] text-primary/80">{editingId === "new" ? "NEW PAGE" : "EDIT PAGE"}</div>
          <input value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="Page heading" className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Page body (HTML: <p>, <b>, <em>, <br/>)" rows={10} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-primary/50 resize-y transition-colors" />
          <div className="text-[10px] tracking-[0.2em] text-primary/80 pt-1">QUICK CHECK</div>
          <textarea value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Quick check question" rows={2} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none transition-colors" />
          <div className="space-y-2">
            {opts.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button onClick={() => setCorrectIdx(i)} className={`shrink-0 h-4 w-4 rounded-full border-2 transition-colors ${correctIdx === i ? "border-primary bg-primary" : "border-border"}`} />
                <span className="text-[10px] font-mono text-muted-foreground w-4">{["A","B","C","D"][i]}</span>
                <input value={opt} onChange={(e) => setOpts((o) => { const n = [...o]; n[i] = e.target.value; return n; })} placeholder={`Option ${["A","B","C","D"][i]}`} className="flex-1 bg-transparent border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary/50 transition-colors" />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Filled circle = correct answer. Leave the question and options empty for a page without a quick check.</p>
          {err && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-primary-foreground text-sm disabled:opacity-50" style={{ background: "var(--gradient-gold)" }}>
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
            </button>
            <button onClick={() => { setEditingId(null); setErr(null); }} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:border-primary/40 transition-colors">Cancel</button>
          </div>
        </div>
      )}
      {editingId === null && err && <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
    </div>
  );
}
