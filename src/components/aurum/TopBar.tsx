import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { IndustrySwitcher } from "./IndustrySwitcher";
import { MobileNav } from "./MobileNav";
import { NotificationPanel } from "./NotificationPanel";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, Check, Sparkles, Gem } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Lang, T } from "@/lib/i18n/translations";
import { PlansModal } from "./PlansModal";
import { CreditBoostsModal } from "./CreditBoostsModal";
import { useGemBalance } from "@/hooks/useGemBalance";

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

function GemBalanceWidget({ t }: { t: T }) {
  const { balance, monthlyAllotment } = useGemBalance();
  const pct = monthlyAllotment > 0 ? Math.min(100, Math.round((balance / monthlyAllotment) * 100)) : 0;

  return (
    <div className="hidden md:flex items-center gap-2 glass rounded-full px-3 py-1.5">
      <Gem className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground whitespace-nowrap">
        {t.gemsLabel}
      </span>
      <span className="text-xs font-semibold text-foreground whitespace-nowrap">
        {balance}/{monthlyAllotment}
      </span>
      <div className="w-16 h-1.5 rounded-full bg-secondary/60 overflow-hidden shrink-0">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: "var(--gradient-gold)" }}
        />
      </div>
    </div>
  );
}

export function TopBar() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [initials, setInitials] = useState<string | null>(null);
  const [plansOpen, setPlansOpen] = useState(false);
  const [boostsOpen, setBoostsOpen] = useState(false);

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
        <div className="hidden md:flex flex-1 items-center justify-center">
          <GemBalanceWidget t={t} />
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <PlansModal open={plansOpen} onClose={() => setPlansOpen(false)} t={t} />
          <CreditBoostsModal open={boostsOpen} onClose={() => setBoostsOpen(false)} t={t} />
          <button
            onClick={() => setBoostsOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground border border-primary/20 hover:border-primary/50 hover:text-foreground transition-colors"
          >
            <Gem className="h-3 w-3" />
            {t.gemsNeedMore}
          </button>
          <button
            onClick={() => setPlansOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            style={{ background: "var(--gradient-gold)" }}
          >
            <Sparkles className="h-3 w-3" />
            <span className="hidden sm:inline">{t.plansUpgradeButton}</span>
          </button>
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
