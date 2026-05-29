import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { INDUSTRY_LIST } from "@/lib/industry/config";
import { toast } from "sonner";

export function IndustrySwitcher({ compact = false }: { compact?: boolean }) {
  const { industry, setIndustry } = useIndustry();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const ActiveIcon = industry.icon;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 glass rounded-full pl-2.5 pr-3 py-1.5 text-xs text-foreground hover:ring-gold transition-all"
      >
        <span
          className="h-6 w-6 rounded-full flex items-center justify-center"
          style={{ background: "var(--gradient-gold)" }}
        >
          <ActiveIcon className="lucide lucide-sailboat h-3.5 w-3.5 text-primary-foreground text-[#9c885e]" />
        </span>
        {!compact && (
          <>
            <span className="font-mono tracking-[0.2em] uppercase">{industry.modeLabel}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </>
        )}
        {compact && <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 glass-strong rounded-xl p-2 z-50 animate-fade-up shadow-[var(--shadow-elegant)]">
          <div className="px-3 py-2 text-[10px] tracking-[0.32em] text-muted-foreground">INDUSTRY ECOSYSTEM</div>
          {INDUSTRY_LIST.map((opt) => {
            const Icon = opt.icon;
            const active = opt.id === industry.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (!active) {
                    setIndustry(opt.id);
                    toast(`Entering ${opt.modeLabel}`, { description: opt.tagline });
                  }
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  active ? "bg-secondary/60" : "hover:bg-secondary/40"
                }`}
              >
                <span className="h-8 w-8 rounded-md bg-[var(--gradient-gold)] flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary-foreground" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-[15px] leading-tight">{opt.modeLabel}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{opt.tagline}</div>
                </div>
                {active && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
