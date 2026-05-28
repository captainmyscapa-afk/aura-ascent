import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { IndustrySwitcher } from "./IndustrySwitcher";
import { MobileNav } from "./MobileNav";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function TopBar() {
  const { user } = useAuth();
  const [initials, setInitials] = useState<string | null>(null);

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
        } else {
          const email = user.email ?? "";
          setInitials(email.slice(0, 2).toUpperCase() || "AU");
        }
      });
  }, [user]);

  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-border/60">
      <div className="flex items-center gap-3 px-4 sm:px-8 lg:px-12 h-14 lg:h-16">
        <div className="lg:hidden flex items-center gap-2">
          <MobileNav />
          <Link to="/app" aria-label="Aurum OS home">
            <Logo />
          </Link>
        </div>
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
            {initials}
          </Link>
        </div>
      </div>
    </header>
  );
}
