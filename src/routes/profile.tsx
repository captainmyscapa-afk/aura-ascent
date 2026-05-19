import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/aurum/AppShell";
import { SectionHeading } from "@/components/aurum/SectionHeading";
import { ArrowUpRight, Linkedin, Instagram, Globe } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

function Profile() {
  return (
    <AppShell>
      <div className="glass rounded-2xl overflow-hidden mb-10 animate-fade-up">
        <div className="h-32 bg-[var(--gradient-gold)] opacity-80" />
        <div className="px-8 pb-8 -mt-12">
          <div className="h-24 w-24 rounded-full bg-background border-4 border-background flex items-center justify-center font-serif text-3xl text-gold-gradient bg-[var(--gradient-card)]">
            AK
          </div>
          <div className="mt-4 flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-serif text-3xl">Alexander Kovac</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Yacht Brokerage · Monaco · Phase 02
              </p>
              <div className="flex items-center gap-3 mt-3 text-muted-foreground">
                <Linkedin className="h-4 w-4 hover:text-foreground cursor-pointer" />
                <Instagram className="h-4 w-4 hover:text-foreground cursor-pointer" />
                <Globe className="h-4 w-4 hover:text-foreground cursor-pointer" />
              </div>
            </div>
            <button className="text-xs glass rounded-full px-4 py-2 tracking-[0.2em] hover:ring-gold transition-all">
              EDIT IDENTITY
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-12">
        {[
          { l: "Authority Score", v: "42", n: "Top 14% of operators" },
          { l: "Visibility Index", v: "68", n: "+12 this month" },
          { l: "Trust Signal", v: "A−", n: "Profile integrity strong" },
        ].map((m) => (
          <div key={m.l} className="glass rounded-xl p-6">
            <div className="text-[10px] tracking-[0.34em] text-muted-foreground">{m.l}</div>
            <div className="font-serif text-5xl mt-3 text-gold-gradient">{m.v}</div>
            <div className="text-xs text-muted-foreground mt-2">{m.n}</div>
          </div>
        ))}
      </div>

      <SectionHeading eyebrow="POSITIONING AUDIT" title="AURUM's read on your identity" />
      <div className="glass rounded-xl p-6 space-y-5">
        {[
          {
            t: "Strengthen your LinkedIn headline",
            n: "Replace 'Aspiring yacht broker' with industry-anchored positioning: 'Mediterranean charter & brokerage — Monaco'. Doubles inbound recognition.",
            c: "HIGH IMPACT",
          },
          {
            t: "Publish weekly market commentary",
            n: "You've completed 12 modules. You have insider vocabulary now — use it publicly to compound authority.",
            c: "COMPOUNDING",
          },
          {
            t: "Photography upgrade",
            n: "One editorial portrait (matte black, soft side light) outperforms 10 corporate headshots in your category.",
            c: "TASTE",
          },
        ].map((r) => (
          <div key={r.t} className="border-t border-border/60 first:border-0 pt-5 first:pt-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[9px] tracking-[0.3em] text-primary/80 mb-1">{r.c}</div>
                <div className="font-serif text-lg">{r.t}</div>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{r.n}</p>
              </div>
              <button className="text-xs text-foreground inline-flex items-center gap-1 hover:text-primary transition-colors shrink-0">
                Act on this <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
