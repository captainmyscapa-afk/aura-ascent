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
  MapPin,
  Users,
  Flag,
} from "lucide-react";
import { AppShell } from "@/components/aurum/AppShell";
import { AnimateIn } from "@/components/aurum/AnimateIn";
import { useAuth } from "@/hooks/useAuth";
import { useAurumCoreState } from "@/hooks/useAurumCoreState";
import { useIndustry } from "@/lib/industry/IndustryProvider";
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

// CAP-93: same industry → color mapping used for calendar events on the dashboard,
// so a ritual's mode is visually consistent across the app.
type CompletedItem = { title: string; industry: string | null };
const INDUSTRY_META: Record<string, { dot: string; text: string; label: string }> = {
  yachts: { dot: "bg-blue-400", text: "text-blue-300", label: "Yacht" },
  villas: { dot: "bg-emerald-400", text: "text-emerald-300", label: "Villa" },
  jets: { dot: "bg-violet-400", text: "text-violet-300", label: "Jet" },
  cars: { dot: "bg-orange-400", text: "text-orange-300", label: "Car" },
};

// CAP-98: community events — shared, industry-scoped calendar entries other users can RSVP to.
type CommunityEvent = {
  id: string;
  user_id: string;
  industry: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string | null;
  attendee_count: number;
  created_at: string;
};
type PublicProfile = { full_name: string | null; photo_url: string | null };

function CalendarPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { state: core } = useAurumCoreState();
  const { industryId } = useIndustry();

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

  // ── Community events (CAP-98) — global across industries; each event still carries
  //    the industry it was shared from, shown as a badge in the list. ──
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([]);
  const [communityEventsLoading, setCommunityEventsLoading] = useState(true);
  const [rsvpedEventIds, setRsvpedEventIds] = useState<Set<string>>(new Set());
  const [eventProfiles, setEventProfiles] = useState<Record<string, PublicProfile>>({});
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventMutatingId, setEventMutatingId] = useState<string | null>(null);
  const [eventReportTarget, setEventReportTarget] = useState<string | null>(null);
  const [eventReportReason, setEventReportReason] = useState("");
  const [eventReportSubmitting, setEventReportSubmitting] = useState(false);
  const [eventReportToast, setEventReportToast] = useState<string | null>(null);

  const loadCommunityEvents = async () => {
    if (!user) return;
    setCommunityEventsLoading(true);
    const { data } = await supabase
      .from("community_events" as any)
      .select("*")
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(20);
    const rows = (data as unknown as CommunityEvent[]) ?? [];
    setCommunityEvents(rows);
    setCommunityEventsLoading(false);

    if (rows.length > 0) {
      const { data: rsvps } = await supabase
        .from("community_event_rsvps" as any)
        .select("event_id")
        .eq("user_id", user.id)
        .in("event_id", rows.map((r) => r.id));
      setRsvpedEventIds(new Set(((rsvps as any[]) ?? []).map((r) => r.event_id)));

      const missing = Array.from(new Set(rows.map((r) => r.user_id))).filter((id) => !(id in eventProfiles));
      if (missing.length > 0) {
        const { data: profiles } = await supabase
          .from("public_profiles" as any)
          .select("user_id, full_name, photo_url")
          .in("user_id", missing);
        if (profiles) {
          setEventProfiles((prev) => {
            const next = { ...prev };
            for (const row of profiles as any[]) next[row.user_id] = { full_name: row.full_name, photo_url: row.photo_url };
            return next;
          });
        }
      }
    } else {
      setRsvpedEventIds(new Set());
    }
  };

  useEffect(() => {
    void loadCommunityEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleRsvp = async (eventId: string) => {
    if (!user) return;
    const has = rsvpedEventIds.has(eventId);
    setRsvpedEventIds((prev) => {
      const next = new Set(prev);
      if (has) next.delete(eventId); else next.add(eventId);
      return next;
    });
    setCommunityEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, attendee_count: Math.max(0, e.attendee_count + (has ? -1 : 1)) } : e));
    if (has) {
      await supabase.from("community_event_rsvps" as any).delete().eq("event_id", eventId).eq("user_id", user.id);
    } else {
      await supabase.from("community_event_rsvps" as any).insert({ event_id: eventId, user_id: user.id });
    }
  };

  const deleteCommunityEvent = async (id: string) => {
    if (!user) return;
    setEventMutatingId(id);
    await supabase.from("community_events" as any).delete().eq("id", id).eq("user_id", user.id);
    setCommunityEvents((prev) => prev.filter((e) => e.id !== id));
    setEventMutatingId(null);
  };

  const submitEventReport = async () => {
    if (!user || !eventReportTarget) return;
    setEventReportSubmitting(true);
    const { error } = await supabase.from("community_reports" as any).insert({
      target_type: "event",
      target_id: eventReportTarget,
      reporter_user_id: user.id,
      reason: eventReportReason.trim() || null,
    });
    setEventReportSubmitting(false);
    setEventReportTarget(null);
    setEventReportReason("");
    setEventReportToast(error ? t.comReportFailed : t.comReportSuccess);
    setTimeout(() => setEventReportToast(null), 3000);
  };

  const eventOrganizerName = (userId: string): string => {
    if (userId === user?.id) return t.comYou;
    return eventProfiles[userId]?.full_name || t.comMember;
  };

  const completedByDay = useMemo(() => {
    const map: Record<string, { ritual: CompletedItem[]; roadmap: CompletedItem[] }> = {};
    monthTasks.forEach((r) => {
      if (r.status !== "completed" || !r.completed_at) return;
      if (r.source !== "daily_ritual" && r.source !== "roadmap") return;
      const key = r.completed_at.slice(0, 10);
      if (!map[key]) map[key] = { ritual: [], roadmap: [] };
      if (r.title) map[key][r.source === "daily_ritual" ? "ritual" : "roadmap"].push({ title: r.title, industry: r.industry ?? null });
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

  // CAP-98 follow-up: community events shown discreetly on the grid too — a hollow
  // ring marker (distinct shape from the filled ritual/roadmap dots) so members can
  // tell "shared event" apart from "I did this" at a glance.
  const eventsByDay = useMemo(() => {
    const map: Record<string, CommunityEvent[]> = {};
    communityEvents.forEach((ev) => {
      const key = isoDay(new Date(ev.start_at));
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [communityEvents]);

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
  const selectedEvents = (eventsByDay[selectedDate] ?? []).sort((a, b) => a.start_at.localeCompare(b.start_at));

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
              const dayEvents = eventsByDay[dateStr] ?? [];

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
                  <div className="flex items-center justify-between gap-1 pl-0.5 pr-0.5">
                    {/* Hollow ring — deliberately not a filled dot, so a "shared event exists"
                        marker never reads as "I completed something" at a glance. */}
                    <span className="flex items-center gap-0.5 shrink-0">
                      {dayEvents.length > 0 && (
                        <span
                          className="h-1.5 w-1.5 rounded-full border border-primary/70"
                          title={dayEvents.length === 1 ? dayEvents[0].title : `${dayEvents.length} community events`}
                        />
                      )}
                    </span>
                    <div className={`text-[11px] ${isToday ? "text-primary font-bold" : "text-muted-foreground/60"}`}>
                      {date.getDate()}
                    </div>
                  </div>
                  <div className="mt-1 flex flex-col gap-1 px-0.5">
                    {completed && (completed.ritual.length > 0 || completed.roadmap.length > 0) && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {/* CAP-95: one pip per distinct mode present that day (not per task) — slicing the
                            first 3 raw tasks could silently drop a whole mode (e.g. 2 yacht + 3 car + 2 jet
                            only showed yacht/car). Dedup by mode so every active mode always shows. */}
                        {Array.from(new Set(completed.ritual.map((it) => it.industry ?? "")))
                          .slice(0, 4)
                          .map((ind) => {
                            const meta = ind ? INDUSTRY_META[ind] : null;
                            return (
                              <span
                                key={"r" + ind}
                                className={`h-1.5 w-1.5 rounded-full ${meta ? meta.dot : ""}`}
                                style={meta ? undefined : { background: "var(--gradient-gold)" }}
                                title={meta ? `${meta.label} ritual` : "Ritual"}
                              />
                            );
                          })}
                        {completed.roadmap.length > 0 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" title="Roadmap" />
                        )}
                        {completed.ritual.length + completed.roadmap.length > 1 && (
                          <span className="text-[8px] font-mono text-muted-foreground/60 ml-0.5">
                            {completed.ritual.length + completed.roadmap.length}
                          </span>
                        )}
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
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
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
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full border border-primary/70" />
              <span className="text-[10px] text-muted-foreground">{t.calLegendEvent}</span>
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

            {(!selectedCompleted || (selectedCompleted.ritual.length === 0 && selectedCompleted.roadmap.length === 0)) && selectedDue.length === 0 && selectedEvents.length === 0 ? (
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
                      <Compass className="h-3 w-3 text-cyan-400" />
                      <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">{t.calRoadmapLabel}</span>
                      <span className="ml-auto font-mono text-[10px] text-cyan-400">{selectedCompleted.roadmap.length}</span>
                    </div>
                    <CompletedList items={selectedCompleted.roadmap} accentClass="text-cyan-400" />
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

                {/* Separate from "what I did" — these are other members' shared events, not personal tasks. */}
                {selectedEvents.length > 0 && (
                  <div>
                    {((selectedCompleted && (selectedCompleted.ritual.length > 0 || selectedCompleted.roadmap.length > 0)) || selectedDue.length > 0) && <div className="border-t border-border/40 pt-3" />}
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users className="h-3 w-3 text-primary/70" />
                      <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">{t.calCommunityTitle}</span>
                      <span className="ml-auto font-mono text-[10px] text-primary/70">{selectedEvents.length}</span>
                    </div>
                    <ul className="space-y-2">
                      {selectedEvents.map((ev) => {
                        const going = rsvpedEventIds.has(ev.id);
                        const start = new Date(ev.start_at);
                        const meta = INDUSTRY_META[ev.industry];
                        return (
                          <li key={ev.id} className="rounded-lg border border-border/60 p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium text-foreground truncate">{ev.title}</span>
                                  {meta && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${meta.dot}`} title={meta.label} />}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                  {start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {eventOrganizerName(ev.user_id)}
                                </div>
                              </div>
                              <button
                                onClick={() => toggleRsvp(ev.id)}
                                className={`shrink-0 text-[9px] tracking-[0.15em] uppercase px-2 py-1 rounded-lg border transition-all ${
                                  going ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary"
                                }`}
                              >
                                {going ? t.calRsvped : t.calRsvp}
                              </button>
                            </div>
                          </li>
                        );
                      })}
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

          {/* ── Community Events (CAP-98) ── */}
          <div className="glass rounded-2xl p-5">
            {eventReportToast && (
              <div className="mb-3 text-xs text-primary border border-primary/30 bg-primary/5 rounded-lg px-3 py-2">
                {eventReportToast}
              </div>
            )}
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] tracking-[0.34em] text-primary/80 uppercase">{t.calCommunityTitle}</div>
              <button
                onClick={() => setShowEventModal(true)}
                className="p-2 rounded-lg border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">{t.calCommunityDesc}</p>

            {communityEventsLoading && <div className="text-xs text-muted-foreground py-4 text-center">{t.calLoadingEvents}</div>}

            {!communityEventsLoading && communityEvents.length === 0 && (
              <div className="text-center py-6">
                <Users className="h-5 w-5 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs font-medium mb-0.5">{t.calNoEvents}</p>
                <p className="text-[11px] text-muted-foreground">{t.calNoEventsDesc}</p>
              </div>
            )}

            <ul className="space-y-2.5">
              {communityEvents.map((ev) => {
                const going = rsvpedEventIds.has(ev.id);
                const start = new Date(ev.start_at);
                return (
                  <li key={ev.id} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className="text-xs font-medium text-foreground truncate">{ev.title}</div>
                          {INDUSTRY_META[ev.industry] && (
                            <span className="flex items-center gap-1 shrink-0" title={INDUSTRY_META[ev.industry].label}>
                              <span className={`h-1.5 w-1.5 rounded-full ${INDUSTRY_META[ev.industry].dot}`} />
                              <span className={`text-[8px] tracking-[0.15em] uppercase ${INDUSTRY_META[ev.industry].text}`}>{INDUSTRY_META[ev.industry].label}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
                          {ev.location && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{ev.location}</span>}
                        </div>
                        {ev.description && <p className="text-[11px] text-muted-foreground/80 mt-1.5 line-clamp-2">{ev.description}</p>}
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                          <span>{eventOrganizerName(ev.user_id)}</span>
                          <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" />{t.calAttendees(ev.attendee_count)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <button
                          onClick={() => toggleRsvp(ev.id)}
                          className={`text-[10px] tracking-[0.15em] uppercase px-2.5 py-1.5 rounded-lg border transition-all ${
                            going ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary"
                          }`}
                        >
                          {going ? t.calRsvped : t.calRsvp}
                        </button>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEventReportTarget(ev.id)} title={t.comReport} className="text-muted-foreground hover:text-amber-400 transition-colors p-1">
                            <Flag className="h-3 w-3" />
                          </button>
                          {ev.user_id === user?.id && (
                            <button onClick={() => deleteCommunityEvent(ev.id)} disabled={eventMutatingId === ev.id} title={t.calDeleteEvent} className="text-muted-foreground hover:text-destructive transition-colors p-1 disabled:opacity-40">
                              {eventMutatingId === ev.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
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

      {showEventModal && (
        <AddEventModal
          defaultDate={selectedDate}
          industryId={industryId}
          onClose={() => setShowEventModal(false)}
          onSaved={async () => {
            setShowEventModal(false);
            await loadCommunityEvents();
          }}
          userId={user?.id}
          t={t}
        />
      )}

      {eventReportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEventReportTarget(null)} />
          <div className="relative glass rounded-2xl max-w-sm w-full p-6 border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="font-serif text-lg">{t.comReportTitle}</div>
              <button onClick={() => setEventReportTarget(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <textarea
              value={eventReportReason}
              onChange={(e) => setEventReportReason(e.target.value)}
              placeholder={t.comReportReasonPlaceholder}
              rows={3}
              className="w-full glass rounded-lg px-4 py-3 text-sm outline-none border border-border/60 focus:border-primary/40 transition-colors resize-none leading-relaxed mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setEventReportTarget(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">{t.calModalCancel}</button>
              <button
                onClick={submitEventReport}
                disabled={eventReportSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg disabled:opacity-50"
                style={{ background: "var(--gradient-gold)", color: "#080808" }}
              >
                {eventReportSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flag className="h-3.5 w-3.5" />}
                {t.comReportSubmit}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function CompletedList({
  items,
  accentClass,
}: {
  items: CompletedItem[];
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
      {items.map((item, i) => {
        const isOpen = expanded.has(i);
        // CAP-93: color-tag by the mode the ritual was generated in, so switching
        // modes doesn't make yesterday's yacht/jet/villa/car rituals indistinguishable.
        const meta = item.industry ? INDUSTRY_META[item.industry] : null;
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className="w-full flex items-start gap-2 text-xs text-foreground/80 text-left"
            >
              <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${accentClass}`} />
              <span className={isOpen ? "flex-1 whitespace-normal break-words" : "flex-1 truncate"}>{item.title}</span>
              {meta && (
                <span className="flex items-center gap-1 shrink-0 mt-1" title={`${meta.label} Mode`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  <span className={`text-[8px] tracking-[0.15em] uppercase ${meta.text}`}>{meta.label}</span>
                </span>
              )}
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

/** CAP-98: shares an event with everyone in the same industry via community_events (separate from personal aurum_tasks). */
function AddEventModal({
  defaultDate,
  industryId,
  onClose,
  onSaved,
  userId,
  t,
}: {
  defaultDate: string;
  industryId: string;
  onClose: () => void;
  onSaved: () => void;
  userId?: string;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState(`${defaultDate}T18:00`);
  const [endAt, setEndAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!userId || !title.trim() || !startAt) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from("community_events" as any).insert({
      user_id: userId,
      industry: industryId,
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      start_at: new Date(startAt).toISOString(),
      end_at: endAt ? new Date(endAt).toISOString() : null,
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
            <Users className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="font-serif text-xl">{t.calEventModalTitle}</div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-2 block">{t.calEventTitleLabel}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.calEventTitlePlaceholder}
              className="w-full bg-transparent outline-none text-sm border border-border rounded-lg p-3 focus:border-primary/50 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-2 block">{t.calEventDescLabel}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.calEventDescPlaceholder}
              rows={2}
              className="w-full bg-transparent outline-none text-sm border border-border rounded-lg p-3 focus:border-primary/50 resize-none transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-2 block">{t.calEventLocationLabel}</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t.calEventLocationPlaceholder}
              className="w-full bg-transparent outline-none text-sm border border-border rounded-lg p-3 focus:border-primary/50 transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-2 block">{t.calEventStartLabel}</label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full bg-transparent outline-none text-sm border border-border rounded-lg p-3 focus:border-primary/50 transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase mb-2 block">{t.calEventEndLabel}</label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="w-full bg-transparent outline-none text-sm border border-border rounded-lg p-3 focus:border-primary/50 transition-colors"
            />
          </div>

          {error && <div className="text-xs text-destructive border border-destructive/40 rounded-lg p-3">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => void save()}
              disabled={saving || !title.trim() || !startAt}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-primary-foreground font-medium text-sm disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: "var(--gradient-gold)" }}
            >
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> {t.calEventSaving}</> : <><Check className="h-4 w-4" /> {t.calEventSave}</>}
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
