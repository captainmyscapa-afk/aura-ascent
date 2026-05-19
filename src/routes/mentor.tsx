import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/aurum/AppShell";
import { Sparkles, Send, MessageCircle, Compass, Target, Zap } from "lucide-react";

export const Route = createFileRoute("/mentor")({
  component: Mentor,
});

const seed = [
  {
    r: "ai",
    t: "Good morning, Alexander. I reviewed last night's market activity and your follow-up queue. Before we plan today: how did the call with the Camper & Nicholsons broker land?",
  },
  {
    r: "me",
    t: "It was good. They invited me to Monaco for the show but I'm nervous I won't hold my own with senior brokers.",
  },
  {
    r: "ai",
    t: "Understandable — and a sign you're entering the right room. Three things will neutralize that anxiety:\n\n1. Memorize three current market data points so you contribute, not just receive.\n2. Prepare two questions only an insider would ask — I'll draft them.\n3. Dress register: matte tones, restraint, one expensive detail. Avoid logos.\n\nWant me to build your full Monaco preparation brief now?",
  },
];

const prompts = [
  { i: Target, t: "Plan my week strategically" },
  { i: Compass, t: "Review my LinkedIn positioning" },
  { i: Zap, t: "Draft outreach for a UHNW prospect" },
  { i: MessageCircle, t: "Coach me through a difficult call" },
];

function Mentor() {
  const [input, setInput] = useState("");
  return (
    <AppShell>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 h-[calc(100vh-7rem)]">
        <div className="glass rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border/60">
            <div className="h-10 w-10 rounded-full bg-[var(--gradient-gold)] flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-serif text-lg leading-tight">AURUM</div>
              <div className="text-[11px] text-muted-foreground">
                Your elite-industry advisor · always present
              </div>
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] tracking-[0.3em] text-emerald-400/90">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {seed.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.r === "me" ? "justify-end" : "justify-start"} animate-fade-up`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div
                  className={`max-w-[78%] text-[15px] leading-relaxed whitespace-pre-line ${
                    m.r === "me"
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-5 py-3"
                      : "text-foreground"
                  }`}
                >
                  {m.t}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border/60 p-4">
            <div className="glass rounded-xl flex items-center gap-2 pl-5 pr-2 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AURUM anything — strategy, outreach, the industry…"
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button className="h-9 w-9 rounded-full bg-[var(--gradient-gold)] flex items-center justify-center text-primary-foreground">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-4 overflow-y-auto">
          <div className="glass rounded-xl p-5">
            <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-4">
              QUICK INVOCATIONS
            </div>
            <div className="space-y-2">
              {prompts.map(({ i: I, t }) => (
                <button
                  key={t}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 text-left text-sm transition-colors"
                >
                  <I className="h-4 w-4 text-primary shrink-0" />
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-3">
              CONTEXT LOADED
            </div>
            <ul className="text-xs text-foreground/90 space-y-2">
              <li>· Yacht Mode · Phase 02 (Brokerage immersion)</li>
              <li>· 12-day execution streak</li>
              <li>· 184 relationships (23 Tier-1)</li>
              <li>· Monaco Yacht Show in 4 weeks</li>
              <li>· Authority score 42 · trajectory ↑</li>
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
