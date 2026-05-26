import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Radio,
  Sparkles,
  GraduationCap,
  Video,
  User2,
  Settings,
  Menu,
  X,
  Crown,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "./Logo";

const primaryNav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/academy", label: "Academy", icon: GraduationCap },
  { to: "/intelligence", label: "Intelligence", icon: Radio },
  { to: "/mentor", label: "AI Mentor", icon: Sparkles },
  { to: "/studio", label: "Content Studio", icon: Video },
] as const;

const secondaryNav = [
  { to: "/settings", label: "Preferences", icon: Settings },
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open menu"
          className="lg:hidden h-10 w-10 -ml-2 rounded-full flex items-center justify-center text-foreground/90 hover:bg-secondary/40 active:scale-95 transition-all"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[86%] max-w-[340px] p-0 border-r border-border/60 bg-transparent backdrop-blur-2xl [&>button]:hidden"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.14 0.01 240 / 92%), oklch(0.11 0.008 240 / 96%))",
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-5">
            <Logo />
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="h-9 w-9 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Identity card */}
          <div className="px-5 pb-4">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 glass rounded-2xl p-3.5 active:scale-[0.99] transition-transform"
            >
              <div className="h-11 w-11 rounded-full bg-[var(--gradient-gold)] flex items-center justify-center text-[12px] font-medium text-primary-foreground shadow-[var(--shadow-gold)]">
                AK
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-serif text-[16px] leading-tight truncate">Alexander K.</div>
                <div className="text-[11px] text-muted-foreground tracking-wide flex items-center gap-1.5">
                  <Crown className="h-3 w-3 text-primary" />
                  Tier · Initiate
                </div>
              </div>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 pt-2 pb-4">
            <div className="px-3 pb-2 text-[10px] tracking-[0.32em] text-muted-foreground/70">
              ECOSYSTEM
            </div>
            <div className="space-y-1">
              {primaryNav.map(({ to, label, icon: Icon }) => {
                const active = pathname === to || pathname.startsWith(to + "/");
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] transition-all active:scale-[0.99] ${
                      active
                        ? "bg-secondary/60 text-foreground"
                        : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                        active
                          ? "bg-[var(--gradient-gold)]"
                          : "bg-secondary/40 group-hover:bg-secondary/60"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          active ? "text-primary-foreground" : "text-muted-foreground"
                        }`}
                      />
                    </span>
                    <span className="tracking-wide flex-1">{label}</span>
                    {active && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-gold" />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="hairline my-5 opacity-50" />

            <div className="px-3 pb-2 text-[10px] tracking-[0.32em] text-muted-foreground/70">
              ACCOUNT
            </div>
            <div className="space-y-1">
              {secondaryNav.map(({ to, label, icon: Icon }) => {
                const active = pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] transition-all active:scale-[0.99] ${
                      active
                        ? "bg-secondary/60 text-foreground"
                        : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
                    }`}
                  >
                    <span className="h-8 w-8 rounded-lg flex items-center justify-center bg-secondary/40">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <span className="tracking-wide flex-1">{label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer momentum */}
          <div className="px-5 pb-6 pt-3 border-t border-border/40">
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] tracking-[0.3em] text-muted-foreground">
                  MOMENTUM
                </span>
                <span className="font-mono text-xs text-primary">87</span>
              </div>
              <div className="h-1 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-[var(--gradient-gold)]"
                  style={{ width: "87%" }}
                />
              </div>
              <div className="mt-2.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span>12-day streak</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
