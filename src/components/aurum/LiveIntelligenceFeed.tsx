import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { INDUSTRY_TO_CATEGORY } from "@/lib/industry/categoryMap";

type Entry = {
  id: string;
  title: string;
  source: string;
  category: string | null;
  description: string | null;
  image: string | null;
  url: string | null;
  published_at: string;
  created_at: string;
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

export function LiveIntelligenceFeed() {
  const { industryId } = useIndustry();
  const activeCategory = INDUSTRY_TO_CATEGORY[industryId];
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const load = async () => {
      const { data } = await (supabase.from("live_intelligence") as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (!mounted) return;
      setEntries([...((data as Entry[]) || [])]);
      setLastSync(new Date());
      setLoading(false);
    };

    load();
    const interval = setInterval(load, 30 * 60_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const visible = entries;


  return (
    <div className="relative glass rounded-2xl p-6 sm:p-7 overflow-hidden ring-gold">
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[var(--gradient-gold)] opacity-[0.06] blur-3xl" />

      <div className="relative">
        <div className="flex items-end justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              <div className="text-[10px] tracking-[0.34em] text-primary/80">LIVE</div>
            </div>
            <h2 className="font-serif text-xl sm:text-[22px] leading-tight">
              The <span className="italic text-gold-gradient">signal</span>
            </h2>
          </div>
          <div className="text-[10px] tracking-[0.25em] text-muted-foreground font-mono shrink-0 uppercase">
            {lastSync ? `Sync ${timeAgo(lastSync.toISOString())}` : "Syncing"}
          </div>
        </div>

        {loading && entries.length === 0 ? (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-secondary/20 animate-pulse" />
            ))}
          </div>
        ) : (
          <ul className="space-y-2">
            {visible.map((e, i) => {
              const content = (
                <div className="relative rounded-xl border border-border/40 bg-black/30 backdrop-blur-sm p-4 sm:p-5 transition-all hover:border-primary/40 hover:bg-black/50 active:scale-[0.99]">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles className="h-3 w-3 text-primary/80 shrink-0" />
                      <span className="text-[10px] tracking-[0.28em] uppercase text-primary/80 truncate">
                        {e.source}
                      </span>
                      {e.category && (
                        <span className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground border border-border/50 rounded px-1.5 py-0.5">
                          {e.category}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {timeAgo(e.created_at)}
                    </span>
                  </div>
                  <div className="text-[15px] sm:text-[15.5px] leading-snug text-foreground group-hover:text-primary transition-colors">
                    {e.title}
                  </div>
                  {e.description && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
                      {e.description}
                    </p>
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
                <li key={e.id} className="group animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  {e.url ? (
                    <a href={e.url} target="_blank" rel="noopener noreferrer" className="block">
                      {content}
                    </a>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
