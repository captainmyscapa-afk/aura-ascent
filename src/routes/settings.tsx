import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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

const SECTIONS: Section[] = [
  { id: "account", label: "Account", icon: User, soon: false },
  { id: "aurum", label: "My AURUM", icon: Sparkles, soon: false },
  { id: "content", label: "Content", icon: ChevronRight, soon: false },
  { id: "notifications", label: "Notifications", icon: Bell, soon: true },
  { id: "privacy", label: "Privacy", icon: Shield, soon: true },
  { id: "billing", label: "Billing", icon: CreditCard, soon: true },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle, soon: false },
];

const MODES = [
  { id: "yachts", label: "Yachts" },
  { id: "villas", label: "Villas" },
  { id: "jets", label: "Jets" },
  { id: "cars", label: "Cars" },
] as const;

const LEVELS = [
  { id: "beginner", label: "Beginner", desc: "Exploring, building foundation" },
  { id: "intermediate", label: "Intermediate", desc: "In the industry, accelerating" },
  { id: "experienced", label: "Experienced", desc: "Established, scaling reach" },
] as const;

const TONES = [
  { id: "Strategic · Calm · Direct", label: "Strategic", desc: "Calm, direct, no fluff" },
  { id: "Warm · Encouraging · Supportive", label: "Warm", desc: "Encouraging and supportive" },
  { id: "Socratic · Challenging · Sharp", label: "Socratic", desc: "Challenges your thinking" },
] as const;

const AI_STYLES = [
  { id: "Concise", label: "Concise", desc: "Short, sharp answers" },
  { id: "Detailed", label: "Detailed", desc: "In-depth explanations" },
] as const;

const TASK_COUNTS = [5, 7, 10] as const;

const CONTENT_TONES = [
  { id: "Professional", label: "Professional" },
  { id: "Conversational", label: "Conversational" },
  { id: "Bold", label: "Bold" },
] as const;

const PLATFORMS = [
  { id: "All", label: "All platforms" },
  { id: "LinkedIn", label: "LinkedIn only" },
  { id: "Instagram", label: "Instagram only" },
  { id: "LinkedIn,Instagram", label: "LinkedIn + Instagram" },
] as const;

function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, update: updateProfile } = useUserProfile();
  const { state: core, update: updateCore } = useAurumCoreState();
  const { industryId, setIndustry } = useIndustry();

  const [activeSection, setActiveSection] = useState<SectionId>("account");
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

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
        toast.success("Check your new email to confirm the change.");
      } else {
        toast.success("Account updated.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
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
    toast.success("Password reset email sent. Check your inbox.");
  };

  return (
    <AppShell>
      <div className="mb-8">
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">PREFERENCES</div>
        <h1 className="font-serif text-4xl">Tune your operating system</h1>
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
                  SOON
                </span>
              )}
              {activeSection === id && !soon && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
            </button>
          ))}
        </nav>

        <div className="glass rounded-2xl p-6 sm:p-8">
          {activeSection === "account" && (
            <div className="space-y-6">
              <SectionTitle title="Account" desc="Manage your personal information and login credentials." />
              <Field label="Full name">
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
              </Field>
              <Field label="Email address">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Changing your email requires confirmation from the new address.
                </p>
              </Field>
              <Button onClick={handleSaveAccount} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
              </Button>
              <div className="pt-4 border-t border-border/60">
                <Field label="Password">
                  <p className="text-sm text-muted-foreground mb-3">We'll send a reset link to your email address.</p>
                  <Button variant="outline" onClick={handlePasswordReset}>
                    Send password reset email
                  </Button>
                </Field>
              </div>
            </div>
          )}

          {activeSection === "aurum" && (
            <div className="space-y-8">
              <SectionTitle title="My AURUM" desc="Personalise your AI mentor, daily rituals and operating system." />
              <Field label="Active mode">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setIndustry(m.id as IndustryId);
                        updateCore({ active_mode: m.id });
                        toast.success(`Switched to ${m.label} mode`);
                      }}
                      className={`py-2 px-3 rounded-lg border text-sm transition-all ${industryId === m.id ? "border-primary/60 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Experience level">
                <div className="space-y-2 mt-1">
                  {LEVELS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        updateCore({ current_level: l.id });
                        toast.success("Level updated");
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
              <Field label="My goal">
                <Input
                  defaultValue={typeof core?.current_focus === "string" ? core.current_focus : ""}
                  placeholder="e.g. Sign first brokerage mandate by Q4"
                  onBlur={(e) => {
                    if (e.target.value) {
                      updateCore({ current_focus: e.target.value });
                      toast.success("Goal saved");
                    }
                  }}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Used by your AI mentor to personalise every recommendation.
                </p>
              </Field>
              <Field label="Daily ritual intensity">
                <div className="flex gap-2 mt-1">
                  {TASK_COUNTS.map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        updateProfile({ daily_task_count: n });
                        toast.success(`Daily tasks set to ${n}`);
                      }}
                      className={`flex-1 py-2 rounded-lg border text-sm transition-all ${(profile?.daily_task_count ?? 5) === n ? "border-primary/60 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}
                    >
                      {n} tasks
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Mentor tone">
                <div className="space-y-2 mt-1">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        updateProfile({ mentor_tone: t.id });
                        toast.success("Mentor tone updated");
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${(profile?.mentor_tone ?? "Strategic · Calm · Direct") === t.id ? "border-primary/60 bg-primary/10" : "border-border hover:border-primary/40"}`}
                    >
                      <div className="text-left">
                        <div className="text-sm font-medium">{t.label}</div>
                        <div className="text-xs text-muted-foreground">{t.desc}</div>
                      </div>
                      {(profile?.mentor_tone ?? "Strategic · Calm · Direct") === t.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="AI response style">
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {AI_STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        updateProfile({ ai_response_style: s.id });
                        toast.success("AI style updated");
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
                <Field label="Reset onboarding">
                  <p className="text-sm text-muted-foreground mb-3">
                    Redo your setup to change your industry and goals from scratch.
                  </p>
                  <Button variant="outline" onClick={() => navigate({ to: "/onboarding" })}>
                    <RotateCcw className="h-4 w-4 mr-2" /> Redo onboarding
                  </Button>
                </Field>
              </div>
            </div>
          )}

          {activeSection === "content" && (
            <div className="space-y-8">
              <SectionTitle title="Content & Intelligence" desc="Control how AURUM generates content for you." />
              <Field label="Preferred platforms">
                <div className="space-y-2 mt-1">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        updateProfile({ preferred_platforms: p.id });
                        toast.success("Platforms updated");
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${(profile?.preferred_platforms ?? "All") === p.id ? "border-primary/60 bg-primary/10" : "border-border hover:border-primary/40"}`}
                    >
                      <span className="text-sm">{p.label}</span>
                      {(profile?.preferred_platforms ?? "All") === p.id && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Content tone">
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {CONTENT_TONES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        updateProfile({ content_tone: t.id });
                        toast.success("Content tone updated");
                      }}
                      className={`py-2 px-3 rounded-lg border text-sm transition-all ${(profile?.content_tone ?? "Professional") === t.id ? "border-primary/60 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Auto-generate daily brief">
                <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-border mt-1">
                  <div>
                    <div className="text-sm">Daily brief</div>
                    <div className="text-xs text-muted-foreground">Automatically generate your brief each morning</div>
                  </div>
                  <button
                    onClick={() => {
                      const next = !(profile?.auto_daily_brief ?? true);
                      updateProfile({ auto_daily_brief: next });
                      toast.success(next ? "Daily brief enabled" : "Daily brief disabled");
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
            <ComingSoon
              title="Notifications"
              desc="Get notified about your streak, intelligence alerts, and weekly reports. Coming soon."
            />
          )}
          {activeSection === "privacy" && (
            <ComingSoon title="Privacy" desc="Control who can see your profile, streak and activity. Coming soon." />
          )}
          {activeSection === "billing" && (
            <ComingSoon title="Billing" desc="Manage your plan, payment method and invoice history. Coming soon." />
          )}

          {activeSection === "danger" && (
            <div className="space-y-4">
              <SectionTitle title="Danger Zone" desc="Irreversible actions. Proceed with caution." />
              <div className="rounded-xl border border-border/60 p-5 flex items-center justify-between">
                <div>
                  <div className="text-sm">Sign out</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Sign out of this device</div>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </Button>
              </div>
              <div className="rounded-xl border border-border/60 p-5 flex items-center justify-between">
                <div>
                  <div className="text-sm">Sign out everywhere</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Sign out of all devices and sessions</div>
                </div>
                <Button variant="outline" onClick={handleSignOutAll}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign out all
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
