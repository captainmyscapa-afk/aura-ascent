import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/aurum/AppShell";
import { SectionHeading } from "@/components/aurum/SectionHeading";
import { ArrowUpRight, Radio, TrendingUp, Globe2, Sparkles, Filter } from "lucide-react";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { INDUSTRY_TO_CATEGORY } from "@/lib/industry/categoryMap";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/intelligence")({
  component: Intelligence,
});

type Entry = {
  id: string;
  title: string;
  source: string;
  category: string | null;
  description: string | null;
  url: string | null;
  published_at: string;
  created_at: string;
};

type DebugResponse = {
  data: Entry[] | null;
  error: unknown;
};

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function Intelligence() {
  const { industry, industryId } = useIndustry();
  const category = INDUSTRY_TO_CATEGORY[industryId];
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setFilter("All");

    const load = async () => {
      const supabaseProjectUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = (await supabase
        .from("live_intelligence" as never)
        .select("*")
       .order('created_at', { ascending: false })
.limit(20)
      const { data, error } = response;
      console.log("[Intelligence DEBUG] Supabase project URL:", supabaseProjectUrl);
      console.log("[Intelligence DEBUG] table queried:", "public.live_intelligence");
      console.log("[Intelligence DEBUG] Supabase response:", response);
      console.log("[Intelligence DEBUG] returned row count:", data?.length ?? 0);
      console.log("[Intelligence DEBUG] returned rows:", data);
      console.log("[Intelligence DEBUG] query errors:", error);
      data?.forEach((r) => console.log(`[Intelligence DEBUG] created_at=${r.created_at} category=${r.category}`));
      console.log("SUPABASE DATA:", data);

      if (data) {
        console.log("LIVE ROWS:", data)
          setEntries([...data] as Entry[]);
      }
      setLastSync(new Date());
      setLoading(false);
    };

    load();
    const interval = setInterval(load, 45_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [category]);

  const sources = ["All", ...Array.from(new Set(entries.map((e) => e.source)))];
  const visible = entries;

  return (
    <AppShell>
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8 animate-fade-up">
        <div>
          <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">
            AURUM · {industry.modeLabel.toUpperCase()} · {category.toUpperCase()}
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl">The signal beneath the noise.</h1>
          <p className="mt-3 text-muted-foreground max-w-xl text-sm">
            Real-time synthesis from the AURUM intelligence network — curated for{" "}
            <span className="italic text-foreground">your</span> position in the {industry.label.toLowerCase()} market.
          </p>
        </div>
        <div className="flex items-center gap-2 glass rounded-full px-4 py-2 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="tracking-[0.3em] text-muted-foreground">LIVE</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="font-mono text-foreground">
            {lastSync ? `Sync ${timeAgo(lastSync.toISOString())}` : "Syncing…"}
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {[
          { i: Radio, l: "Signals tracked", v: String(entries.length) },
          { i: TrendingUp, l: "Sources", v: String(Math.max(0, sources.length - 1)) },
          { i: Globe2, l: "Realtime", v: "ON" },
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

      <div className="flex items-center gap-2 mb-4 text-xs flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {sources.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              filter === f
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <SectionHeading eyebrow="LATEST" title={`Signals · ${category}`} />

      {loading && entries.length === 0 ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-secondary/20 animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="glass rounded-xl py-16 text-center">
          <Radio className="h-6 w-6 text-primary/60 mx-auto mb-3" />
          <div className="text-sm text-muted-foreground">No live intelligence in {category} yet.</div>
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
                      {e.category}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground font-mono ml-auto">{timeAgo(e.created_at)}</span>
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
                {e.url && (
                  <div className="mt-3 flex items-center gap-1 text-[11px] tracking-[0.2em] uppercase text-primary/80">
                    Read brief
                    <ArrowUpRight className="h-3 w-3" />
                  </div>
                )}
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
