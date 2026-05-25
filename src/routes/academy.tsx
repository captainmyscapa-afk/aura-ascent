import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/aurum/AppShell";
import { SectionHeading } from "@/components/aurum/SectionHeading";
import { Play, Lock, Sparkles } from "lucide-react";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { INDUSTRY_LIST } from "@/lib/industry/config";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/academy")({
  component: () => (
    <RequireAuth>
      <Academy />
    </RequireAuth>
  ),
});

function Academy() {
  const { industry, industryId, setIndustry } = useIndustry();

  return (
    <AppShell>
      <div className="mb-10 animate-fade-up">
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">
          ACADEMY · {industry.modeLabel.toUpperCase()}
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl">
          Become an insider — <span className="italic text-gold-gradient">methodically.</span>
        </h1>
      </div>

      <SectionHeading eyebrow="TRACKS" title="Industry curricula" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
        {INDUSTRY_LIST.map((t) => {
          const active = t.id === industryId;
          return (
            <button
              key={t.id}
              onClick={() => setIndustry(t.id)}
              className={`text-left glass rounded-xl overflow-hidden group cursor-pointer ${
                active ? "ring-gold" : ""
              }`}
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={t.ambientImage}
                  alt={t.trackName}
                  className="h-full w-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                  loading="lazy"
                  width={800}
                  height={600}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              </div>
              <div className="p-5">
                <div className="font-serif text-lg">{t.trackName}</div>
                <div className="mt-1 text-xs text-muted-foreground">{t.trackModules} modules</div>
                <div className="mt-4 h-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--gradient-gold)]"
                    style={{ width: `${(t.trackProgress / t.trackModules) * 100}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground font-mono">
                  {t.trackProgress}/{t.trackModules} complete
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <SectionHeading
        eyebrow={`ACTIVE TRACK · ${industry.trackName.toUpperCase()}`}
        title="Continue your immersion"
      />
      <div className="glass rounded-xl divide-y divide-border/60">
        {industry.modules.map((m) => (
          <div
            key={m.n}
            className={`flex items-center gap-5 p-5 transition-colors ${
              m.state === "locked" ? "opacity-50" : "hover:bg-secondary/30 cursor-pointer"
            } ${m.state === "current" ? "bg-secondary/40" : ""}`}
          >
            <div className="font-mono text-xs text-muted-foreground w-8">{m.n}</div>
            <div className="flex-1">
              <div className="text-foreground">{m.t}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">{m.dur}</div>
            </div>
            {m.state === "done" && (
              <span className="text-[10px] tracking-[0.3em] text-primary/80">COMPLETED</span>
            )}
            {m.state === "current" && (
              <button className="inline-flex items-center gap-2 bg-[var(--gradient-gold)] text-primary-foreground rounded-full px-4 py-2 text-xs">
                <Play className="h-3 w-3" /> Continue
              </button>
            )}
            {m.state === "locked" && <Lock className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <div className="glass rounded-xl mt-8 p-6 flex items-start gap-4">
        <Sparkles className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <div className="font-serif text-lg">AI tutor for this module</div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{industry.tutorBlurb}</p>
          <Link to="/tutor" className="mt-3 inline-block text-sm text-primary hover:underline">Begin role-play →</Link>
        </div>
      </div>
    </AppShell>
  );
}
