import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import type React from "react";
import {
  User,
  Sparkles,
  Bell,
  Shield,
  CreditCard,
  AlertTriangle,
  ChevronRight,
  Check,
  LogOut,
  RotateCcw,
  Loader2,
  Flame,
  GraduationCap,
  Radio,
  CheckCheck,
} from "lucide-react";
import { AppShell } from "@/components/aurum/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAurumCoreState } from "@/hooks/useAurumCoreState";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { IndustryId } from "@/lib/industry/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { T } from "@/lib/i18n/translations";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

type SectionId = "account" | "aurum" | "content" | "notifications" | "privacy" | "billing" | "danger";

type Section = {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  soon: boolean;
};

function getSections(t: T): Section[] {
  return [
    { id: "account", label: t.setSectionAccount, icon: User, soon: false },
    { id: "aurum", label: t.setSectionAurum, icon: Sparkles, soon: false },
    { id: "content", label: t.setSectionContent, icon: ChevronRight, soon: false },
    { id: "notifications", label: t.setSectionNotifications, icon: Bell, soon: false },
    { id: "privacy", label: t.setSectionPrivacy, icon: Shield, soon: true },
    { id: "billing", label: t.setSectionBilling, icon: CreditCard, soon: true },
    { id: "danger", label: t.setSectionDanger, icon: AlertTriangle, soon: false },
  ];
}

const MODES = [
  { id: "yachts", label: "Yachts" },
  { id: "villas", label: "Villas" },
  { id: "jets", label: "Jets" },
  { id: "cars", label: "Cars" },
] as const;

function getLevels(t: T) {
  return [
    { id: "beginner", label: t.setLevelBeginner, desc: t.setLevelBeginnerDesc },
    { id: "intermediate", label: t.setLevelIntermediate, desc: t.setLevelIntermediateDesc },
    { id: "experienced", label: t.setLevelExperienced, desc: t.setLevelExperiencedDesc },
  ] as const;
}

function getTones(t: T) {
  return [
    { id: "Strategic · Calm · Direct", label: t.setToneStrategic, desc: t.setToneStrategicDesc },
    { id: "Warm · Encouraging · Supportive", label: t.setToneWarm, desc: t.setToneWarmDesc },
    { id: "Socratic · Challenging · Sharp", label: t.setToneSocratic, desc: t.setToneSocraticDesc },
  ] as const;
}

function getAiStyles(t: T) {
  return [
    { id: "Concise", label: t.setStyleConcise, desc: t.setStyleConciseDesc },
    { id: "Detailed", label: t.setStyleDetailed, desc: t.setStyleDetailedDesc },
  ] as const;
}

const TASK_COUNTS = [5, 7, 10] as const;

function getContentTones(t: T) {
  return [
    { id: "Professional", label: t.setToneProfessional },
    { id: "Conversational", label: t.setToneConversational },
    { id: "Bold", label: t.setToneBold },
  ] as const;
}

function getPlatformOptions(t: T) {
  return [
    { id: "All", label: t.setPlatformAll },
    { id: "LinkedIn", label: t.setPlatformLinkedinOnly },
    { id: "Instagram", label: t.setPlatformInstagramOnly },
    { id: "LinkedIn,Instagram", label: t.setPlatformLinkedinInstagram },
  ] as const;
}

function Settings() {
  const { t } = useLanguage();
  const SECTIONS = getSections(t);
  const LEVELS = getLevels(t);
  const TONES = getTones(t);
  const AI_STYLES = getAiStyles(t);
  const CONTENT_TONES = getContentTones(t);
  const PLATFORMS = getPlatformOptions(t);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, update: updateProfile } = useUserProfile();
  const { state: core, update: updateCore } = useAurumCoreState();
  const { industryId, setIndustry } = useIndustry();

  const [activeSection, setActiveSection] = useState<SectionId>("account");
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  // Notification preferences (stored in user_profiles via a JSON column or separate flags)
  const [notifPrefs, setNotifPrefs] = useState({
    streak: true,
    academy: true,
    intelligence: true,
    mentor: true,
    system: true,
  });
  const [recentNotifs, setRecentNotifs] = useState<Array<{ id: string; type: string; title: string; body: string | null; read: boolean; created_at: string }>>([]);
  const [notifSaving, setNotifSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from("notifications")
      .select("id, type, title, body, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }: { data: any[] | null }) => {
        if (data) setRecentNotifs(data);
      });
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    setNotifSaving(true);
    const ids = recentNotifs.filter((n) => !n.read).map((n) => n.id);
    if (ids.length) {
      await (supabase as any).from("notifications").update({ read: true }).in("id", ids);
      setRecentNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    }
    setNotifSaving(false);
  };

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return t.setTimeJustNow;
    if (m < 60) return t.setTimeMinAgo(m);
    const h = Math.floor(m / 60);
    if (h < 24) return t.setTimeHourAgo(h);
    return t.setTimeDayAgo(Math.floor(h / 24));
  }

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  const handleSignOutAll = async () => {
    await supabase.auth.signOut({ scope: "global" });
    navigate({ to: "/login", replace: true });
  };

  const handleSaveAccount = async () => {
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName });
      if (email !== user?.email) {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
        toast.success(t.setEmailChangeToast);
      } else {
        toast.success(t.setAccountUpdatedToast);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.setSaveFailedToast);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t.setPasswordResetSentToast);
  };

  return (
    <AppShell>
      <div className="mb-8">
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">{t.setPreferencesEyebrow}</div>
        <h1 className="font-serif text-4xl">{t.setTuneTitle}</h1>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        <nav className="space-y-1">
          {SECTIONS.map(({ id, label, icon: Icon, soon }) => (
            <button
              key={id}
              onClick={() => {
                if (!soon) setActiveSection(id);
              }}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                activeSection === id
                  ? "bg-secondary/60 text-foreground"
                  : soon
                    ? "text-muted-foreground/40 cursor-not-allowed"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </div>
              {soon && (
                <span className="text-[9px] tracking-[0.2em] px-1.5 py-0.5 rounded bg-secondary/60 text-muted-foreground/60">
                  {t.setSoon}
                </span>
              )}
              {activeSection === id && !soon && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
            </button>
          ))}
        </nav>

        <div className="glass rounded-2xl p-6 sm:p-8">
          {activeSection === "account" && (
            <div className="space-y-6">
              <SectionTitle title={t.setAccountTitle} desc={t.setAccountDesc} />
              <Field label={t.setFieldFullName}>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t.setFullNamePlaceholder} />
              </Field>
              <Field label={t.setFieldEmail}>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.setEmailPlaceholder}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t.setEmailChangeHint}
                </p>
              </Field>
              <Button onClick={handleSaveAccount} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t.setSaveChanges}
              </Button>
              <div className="pt-4 border-t border-border/60">
                <Field label={t.setFieldPassword}>
                  <p className="text-sm text-muted-foreground mb-3">{t.setPasswordResetDesc}</p>
                  <Button variant="outline" onClick={handlePasswordReset}>
                    {t.setSendPasswordReset}
                  </Button>
                </Field>
              </div>
            </div>
          )}

          {activeSection === "aurum" && (
            <div className="space-y-8">
              <SectionTitle title={t.setAurumTitle} desc={t.setAurumDesc} />
              <Field label={t.setActiveMode}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setIndustry(m.id as IndustryId);
                        updateCore({ active_mode: m.id });
                        toast.success(t.setModeSwitchedToast(m.label));
                      }}
                      className={`py-2 px-3 rounded-lg border text-sm transition-all ${industryId === m.id ? "border-primary/60 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={t.setExperienceLevel}>
                <div className="space-y-2 mt-1">
                  {LEVELS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        updateCore({ current_level: l.id });
                        toast.success(t.setLevelUpdatedToast);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${core?.current_level === l.id ? "border-primary/60 bg-primary/10" : "border-border hover:border-primary/40"}`}
                    >
                      <div className="text-left">
                        <div className="text-sm font-medium">{l.label}</div>
                        <div className="text-xs text-muted-foreground">{l.desc}</div>
                      </div>
                      {core?.current_level === l.id && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={t.setMyGoal}>
                <Input
                  defaultValue={typeof core?.current_focus === "string" ? core.current_focus : ""}
                  placeholder={t.setGoalPlaceholder}
                  onBlur={(e) => {
                    if (e.target.value) {
                      updateCore({ current_focus: e.target.value });
                      toast.success(t.setGoalSavedToast);
                    }
                  }}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t.setGoalHint}
                </p>
              </Field>
              <Field label={t.setDailyRitualIntensity}>
                <div className="flex gap-2 mt-1">
                  {TASK_COUNTS.map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        updateProfile({ daily_task_count: n });
                        toast.success(t.setDailyTasksToast(n));
                      }}
                      className={`flex-1 py-2 rounded-lg border text-sm transition-all ${(profile?.daily_task_count ?? 5) === n ? "border-primary/60 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}
                    >
                      {t.setTasksLabel(n)}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={t.setMentorTone}>
                <div className="space-y-2 mt-1">
                  {TONES.map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => {
                        updateProfile({ mentor_tone: tone.id });
                        toast.success(t.setMentorToneToast);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${(profile?.mentor_tone ?? "Strategic · Calm · Direct") === tone.id ? "border-primary/60 bg-primary/10" : "border-border hover:border-primary/40"}`}
                    >
                      <div className="text-left">
                        <div className="text-sm font-medium">{tone.label}</div>
                        <div className="text-xs text-muted-foreground">{tone.desc}</div>
                      </div>
                      {(profile?.mentor_tone ?? "Strategic · Calm · Direct") === tone.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={t.setAiResponseStyle}>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {AI_STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        updateProfile({ ai_response_style: s.id });
                        toast.success(t.setAiStyleToast);
                      }}
                      className={`py-3 px-4 rounded-lg border text-left transition-all ${(profile?.ai_response_style ?? "Concise") === s.id ? "border-primary/60 bg-primary/10" : "border-border hover:border-primary/40"}`}
                    >
                      <div className="text-sm font-medium">{s.label}</div>
                      <div className="text-xs text-muted-foreground">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </Field>
              <div className="pt-4 border-t border-border/60">
                <Field label={t.setResetOnboarding}>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t.setResetOnboardingDesc}
                  </p>
                  <Button variant="outline" onClick={() => navigate({ to: "/onboarding" })}>
                    <RotateCcw className="h-4 w-4 mr-2" /> {t.setRedoOnboarding}
                  </Button>
                </Field>
              </div>
            </div>
          )}

          {activeSection === "content" && (
            <div className="space-y-8">
              <SectionTitle title={t.setContentTitle} desc={t.setContentDesc} />
              <Field label={t.setPreferredPlatforms}>
                <div className="space-y-2 mt-1">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        updateProfile({ preferred_platforms: p.id });
                        toast.success(t.setPlatformsUpdatedToast);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${(profile?.preferred_platforms ?? "All") === p.id ? "border-primary/60 bg-primary/10" : "border-border hover:border-primary/40"}`}
                    >
                      <span className="text-sm">{p.label}</span>
                      {(profile?.preferred_platforms ?? "All") === p.id && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={t.setContentTone}>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {CONTENT_TONES.map((ct) => (
                    <button
                      key={ct.id}
                      onClick={() => {
                        updateProfile({ content_tone: ct.id });
                        toast.success(t.setContentToneUpdatedToast);
                      }}
                      className={`py-2 px-3 rounded-lg border text-sm transition-all ${(profile?.content_tone ?? "Professional") === ct.id ? "border-primary/60 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}
                    >
                      {ct.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={t.setAutoGenerateDailyBrief}>
                <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-border mt-1">
                  <div>
                    <div className="text-sm">{t.setDailyBrief}</div>
                    <div className="text-xs text-muted-foreground">{t.setDailyBriefDesc}</div>
                  </div>
                  <button
                    onClick={() => {
                      const next = !(profile?.auto_daily_brief ?? true);
                      updateProfile({ auto_daily_brief: next });
                      toast.success(next ? t.setDailyBriefEnabledToast : t.setDailyBriefDisabledToast);
                    }}
                    className={`relative h-6 w-11 rounded-full transition-colors ${(profile?.auto_daily_brief ?? true) ? "bg-primary" : "bg-border"}`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${(profile?.auto_daily_brief ?? true) ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
              </Field>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="space-y-8">
              <SectionTitle
                title={t.setNotificationsTitle}
                desc={t.setNotificationsDesc}
              />

              {/* Preference toggles */}
              <div className="space-y-3">
                {[
                  { key: "streak", icon: Flame, label: t.setNotifStreakLabel, desc: t.setNotifStreakDesc, color: "text-orange-400" },
                  { key: "academy", icon: GraduationCap, label: t.setNotifAcademyLabel, desc: t.setNotifAcademyDesc, color: "text-primary" },
                  { key: "intelligence", icon: Radio, label: t.setNotifIntelligenceLabel, desc: t.setNotifIntelligenceDesc, color: "text-blue-400" },
                  { key: "mentor", icon: Sparkles, label: t.setNotifMentorLabel, desc: t.setNotifMentorDesc, color: "text-primary" },
                  { key: "system", icon: Bell, label: t.setNotifSystemLabel, desc: t.setNotifSystemDesc, color: "text-muted-foreground" },
                ].map(({ key, icon: Icon, label, desc, color }) => (
                  <div key={key} className="flex items-center justify-between gap-4 rounded-xl border border-border/50 px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className={`h-8 w-8 rounded-lg flex items-center justify-center bg-secondary/50 ${color}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-sm font-medium">{label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifPrefs((p) => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                      className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${notifPrefs[key as keyof typeof notifPrefs] ? "bg-primary" : "bg-border"}`}
                    >
                      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${notifPrefs[key as keyof typeof notifPrefs] ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Recent notifications */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] tracking-[0.3em] text-muted-foreground">{t.setRecent}</span>
                  {recentNotifs.some((n) => !n.read) && (
                    <button
                      onClick={markAllRead}
                      disabled={notifSaving}
                      className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary/80 transition-colors"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      {t.setMarkAllRead}
                    </button>
                  )}
                </div>

                {recentNotifs.length === 0 ? (
                  <div className="rounded-xl border border-border/40 px-4 py-8 text-center text-muted-foreground text-sm">
                    {t.setNoNotifications}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/50 overflow-hidden divide-y divide-border/40">
                    {recentNotifs.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 ${!n.read ? "bg-secondary/10" : ""}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm ${!n.read ? "font-medium text-foreground" : "text-foreground/80"}`}>
                            {n.title}
                          </div>
                          {n.body && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</div>}
                          <div className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.created_at)}</div>
                        </div>
                        {!n.read && <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeSection === "privacy" && (
            <ComingSoon title={t.setPrivacyTitle} desc={t.setPrivacyDesc} />
          )}
          {activeSection === "billing" && (
            <ComingSoon title={t.setBillingTitle} desc={t.setBillingDesc} />
          )}

          {activeSection === "danger" && (
            <div className="space-y-4">
              <SectionTitle title={t.setDangerTitle} desc={t.setDangerDesc} />
              <div className="rounded-xl border border-border/60 p-5 flex items-center justify-between">
                <div>
                  <div className="text-sm">{t.setSignOut}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.setSignOutDesc}</div>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" /> {t.setSignOut}
                </Button>
              </div>
              <div className="rounded-xl border border-border/60 p-5 flex items-center justify-between">
                <div>
                  <div className="text-sm">{t.setSignOutAll}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.setSignOutAllDesc}</div>
                </div>
                <Button variant="outline" onClick={handleSignOutAll}>
                  <LogOut className="h-4 w-4 mr-2" /> {t.setSignOutAll}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function SectionTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-serif text-2xl">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] tracking-[0.3em] text-muted-foreground">{label.toUpperCase()}</div>
      {children}
    </div>
  );
}

function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-12 w-12 rounded-full bg-secondary/60 flex items-center justify-center mb-4">
        <Sparkles className="h-5 w-5 text-primary/60" />
      </div>
      <h2 className="font-serif text-2xl mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-sm">{desc}</p>
    </div>
  );
}
