// CAP-148 — "Upgrade" popup listing the 4 credit-pack plans. Visual only for
// now: selecting a plan shows a "coming soon" toast rather than checkout.
//
// Rendered via a portal into document.body: the trigger button lives in
// TopBar's <header>, which has the `glass-strong` class (backdrop-filter).
// backdrop-filter creates a new containing block for `position: fixed`
// descendants, so without the portal this modal's `inset-0` resolved against
// the header's small box instead of the viewport.
import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PLAN_TIERS } from "@/lib/plans";
import { PlanCard } from "./PlanCard";
import type { T } from "@/lib/i18n/translations";

export function PlansModal({ open, onClose, t }: { open: boolean; onClose: () => void; t: T }) {
  const [expandedId, setExpandedId] = useState<string | null>("basic");

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl max-w-2xl w-full p-8 border border-primary/20 shadow-[0_0_60px_rgba(201,168,76,0.1)] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--gradient-gold)" }}
          >
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-[10px] tracking-[0.3em] text-primary/80 uppercase">AURUM OS</div>
            <div className="font-serif text-xl">{t.plansModalTitle}</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-6">{t.plansModalDesc}</p>

        <div className="grid sm:grid-cols-2 gap-5 mt-2">
          {PLAN_TIERS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              expanded={expandedId === plan.id}
              onToggle={() => setExpandedId((cur) => (cur === plan.id ? null : plan.id))}
              onSelect={() => toast(t.plansComingSoon)}
              t={t}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
