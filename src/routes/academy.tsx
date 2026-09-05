import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/aurum/AppShell";
import { SectionHeading } from "@/components/aurum/SectionHeading";
import {
  Play, Lock, Sparkles, CheckCircle2, ChevronLeft, Download,
  Settings, Plus, Trash2, Save, FileText, X, Check, RefreshCw, Trophy, GraduationCap,
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
const PASS_SCORE = 3;

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

type ModuleProgress = {
  module_id: string;
  video_watched: boolean;
  quiz_passed: boolean;
  quiz_score: number | null;
  attempts: number;
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
  const [progress, setProgress] = useState<Record<string, ModuleProgress>>({});
  // Real DB counts for all tracks (for the track selector cards)
  const [allTracksStats, setAllTracksStats] = useState<Record<string, { total: number; completed: number }>>({});
  const [loading, setLoading] = useState(true);

  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "module" | "quiz">("list");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
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
    const [{ data: pdfData }, { data: qData }, { data: oData }] = await Promise.all([
      (supabase.from("academy_module_pdfs") as any).select("*").in("module_id", ids).order("order_index"),
      (supabase.from("academy_quiz_questions") as any).select("*").in("module_id", ids).order("order_index"),
      // Public view — never exposes is_correct. Admin editing fetches that
      // separately, on demand, from the base table (which is admin-gated).
      (supabase.from("academy_quiz_options_public") as any).select("*").order("order_index"),
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

  const activeModule = modules.find((m) => m.id === activeModuleId) ?? null;
  const activeQuestions = activeModuleId ? (questions[activeModuleId] ?? []) : [];
  const activePdfs = activeModuleId ? (pdfs[activeModuleId] ?? []) : [];
  const activeProgress = activeModuleId ? (progress[activeModuleId] ?? null) : null;

  const openModule = (mod: DbModule) => {
    if (isTrackLocked) return; // whole track locked for regular users
    if (getState(mod) === "locked" && !isAdmin) return;
    setActiveModuleId(mod.id);
    setView("module");
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
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
      },
    }));
  };

  const submitQuiz = async () => {
    if (!user || !activeModuleId || activeQuestions.length === 0) return;

    // Grading happens server-side (submit_module_quiz RPC) — the client never
    // computes pass/fail or writes user_module_progress directly, since that
    // would let anyone unlock a module without passing the quiz.
    const { data, error } = await supabase.rpc("submit_module_quiz", {
      p_module_id: activeModuleId,
      p_answers: quizAnswers,
    });
    if (error || !data) return;

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
          const phaseLabel = t.acadPhase(passedModule.phase_number, t.acadPhaseTitle(passedModule.phase_number, passedModule.phase_title));
          celebrate({ icon: Trophy, title: t.celebrationPhaseTitle(phaseLabel) });
        } else {
          celebrate({ icon: CheckCircle2, title: t.celebrationModuleTitle });
        }
      }
    }
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
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
        {INDUSTRY_LIST.map((ind) => {
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
      ) : view === "quiz" ? (
        <QuizView
          t={t}
          module={activeModule!}
          questions={activeQuestions}
          answers={quizAnswers}
          submitted={quizSubmitted}
          result={quizResult}
          onAnswer={(qId, optId) => setQuizAnswers((a) => ({ ...a, [qId]: optId }))}
          onSubmit={submitQuiz}
          onRetry={() => { setQuizAnswers({}); setQuizSubmitted(false); setQuizResult(null); }}
          onBack={() => setView("module")}
          onContinue={goBack}
        />
      ) : (
        <ModuleDetail
          t={t}
          module={activeModule!}
          pdfs={activePdfs}
          questions={activeQuestions}
          progress={activeProgress}
          isAdmin={isAdmin}
          adminMode={adminMode}
          editingModule={editingModule}
          onSetEditing={setEditingModule}
          onBack={goBack}
          onStartQuiz={() => setView("quiz")}
          onMarkWatched={markWatched}
          onReloadAll={loadAll}
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
  t, phases, modules, progress, getState, isAdmin, adminMode, isTrackLocked, onToggleAdmin, onOpenModule, loading, totalDone,
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
              <div className="text-[10px] tracking-[0.34em] text-primary/70 uppercase mb-2 px-1">
                {t.acadPhase(phaseNum, t.acadPhaseTitle(+phaseNum, title))}
              </div>
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
    </>
  );
}

// ─── Module Detail ────────────────────────────────────────────────────────────

function ModuleDetail({
  t, module, pdfs, questions, progress, isAdmin, adminMode, editingModule,
  onSetEditing, onBack, onStartQuiz, onMarkWatched, onReloadAll,
}: {
  t: T;
  module: DbModule;
  pdfs: DbPdf[];
  questions: DbQuestion[];
  progress: ModuleProgress | null;
  isAdmin: boolean;
  adminMode: boolean;
  editingModule: string | null;
  onSetEditing: (id: string | null) => void;
  onBack: () => void;
  onStartQuiz: () => void;
  onMarkWatched: () => void;
  onReloadAll: () => void;
}) {
  if (!module) return null;
  const embedUrl = module.video_url ? getEmbedUrl(module.video_url) : null;
  const hasQuiz = questions.length >= 5;
  const quizPassed = !!progress?.quiz_passed;
  const videoWatched = !!progress?.video_watched;
  const isEditing = editingModule === module.id;

  return (
    <div className="animate-fade-up">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ChevronLeft className="h-4 w-4" /> {t.acadBackToModules}
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-1">
            {t.acadModuleOf(String(module.module_number).padStart(2, "0"), module.phase_number)}
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl leading-tight">{t.acadModuleTitle(module.track, module.module_number, module.title)}</h2>
          <div className="text-xs text-muted-foreground mt-1 tracking-wider uppercase">{t.acadPhaseTitle(module.phase_number, module.phase_title)}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {quizPassed && (
            <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.2em] text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" /> {t.acadCompleted}
            </span>
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
        <AdminEditPanel module={module} pdfs={pdfs} questions={questions} onSaved={onReloadAll} />
      )}

      {/* Video */}
      <div className="glass rounded-xl overflow-hidden mb-6">
        {embedUrl ? (
          <div className="relative" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={t.acadModuleTitle(module.track, module.module_number, module.title)}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="h-14 w-14 rounded-full border border-border/60 flex items-center justify-center">
              <Play className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t.acadVideoComingSoon}</p>
            {isAdmin && adminMode && <p className="text-[11px] text-amber-400/80">{t.acadAddVideoUrlHint}</p>}
          </div>
        )}
      </div>

      {embedUrl && !videoWatched && (
        <button
          onClick={onMarkWatched}
          className="w-full mb-5 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all"
        >
          {t.acadMarkWatched}
        </button>
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
              <div className="text-[11px] text-muted-foreground">{t.acadScoreNextUnlocked(progress?.quiz_score ?? 0)}</div>
            </div>
          </div>
        ) : !hasQuiz ? (
          <p className="text-sm text-muted-foreground">
            {isAdmin ? t.acadAddQuestionsHint : t.acadQuizComingSoon}
          </p>
        ) : (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm">{t.acadQuizInstructions}</p>
              {(progress?.attempts ?? 0) > 0 && (
                <p className="text-[11px] text-muted-foreground mt-1">{t.acadLastScore(progress?.quiz_score ?? 0, progress?.attempts)}</p>
              )}
            </div>
            <button
              onClick={onStartQuiz}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-primary-foreground text-sm font-medium"
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
  t, module, questions, answers, submitted, result,
  onAnswer, onSubmit, onRetry, onBack, onContinue,
}: {
  t: T;
  module: DbModule;
  questions: DbQuestion[];
  answers: Record<string, string>;
  submitted: boolean;
  result: { score: number; passed: boolean; correctOptions: Record<string, string> } | null;
  onAnswer: (qId: string, optId: string) => void;
  onSubmit: () => void;
  onRetry: () => void;
  onBack: () => void;
  onContinue: () => void;
}) {
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
              <div className="text-sm text-muted-foreground mb-5">{t.acadScoredUnlocked(result.score)}</div>
              <button onClick={onContinue} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-primary-foreground text-sm font-medium" style={{ background: "var(--gradient-gold)" }}>
                {t.acadContinue}
              </button>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">📚</div>
              <div className="font-serif text-2xl mb-1">{t.acadNotQuite}</div>
              <div className="text-sm text-muted-foreground mb-5">{t.acadScoredRetry(result.score, PASS_SCORE)}</div>
              <button onClick={onRetry} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border text-sm hover:border-primary/40 transition-colors">
                <RefreshCw className="h-4 w-4" /> {t.acadTryAgain}
              </button>
            </>
          )}
        </div>
      )}

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

      {!submitted && (
        <button
          onClick={onSubmit}
          disabled={!allAnswered}
          className="w-full mt-6 h-12 rounded-xl text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          style={{ background: "var(--gradient-gold)" }}
        >
          {t.acadSubmitAnswers}
        </button>
      )}
    </div>
  );
}

// ─── Admin Edit Panel ─────────────────────────────────────────────────────────

function AdminEditPanel({
  module, pdfs, questions, onSaved,
}: {
  module: DbModule;
  pdfs: DbPdf[];
  questions: DbQuestion[];
  onSaved: () => void;
}) {
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

      {/* Quiz questions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Quiz Questions ({questions.length}/5)</div>
          {questions.length < 5 && !showQuestionForm && (
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
    </div>
  );
}
