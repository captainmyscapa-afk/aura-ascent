import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Linkedin,
  Instagram,
  MapPin,
  Flame,
  RefreshCw,
  Pencil,
  Twitter,
  Youtube,
  Music2,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle2,
  Plug,
} from "lucide-react";
import { AppShell } from "@/components/aurum/AppShell";
import { SectionHeading } from "@/components/aurum/SectionHeading";
import { useAuth } from "@/hooks/useAuth";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { supabase } from "@/integrations/supabase/client";
import { useAurumCoreState } from "@/hooks/useAurumCoreState";
import { useServerFn } from "@tanstack/react-start";
import {
  generateIdentityAudit,
  generateTodayBrief,
  type IdentityAudit,
  type TodayBrief,
} from "@/lib/identity.functions";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

type UserProfile = {
  id?: string;
  user_id: string;
  full_name: string | null;
  current_profession: string | null;
  location: string | null;
  mission: string | null;
  goal: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  substack_url: string | null;
};

// Core state is read from useAurumCoreState (single source of truth).

type SocialAccount = {
  id: string;
  user_id: string;
  platform: string;
  username: string | null;
  connected_at: string;
};

const PLATFORMS = [
  { key: "linkedin", name: "LinkedIn", icon: Linkedin },
  { key: "instagram", name: "Instagram", icon: Instagram },
  { key: "twitter", name: "X / Twitter", icon: Twitter },
  { key: "tiktok", name: "TikTok", icon: Music2 },
  { key: "youtube", name: "YouTube", icon: Youtube },
  { key: "substack", name: "Substack", icon: FileText },
] as const;

const EMPTY_PROFILE = (uid: string): UserProfile => ({
  user_id: uid,
  full_name: null,
  current_profession: null,
  location: null,
  mission: null,
  goal: null,
  photo_url: null,
  linkedin_url: null,
  instagram_url: null,
  tiktok_url: null,
  twitter_url: null,
  youtube_url: null,
  substack_url: null,
});

function titleFor(mode: string, level: string) {
  const m = mode?.[0]?.toUpperCase() + mode?.slice(1);
  const l = level?.[0]?.toUpperCase() + level?.slice(1);
  return `${m || "Aurum"} ${l || "Initiate"}`;
}

function initials(name: string | null) {
  if (!name) return "AU";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function computeCompleteness(p: UserProfile) {
  const fields = [
    p.full_name,
    p.current_profession,
    p.location,
    p.mission,
    p.goal,
    p.photo_url,
    p.linkedin_url,
    p.instagram_url,
  ];
  const filled = fields.filter((v) => !!v && String(v).trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
}

function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { industry } = useIndustry();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { state: core, update: updateCore } = useAurumCoreState();
  const [socials, setSocials] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [briefLoading, setBriefLoading] = useState(false);
  const [connectPlatform, setConnectPlatform] = useState<string | null>(null);

  const runAudit = useServerFn(generateIdentityAudit);
  const runBrief = useServerFn(generateTodayBrief);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      setLoading(true);
      const [p, s] = await Promise.all([
        supabase
          .from("user_profiles")
          .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: false })
          .select("*")
          .maybeSingle(),
        supabase.from("social_accounts").select("*").eq("user_id", user.id),
      ]);
      if (!alive) return;
      if (p.error) console.error("user_profiles upsert error", p.error);
      setProfile((p.data as UserProfile) ?? EMPTY_PROFILE(user.id));
      setSocials((s.data as SocialAccount[]) ?? []);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const completeness = useMemo(
    () => (profile ? computeCompleteness(profile) : 0),
    [profile],
  );

  const scoreBreakdown = useMemo(() => {
    const identityScore = completeness;
    const networkScore = Math.min(100, socials.length * 16);
    const executionScore = core?.execution_score ?? 0;
    const knowledgeScore = Math.min(100, (core?.streak ?? 0) * 5 + 20);
    const visibilityScore = Math.min(
      100,
      socials.filter((s) => s.username).length * 18,
    );
    return [
      { key: "knowledge", emoji: "🎓", label: "Knowledge", score: knowledgeScore, hint: "Complete Academy modules", to: "/academy" as const },
      { key: "network", emoji: "🤝", label: "Network", score: networkScore, hint: "Make connections and introductions", to: "/network" as const },
      { key: "visibility", emoji: "📢", label: "Visibility", score: visibilityScore, hint: "Publish content and insights", to: "/studio" as const },
      { key: "execution", emoji: "⚡", label: "Execution", score: executionScore, hint: "Complete daily tasks", to: "/dashboard" as const },
      { key: "identity", emoji: "👤", label: "Identity", score: identityScore, hint: "Complete your profile", to: "/profile" as const },
    ];
  }, [completeness, core, socials]);

  const aurumScore = useMemo(
    () =>
      Math.round(
        scoreBreakdown.reduce((acc, b) => acc + b.score, 0) / scoreBreakdown.length,
      ),
    [scoreBreakdown],
  );

  // Auto-run today's brief if missing or stale
  useEffect(() => {
    if (!user || !core) return;
    const today = new Date().toISOString().slice(0, 10);
    if (core.daily_brief && core.daily_brief_date === today) return;
    void refreshBrief();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, core?.user_id]);

  async function refreshAudit() {
    if (!user || !profile) return;
    setAuditLoading(true);
    try {
      const focus = typeof core?.current_focus === "string" ? core.current_focus : undefined;
      const { audit } = await runAudit({
        data: {
          name: profile.full_name ?? undefined,
          mode: industry.label,
          profession: profile.current_profession ?? undefined,
          goal: profile.goal ?? focus,
          location: profile.location ?? undefined,
          level: core?.current_level ?? undefined,
          streak: core?.streak,
          aurumScore,
        },
      });
      await updateCore({
        ai_summary: audit,
        ai_summary_updated_at: new Date().toISOString(),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Audit failed");
    } finally {
      setAuditLoading(false);
    }
  }

  async function refreshBrief() {
    if (!user || !profile) return;
    setBriefLoading(true);
    try {
      const focus = typeof core?.current_focus === "string" ? core.current_focus : undefined;
      const { brief } = await runBrief({
        data: {
          name: profile.full_name ?? undefined,
          mode: industry.label,
          profession: profile.current_profession ?? undefined,
          goal: profile.goal ?? focus,
          location: profile.location ?? undefined,
          level: core?.current_level ?? undefined,
        },
      });
      const today = new Date().toISOString().slice(0, 10);
      await updateCore({
        daily_brief: brief,
        daily_brief_date: today,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Brief failed");
    } finally {
      setBriefLoading(false);
    }
  }

  async function saveProfile(updates: Partial<UserProfile>) {
    if (!user) return;
    const merged = { ...(profile ?? EMPTY_PROFILE(user.id)), ...updates, user_id: user.id };
    const { error } = await supabase
      .from("user_profiles")
      .upsert(merged as never, { onConflict: "user_id" });
    if (error) {
      toast.error(error.message);
      return;
    }
    setProfile(merged);
    // Mirror goal into core current_focus (single source of truth for AI context)
    if (updates.goal !== undefined && updates.goal !== null && updates.goal !== "") {
      void updateCore({ current_focus: updates.goal });
    }
    toast.success("Identity updated");
    setEditOpen(false);
  }


  async function connectSocial(platform: string, username: string) {
    if (!user) return;
    const { error } = await supabase
      .from("social_accounts")
      .upsert(
        {
          user_id: user.id,
          platform,
          username,
          connected_at: new Date().toISOString(),
        } as never,
        { onConflict: "user_id,platform" },
      );
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("user_id", user.id);
    setSocials((data as SocialAccount[]) ?? []);
    toast.success(`${platform} connected`);
    setConnectPlatform(null);
  }

  async function disconnectSocial(platform: string) {
    if (!user) return;
    await supabase
      .from("social_accounts")
      .delete()
      .eq("user_id", user.id)
      .eq("platform", platform);
    setSocials((s) => s.filter((x) => x.platform !== platform));
    toast.success(`${platform} disconnected`);
  }

  if (authLoading || loading || !profile) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading dossier…
        </div>
      </AppShell>
    );
  }

  const hasName = !!profile.full_name;
  const displayName = profile.full_name || "Unnamed Operator";
  const computedTitle = `${titleFor(industry.id, core?.current_level ?? "initiate")} · ${profile.location || industry.label}`;
  const audit = (core?.ai_summary ?? null) as IdentityAudit | null;
  const brief = (core?.daily_brief ?? null) as TodayBrief | null;
  const phaseProgress = Math.min(
    100,
    Math.round(((core?.execution_score ?? 0) / 100) * 100),
  );

  return (
    <AppShell>
      {/* SECTION 1 — DOSSIER */}
      <div
        className="glass rounded-2xl overflow-hidden mb-10 animate-fade-up relative"
        style={{ animationDelay: "0ms" }}
      >
        <div className="h-32 bg-[var(--gradient-gold)] opacity-70" />
        <div className="px-6 sm:px-10 pb-10 -mt-16 grid lg:grid-cols-[1fr_360px] gap-8">
          {/* LEFT */}
          <div>
            <div className="relative inline-block">
              {/* progress ring */}
              <svg className="absolute inset-0 -m-1.5 h-[108px] w-[108px]" viewBox="0 0 108 108">
                <circle cx="54" cy="54" r="50" stroke="hsl(var(--border))" strokeWidth="3" fill="none" />
                <circle
                  cx="54"
                  cy="54"
                  r="50"
                  stroke="url(#goldRing)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(completeness / 100) * 314} 314`}
                  transform="rotate(-90 54 54)"
                  style={{ transition: "stroke-dasharray 800ms ease" }}
                />
                <defs>
                  <linearGradient id="goldRing" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--primary)/0.4)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="h-24 w-24 rounded-full bg-background border-4 border-background flex items-center justify-center font-serif text-3xl text-gold-gradient bg-[var(--gradient-card)] overflow-hidden">
                {profile.photo_url ? (
                  // eslint-disable-next-line jsx-a11y/img-redundant-alt
                  <img src={profile.photo_url} alt="Profile photo" className="h-full w-full object-cover" />
                ) : (
                  initials(profile.full_name)
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 flex-wrap">
              <h1 className="font-serif text-3xl sm:text-4xl">{displayName}</h1>
              <span className="text-[10px] tracking-[0.3em] px-3 py-1 rounded-full ring-1 ring-primary/40 text-primary uppercase">
                {industry.shortLabel} Mode
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-1.5">{computedTitle}</p>

            <div className="flex items-center gap-4 mt-4 text-muted-foreground text-sm">
              {profile.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {profile.location}
                </span>
              )}
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="hover:text-foreground">
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {profile.instagram_url && (
                <a href={profile.instagram_url} target="_blank" rel="noreferrer" className="hover:text-foreground">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
            </div>

            <div className="mt-6 rounded-xl border border-border/60 bg-background/40 p-4 max-w-2xl">
              <div className="text-[9px] tracking-[0.34em] text-muted-foreground mb-1.5">MY MISSION</div>
              {profile.mission ? (
                <p className="font-serif text-lg leading-snug">{profile.mission}</p>
              ) : (
                <button
                  onClick={() => setEditOpen(true)}
                  className="text-sm text-muted-foreground italic hover:text-foreground transition-colors"
                >
                  Add your mission — e.g. "Break into Monaco yacht brokerage by Q4"
                </button>
              )}
            </div>

            <button
              onClick={() => setEditOpen(true)}
              className="mt-6 inline-flex items-center gap-2 text-xs glass rounded-full px-4 py-2 tracking-[0.2em] hover:ring-gold transition-all"
            >
              <Pencil className="h-3 w-3" /> EDIT IDENTITY
            </button>

            {!hasName && (
              <p className="text-xs text-primary/80 mt-3">Start by adding your name and mission to unlock your dossier.</p>
            )}
          </div>

          {/* RIGHT — STATS */}
          <div className="flex flex-col gap-3">
            <div className="glass rounded-xl p-5">
              <div className="text-[9px] tracking-[0.34em] text-muted-foreground">AURUM SCORE</div>
              <div className="font-serif text-5xl mt-2 text-gold-gradient">{aurumScore}</div>
              <div className="text-xs text-muted-foreground mt-1">Your readiness index</div>
            </div>
            <div className="glass rounded-xl p-5">
              <div className="text-[9px] tracking-[0.34em] text-muted-foreground">MOMENTUM</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif text-4xl text-gold-gradient">{core?.streak ?? 0}</span>
                <span className="text-xs text-muted-foreground">day streak</span>
                <Flame className="h-4 w-4 text-primary ml-auto" />
              </div>
            </div>
            <div className="glass rounded-xl p-5">
              <div className="text-[9px] tracking-[0.34em] text-muted-foreground">PHASE</div>
              <div className="font-serif text-lg mt-1.5 capitalize">{typeof core?.current_focus === "string" ? core.current_focus : "Onboarding"}</div>
              <div className="mt-3 h-1.5 rounded-full bg-border/60 overflow-hidden">
                <div
                  className="h-full bg-[var(--gradient-gold)]"
                  style={{ width: `${phaseProgress}%`, transition: "width 800ms ease" }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground mt-2">{phaseProgress}% to next phase</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 — SCORE BREAKDOWN */}
      <div className="glass rounded-2xl p-6 sm:p-8 mb-10 animate-fade-up" style={{ animationDelay: "80ms" }}>
        <SectionHeading eyebrow="AURUM SCORE BREAKDOWN" title="What's building your score." />
        <div className="space-y-4 mt-4">
          {scoreBreakdown.map((b, i) => (
            <Link
              key={b.key}
              to={b.to}
              className="block group"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{b.emoji}</span>
                  <span className="font-serif text-base group-hover:text-primary transition-colors">{b.label}</span>
                  <span className="text-xs text-muted-foreground">— {b.hint}</span>
                </div>
                <span className="font-serif text-sm text-gold-gradient">{b.score}</span>
              </div>
              <div className="h-2 rounded-full bg-border/60 overflow-hidden">
                <div
                  className="h-full bg-[var(--gradient-gold)] group-hover:opacity-90"
                  style={{ width: `${b.score}%`, transition: "width 900ms cubic-bezier(.2,.7,.2,1)" }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* SECTION 3 — AI AUDIT */}
      <div className="glass rounded-2xl p-6 sm:p-8 mb-10 animate-fade-up relative" style={{ animationDelay: "160ms" }}>
        <div className="flex items-start justify-between gap-4">
          <SectionHeading eyebrow="AI POSITIONING AUDIT" title="AURUM's read on you." />
          <Sparkles className="h-5 w-5 text-primary/70" />
        </div>

        {audit ? (
          <div className="space-y-5 mt-4">
            {(audit?.actions ?? []).map((a) => (
              <div key={a.headline} className="border-t border-border/60 first:border-0 pt-5 first:pt-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[9px] tracking-[0.3em] text-primary/80 mb-1">{a.label}</div>
                    <div className="font-serif text-lg">{a.headline}</div>
                    <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{a.explanation}</p>
                  </div>
                  <button className="text-xs text-foreground inline-flex items-center gap-1 hover:text-primary transition-colors shrink-0">
                    Act on this <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 text-sm text-muted-foreground">
            {auditLoading ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Generating your positioning audit…</span>
            ) : (
              <button onClick={refreshAudit} className="text-primary hover:underline">
                Generate my positioning audit →
              </button>
            )}
          </div>
        )}

        <button
          onClick={refreshAudit}
          disabled={auditLoading}
          className="absolute bottom-5 right-5 text-xs inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${auditLoading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* SECTION 4 — SOCIAL ACCOUNTS */}
      <div className="glass rounded-2xl p-6 sm:p-8 mb-10 animate-fade-up" style={{ animationDelay: "240ms" }}>
        <SectionHeading eyebrow="CONNECTED ACCOUNTS" title="Your publishing network." />
        <p className="text-sm text-muted-foreground -mt-2 mb-1">
          Connect your accounts so AURUM can publish directly on your behalf.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mt-5">
          {PLATFORMS.map((p) => {
            const connected = socials.find((s) => s.platform === p.key);
            const Icon = p.icon;
            return (
              <div key={p.key} className="rounded-xl border border-border/60 bg-background/40 p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-[var(--gradient-card)] flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-base">{p.name}</span>
                    {connected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        CONNECTED
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">NOT CONNECTED</span>
                    )}
                  </div>
                  {connected?.username && (
                    <div className="text-xs text-muted-foreground truncate">@{connected.username}</div>
                  )}
                </div>
                {connected ? (
                  <button
                    onClick={() => disconnectSocial(p.key)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => setConnectPlatform(p.key)}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Plug className="h-3 w-3" /> Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 5 — TODAY'S BRIEF */}
      <div className="glass rounded-2xl p-6 sm:p-8 mb-6 animate-fade-up relative overflow-hidden" style={{ animationDelay: "320ms" }}>
        <div className="absolute inset-0 bg-[var(--gradient-gold)] opacity-[0.04] pointer-events-none" />
        <div className="relative">
          <SectionHeading eyebrow="TODAY'S BRIEF" title="Your signal for today." />
          {brief ? (
            <div className="mt-4 grid sm:grid-cols-3 gap-5">
              <div>
                <div className="text-[9px] tracking-[0.3em] text-primary/80 mb-1.5">🎯 PRIORITY</div>
                <p className="text-sm leading-relaxed">{brief.priority}</p>
              </div>
              <div>
                <div className="text-[9px] tracking-[0.3em] text-primary/80 mb-1.5">💡 INSIGHT</div>
                <p className="text-sm leading-relaxed">{brief.insight}</p>
              </div>
              <div>
                <div className="text-[9px] tracking-[0.3em] text-primary/80 mb-1.5">🤝 NETWORK MOVE</div>
                <p className="text-sm leading-relaxed">{brief.network_move}</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-muted-foreground">
              {briefLoading ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Drafting today's brief…</span>
              ) : (
                <button onClick={refreshBrief} className="text-primary hover:underline">Generate today's brief →</button>
              )}
            </div>
          )}
          <button
            onClick={refreshBrief}
            disabled={briefLoading}
            className="absolute top-0 right-0 text-xs inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${briefLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <EditIdentitySheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        profile={profile}
        onSave={saveProfile}
      />
      <ConnectDialog
        platform={connectPlatform}
        onClose={() => setConnectPlatform(null)}
        onConfirm={connectSocial}
      />
    </AppShell>
  );
}

function EditIdentitySheet({
  open,
  onClose,
  profile,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (p: Partial<UserProfile>) => Promise<void>;
}) {
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(profile), [profile, open]);

  const set = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">Edit identity</SheetTitle>
          <SheetDescription>Your dossier shapes every recommendation AURUM makes.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <Field label="Full name">
            <Input value={form.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} placeholder="Alexander Kovac" />
          </Field>
          <Field label="Current profession">
            <Input value={form.current_profession ?? ""} onChange={(e) => set("current_profession", e.target.value)} placeholder="Yacht brokerage analyst" />
          </Field>
          <Field label="Location">
            <Input value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="Monaco" />
          </Field>
          <Field label="My mission">
            <Textarea value={form.mission ?? ""} onChange={(e) => set("mission", e.target.value)} placeholder="Break into Monaco yacht brokerage by Q4" rows={3} />
          </Field>
          <Field label="Goal">
            <Input value={form.goal ?? ""} onChange={(e) => set("goal", e.target.value)} placeholder="Sign first brokerage mandate" />
          </Field>
          <Field label="Photo URL">
            <Input value={form.photo_url ?? ""} onChange={(e) => set("photo_url", e.target.value)} placeholder="https://…" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="LinkedIn URL">
              <Input value={form.linkedin_url ?? ""} onChange={(e) => set("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/…" />
            </Field>
            <Field label="Instagram URL">
              <Input value={form.instagram_url ?? ""} onChange={(e) => set("instagram_url", e.target.value)} placeholder="https://instagram.com/…" />
            </Field>
          </div>
        </div>

        <div className="mt-8 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={async () => {
              setSaving(true);
              await onSave(form);
              setSaving(false);
            }}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] tracking-[0.3em] text-muted-foreground">{label.toUpperCase()}</Label>
      {children}
    </div>
  );
}

function ConnectDialog({
  platform,
  onClose,
  onConfirm,
}: {
  platform: string | null;
  onClose: () => void;
  onConfirm: (platform: string, username: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  useEffect(() => setValue(""), [platform]);
  if (!platform) return null;
  const meta = PLATFORMS.find((p) => p.key === platform);
  return (
    <Dialog open={!!platform} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Connect {meta?.name}</DialogTitle>
          <DialogDescription>
            Enter your {meta?.name} handle{platform === "substack" ? " or URL" : ""} — OAuth-based publishing rolls out shortly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-[10px] tracking-[0.3em] text-muted-foreground">
            {platform === "substack" ? "URL" : "USERNAME"}
          </Label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={platform === "substack" ? "https://you.substack.com" : "yourhandle"}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => value.trim() && onConfirm(platform, value.trim())} disabled={!value.trim()}>
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
