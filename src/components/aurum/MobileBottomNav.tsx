import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  GraduationCap,
  Sparkles,
  Video,
  User2,
} from "lucide-react";

const tabs = [
  { to: "/app", label: "Home", icon: LayoutDashboard },
  { to: "/academy", label: "Academy", icon: GraduationCap },
  { to: "/mentor", label: "Mentor", icon: Sparkles },
  { to: "/studio", label: "Studio", icon: Video },
  { to: "/profile", label: "Identity", icon: User2 },
] as const;

export function MobileBottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 pointer-events-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="pointer-events-auto mx-3 mb-3">
        <div
          className="glass-strong rounded-2xl px-2 py-1.5 flex items-center justify-between shadow-[var(--shadow-elegant)]"
        >
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className="relative flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl active:scale-95 transition-transform"
              >
                <span
                  className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all ${
                    active
                      ? "bg-[var(--gradient-gold)] shadow-[var(--shadow-gold)]"
                      : "bg-transparent"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] ${
                      active ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  />
                </span>
                <span
                  className={`text-[10px] tracking-wide ${
                    active ? "text-foreground" : "text-muted-foreground/80"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
