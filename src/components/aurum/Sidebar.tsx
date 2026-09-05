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
  Map,
  Settings,
  LogOut,
  CalendarDays,
} from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/useAuth";
import { useAurumCoreState } from "@/hooks/useAurumCoreState";
import { useAccountAge } from "@/hooks/useAccountAge";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function Sidebar() {
  const { pathname } = useLocation();
  const { session, signOut } = useAuth();
  const { state: core } = useAurumCoreState();
  const accountAge = useAccountAge();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const nav = [
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

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col glass-strong border-r border-border/60 z-30" style={{ viewTransitionName: "aurum-sidebar" }}>
      <div className="px-6 pt-7 pb-8">
        <Link to="/app">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] tracking-[0.32em] text-muted-foreground/70">{t.ecosystem}</div>
        {nav.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all ${
                active
                  ? "bg-secondary/60 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              }`}
            >
              <Icon
                className={`h-4 w-4 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              <span className="tracking-wide">{label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse-gold" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/60">
        <div className="glass rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] tracking-[0.3em] text-muted-foreground">{t.momentum}</span>
            <span className="font-mono text-xs text-primary">{core?.streak ?? 0}</span>
          </div>
          <div className="h-1 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-[var(--gradient-gold)]"
              style={{ width: `${Math.min(100, (core?.streak ?? 0) * 2)}%` }}
            />
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>{t.streak(core?.streak ?? 0)}</span>
          </div>
          {accountAge && (
            <div className="mt-1.5 text-[10px] text-muted-foreground/70">
              {t.memberSince(accountAge.days, accountAge.hours)}
            </div>
          )}
        </div>
        <Link
          to="/settings"
          className="mt-3 flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="h-3.5 w-3.5" />
          {t.navPreferences}
        </Link>
        {session ? (
          <button
            onClick={handleLogout}
            className="mt-1 w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t.signOut}
          </button>
        ) : (
          <Link
            to="/login"
            className="mt-1 w-full flex items-center gap-2 px-3 py-2 text-xs text-primary hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t.signInUnlock}
          </Link>
        )}
      </div>
    </aside>
  );
}
