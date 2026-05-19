export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative h-7 w-7">
        <div className="absolute inset-0 rounded-sm bg-[var(--gradient-gold)] opacity-90" />
        <div className="absolute inset-[3px] rounded-[2px] bg-background flex items-center justify-center">
          <span className="font-serif text-[13px] leading-none text-gold-gradient">A</span>
        </div>
      </div>
      <div className="leading-none">
        <div className="font-serif text-base tracking-[0.18em] text-foreground">AURUM</div>
        <div className="mt-0.5 text-[9px] tracking-[0.4em] text-muted-foreground">OS</div>
      </div>
    </div>
  );
}
