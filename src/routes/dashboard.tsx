import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  ArrowUpRight,
  Flame,
  Trophy,
  Radio,
  Sparkles,
  ChevronRight,
  Calendar,
  MessageCircle,
  Check,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/aurum/AppShell";
import { SectionHeading } from "@/components/aurum/SectionHeading";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { INDUSTRY_LIST } from "@/lib/industry/config";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { industry, industryId, setIndustry } = useIndustry();
  const [done, setDone] = useState<Record<number, boolean>>({ 0: true, 1: true });

  const toggle = (i: number) => setDone((d) => ({ ...d, [i]: !d[i] }));
  const completed = industry.dailyObjectives.filter((_, i) => done[i]).length;

  const otherModes = INDUSTRY_LIST.filter((m) => m.id !== industryId);

  return (
    <AppShell>
      {/* Hero greeting */}
      <section className="mb-10 animate-fade-up">
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">
          TUESDAY · 19 MAY · {industry.modeLabel.toUpperCase()}
        </div>
        <div className="flex items-end justify-between flex-wrap gap-6">
          <h1 className="font-serif text-3xl sm:text-[42px] leading-tight">
            Good morning, Alexander.
            <br />
            <span className="text-muted-foreground">{industry.greetingSubtitle}</span>
          </h1>
          <div className="flex items-center gap-3">
            <Link
              to="/mentor"
              className="inline-flex items-center gap-2 bg-[var(--gradient-gold)] text-primary-foreground rounded-full px-5 py-2.5 text-sm shadow-[var(--shadow-gold)]"
            >
              <Sparkles className="h-4 w-4" />
              Speak with AURUM
            </Link>
          </div>
        </div>

        {/* Market trend chips */}
        <div className="mt-5 flex flex-wrap gap-2">
          {industry.marketTrends.map((t) => (
            <span
              key={t}
              className="text-[11px] tracking-wide text-foreground/80 glass rounded-full px-3 py-1.5 border border-border/60"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Metric strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <Metric label="MOMENTUM" value="87" delta="+6" hint="of 100 · top 8%" highlight />
        <Metric label="AUTHORITY" value="42" delta="+3" hint="LinkedIn + IG composite" />
        <Metric label="STREAK" value="12d" hint="Consecutive execution" />
        <Metric label="RELATIONSHIPS" value="184" delta="+9" hint="Tier-1: 23" />
      </section>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <section className="lg:col-span-2 space-y-6">
          <div className="glass rounded-xl p-6 sm:p-7 relative overflow-hidden">
            <SectionHeading
              eyebrow={`DAILY OS · ${industry.modeLabel.toUpperCase()}`}
              title="Today's execution"
              action={
                <span className="text-xs text-muted-foreground font-mono">
                  {completed} / {industry.dailyObjectives.length} complete
                </span>
              }
            />
            <div className="space-y-2">
              {industry.dailyObjectives.map((t, i) => {
                const isDone = !!done[i];
                return (
                  <button
                    key={i}
                    onClick={() => toggle(i)}
                    className={`group w-full text-left flex items-center gap-4 p-4 rounded-lg border transition-all ${
                      isDone
                        ? "border-border/40 bg-secondary/20"
                        : "border-border hover:border-primary/40 bg-secondary/40"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                        isDone
                          ? "bg-primary border-primary"
                          : "border-border group-hover:border-primary"
                      }`}
                    >
                      {isDone && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div
                      className={`flex-1 text-sm ${
                        isDone ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {t}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
            <button className="mt-4 flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add custom ritual
            </button>
          </div>

          {/* Intelligence preview */}
          <div className="glass rounded-xl p-6 sm:p-7">
            <SectionHeading
              eyebrow="LIVE INTELLIGENCE"
              title={
                <>
                  {industry.shortLabel} <span className="italic text-gold-gradient">terminal</span>
                </>
              }
              action={
                <Link
                  to="/intelligence"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  All signals <ArrowUpRight className="h-3 w-3" />
                </Link>
              }
            />
            <div className="space-y-1">
              {industry.intelFeed.slice(0, 4).map((item, i) => (
                <div
                  key={i}
                  className="group p-4 -mx-2 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-[9px] tracking-[0.3em] text-primary/80 px-2 py-0.5 border border-primary/30 rounded">
                      {item.tag}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">{item.time}</span>
                  </div>
                  <div className="text-[15px] text-foreground leading-snug group-hover:text-primary transition-colors">
                    {item.title}
                  </div>
                  <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 mt-0.5 text-primary/70 shrink-0" />
                    <span>{item.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT */}
        <aside className="space-y-6">
          {/* Active ecosystem */}
          <div className="glass rounded-xl overflow-hidden relative group">
            <img
              src={industry.ambientImage}
              alt={`${industry.modeLabel} ecosystem`}
              className="h-44 w-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
              loading="lazy"
              width={1920}
              height={1080}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
            <div className="absolute inset-0 p-5 flex flex-col justify-end">
              <div className="text-[10px] tracking-[0.34em] text-primary/90">YOUR ECOSYSTEM</div>
              <div className="font-serif text-2xl mt-1">{industry.modeLabel}</div>
              <div className="text-xs text-muted-foreground mt-1">{industry.phaseLabel}</div>
            </div>
          </div>

          {/* Switch ecosystem */}
          <div className="glass rounded-xl p-5">
            <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-4">
              SWITCH ECOSYSTEM
            </div>
            <div className="grid grid-cols-3 gap-2">
              {otherModes.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setIndustry(m.id)}
                    className="group relative aspect-square rounded-md overflow-hidden border border-border hover:border-primary/60 transition-all"
                    title={`Enter ${m.modeLabel}`}
                  >
                    <img
                      src={m.ambientImage}
                      alt={m.label}
                      className="h-full w-full object-cover opacity-60 group-hover:opacity-90 transition-opacity"
                      loading="lazy"
                      width={400}
                      height={400}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
                    <Icon className="absolute top-2 right-2 h-3.5 w-3.5 text-primary/90" />
                    <div className="absolute bottom-1.5 left-2 text-[11px] tracking-wide text-foreground">
                      {m.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI suggestions */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <div className="text-[10px] tracking-[0.34em] text-foreground">AI RECOMMENDATION</div>
            </div>
            <div className="font-serif text-lg leading-snug">"{industry.aiRecommendation}"</div>
            <button className="mt-4 w-full text-sm bg-secondary hover:bg-secondary/80 transition-colors rounded-md py-2.5 border border-border">
              Generate outreach draft
            </button>
          </div>

          {/* Upcoming */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-primary" />
              <div className="text-[10px] tracking-[0.34em] text-foreground">UPCOMING</div>
            </div>
            <div className="space-y-3">
              {industry.upcoming.map(([d, t]) => (
                <div key={t} className="flex items-baseline gap-3 text-sm">
                  <span className="font-mono text-[10px] text-primary/80 w-14 tracking-widest shrink-0">
                    {d}
                  </span>
                  <span className="text-foreground/90">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Achievements row */}
      <section className="mt-12">
        <SectionHeading eyebrow="PROGRESSION" title="Recently unlocked" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Flame, name: "10-day streak", note: "Daily execution unlocked" },
            { icon: Trophy, name: "First intro secured", note: `Tier-2 ${industry.terms.client.toLowerCase()} contact` },
            { icon: Radio, name: "Authority threshold", note: "Crossed 40 · top 14%" },
            { icon: MessageCircle, name: "Mentor sync", note: "5 strategy sessions" },
          ].map(({ icon: Icon, name, note }) => (
            <div key={name} className="glass rounded-xl p-5 group hover:ring-gold transition-all">
              <Icon className="h-5 w-5 text-primary mb-3" />
              <div className="font-serif text-lg">{name}</div>
              <div className="text-xs text-muted-foreground mt-1">{note}</div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  delta,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative rounded-xl p-5 glass overflow-hidden ${highlight ? "ring-gold" : ""}`}
    >
      {highlight && (
        <div className="absolute inset-0 bg-[var(--gradient-gold)] opacity-[0.04] pointer-events-none" />
      )}
      <div className="text-[10px] tracking-[0.34em] text-muted-foreground">{label}</div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className={`font-serif text-4xl ${highlight ? "text-gold-gradient" : "text-foreground"}`}>
          {value}
        </span>
        {delta && (
          <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-400/90">
            <TrendingUp className="h-3 w-3" /> {delta}
          </span>
        )}
      </div>
      {hint && <div className="mt-2 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
