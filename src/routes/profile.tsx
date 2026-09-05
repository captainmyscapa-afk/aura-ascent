import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Linkedin,
  Instagram,
  MapPin,
  Flame,
  Pencil,
  Twitter,
  Youtube,
  Music2,
  FileText,
  Loader2,
  CheckCircle2,
  Plug,
} from "lucide-react";
import { AppShell } from "@/components/aurum/AppShell";
import { SectionHeading } from "@/components/aurum/SectionHeading";
import { useAuth } from "@/hooks/useAuth";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { supabase } from "@/integrations/supabase/client";
import { useAurumCoreState } from "@/hooks/useAurumCoreState";
import { useUserProfile, type UserProfile } from "@/hooks/useUserProfile";
import { useAcademyProgress } from "@/hooks/useAcademyProgress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { T } from "@/lib/i18n/translations";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

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
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { industry, industryId } = useIndustry();
  const { profile, loading, update: updateProfile } = useUserProfile();
  const { state: core, update: updateCore } = useAurumCoreState();
  const [socials, setSocials] = useState<SocialAccount[]>([]);
  const [socialsLoading, setSocialsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [connectPlatform, setConnectPlatform] = useState<string | null>(null);
  const academyProgress = useAcademyProgress(industryId);
  // Network/Visibility used to both read off `socials` (double-counting the
  // same "connected a social account" fact under two different labels) and Knowledge
  // used the daily-ritual streak instead of anything to do with Academy. Pull the
  // actual activity each label claims to measure instead.
  const [communityActivityCount, setCommunityActivityCount] = useState(0);
  const [contentPublishedCount, setContentPublishedCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    supabase
      .from("social_accounts")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!alive) return;
        setSocials((data as SocialAccount[]) ?? []);
        setSocialsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const [{ count: postCount }, { count: replyCount }, { count: contentCount }] = await Promise.all([
        supabase.from("community_posts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("community_replies").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("user_content_history").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      if (!alive) return;
      setCommunityActivityCount((postCount ?? 0) + (replyCount ?? 0));
      setContentPublishedCount(contentCount ?? 0);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const completeness = useMemo(() => (profile ? computeCompleteness(profile) : 0), [profile]);

  const scoreBreakdown = useMemo(() => {
    const identityScore = completeness;
    // Community participation (posts + replies on the Network board) — not "how many
    // social accounts you linked", which measured the same thing Visibility does.
    const networkScore = Math.min(100, communityActivityCount * 10);
    // execution_score is a same-day count of completed tasks (self-healing daily
    // reset, see CAP-40) — it was being shown unscaled as if it were already a 0-100
    // score, so a genuinely productive day (say 8 tasks) displayed as "8" instead of
    // something reading as strong progress. Scale it the same way as the other bars.
    const executionScore = Math.min(100, (core?.execution_score ?? 0) * 10);
    // Real Academy completion for the active track, not the unrelated daily-ritual streak.
    const knowledgeScore = academyProgress.total > 0
      ? Math.round((academyProgress.completed / academyProgress.total) * 100)
      : 0;
    // Content actually published from Studio — not a second copy of the socials count.
    const visibilityScore = Math.min(100, contentPublishedCount * 12);
    return [
      {
        key: "knowledge",
        emoji: "🎓",
        label: t.profKnowledge,
        score: knowledgeScore,
        hint: t.profKnowledgeHint,
        to: "/academy" as const,
      },
      {
        key: "network",
        emoji: "🤝",
        label: t.profNetwork,
        score: networkScore,
        hint: t.profNetworkHint,
        to: "/network" as const,
      },
      {
        key: "visibility",
        emoji: "📢",
        label: t.profVisibility,
        score: visibilityScore,
        hint: t.profVisibilityHint,
        to: "/studio" as const,
      },
      {
        key: "execution",
        emoji: "⚡",
        label: t.profExecution,
        score: executionScore,
        hint: t.profExecutionHint,
        to: "/dashboard" as const,
      },
      {
        key: "identity",
        emoji: "👤",
        label: t.profIdentity,
        score: identityScore,
        hint: t.profIdentityHint,
        to: "/profile" as const,
      },
    ];
  }, [completeness, core, academyProgress, communityActivityCount, contentPublishedCount, t]);

  const aurumScore = useMemo(
    () => Math.round(scoreBreakdown.reduce((acc, b) => acc + b.score, 0) / scoreBreakdown.length),
    [scoreBreakdown],
  );

  async function saveProfile(updates: Partial<UserProfile>) {
    if (!user) return;
    await updateProfile(updates);
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
      .upsert({ user_id: user.id, platform, username, connected_at: new Date().toISOString() } as never, {
        onConflict: "user_id,platform",
      });
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = await supabase.from("social_accounts").select("*").eq("user_id", user.id);
    setSocials((data as SocialAccount[]) ?? []);
    toast.success(`${platform} connected`);
    setConnectPlatform(null);
  }

  async function disconnectSocial(platform: string) {
    if (!user) return;
    await supabase.from("social_accounts").delete().eq("user_id", user.id).eq("platform", platform);
    setSocials((s) => s.filter((x) => x.platform !== platform));
    toast.success(`${platform} disconnected`);
  }

  if (authLoading || loading || !profile) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> {t.profLoadingDossier}
        </div>
      </AppShell>
    );
  }

  const hasName = !!profile.full_name;
  const displayName = profile.full_name || t.profUnnamedOperator;
  const computedTitle = `${titleFor(industry.id, core?.current_level ?? "initiate")} · ${profile.location || industry.label}`;
  const phaseProgress = Math.min(100, Math.round(((core?.execution_score ?? 0) / 100) * 100));

  return (
    <AppShell>
      <div
        className="glass rounded-2xl overflow-hidden mb-10 animate-fade-up relative"
        style={{ animationDelay: "0ms" }}
      >
        <div className="h-32 bg-[var(--gradient-gold)] opacity-70" />
        <div className="px-6 sm:px-10 pb-10 -mt-16 grid lg:grid-cols-[1fr_360px] gap-8">
          <div>
            <div className="relative inline-block">
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
                  <img src={profile.photo_url} alt="Profile photo" className="h-full w-full object-cover" />
                ) : (
                  initials(profile.full_name)
                )}
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3 flex-wrap">
              <h1 className="font-serif text-3xl sm:text-4xl">{displayName}</h1>
              <span className="text-[10px] tracking-[0.3em] px-3 py-1 rounded-full ring-1 ring-primary/40 text-primary uppercase">
                {t.profModeBadge(industry.shortLabel)}
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
              <div className="text-[9px] tracking-[0.34em] text-muted-foreground mb-1.5">{t.profMyMission}</div>
              {profile.mission ? (
                <p className="font-serif text-lg leading-snug">{profile.mission}</p>
              ) : (
                <button
                  onClick={() => setEditOpen(true)}
                  className="text-sm text-muted-foreground italic hover:text-foreground transition-colors"
                >
                  {t.profMissionPlaceholder}
                </button>
              )}
            </div>
            <button
              onClick={() => setEditOpen(true)}
              className="mt-6 inline-flex items-center gap-2 text-xs glass rounded-full px-4 py-2 tracking-[0.2em] hover:ring-gold transition-all"
            >
              <Pencil className="h-3 w-3" /> {t.profEditIdentity}
            </button>
            {!hasName && (
              <p className="text-xs text-primary/80 mt-3">
                {t.profUnlockDossier}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <div className="glass rounded-xl p-5">
              <div className="text-[9px] tracking-[0.34em] text-muted-foreground">{t.profAurumScore}</div>
              <div className="font-serif text-5xl mt-2 text-gold-gradient">{aurumScore}</div>
              <div className="text-xs text-muted-foreground mt-1">{t.profReadinessIndex}</div>
            </div>
            <div className="glass rounded-xl p-5">
              <div className="text-[9px] tracking-[0.34em] text-muted-foreground">{t.profMomentum}</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif text-4xl text-gold-gradient">{core?.streak ?? 0}</span>
                <span className="text-xs text-muted-foreground">{t.profDayStreak}</span>
                <Flame className="h-4 w-4 text-primary ml-auto" />
              </div>
            </div>
            <div className="glass rounded-xl p-5">
              <div className="text-[9px] tracking-[0.34em] text-muted-foreground">{t.profPhase}</div>
              <div className="font-serif text-lg mt-1.5 capitalize">
                {typeof core?.current_focus === "string" ? core.current_focus : t.profOnboarding}
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-border/60 overflow-hidden">
                <div
                  className="h-full bg-[var(--gradient-gold)]"
                  style={{ width: `${phaseProgress}%`, transition: "width 800ms ease" }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground mt-2">{t.profToNextPhase(phaseProgress)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 sm:p-8 mb-10 animate-fade-up" style={{ animationDelay: "80ms" }}>
        <SectionHeading eyebrow={t.profScoreBreakdownEyebrow} title={t.profScoreBreakdownTitle} />
        <div className="space-y-4 mt-4">
          {scoreBreakdown.map((b, i) => (
            <Link key={b.key} to={b.to} className="block group" style={{ animationDelay: `${i * 60}ms` }}>
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

      <div className="glass rounded-2xl p-6 sm:p-8 mb-10 animate-fade-up" style={{ animationDelay: "240ms" }}>
        <SectionHeading eyebrow={t.profConnectedAccountsEyebrow} title={t.profConnectedAccountsTitle} />
        <p className="text-sm text-muted-foreground -mt-2 mb-1">
          {t.profConnectDesc}
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mt-5">
          {PLATFORMS.map((p) => {
            const connected = socials.find((s) => s.platform === p.key);
            const Icon = p.icon;
            return (
              <div
                key={p.key}
                className="rounded-xl border border-border/60 bg-background/40 p-4 flex items-center gap-4"
              >
                <div className="h-10 w-10 rounded-lg bg-[var(--gradient-card)] flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-base">{p.name}</span>
                    {connected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {t.profConnected}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">{t.profNotConnected}</span>
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
                    {t.profDisconnect}
                  </button>
                ) : (
                  <button
                    onClick={() => setConnectPlatform(p.key)}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Plug className="h-3 w-3" /> {t.profConnect}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <EditIdentitySheet open={editOpen} onClose={() => setEditOpen(false)} profile={profile} onSave={saveProfile} t={t} />
      <ConnectDialog platform={connectPlatform} onClose={() => setConnectPlatform(null)} onConfirm={connectSocial} t={t} />
    </AppShell>
  );
}

function EditIdentitySheet({
  open,
  onClose,
  profile,
  onSave,
  t,
}: {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (p: Partial<UserProfile>) => Promise<void>;
  t: T;
}) {
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(profile), [profile, open]);
  const set = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">{t.profEditIdentityTitle}</SheetTitle>
          <SheetDescription>{t.profEditIdentityDesc}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <Field label={t.profFieldFullName}>
            <Input
              value={form.full_name ?? ""}
              onChange={(e) => set("full_name", e.target.value)}
              placeholder="Alexander Kovac"
            />
          </Field>
          <Field label={t.profFieldProfession}>
            <Input
              value={form.current_profession ?? ""}
              onChange={(e) => set("current_profession", e.target.value)}
              placeholder={t.profPlaceholderProfession}
            />
          </Field>
          <Field label={t.profFieldLocation}>
            <Input value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="Monaco" />
          </Field>
          <Field label={t.profFieldMission}>
            <Textarea
              value={form.mission ?? ""}
              onChange={(e) => set("mission", e.target.value)}
              placeholder={t.profPlaceholderMission}
              rows={3}
            />
          </Field>
          <Field label={t.profFieldGoal}>
            <Input
              value={form.goal ?? ""}
              onChange={(e) => set("goal", e.target.value)}
              placeholder={t.profPlaceholderGoal}
            />
          </Field>
          <Field label={t.profFieldPhotoUrl}>
            <Input
              value={form.photo_url ?? ""}
              onChange={(e) => set("photo_url", e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.profFieldLinkedinUrl}>
              <Input
                value={form.linkedin_url ?? ""}
                onChange={(e) => set("linkedin_url", e.target.value)}
                placeholder="https://linkedin.com/in/…"
              />
            </Field>
            <Field label={t.profFieldInstagramUrl}>
              <Input
                value={form.instagram_url ?? ""}
                onChange={(e) => set("instagram_url", e.target.value)}
                placeholder="https://instagram.com/…"
              />
            </Field>
          </div>
        </div>
        <div className="mt-8 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t.profCancel}
          </Button>
          <Button
            onClick={async () => {
              setSaving(true);
              await onSave(form);
              setSaving(false);
            }}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}{t.profSave}
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

function getPlatformMeta(t: T): Record<string, { label: string; placeholder: string; hint: string }> {
  return {
    linkedin:  { label: t.profPlatformLinkedinLabel, placeholder: "linkedin.com/in/yourname or yourname", hint: t.profPlatformLinkedinHint },
    instagram: { label: t.profPlatformUsernameLabel, placeholder: "@yourhandle", hint: t.profPlatformInstagramHint },
    twitter:   { label: t.profPlatformUsernameLabel, placeholder: "@yourhandle", hint: t.profPlatformTwitterHint },
    tiktok:    { label: t.profPlatformUsernameLabel, placeholder: "@yourhandle", hint: t.profPlatformTiktokHint },
    youtube:   { label: t.profPlatformYoutubeLabel, placeholder: "youtube.com/@yourchannel", hint: t.profPlatformYoutubeHint },
    substack:  { label: t.profPlatformSubstackLabel, placeholder: "https://you.substack.com", hint: t.profPlatformSubstackHint },
  };
}

function ConnectDialog({
  platform,
  onClose,
  onConfirm,
  t,
}: {
  platform: string | null;
  onClose: () => void;
  onConfirm: (platform: string, username: string) => Promise<void>;
  t: T;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { setValue(""); setSaving(false); }, [platform]);
  if (!platform) return null;
  const meta = PLATFORMS.find((p) => p.key === platform);
  const fieldMeta = getPlatformMeta(t)[platform] ?? { label: t.profPlatformUsernameLabel, placeholder: "yourhandle", hint: "" };

  const handleConfirm = async () => {
    if (!value.trim()) return;
    setSaving(true);
    await onConfirm(platform, value.trim());
    setSaving(false);
  };

  return (
    <Dialog open={!!platform} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{t.profConnectPlatform(meta?.name ?? "")}</DialogTitle>
          <DialogDescription>
            {fieldMeta.hint}{t.profConnectHintSuffix}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-[10px] tracking-[0.3em] text-muted-foreground">{fieldMeta.label}</Label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            placeholder={fieldMeta.placeholder}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t.profCancel}</Button>
          <Button onClick={handleConfirm} disabled={!value.trim() || saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t.profConnecting}</> : t.profConnect}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
