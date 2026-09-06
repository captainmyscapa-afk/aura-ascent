import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  Radio,
  Sparkles,
  GraduationCap,
  Video,
  Users,
  User2,
  Settings,
  Map,
  BookOpen,
  Search,
  Compass,
  LogOut,
  Bell,
} from "lucide-react";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { INDUSTRY_LIST } from "@/lib/industry/config";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const NAV_ITEMS = [
  { label: "Dashboard",        to: "/app",          icon: LayoutDashboard, group: "Navigate" },
  { label: "30-Day Roadmap",   to: "/roadmap",       icon: Map,             group: "Navigate" },
  { label: "Intelligence",     to: "/intelligence",  icon: Radio,           group: "Navigate" },
  { label: "Mentor",           to: "/mentor",        icon: Sparkles,        group: "Navigate" },
  { label: "Academy",          to: "/academy",       icon: GraduationCap,   group: "Navigate" },
  { label: "Tutor",            to: "/tutor",         icon: BookOpen,        group: "Navigate" },
  { label: "Network",          to: "/network",       icon: Users,           group: "Navigate" },
  { label: "Content Studio",   to: "/studio",        icon: Video,           group: "Navigate" },
  { label: "Identity",         to: "/profile",       icon: User2,           group: "Navigate" },
  { label: "Preferences",      to: "/settings",      icon: Settings,        group: "Navigate" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { industry, setIndustry } = useIndustry();
  const { signOut } = useAuth();

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const run = useCallback((fn: () => void) => {
    setOpen(false);
    setQuery("");
    fn();
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh]"
      style={{ background: "oklch(0 0 0 / 60%)", backdropFilter: "blur(8px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div
        className="w-full max-w-[580px] mx-4 glass-strong rounded-2xl shadow-[var(--shadow-elegant)] border border-border/60 overflow-hidden"
        style={{ animation: "page-enter 0.22s cubic-bezier(0.32,0.72,0,1) both" }}
      >
        <Command label="Command palette" shouldFilter>
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search pages, actions, industry modes…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary/60 text-[10px] text-muted-foreground tracking-wide">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[420px] overflow-y-auto py-2">
            <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {/* Navigation */}
            <Command.Group
              heading={
                <span className="px-4 py-1.5 text-[10px] tracking-[0.28em] text-muted-foreground/60 block">
                  NAVIGATE
                </span>
              }
            >
              {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
                <Command.Item
                  key={to}
                  value={label}
                  onSelect={() => run(() => navigate({ to: to as any }))}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 cursor-pointer
                    data-[selected=true]:bg-secondary/50 data-[selected=true]:text-foreground
                    transition-colors"
                >
                  <span className="h-7 w-7 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                  <span>{label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <div className="mx-4 my-2 h-px bg-border/40" />

            {/* Industry modes */}
            <Command.Group
              heading={
                <span className="px-4 py-1.5 text-[10px] tracking-[0.28em] text-muted-foreground/60 flex items-center gap-2 block">
                  <Compass className="h-3 w-3" />
                  INDUSTRY MODE
                </span>
              }
            >
              {INDUSTRY_LIST.map((opt) => {
                const Icon = opt.icon;
                const active = opt.id === industry.id;
                return (
                  <Command.Item
                    key={opt.id}
                    value={`${opt.label} ${opt.modeLabel} mode`}
                    onSelect={() =>
                      run(() => {
                        if (!active) {
                          setIndustry(opt.id);
                          toast(`Entering ${opt.modeLabel}`, { description: opt.tagline });
                        }
                      })
                    }
                    className="flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer
                      data-[selected=true]:bg-secondary/50 data-[selected=true]:text-foreground
                      transition-colors"
                  >
                    <span
                      className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                      style={active ? { background: "var(--gradient-gold)" } : { background: "var(--secondary)" }}
                    >
                      <Icon className={`h-3.5 w-3.5 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    </span>
                    <span className={active ? "text-foreground" : "text-foreground/80"}>
                      {opt.label}
                    </span>
                    {active && (
                      <span className="ml-auto text-[10px] tracking-widest text-primary">ACTIVE</span>
                    )}
                  </Command.Item>
                );
              })}
            </Command.Group>

            <div className="mx-4 my-2 h-px bg-border/40" />

            {/* Quick actions */}
            <Command.Group
              heading={
                <span className="px-4 py-1.5 text-[10px] tracking-[0.28em] text-muted-foreground/60 block">
                  ACTIONS
                </span>
              }
            >
              <Command.Item
                value="notifications"
                onSelect={() => run(() => navigate({ to: "/settings" as any }))}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 cursor-pointer
                  data-[selected=true]:bg-secondary/50 data-[selected=true]:text-foreground transition-colors"
              >
                <span className="h-7 w-7 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                  <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
                Notification preferences
              </Command.Item>
              <Command.Item
                value="sign out log out"
                onSelect={() => run(async () => { await signOut(); navigate({ to: "/login" as any, replace: true }); })}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 cursor-pointer
                  data-[selected=true]:bg-secondary/50 data-[selected=true]:text-foreground transition-colors"
              >
                <span className="h-7 w-7 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                  <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
                Sign out
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer hint */}
          <div className="px-4 py-2.5 border-t border-border/40 flex items-center gap-4 text-[10px] text-muted-foreground/50">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-secondary/60">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-secondary/60">↵</kbd> select</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-secondary/60">esc</kbd> close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
