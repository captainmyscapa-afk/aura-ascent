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
