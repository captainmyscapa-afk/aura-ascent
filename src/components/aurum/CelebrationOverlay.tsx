import { useCelebrationFeed } from "@/lib/celebration";

/**
 * Mounted once in AppShell. Any page fires a celebration with a plain
 * `celebrate({ icon, title, subtitle? })` call (see src/lib/celebration.ts)
 * — no prop drilling, no per-page overlay markup.
 */
export function CelebrationOverlay() {
  const { active, dismiss } = useCelebrationFeed();

  if (!active) return null;
  const Icon = active.icon;

  return (
    <div className="fixed inset-x-0 top-6 z-[60] flex justify-center px-4 pointer-events-none">
      <button
        onClick={dismiss}
        className="pointer-events-auto flex items-center gap-3 glass-strong rounded-2xl pl-4 pr-6 py-4 border border-primary/30 shadow-[0_0_60px_rgba(201,168,76,0.25)] animate-fade-up text-left"
      >
        <span
          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 animate-pulse-gold"
          style={{ background: "var(--gradient-gold)" }}
        >
          <Icon className="h-5 w-5 text-primary-foreground" />
        </span>
        <div>
          <div className="text-sm font-medium text-foreground">{active.title}</div>
          {active.subtitle && (
            <div className="text-xs text-muted-foreground">{active.subtitle}</div>
          )}
        </div>
      </button>
    </div>
  );
}
