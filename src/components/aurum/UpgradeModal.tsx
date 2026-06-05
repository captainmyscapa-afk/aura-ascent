import { Sparkles, X, Check, Zap } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useState } from "react";

const PRO_FEATURES = [
  "Full Academy — all tracks, all modules",
  "Unlimited AURUM Mentor conversations",
  "AURUM Signal intelligence feed — daily curated news",
  "Content Studio — unlimited generation + AI visuals",
  "Industry event calendar with content prep windows",
  "Network introductions — AI-drafted, personalised",
  "Priority AI responses",
];

const FREE_FEATURES = [
  "Dashboard + daily ritual",
  "Academy Module 01 (preview)",
  "10 mentor messages / day",
  "Basic intelligence feed",
];

export function UpgradeModal({
  open,
  onClose,
  reason,
}: {
  open: boolean;
  onClose: () => void;
  reason?: string; // e.g. "Unlimited mentor access is a Pro feature."
}) {
  const { startCheckout } = useSubscription();
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    await startCheckout();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl max-w-lg w-full p-8 border border-primary/20 shadow-[0_0_60px_rgba(201,168,76,0.1)]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--gradient-gold)" }}
          >
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-[10px] tracking-[0.3em] text-primary/80 uppercase">Upgrade</div>
            <div className="font-serif text-xl">AURUM Pro</div>
          </div>
        </div>

        {reason && (
          <p className="text-sm text-muted-foreground mb-6 pb-6 border-b border-border/60">
            {reason}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-muted-foreground mb-3">FREE</div>
            <ul className="space-y-2">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground/50" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
            <div className="text-[10px] tracking-[0.3em] text-primary/80 mb-3">PRO</div>
            <ul className="space-y-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                  <Check className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-primary-foreground font-medium text-sm tracking-wide disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{ background: "var(--gradient-gold)" }}
        >
          {loading ? (
            "Redirecting to checkout…"
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Upgrade to Pro — £29/month
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-muted-foreground mt-3">
          Cancel anytime · Secure payment via Stripe
        </p>
      </div>
    </div>
  );
}

// Convenience hook to show upgrade modal at friction points
export function useUpgradeModal() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | undefined>();
  const { isPro } = useSubscription();

  const requirePro = (featureReason?: string): boolean => {
    if (isPro) return true;
    setReason(featureReason);
    setOpen(true);
    return false;
  };

  return { open, reason, setOpen, requirePro, isPro };
}
