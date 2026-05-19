import { Bell, Search, Command } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 glass-strong border-b border-border/60">
      <div className="flex items-center gap-4 px-5 sm:px-8 lg:px-12 h-16">
        <div className="lg:hidden">
          <Link to="/dashboard">
            <Logo />
          </Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-xl items-center gap-2 glass rounded-md px-3.5 py-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          <span className="flex-1">Search markets, players, listings, events…</span>
          <kbd className="hidden lg:flex items-center gap-1 text-[10px] text-muted-foreground/70 border border-border rounded px-1.5 py-0.5">
            <Command className="h-3 w-3" /> K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 glass rounded-full px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] tracking-[0.3em] text-muted-foreground">
              MARKETS LIVE
            </span>
          </div>
          <button className="relative h-9 w-9 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>
          <Link
            to="/profile"
            className="h-9 w-9 rounded-full bg-[var(--gradient-gold)] flex items-center justify-center text-[11px] font-medium text-primary-foreground"
          >
            AK
          </Link>
        </div>
      </div>
    </header>
  );
}
