/**
 * ProGate — wraps a feature and shows an upgrade prompt when the free limit is hit.
 *
 * Usage:
 *   const { canUse, increment, remaining } = useProGate("studio_drafts");
 *   // call increment() after successful use
 *   // check canUse before allowing the action
 */

import { useState } from "react";
import { Lock, Zap } from "lucide-react";
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
