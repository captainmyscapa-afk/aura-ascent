export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative h-7 w-7 rounded-md border border-primary/70 shadow-[var(--shadow-gold)]">
        <div className="absolute inset-[3px] rounded-[4px] bg-background flex items-center justify-center">
          <span className="font-serif text-[11px] text-gold-gradient leading-none">Au</span>
        </div>
      </div>
      <div className="font-serif text-[15px] tracking-tight text-foreground flex items-baseline gap-1.5">
        <span>Aurum</span>
        <span className="uppercase tracking-[0.22em] text-muted-foreground text-sm">OS</span>
      </div>
    </div>
  );
}

/** Large pulsing, glowing "Au" mark for loading states. */
export function LogoPulse({ label, className = "", decorative = false }: { label?: string; className?: string; decorative?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-5 ${className}`} {...(decorative ? { "aria-hidden": true } : { role: "status", "aria-live": "polite" as const })}>
      <div className="relative h-16 w-16 rounded-xl border border-primary/70 animate-logo-glow">
        <div className="absolute inset-[5px] rounded-[9px] bg-background flex items-center justify-center">
          <span className="font-serif text-2xl text-gold-gradient leading-none">Au</span>
        </div>
      </div>
      {label && <div className="text-[10px] tracking-[0.34em] text-muted-foreground uppercase">{label}</div>}
      {!label && !decorative && <span className="sr-only">Loading</span>}
    </div>
  );
}
