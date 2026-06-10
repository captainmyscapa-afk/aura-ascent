import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { IndustrySwitcher } from "./IndustrySwitcher";
import { MobileNav } from "./MobileNav";
import { NotificationPanel } from "./NotificationPanel";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Lang } from "@/lib/i18n/translations";

const LANG_OPTIONS: { lang: Lang; flag: string; label: string }[] = [
  { lang: "en", flag: "🇬🇧", label: "English" },
  { lang: "fr", flag: "🇫🇷", label: "Français" },
];

function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANG_OPTIONS.find((o) => o.lang === lang)!;

  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOut);
    return () => document.removeEventListener("mousedown", onClickOut);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 glass rounded-full px-2.5 py-1.5 text-xs text-foreground hover:ring-gold transition-all"
        aria-label="Change language"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 glass-strong rounded-xl p-1.5 z-50 animate-fade-up shadow-[var(--shadow-elegant)]">
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.lang}
              onClick={() => { setLang(opt.lang); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
                lang === opt.lang ? "bg-secondary/60" : "hover:bg-secondary/40"
              }`}
            >
              <span className="text-base leading-none">{opt.flag}</span>
              <span className="text-[12px] tracking-wide">{opt.label}</span>
              {lang === opt.lang && <Check className="h-3 w-3 text-primary ml-auto shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
    <header
      className="sticky top-0 z-30 glass-strong border-b border-border/60"
      style={{ paddingTop: "env(safe-area-inset-top)", viewTransitionName: "aurum-topbar" }}
    >
      <div className="flex items-center gap-3 px-4 sm:px-8 lg:px-12 h-14 lg:h-16">
        <div className="lg:hidden flex items-center gap-2">
          <MobileNav />
          <Link to="/app" aria-label="Aurum OS home">
            <Logo />
          </Link>
        </div>
        <div className="hidden md:flex flex-1" />
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <div className="hidden sm:block">
            <IndustrySwitcher />
          </div>
          <div className="sm:hidden">
            <IndustrySwitcher compact />
          </div>
          <NotificationPanel />
          <Link
            to="/profile"
            className="hidden sm:flex h-9 w-9 rounded-full bg-[var(--gradient-gold)] items-center justify-center text-[11px] font-medium text-primary-foreground"
          >
            {initials ?? "AU"}
          </Link>
        </div>
      </div>
    </header>
  );
}
