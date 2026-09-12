// CAP-148 — bookmark-style credit plan card. Collapsed by default; click
// anywhere on the card to expand and reveal the full breakdown + CTA.
import { ChevronDown } from "lucide-react";
import type { PlanTier } from "@/lib/plans";
import type { T } from "@/lib/i18n/translations";

export function PlanCard({
  plan,
  expanded,
  onToggle,
  onSelect,
  t,
}: {
  plan: PlanTier;
  expanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  t: T;
}) {
  const badgeLabel =
    plan.badge === "popular" ? t.plansBadgeMostPopular : plan.badge === "bestValue" ? t.plansBadgeBestValue : null;

  return (
    <div
      onClick={onToggle}
      className={`relative rounded-2xl border cursor-pointer transition-all ${
        expanded ? "border-primary/50 bg-primary/5" : "border-border/60 bg-secondary/10 hover:border-primary/30"
      }`}
    >
      <div
        className="absolute -top-3 left-5 px-3 pt-1.5 pb-2.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-primary-foreground"
        style={{
          background: "var(--gradient-gold)",
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)",
        }}
      >
        {plan.name}
      </div>

      {badgeLabel && (
        <div className="absolute -top-3 right-4 px-2.5 py-1 rounded-full bg-foreground text-background text-[9px] font-semibold tracking-wide uppercase">
          {badgeLabel}
        </div>
      )}

      <div className="px-5 pt-9 pb-5">
        <div className="flex items-end justify-between gap-2">
          <div className="font-serif text-3xl">{plan.priceLabel}</div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 mb-1 ${expanded ? "rotate-180" : ""}`}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {t.plansCreditsLabel(plan.credits)} · {t.plansBonusLabel(plan.bonusCredits)}
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-border/50 animate-fade-up">
            <div className="text-sm text-foreground/90 mb-4">
              {t.plansCreditsLabel(plan.credits)} + {t.plansBonusLabel(plan.bonusCredits)} ={" "}
              <span className="text-primary font-medium">{plan.credits + plan.bonusCredits}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="w-full py-2.5 rounded-lg text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ background: "var(--gradient-gold)" }}
            >
              {t.plansCta}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
