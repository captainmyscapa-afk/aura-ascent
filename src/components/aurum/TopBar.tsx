import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { IndustrySwitcher } from "./IndustrySwitcher";
import { MobileNav } from "./MobileNav";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-border/60">
      <div className="flex items-center gap-3 px-4 sm:px-8 lg:px-12 h-14 lg:h-16">
        {/* Mobile: menu + logo */}
        <div className="lg:hidden flex items-center gap-2">
          <MobileNav />
          <Link to="/app" aria-label="Aurum OS home">
            <Logo />
          </Link>
        </div>

        {/* Desktop: spacer */}
        <div className="hidden md:flex flex-1" />

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <IndustrySwitcher />
          </div>
          <div className="sm:hidden">
            <IndustrySwitcher compact />
          </div>
          <button
            aria-label="Notifications"
            className="relative h-9 w-9 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>
          <Link
            to="/profile"
            className="hidden sm:flex h-9 w-9 rounded-full bg-[var(--gradient-gold)] items-center justify-center text-[11px] font-medium text-primary-foreground"
          >
            AK
          </Link>
        </div>
      </div>
    </header>
  );
}
