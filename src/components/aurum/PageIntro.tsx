import { useState, type ComponentType } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useAurumCoreState } from "@/hooks/useAurumCoreState";

// Keep in sync with the pathname → config map in PageIntroConfig.ts
export type PageIntroKey =
  | "dashboard"
  | "roadmap"
  | "intelligence"
  | "mentor"
  | "academy"
  | "tutor"
  | "studio"
  | "calendar"
  | "network"
  | "profile";

/**
 * PageIntro — a welcome overlay explaining what a page is for, shown to
 * every user (not a paywall — see ProGate's PageLock for that). By default
 * it reappears on every visit; "Enter" only dismisses it for the current
 * visit, while checking "Don't show this again" persists the dismissal to
 * aurum_core_state.dismissed_page_intros so it's gone for good, everywhere.
 */
export function PageIntro({
  pageKey,
  icon: Icon,
  eyebrow,
  title,
  description,
  features,
  enterLabel,
  dontShowAgainLabel,
}: {
  pageKey: PageIntroKey;
  icon: ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  description: string;
  features: string[];
  enterLabel: string;
  dontShowAgainLabel: string;
}) {
  const { state: core, loading, update } = useAurumCoreState();
  const [entered, setEntered] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Wait for core state to resolve before deciding whether to show anything —
  // otherwise a permanently-dismissed intro would flash on screen for a beat
  // on every navigation while the row loads.
  if (loading || !core) return null;

  if (core.dismissed_page_intros.includes(pageKey) || entered) return null;

  const handleEnter = () => {
    if (dontShowAgain) {
      void update({ dismissed_page_intros: [...core.dismissed_page_intros, pageKey] });
    }
    setEntered(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative glass rounded-2xl p-10 sm:p-14 text-center max-w-lg w-full mx-auto border border-primary/20 shadow-[0_0_60px_rgba(201,168,76,0.1)] animate-fade-up">
        <div
          className="h-14 w-14 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: "var(--gradient-gold)" }}
        >
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="text-[10px] tracking-[0.34em] text-primary/80 uppercase mb-3">
          {eyebrow}
        </div>
        <h1 className="font-serif text-3xl mb-3">{title}</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
          {description}
        </p>

        {features.length > 0 && (
          <ul className="text-left inline-block mb-8 space-y-2">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        )}

        <div>
          <button
            onClick={handleEnter}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--gradient-gold)", color: "#080808" }}
          >
            {enterLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border accent-primary"
          />
          {dontShowAgainLabel}
        </label>
      </div>
    </div>
  );
}
