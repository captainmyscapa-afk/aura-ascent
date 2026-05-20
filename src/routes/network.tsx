import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/aurum/AppShell";
import { SectionHeading } from "@/components/aurum/SectionHeading";
import { Users, MessageCircle, Sparkles } from "lucide-react";
import { useIndustry } from "@/lib/industry/IndustryProvider";

export const Route = createFileRoute("/network")({
  component: Network,
});

function Network() {
  const { industry } = useIndustry();

  return (
    <AppShell>
      <div className="mb-10 animate-fade-up">
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">
          NETWORK · {industry.modeLabel.toUpperCase()}
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl">
          The room you're <span className="italic text-gold-gradient">already in.</span>
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl text-sm">
          Curated circles, mentorship, and warm introductions inside the{" "}
          {industry.label.toLowerCase()} world — engineered to compress a decade of proximity.
        </p>
      </div>

      <SectionHeading eyebrow="CIRCLES" title="Active communities" />
      <div className="grid md:grid-cols-2 gap-4 mb-14">
        {industry.circles.map((c) => (
          <div
            key={c.name}
            className="glass rounded-xl p-5 hover:ring-gold transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-[9px] tracking-[0.3em] text-primary/80 px-2 py-0.5 border border-primary/30 rounded">
                {c.tier}
              </span>
              <span className="ml-auto text-xs text-muted-foreground font-mono">
                {c.members} members
              </span>
            </div>
            <div className="font-serif text-xl">{c.name}</div>
            <div className="text-sm text-muted-foreground mt-1">{c.note}</div>
          </div>
        ))}
      </div>

      <SectionHeading
        eyebrow="SUGGESTED INTRODUCTIONS"
        title={`${industry.terms.client}s AURUM curated for you`}
        action={<span className="text-xs text-muted-foreground">Refreshed daily</span>}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {industry.people.map((p) => (
          <div key={p.n} className="glass rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-[var(--gradient-gold)] flex items-center justify-center font-mono text-primary-foreground">
                {p.n.split(" ").map((x) => x[0]).join("")}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-serif text-lg leading-tight">{p.n}</div>
                  <span className="text-[9px] tracking-[0.3em] text-primary/80">T{p.tier}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{p.r}</div>
                <div className="text-[11px] text-muted-foreground/80 mt-0.5 font-mono">{p.c}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-foreground/90 border-t border-border/60 pt-3">
              <Sparkles className="h-3 w-3 text-primary/80" />
              {industry.introContext}
            </div>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 text-xs bg-secondary hover:bg-secondary/80 transition-colors rounded-md py-2 border border-border">
                Draft intro
              </button>
              <button className="h-8 w-8 rounded-md bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
                <MessageCircle className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
