/**
 * ProGate — wraps a feature and shows an upgrade prompt when the free limit is hit.
 *
 * Usage:
 *   const { canUse, increment, remaining } = useProGate("studio_drafts");
 *   // call increment() after successful use
 *   // check canUse before allowing the action
 */

import { useState, type ComponentType } from "react";
import { Lock, Zap, Check } from "lucide-react";
import { useFreeTier, type FreeTierKey, FREE_LIMITS } from "@/hooks/useFreeTier";
import { UpgradeModal } from "@/components/aurum/UpgradeModal";

export function useProGate(key: FreeTierKey) {
  const { isPro, hasRemaining, remaining, increment } = useFreeTier();

  const [showUpgrade, setShowUpgrade] = useState(false);

  function gate(reason?: string): boolean {
    if (isPro || hasRemaining(key)) return true;
    setShowUpgrade(true);
    return false;
  }

  return {
    isPro,
    canUse: isPro || hasRemaining(key),
    remaining: remaining(key),
    limit: FREE_LIMITS[key],
    increment,
    gate,
    showUpgrade,
    setShowUpgrade,
  };
}

export function UsageBar({
  used,
  limit,
  label,
}: {
  used: number;
  limit: number;
  label: string;
}) {
  const pct = Math.min((used / limit) * 100, 100);
  const left = Math.max(limit - used, 0);
  if (used === 0) return null;
  return (
    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
      <span>{left === 0 ? "No" : left} {label} remaining</span>
      <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden max-w-24">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: left === 0 ? "oklch(0.62 0.2 25)" : "var(--gradient-gold)",
          }}
        />
      </div>
    </div>
  );
}

/**
 * PageLock — full-page gate for Pro-only routes (e.g. Roadmap, AI Tutor).
 * Renders instead of the page's normal content for free-plan users, with a CTA
 * that opens UpgradeModal. Callers are responsible for the isPro/loading check
 * and for not running paid-API side effects (e.g. auto-generation) while locked.
 */
export function PageLock({
  icon: Icon,
  eyebrow,
  title,
  description,
  features,
  upgradeLabel,
  onUpgrade,
}: {
  icon: ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  description: string;
  features?: string[];
  upgradeLabel: string;
  onUpgrade: () => void;
}) {
  return (
    <div className="glass rounded-2xl p-10 sm:p-16 text-center max-w-xl mx-auto mt-6 animate-fade-up">
      <div className="h-14 w-14 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: "var(--gradient-gold)" }}>
        <Icon className="h-6 w-6 text-primary-foreground" />
      </div>
      <div className="text-[10px] tracking-[0.34em] text-primary/80 uppercase mb-3">{eyebrow}</div>
      <h1 className="font-serif text-3xl mb-3">{title}</h1>
      <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">{description}</p>
      {features && features.length > 0 && (
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
          onClick={onUpgrade}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: "var(--gradient-gold)", color: "#080808" }}
        >
          <Zap className="h-4 w-4" />
          {upgradeLabel}
        </button>
      </div>
    </div>
  );
}

export function LockedOverlay({
  reason,
  onUpgrade,
}: {
  reason: string;
  onUpgrade: () => void;
}) {
  return (
    <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-3 z-10"
      style={{ background: "oklch(0.13 0.005 240 / 85%)", backdropFilter: "blur(4px)" }}>
      <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
        <Lock className="h-5 w-5 text-primary" />
      </div>
      <p className="text-sm text-center text-muted-foreground max-w-48">{reason}</p>
      <button
        onClick={onUpgrade}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
        style={{ background: "var(--gradient-gold)", color: "#080808" }}
      >
        <Zap className="h-3.5 w-3.5" /> Upgrade to Pro
      </button>
    </div>
  );
}
