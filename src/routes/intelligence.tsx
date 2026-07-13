import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/aurum/AppShell";
import { SectionHeading } from "@/components/aurum/SectionHeading";
import { ArrowUpRight, Radio, TrendingUp, Globe2, Sparkles } from "lucide-react";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { INDUSTRY_TO_CATEGORY } from "@/lib/industry/categoryMap";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { T } from "@/lib/i18n/translations";

export const Route = createFileRoute("/intelligence")({
  component: Intelligence,
});

type Entry = {
  id: number; // matches live_intelligence.id which is a serial integer
  title: string;
  source: string;
  category: string | null;
  description: string | null;
  image: string | null;
  url: string | null;
  published_at: string;
  created_at: string;
};

function timeAgo(iso: string, t: T): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60_000);
  if (m < 1) return t.intelJustNow;
  if (m < 60) return t.intelMinAgo(m);
  const h = Math.floor(m / 60);
  if (h < 24) return t.intelHourAgo(h);
  const d = Math.floor(h / 24);
  return t.intelDayAgo(d);
}

function Intelligence() {
  const { t } = useLanguage();
  const { industry, industryId } = useIndustry();
  const navigate = useNavigate();
  const category = INDUSTRY_TO_CATEGORY[industryId];
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const load = async () => {
      // 30-day window so feed never goes empty if pipeline is delayed
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("live_intelligence")
        .select("*")
        .eq("category", category)
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!mounted) return;
      setEntries([...((data as unknown as Entry[]) || [])]);
      setLastSync(new Date());
      setLoading(false);
    };

    load();
    const interval = setInterval(load, 30 * 60_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [category]);

  const visible = entries.filter((e) => e.category === category);
  const sourceCount = new Set(visible.map((e) => e.source)).size;

  return (
    <AppShell>
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8 animate-fade-up">
        <div>
          <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">
            {t.intelEyebrow(industry.modeLabel, t.categoryLabel(category))}
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl">{t.intelHeadline}</h1>
          <p className="mt-3 text-muted-foreground max-w-xl text-sm">
            {t.intelDescPre}
            <span className="italic text-foreground">{t.intelYour}</span>{t.intelDescPost(industry.label)}
          </p>
        </div>
        <div className="flex items-center gap-2 glass rounded-full px-4 py-2 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="tracking-[0.3em] text-muted-foreground">{t.intelLive}</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="font-mono text-foreground">
            {lastSync ? t.intelSync(timeAgo(lastSync.toISOString(), t)) : t.intelSyncing}
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {[
          { i: Radio, l: t.intelSignalsTracked, v: String(visible.length) },
          { i: TrendingUp, l: t.intelSources, v: String(sourceCount) },
          { i: Globe2, l: t.intelRealtime, v: t.intelOn },
        ].map(({ i: I, l, v }) => (
          <div key={l} className="glass rounded-xl p-5 flex items-center gap-4">
            <I className="h-5 w-5 text-primary" />
            <div>
              <div className="text-[10px] tracking-[0.3em] text-muted-foreground">{l}</div>
              <div className="font-serif text-2xl mt-0.5">{v}</div>
            </div>
          </div>
        ))}
      </div>

      <SectionHeading eyebrow={t.intelLatest} title={t.intelSignalsOf(t.categoryLabel(category))} />

      {loading && entries.length === 0 ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-secondary/20 animate-pulse" />
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((e, i) => {
            const inner = (
              <div className="group glass rounded-xl p-5 hover:ring-gold transition-all">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="text-[9px] tracking-[0.3em] text-primary/80 px-2 py-0.5 border border-primary/30 rounded uppercase">
                    {e.source}
                  </span>
                  {e.category && (
                    <span className="text-[9px] tracking-[0.3em] text-muted-foreground px-2 py-0.5 border border-border/50 rounded uppercase">
                      {t.categoryLabel(e.category)}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground font-mono ml-auto">{timeAgo(e.created_at, t)}</span>
                </div>
                <div className="text-[16px] text-foreground leading-snug group-hover:text-primary transition-colors">
                  {e.title}
                </div>
                {e.description && (
                  <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 mt-0.5 text-primary/80 shrink-0" />
                    <span>{e.description}</span>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between">
                  {e.url ? (
                    <div className="flex items-center gap-1 text-[11px] tracking-[0.2em] uppercase text-primary/80">
                      {t.intelReadBrief}
                      <ArrowUpRight className="h-3 w-3" />
                    </div>
                  ) : (
                    <span />
                  )}
                  <button
                    onClick={(evt) => {
                      evt.preventDefault();
                      evt.stopPropagation();
                      navigate({ to: "/studio", search: { intel: String(e.id), idea: undefined } });
                    }}
                    className="flex items-center gap-1 text-[11px] tracking-[0.2em] uppercase text-primary/80 hover:text-primary transition-colors"
                  >
                    <Sparkles className="h-3 w-3" />
                    {t.intelGenerateContent}
                  </button>
                </div>
              </div>
            );
            return (
              <li key={e.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                {e.url ? (
                  <a href={e.url} target="_blank" rel="noopener noreferrer" className="block">
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
