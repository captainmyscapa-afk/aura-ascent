import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/aurum/AppShell";
import { Sparkles, Send, MessageCircle, Compass, Target, Zap } from "lucide-react";
import { useIndustry, useIndustrySystemPrompt } from "@/lib/industry/IndustryProvider";
import { askGemini } from "@/lib/gemini.functions";

export const Route = createFileRoute("/mentor")({
  component: Mentor,
});

const promptIcons = [Target, Compass, Zap, MessageCircle];

function Mentor() {
  const { industry } = useIndustry();
  const systemPrompt = useIndustrySystemPrompt();
  const ask = useServerFn(askGemini);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [thread, setThread] = useState<Array<{ r: "ai" | "me"; t: string }> | null>(null);

  const seed = [
    { r: "ai", t: industry.mentorOpener },
    {
      r: "me",
      t: "It was good. They invited me to discuss further but I'm nervous I won't hold my own with senior players.",
    },
    {
      r: "ai",
      t: `Understandable — and a sign you're entering the right room. Three things will neutralize that anxiety in ${industry.label.toLowerCase()}:\n\n1. Memorize three current ${industry.terms.market.toLowerCase()} data points so you contribute, not just receive.\n2. Prepare two questions only an insider would ask — I'll draft them.\n3. Dress register: matte tones, restraint, one expensive detail. Avoid logos.\n\nWant me to build your full preparation brief now?`,
    },
  ];

  return (
    <AppShell>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 h-[calc(100vh-7rem)]">
        <div className="glass rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border/60">
            <div className="h-10 w-10 rounded-full bg-[var(--gradient-gold)] flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-serif text-lg leading-tight">{industry.mentorPersona}</div>
              <div className="text-[11px] text-muted-foreground">{industry.mentorSpecialty}</div>
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
                placeholder={`Ask AURUM about ${industry.label.toLowerCase()} — strategy, outreach, the market…`}
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
              {industry.mentorPrompts.map((t, i) => {
                const I = promptIcons[i % promptIcons.length];
                return (
                  <button
                    key={t}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 text-left text-sm transition-colors"
                  >
                    <I className="h-4 w-4 text-primary shrink-0" />
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-3">
              CONTEXT LOADED
            </div>
            <ul className="text-xs text-foreground/90 space-y-2">
              <li>· {industry.modeLabel} · {industry.phaseLabel}</li>
              <li>· 12-day execution streak</li>
              <li>· 184 relationships (23 Tier-1)</li>
              <li>· Next event: {industry.upcoming[0][1]}</li>
              <li>· Authority score 42 · trajectory ↑</li>
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
