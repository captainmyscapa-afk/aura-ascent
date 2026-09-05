import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Radio,
  Sparkles,
  GraduationCap,
  BookOpen,
  Users,
  Video,
  User2,
  Settings,
  Menu,
  X,
  Compass,
  Crown,
  Map,
  LogOut,
  CalendarDays,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./Logo";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { INDUSTRY_LIST } from "@/lib/industry/config";
import { useAuth } from "@/hooks/useAuth";
import { useAurumCoreState } from "@/hooks/useAurumCoreState";
import { useAccountAge } from "@/hooks/useAccountAge";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { industry, setIndustry } = useIndustry();
  const { user, signOut } = useAuth();
  const { state: core } = useAurumCoreState();
  const accountAge = useAccountAge();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [initials, setInitials] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Nav arrays inside component so they react to language changes
  const primaryNav = [
    { to: "/app", label: t.navDashboard, icon: LayoutDashboard },
    { to: "/roadmap", label: t.navRoadmap, icon: Map },
    { to: "/intelligence", label: t.navIntelligence, icon: Radio },
    { to: "/mentor", label: t.navMentor, icon: Sparkles },
    { to: "/academy", label: t.navAcademy, icon: GraduationCap },
    { to: "/tutor", label: t.navTutor, icon: BookOpen },
    { to: "/studio", label: t.navStudio, icon: Video },
    { to: "/calendar", label: t.navCalendar, icon: CalendarDays },
    { to: "/network", label: t.navNetwork, icon: Users },
    { to: "/profile", label: t.navIdentity, icon: User2 },
  ] as const;

  const accountNav = [
    { to: "/settings", label: t.navPreferences, icon: Settings },
  ] as const;

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const name = (data as { full_name: string | null } | null)?.full_name;
        if (name) {
          const parts = name.trim().split(" ").filter(Boolean);
          const ini = parts
            .map((p: string) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
          setInitials(ini || "AU");
          const short = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
          setDisplayName(short);
        } else {
          const email = user.email ?? "";
          setInitials(email.slice(0, 2).toUpperCase() || "AU");
          setDisplayName(email.split("@")[0]);
        }
      });
  }, [user]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open menu"
          style={{ WebkitTapHighlightColor: "transparent" }}
          className="lg:hidden h-10 w-10 -ml-2 rounded-full flex items-center justify-center text-foreground/90 hover:bg-secondary/40 active:scale-95 transition-all"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[86%] max-w-[340px] p-0 border-r border-border/60 bg-transparent backdrop-blur-2xl [&>button]:hidden"
        style={{
          background: "linear-gradient(180deg, oklch(0.14 0.01 240 / 92%), oklch(0.11 0.008 240 / 96%))",
        }}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-5 shrink-0">
            <Logo />
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              style={{ WebkitTapHighlightColor: "transparent" }}
              className="h-9 w-9 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Profile card */}
          <div className="px-5 pb-4 shrink-0">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              style={{ WebkitTapHighlightColor: "transparent" }}
              className="flex items-center gap-3 glass rounded-2xl p-3.5 active:scale-[0.99] transition-transform"
            >
              <div
                className="h-11 w-11 rounded-full flex items-center justify-center text-[12px] font-medium text-primary-foreground shadow-[var(--shadow-gold)] shrink-0"
                style={{ background: "var(--gradient-gold)" }}
              >
                {initials ?? "AU"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-serif text-[16px] leading-tight truncate">{displayName ?? "Operator"}</div>
                <div className="text-[11px] text-muted-foreground tracking-wide flex items-center gap-1.5">
                  <Crown className="h-3 w-3 text-primary" />
                  Tier · Initiate
                </div>
              </div>
            </Link>
          </div>

          {/* Industry switcher */}
          <div className="px-5 pb-3 shrink-0">
            <div className="px-2 pb-2 text-[10px] tracking-[0.32em] text-muted-foreground/70 flex items-center gap-2">
              <Compass className="h-3 w-3" />
              {t.industryLabel}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {INDUSTRY_LIST.map((opt) => {
                const Icon = opt.icon;
                const active = opt.id === industry.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      if (!active) {
                        setIndustry(opt.id);
                        toast(t.enteringMode(opt.modeLabel), { description: opt.tagline });
                      }
                    }}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all active:scale-95 ${
                      active
                        ? "glass ring-1 ring-primary/50 shadow-[var(--shadow-gold)]"
                        : "glass opacity-60 hover:opacity-100"
                    }`}
                  >
                    <span
                      className={`h-7 w-7 rounded-full flex items-center justify-center ${
                        active ? "" : "bg-secondary/60"
                      }`}
                      style={active ? { background: "var(--gradient-gold)" } : {}}
                    >
                      <Icon className={`h-3.5 w-3.5 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    </span>
                    <span className="text-[10px] tracking-wide text-foreground/80">{opt.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nav — scrollable */}
          <nav className="flex-1 overflow-y-auto px-3 pt-2 pb-2">
            <div className="px-3 pb-2 text-[10px] tracking-[0.32em] text-muted-foreground/70">{t.ecosystem}</div>
            <div className="space-y-0.5">
              {primaryNav.map(({ to, label, icon: Icon }) => {
                const active = pathname === to || pathname.startsWith(to + "/");
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-all active:scale-[0.99] ${
                      active
                        ? "bg-secondary/60 text-foreground"
                        : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        active ? "" : "bg-secondary/40 group-hover:bg-secondary/60"
                      }`}
                      style={active ? { background: "var(--gradient-gold)" } : {}}
                    >
                      <Icon className={`h-4 w-4 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    </span>
                    <span className="tracking-wide flex-1">{label}</span>
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-gold shrink-0" />}
                  </Link>
                );
              })}
            </div>

            <div className="hairline my-4 opacity-50" />

            <div className="px-3 pb-2 text-[10px] tracking-[0.32em] text-muted-foreground/70">ACCOUNT</div>
            <div className="space-y-0.5">
              {accountNav.map(({ to, label, icon: Icon }) => {
                const active = pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-all active:scale-[0.99] ${
                      active
                        ? "bg-secondary/60 text-foreground"
                        : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
                    }`}
                  >
                    <span className="h-8 w-8 rounded-lg flex items-center justify-center bg-secondary/40 shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <span className="tracking-wide flex-1">{label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                style={{ WebkitTapHighlightColor: "transparent" }}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-muted-foreground hover:bg-secondary/30 hover:text-foreground transition-all active:scale-[0.99]"
              >
                <span className="h-8 w-8 rounded-lg flex items-center justify-center bg-secondary/40 shrink-0">
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                </span>
                <span className="tracking-wide flex-1 text-left">{t.signOut}</span>
              </button>
            </div>
          </nav>

          {/* Momentum strip */}
          <div className="px-5 pb-6 pt-3 border-t border-border/40 shrink-0">
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] tracking-[0.3em] text-muted-foreground">{t.momentum}</span>
                <span className="font-mono text-xs text-primary">{core?.streak ?? 0}</span>
              </div>
              <div className="h-1 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-[var(--gradient-gold)] transition-all duration-700"
                  style={{ width: `${Math.min(100, (core?.streak ?? 0) * 2)}%` }}
                />
              </div>
              <div className="mt-2.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span>{`${t.streak(core?.streak ?? 0)} · ${industry.modeLabel}`}</span>
              </div>
              {accountAge && (
                <div className="mt-1.5 text-[10px] text-muted-foreground/70">
                  {t.memberSince(accountAge.days, accountAge.hours)}
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
