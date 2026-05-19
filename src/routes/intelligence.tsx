import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/aurum/AppShell";
import { SectionHeading } from "@/components/aurum/SectionHeading";
import { Radio, TrendingUp, Globe2, Sparkles, Filter } from "lucide-react";

export const Route = createFileRoute("/intelligence")({
  component: Intelligence,
});

const signals = [
  { tag: "MARKET", t: "Benetti Oasis 67m delivered — Med charter inventory tightens by 18% YoY", n: "Reposition early. Brokers with summer 2026 capacity unbooked should secure UHNW commitments now.", time: "12m", region: "Monaco" },
  { tag: "DEAL", t: "Feadship 84m 'Lonian' sold off-market — Burgess closed", n: "Confirms appetite at $200M+ segment despite rate environment. Owner Ukrainian-flagged, watch successor inquiries.", time: "44m", region: "Amsterdam" },
  { tag: "PEOPLE", t: "Bernard Arnault yacht 'Symphony' refit at Lürssen — 8 weeks", n: "Spring relaunch likely. Onboard refresh = vendor pipeline opens (interior, AV, chef).", time: "2h", region: "Bremen" },
  { tag: "EVENT", t: "Cannes 2026 dates confirmed — Sept 8–13", n: "12 high-tier prospects in your network attending. Strategic pre-show outreach window: 6 weeks.", time: "5h", region: "Cannes" },
  { tag: "CULTURE", t: "Hybrid superyachts: search volume up 240% on luxury portals", n: "Authority opportunity. Publish primer this week before competitor brokerages.", time: "8h", region: "Global" },
  { tag: "REGULATORY", t: "Italian VAT lease scheme tightened — charter operators advised to restructure", n: "Affects ~60% of Med-flagged charter inventory. Talking point with Italian-based UHNW.", time: "1d", region: "Rome" },
  { tag: "MARKET", t: "Sanlorenzo 73Steel #3 enters resale within 14 months of delivery", n: "Asking €31.5M. Signal of soft secondary market — leverage for buyer-side mandates.", time: "1d", region: "La Spezia" },
];

function Intelligence() {
  return (
    <AppShell>
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8 animate-fade-up">
        <div>
          <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">
            AURUM INTELLIGENCE TERMINAL
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl">
            The signal beneath the noise.
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl text-sm">
            Real-time AI synthesis of luxury market movement, key player activity,
            UHNW behavior and emerging opportunities — analyzed for{" "}
            <span className="italic text-foreground">your</span> position.
          </p>
        </div>
        <div className="flex items-center gap-2 glass rounded-full px-4 py-2 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="tracking-[0.3em] text-muted-foreground">LIVE</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="font-mono text-foreground">Last sync 02:14 ago</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {[
          { i: Radio, l: "Signals today", v: "124" },
          { i: TrendingUp, l: "Actionable for you", v: "9" },
          { i: Globe2, l: "Markets monitored", v: "26" },
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

      <div className="flex items-center gap-3 mb-4 text-xs">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {["All", "Market", "Deal", "People", "Event", "Regulatory"].map((f, i) => (
          <button
            key={f}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              i === 0 ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <SectionHeading eyebrow="LATEST" title="Signals · synthesized" />
      <div className="space-y-1">
        {signals.map((s, i) => (
          <div
            key={i}
            className="group glass rounded-xl p-5 hover:ring-gold transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[9px] tracking-[0.3em] text-primary/80 px-2 py-0.5 border border-primary/30 rounded">
                {s.tag}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">{s.region}</span>
              <span className="text-[11px] text-muted-foreground font-mono ml-auto">{s.time}</span>
            </div>
            <div className="text-[16px] text-foreground leading-snug">{s.t}</div>
            <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 mt-0.5 text-primary/80 shrink-0" />
              <span>{s.n}</span>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
