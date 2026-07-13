import { Link, useLocation } from "@tanstack/react-router";
import {
  GraduationCap,
  Sparkles,
  Video,
  Radio,
  CalendarDays,
} from "lucide-react";

const tabs = [
  { to: "/academy", label: "Academy", icon: GraduationCap },
  { to: "/mentor", label: "Mentor", icon: Sparkles },
  { to: "/studio", label: "Studio", icon: Video },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/intelligence", label: "Intelligence", icon: Radio },
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
          className="glass-strong rounded-2xl px-4 py-1.5 flex items-center justify-between shadow-[var(--shadow-elegant)]"
        >
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className="relative flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl active:scale-95 transition-transform"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <span
                  className={`flex items-center justify-center h-9 w-9 rounded-xl transition-all ${
                    active
                      ? "shadow-[var(--shadow-gold)]"
                      : "bg-transparent"
                  }`}
                  style={active ? { background: "var(--gradient-gold)" } : {}}
                >
                  <Icon
                    className={`h-[19px] w-[19px] ${
                      active ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  />
                </span>
                <span
                  className={`text-[10px] tracking-wide font-medium ${
                    active ? "text-foreground" : "text-muted-foreground/70"
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
