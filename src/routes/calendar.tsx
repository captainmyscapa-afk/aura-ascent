import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check,
  Trash2,
  Bell,
  Flame,
  Clock,
  Loader2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  Compass,
  ChevronDown,
} from "lucide-react";
import { AppShell } from "@/components/aurum/AppShell";
import { AnimateIn } from "@/components/aurum/AnimateIn";
import { useAuth } from "@/hooks/useAuth";
import { useAurumCoreState } from "@/hooks/useAurumCoreState";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
});

type AurumTask = Tables<"aurum_tasks">;
type Priority = "low" | "medium" | "high";

/** Sources that represent "activity done that day" rather than a task with a due date. */
const ACTIVITY_SOURCES = ["daily_ritual", "roadmap"];

function isoDay(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function useTilt(strength = 8) {
  const [style, setStyle] = useState<React.CSSProperties>({
    transform: "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)",
  });
  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setStyle({
      transform: `perspective(900px) rotateX(${(-py * strength).toFixed(2)}deg) rotateY(${(px * strength).toFixed(2)}deg) translateZ(4px)`,
    });
  };
  const onMouseLeave = () => {
    setStyle({ transform: "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)" });
  };
  return { style, onMouseMove, onMouseLeave };
}

const PRIORITY_META: Record<Priority, { dot: string; ring: string; text: string }> = {
  low: { dot: "bg-emerald-400", ring: "ring-emerald-400/30", text: "text-emerald-400" },
  medium: { dot: "bg-primary", ring: "ring-primary/30", text: "text-primary" },
  high: { dot: "bg-red-400", ring: "ring-red-400/30", text: "text-red-400" },
};

function CalendarPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { state: core } = useAurumCoreState();

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(isoDay());
  const [monthTasks, setMonthTasks] = useState<AurumTask[]>([]);
  const [upcoming, setUpcoming] = useState<AurumTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(isoDay());
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const addTilt = useTilt(6);

  const loadMonth = async () => {
    if (!user) return;
    setLoading(true);
    const monthStart = new Date(viewYear, viewMonth, 1);
    const monthEnd = new Date(viewYear, viewMonth + 1, 1);
    const monthStartDate = isoDay(monthStart);
    const monthEndDate = isoDay(monthEnd);

    const [ritualsRes, dueRes] = await Promise.all([
      supabase
        .from("aurum_tasks")
        .select("*")
        .eq("user_id", user.id)
        .in("source", ACTIVITY_SOURCES)
        .eq("status", "completed")
        .gte("completed_at", monthStart.toISOString())
        .lt("completed_at", monthEnd.toISOString()),
      supabase
        .from("aurum_tasks")
        .select("*")
        .eq("user_id", user.id)
        .gte("due_date", monthStartDate)
        .lt("due_date", monthEndDate),
    ]);

    const merged = new Map<string, AurumTask>();
    (ritualsRes.data ?? []).forEach((r) => merged.set(r.id, r));
    (dueRes.data ?? []).forEach((r) => merged.set(r.id, r));
    setMonthTasks(Array.from(merged.values()));
    setLoading(false);
  };

  const loadUpcoming = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("aurum_tasks")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "completed")
      .not("due_date", "is", null)
      .order("due_date", { ascending: true })
      .limit(8);
    setUpcoming(data ?? []);
  };

  useEffect(() => {
    void loadMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, viewMonth, viewYear]);

  useEffect(() => {
    void loadUpcoming();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const completedByDay = useMemo(() => {
    const map: Record<string, { ritual: string[]; roadmap: string[] }> = {};
    monthTasks.forEach((r) => {
      if (r.status !== "completed" || !r.completed_at) return;
      if (r.source !== "daily_ritual" && r.source !== "roadmap") return;
      const key = r.completed_at.slice(0, 10);
      if (!map[key]) map[key] = { ritual: [], roadmap: [] };
      if (r.title) map[key][r.source === "daily_ritual" ? "ritual" : "roadmap"].push(r.title);
    });
    return map;
  }, [monthTasks]);

  const tasksByDueDay = useMemo(() => {
    const map: Record<string, AurumTask[]> = {};
    monthTasks.forEach((r) => {
      if (ACTIVITY_SOURCES.includes(r.source ?? "") || !r.due_date) return;
      const key = r.due_date;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [monthTasks]);

  const monthActivePct = useMemo(() => {
    const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
    const activeDays = Object.keys(completedByDay).length;
    return Math.round((activeDays / lastDay) * 100);
  }, [completedByDay, viewMonth, viewYear]);

  const toggleComplete = async (task: AurumTask) => {
    if (!user) return;
    setMutatingId(task.id);
    const nowDone = task.status !== "completed";
    await supabase
      .from("aurum_tasks")
      .update({ status: nowDone ? "completed" : "pending", completed_at: nowDone ? new Date().toISOString() : null })
      .eq("id", task.id);
    await Promise.all([loadMonth(), loadUpcoming()]);
    setMutatingId(null);
  };

  const deleteTask = async (task: AurumTask) => {
    setMutatingId(task.id);
    await supabase.from("aurum_tasks").delete().eq("id", task.id);
    await Promise.all([loadMonth(), loadUpcoming()]);
    setMutatingId(null);
  };

  const openAddModal = (dateStr: string) => {
    setModalDate(dateStr);
    setModalOpen(true);
  };

  const gridCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7;
    const cells: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < startDow; i++) {
      cells.push({ date: new Date(viewYear, viewMonth, 1 - (startDow - i)), inMonth: false });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      cells.push({ date: new Date(viewYear, viewMonth, d), inMonth: true });
    }
    const remainder = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
    for (let i = 1; i <= remainder; i++) {
      cells.push({ date: new Date(viewYear, viewMonth + 1, i), inMonth: false });
    }
    return cells;
  }, [viewMonth, viewYear]);

  const todayStr = isoDay();
  const selectedCompleted = completedByDay[selectedDate];
  const selectedDue = (tasksByDueDay[selectedDate] ?? []).sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "high" ? -1 : 1));

  return (
    <AppShell>
      {/* ── Header ── */}
      <div
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty("--px", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
          e.currentTarget.style.setProperty("--py", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
        }}
        className="relative mb-8 animate-fade-up overflow-hidden rounded-3xl glass p-8 sm:p-12"
        style={{ "--px": "70%", "--py": "20%" } as React.CSSProperties}
      >
        <div
          className="pointer-events-none absolute h-96 w-96 rounded-full opacity-[0.1] blur-3xl animate-orb-a transition-[left,top] duration-500 ease-out"
          style={{ background: "var(--gradient-gold)", left: "var(--px)", top: "var(--py)", transform: "translate(-50%,-50%)" }}
        />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl animate-orb-b" />

        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <div className="text-[10px] tracking-[0.4em] text-primary/80 uppercase">{t.calEyebrow}</div>
            </div>
            <h1 className="font-serif text-5xl sm:text-[58px] leading-[1.05] tracking-tight">
              {t.calHeroPre} <span className="italic text-gold-gradient">{t.calHeroEm}</span>
            </h1>
            <div className="mt-3 h-px w-24 hairline" />
            <p className="mt-5 text-muted-foreground max-w-xl text-[15px] leading-relaxed">{t.calSubtitle}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-full border border-border/60 px-3.5 py-1.5 text-xs text-muted-foreground">
                <Flame className="h-3.5 w-3.5 text-primary" />
                {t.calStreakLabel(core?.streak ?? 0)}
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border/60 px-3.5 py-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                {t.calMonthCompletion(monthActivePct)}
              </div>
            </div>
          </div>

          <button
            onClick={() => openAddModal(selectedDate)}
            onMouseMove={addTilt.onMouseMove}
            onMouseLeave={addTilt.onMouseLeave}
            style={addTilt.style}
            className="tilt-card relative shrink-0 flex items-center gap-2 rounded-xl px-5 py-3 text-primary-foreground font-medium text-sm overflow-hidden group active:scale-[0.98] shadow-[var(--shadow-gold)]"
          >
            <span className="absolute inset-0" style={{ background: "var(--gradient-gold)" }} />
            <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <Plus className="h-4 w-4 relative" />
            <span className="relative tracking-wide">{t.calAddTask}</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* ── Big month grid ── */}
        <div className="glass rounded-2xl p-5 sm:p-7">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); } else setViewMonth((m) => m - 1); }}
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <span className="font-serif text-2xl">{t.monthShort[viewMonth]} {viewYear}</span>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); setSelectedDate(todayStr); }}
                className="mr-1 text-[10px] tracking-[0.2em] uppercase px-2.5 py-1.5 rounded-lg border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
              >
                {t.calToday}
              </button>
              <button
                onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); } else setViewMonth((m) => m + 1); }}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {t.weekdayLetters.map((d, i) => (
              <div key={i} className="text-center text-[10px] tracking-[0.15em] text-muted-foreground/50 py-1 uppercase">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {gridCells.map(({ date, inMonth }, i) => {
              const dateStr = isoDay(date);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const completed = completedByDay[dateStr];
              const due = tasksByDueDay[dateStr] ?? [];
              const overdue = due.some((tk) => tk.status !== "completed" && dateStr < todayStr);
              const hasReminder = due.some((tk) => !!tk.remind_at);

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative min-h-[76px] sm:min-h-[92px] rounded-xl p-1.5 text-left transition-all ${
                    !inMonth ? "opacity-25" : "hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
                  } ${
                    isSelected
                      ? "ring-2 ring-primary/60 bg-primary/10"
                      : isToday
                      ? "ring-1 ring-primary/40 bg-primary/5"
                      : "hover:bg-secondary/20"
                  }`}
                >
                  <div className={`text-[11px] text-right pr-0.5 ${isToday ? "text-primary font-bold" : "text-muted-foreground/60"}`}>
                    {date.getDate()}
                  </div>
                  <div className="mt-1 flex flex-col gap-1 px-0.5">
                    {completed && (completed.ritual.length > 0 || completed.roadmap.length > 0) && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {completed.ritual.slice(0, 3).map((_, di) => (
                          <span key={"r" + di} className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--gradient-gold)" }} />
                        ))}
                        {completed.roadmap.slice(0, 3).map((_, di) => (
                          <span key={"m" + di} className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                        ))}
                      </div>
                    )}
                    {due.length > 0 && (
                      <div className={`text-[9px] leading-tight px-1 py-0.5 rounded truncate flex items-center gap-1 ${
                        overdue ? "bg-red-400/15 text-red-300" : "bg-primary/10 text-primary/90"
                      }`}>
                        {hasReminder && <Bell className="h-2 w-2 shrink-0" />}
                        {due.length === 1 ? due[0].title : `${due.length} tasks`}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-border/40 flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--gradient-gold)" }} />
              <span className="text-[10px] text-muted-foreground">{t.calRitualLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              <span className="text-[10px] text-muted-foreground">{t.calRoadmapLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
              <span className="text-[10px] text-muted-foreground">{t.calLegendDue}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              <span className="text-[10px] text-muted-foreground">{t.calLegendOverdue}</span>
            </div>
          </div>
        </div>

        {/* ── Right rail: selected day + upcoming ── */}
        <div className="space-y-5">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] tracking-[0.34em] text-primary/80 uppercase">{selectedDate === todayStr ? t.calToday : ""}</div>
                <div className="font-serif text-xl">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                </div>
              </div>
              <button
                onClick={() => openAddModal(selectedDate)}
                className="p-2 rounded-lg border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {(!selectedCompleted || (selectedCompleted.ritual.length === 0 && selectedCompleted.roadmap.length === 0)) && selectedDue.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="h-6 w-6 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">{t.calEmptyDay}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedCompleted && selectedCompleted.ritual.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Flame className="h-3 w-3 text-primary" />
                      <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">{t.calRitualLabel}</span>
                      <span className="ml-auto font-mono text-[10px] text-primary">{selectedCompleted.ritual.length}</span>
                    </div>
                    <CompletedList items={selectedCompleted.ritual} accentClass="text-primary" />
                  </div>
                )}

                {selectedCompleted && selectedCompleted.roadmap.length > 0 && (
                  <div>
                    {selectedCompleted.ritual.length > 0 && <div className="border-t border-border/40 pt-3" />}
                    <div className="flex items-center gap-1.5 mb-2">
                      <Compass className="h-3 w-3 text-violet-400" />
                      <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">{t.calRoadmapLabel}</span>
                      <span className="ml-auto font-mono text-[10px] text-violet-400">{selectedCompleted.roadmap.length}</span>
                    </div>
                    <CompletedList items={selectedCompleted.roadmap} accentClass="text-violet-400" />
                  </div>
                )}

                {selectedDue.length > 0 && (
                  <div>
                    {selectedCompleted && (selectedCompleted.ritual.length > 0 || selectedCompleted.roadmap.length > 0) && <div className="border-t border-border/40 pt-3" />}
                    <ul className="space-y-2">
                      {selectedDue.map((tk) => (
                        <TaskRow key={tk.id} task={tk} onToggle={() => toggleComplete(tk)} onDelete={() => deleteTask(tk)} busy={mutatingId === tk.id} t={t} />
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {upcoming.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <div className="text-[10px] tracking-[0.34em] text-primary/80 uppercase mb-3">{t.calUpcoming}</div>
              <ul className="space-y-2">
                {upcoming.map((tk, i) => (
                  <AnimateIn key={tk.id} delay={i * 40}>
                    <TaskRow task={tk} onToggle={() => toggleComplete(tk)} onDelete={() => deleteTask(tk)} busy={mutatingId === tk.id} t={t} showDate />
                  </AnimateIn>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <AddTaskModal
          defaultDate={modalDate}
          onClose={() => setModalOpen(false)}
          onSaved={async () => {
            setModalOpen(false);
            await Promise.all([loadMonth(), loadUpcoming()]);
          }}
          userId={user?.id}
          t={t}
        />
      )}
    </AppShell>
  );
}

function CompletedList({
  items,
  accentClass,
}: {
  items: string[];
  accentClass: string;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <ul className="space-y-1.5">
      {items.map((title, i) => {
        const isOpen = expanded.has(i);
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className="w-full flex items-start gap-2 text-xs text-foreground/80 text-left"
            >
              <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${accentClass}`} />
              <span className={isOpen ? "flex-1 whitespace-normal break-words" : "flex-1 truncate"}>{title}</span>
              <ChevronDown
                className={`h-3 w-3 shrink-0 mt-0.5 text-muted-foreground/50 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
  busy,
  t,
  showDate,
}: {
  task: AurumTask;
  onToggle: () => void;
  onDelete: () => void;
  busy: boolean;
  t: ReturnType<typeof useLanguage>["t"];
  showDate?: boolean;
}) {
  const done = task.status === "completed";
  const priority = (task.priority as Priority) ?? "medium";
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.medium;
  const overdue = !done && task.due_date && task.due_date < isoDay();

  return (
    <li className={`group flex items-start gap-2.5 rounded-lg border p-2.5 transition-all ${done ? "border-border/40 opacity-60" : "border-border/60 hover:border-primary/30"}`}>
      <button onClick={onToggle} disabled={busy} className="shrink-0 mt-0.5 disabled:opacity-40">
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : done ? (
          <CheckCircle2 className="h-4 w-4 text-primary" />
        ) : (
          <Circle className={`h-4 w-4 ${meta.text}`} />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-medium truncate ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {showDate && task.due_date && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(task.due_date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
          {overdue && (
            <span className="flex items-center gap-1 text-[10px] text-red-400">
              <AlertCircle className="h-2.5 w-2.5" /> {t.calOverdue}
            </span>
          )}
          {task.remind_at && (
            <span className="flex items-center gap-1 text-[10px] text-primary/80">
              <Bell className="h-2.5 w-2.5" /> {t.calReminderBadge}
            </span>
          )}
        </div>
      </div>
      <button onClick={onDelete} disabled={busy} className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all disabled:opacity-40">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

function AddTaskModal({
  defaultDate,
  onClose,
  onSaved,
  userId,
  t,
}: {
  defaultDate: string;
  onClose: () => void;
  onSaved: () => void;
  userId?: string;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(defaultDate);
  const [remindEnabled, setRemindEnabled] = useState(false);
  const [remindAt, setRemindAt] = useState(`${defaultDate}T09:00`);
  const [priority, setPriority] = useState<Priority>("medium");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!userId || !title.trim()) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from("aurum_tasks").insert({
      user_id: userId,
      title: title.trim(),
      description: description.trim() || null,
      status: "pending",
      priority,
      source: "manual",
      due_date: dueDate || null,
      remind_at: remindEnabled && dueDate ? new Date(remindAt).toISOString() : null,
      reminder_sent: false,
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-strong rounded-2xl max-w-md w-full p-7 border border-primary/20 shadow-[0_0_60px_rgba(201,168,76,0.1)] animate-pop">
        <button onClick={onClose} className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-gold)" }}>
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="font-serif text-xl">{t.calModalTitle}</div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-2 block">{t.calModalTitleLabel}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.calModalTitlePlaceholder}
              className="w-full bg-transparent outline-none text-sm border border-border rounded-lg p-3 focus:border-primary/50 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-2 block">{t.calModalDescLabel}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.calModalDescPlaceholder}
              rows={2}
              className="w-full bg-transparent outline-none text-sm border border-border rounded-lg p-3 focus:border-primary/50 resize-none transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-2 block">{t.calModalDueLabel}</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-transparent outline-none text-sm border border-border rounded-lg p-3 focus:border-primary/50 transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={remindEnabled}
                onChange={(e) => setRemindEnabled(e.target.checked)}
                disabled={!dueDate}
                className="accent-primary"
              />
              {t.calModalReminderLabel}
            </label>
            {remindEnabled && (
              <>
                <input
                  type="datetime-local"
                  value={remindAt}
                  onChange={(e) => setRemindAt(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm border border-border rounded-lg p-3 focus:border-primary/50 transition-colors"
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">{t.calModalReminderHint}</p>
              </>
            )}
          </div>

          <div>
            <label className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-2 block">{t.calModalPriorityLabel}</label>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs transition-all ${
                    priority === p ? "border-primary/60 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_META[p].dot}`} />
                  {p === "low" ? t.calPriorityLow : p === "medium" ? t.calPriorityMedium : t.calPriorityHigh}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="text-xs text-destructive border border-destructive/40 rounded-lg p-3">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => void save()}
              disabled={saving || !title.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-primary-foreground font-medium text-sm disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: "var(--gradient-gold)" }}
            >
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> {t.calModalSaving}</> : <><Check className="h-4 w-4" /> {t.calModalSave}</>}
            </button>
            <button onClick={onClose} className="px-5 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t.calModalCancel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
