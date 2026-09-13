// CAP-147 — "Need more capacity?" popup listing one-time Aurum Gems top-up
// tiers. Visual only for now: selecting a tier shows a "coming soon" toast
// rather than checkout (mirrors PlansModal.tsx's pattern exactly, including
// the createPortal fix for the backdrop-filter containing-block bug — see
// that file's header comment for why the portal is required here too).
//
// CAP-147 follow-up: Aurum Gems isn't linked to billing yet, so Captain asked
// to be able to control his own balance directly while testing. The section
// below is admin-only (RLS-enforced server-side too, not just hidden client
// UI — see the gem_balance_admin_self_control migration) and writes only the
// signed-in admin's own row.
import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Gem } from "lucide-react";
import { toast } from "sonner";
import type { T } from "@/lib/i18n/translations";
import { useGemBalance } from "@/hooks/useGemBalance";
import { useSubscription } from "@/hooks/useSubscription";

const BOOST_TIERS: { amount: number; priceLabel: string }[] = [
  { amount: 500, priceLabel: "24,99€" },
  { amount: 1000, priceLabel: "44,99€" },
  { amount: 2500, priceLabel: "99,99€" },
  { amount: 5000, priceLabel: "179,99€" },
];

export function CreditBoostsModal({ open, onClose, t }: { open: boolean; onClose: () => void; t: T }) {
  const { isAdmin } = useSubscription();
  const { balance, monthlyAllotment, setGemBalance } = useGemBalance();
  const [balanceInput, setBalanceInput] = useState("");
  const [allotmentInput, setAllotmentInput] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const applyBalance = async (nextBalance: number, nextAllotment?: number) => {
    setSaving(true);
    const ok = await setGemBalance(nextBalance, nextAllotment);
    setSaving(false);
    toast(ok ? t.gemsAdminSaved : t.gemsAdminFailed);
    setBalanceInput("");
    setAllotmentInput("");
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl max-w-md w-full p-8 border border-primary/20 shadow-[0_0_60px_rgba(201,168,76,0.1)] max-h-[90vh] overflow-y-auto">
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
            <Gem className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-[10px] tracking-[0.3em] text-primary/80 uppercase">AURUM OS</div>
            <div className="font-serif text-xl">{t.gemsBoostsTitle}</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-6">{t.gemsBoostsDesc}</p>

        <div className="grid grid-cols-2 gap-4 mt-2">
          {BOOST_TIERS.map((tier) => (
            <button
              key={tier.amount}
              onClick={() => toast(t.gemsComingSoon)}
              className="rounded-xl border border-primary/20 p-4 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center justify-center gap-1.5 text-lg font-serif text-primary">
                <Gem className="h-4 w-4" />
                {t.gemsBoostCta(tier.amount)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{tier.priceLabel}</div>
            </button>
          ))}
        </div>

        {isAdmin && (
          <div className="mt-6 pt-5 border-t border-border/50">
            <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
              {t.gemsAdminTitle}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <label className="text-xs">
                <span className="block text-muted-foreground mb-1">{t.gemsAdminBalanceLabel}</span>
                <input
                  type="number"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  placeholder={String(balance)}
                  className="w-full rounded-lg border border-border/60 bg-transparent px-2.5 py-1.5 text-sm text-foreground"
                />
              </label>
              <label className="text-xs">
                <span className="block text-muted-foreground mb-1">{t.gemsAdminAllotmentLabel}</span>
                <input
                  type="number"
                  value={allotmentInput}
                  onChange={(e) => setAllotmentInput(e.target.value)}
                  placeholder={String(monthlyAllotment)}
                  className="w-full rounded-lg border border-border/60 bg-transparent px-2.5 py-1.5 text-sm text-foreground"
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={saving || balanceInput.trim() === ""}
                onClick={() =>
                  void applyBalance(
                    Number(balanceInput),
                    allotmentInput.trim() === "" ? undefined : Number(allotmentInput),
                  )
                }
                className="flex-1 rounded-lg px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40 transition-opacity"
                style={{ background: "var(--gradient-gold)" }}
              >
                {t.gemsAdminSave}
              </button>
              <button
                disabled={saving}
                onClick={() => void applyBalance(0)}
                className="rounded-lg px-3 py-2 text-xs font-medium border border-primary/20 hover:border-primary/50 transition-colors disabled:opacity-40"
              >
                {t.gemsAdminReset}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
