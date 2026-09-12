// CAP-148 — shared credit-pack tier data, used by the landing page pricing
// section and the in-app Plans modal. Visual/display only for now: no Stripe
// products or credits ledger exist yet (see useSubscription.ts LAUNCH_MODE).

export type PlanBadge = "popular" | "bestValue" | null;

export interface PlanTier {
  id: "starter" | "basic" | "pro" | "business";
  name: string;
  priceLabel: string;
  credits: number;
  bonusCredits: number;
  badge: PlanBadge;
}

export const PLAN_TIERS: PlanTier[] = [
  { id: "starter", name: "Aurum Starter", priceLabel: "9,99€", credits: 8, bonusCredits: 2, badge: null },
  { id: "basic", name: "Aurum Basic", priceLabel: "29,99€", credits: 40, bonusCredits: 10, badge: "popular" },
  { id: "pro", name: "Aurum Pro", priceLabel: "49,99€", credits: 80, bonusCredits: 20, badge: "bestValue" },
  { id: "business", name: "Business", priceLabel: "99,99€", credits: 200, bonusCredits: 50, badge: null },
];
