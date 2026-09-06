import type { T } from "@/lib/i18n/translations";

// Shared by Sidebar + MobileNav to render total_active_seconds consistently.
export function formatActiveSeconds(totalSeconds: number, t: T): string {
  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) return t.activeMinutes(totalMinutes);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return t.activeHours(hours, minutes);
}
