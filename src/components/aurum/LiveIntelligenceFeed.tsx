import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { INDUSTRY_TO_CATEGORY } from "@/lib/industry/categoryMap";

type Entry = {
  id: string;
  title: string;
  source: string;
  category: string | null;
  description: string | null;
  url: string | null;
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
  const category = INDUSTRY_TO_CATEGORY[industryId as keyof typeof INDUSTRY_TO_CATEGORY];
  const [entries, setEntries] = useState<Entry[]>([]);
  // RLS on live_intelligence requires an authenticated request (auth.role() =
  // 'authenticated'). useAuth's `loading` flag tracks whether the Supabase
  // client has finished restoring the session from storage; querying before
  // that resolves runs the SELECT as anon, RLS silently returns zero rows
  // (no error — just an empty feed), and this effect never re-fires because
  // it wasn't depending on auth state. Waiting on `loading` (and re-running
  // when the session itself changes, e.g. sign-in/out) fixes that race.
  const { loading: authLoading, session } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    const load = async () => {
      let query = (supabase.from("live_intelligence") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (category) query = query.eq("category", category);
      const { data, error } = await query;
      if (error) {
        console.error("LiveIntelligenceFeed: failed to load live_intelligence:", error);
        return;
      }
      setEntries([...((data as Entry[]) || [])]);
    };
    load();
  }, [category, authLoading, session?.user?.id]);

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
        </div>

        <ul className="space-y-2">
          {entries.map((e) => {
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
                  <span className="text-[11px] text-muted-foreground font-mono ml-auto">
                    {timeAgo(e.created_at)}
                  </span>
                </div>
                <div className="text-[16px] text-foreground leading-snug group-hover:text-primary transition-colors">
                  {e.title}
                </div>
                {e.description && (
                  <div className="mt-2 text-sm text-muted-foreground">{e.description}</div>
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
              <li key={e.id}>
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
      </div>
    </div>
  );
}
