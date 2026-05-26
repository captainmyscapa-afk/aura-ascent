import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/aurum/AppShell";
import { GraduationCap, Send, BookOpen, Lightbulb, ListChecks, HelpCircle } from "lucide-react";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { askGemini } from "@/lib/gemini.functions";

export const Route = createFileRoute("/tutor")({
  component: Tutor,
});

const promptIcons = [BookOpen, Lightbulb, ListChecks, HelpCircle];

function Tutor() {
  const { industry } = useIndustry();
  const ask = useServerFn(askGemini);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  const systemPrompt = `You are AURUM AI Tutor, an educational assistant for the ${industry.label} (${industry.trackName}) curriculum. Teach topics step-by-step in a simple, structured way:
1) Start with a one-sentence definition.
2) Break the concept into 3–5 numbered steps or key points.
3) Give a concrete example from ${industry.label.toLowerCase()}.
4) End with a short check-for-understanding question.
Use clear markdown formatting (headings, bullet lists, bold for key terms). Keep tone calm, precise, and encouraging. Reference industry terminology: client="${industry.terms.client}", asset="${industry.terms.asset}", market="${industry.terms.market}".`;

  const opener = `Welcome to the ${industry.trackName} track. I'm your AI Tutor — ask me to explain any module, term, or concept and I'll break it down step-by-step. Where would you like to start?`;

  const [thread, setThread] = useState<Array<{ r: "ai" | "me"; t: string }>>([
    { r: "ai", t: opener },
  ]);

  const suggestions = [
    `Explain the fundamentals of the ${industry.label.toLowerCase()} ${industry.terms.market.toLowerCase()}`,
    `Walk me through module 1 of the ${industry.trackName} step-by-step`,
    `What insider terminology should I master first?`,
    `Quiz me on a key concept from this track`,
  ];

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || pending) return;
    const next: Array<{ r: "ai" | "me"; t: string }> = [...thread, { r: "me", t: text }];
    setThread(next);
    setInput("");
    setPending(true);
    try {
      const { text: reply } = await ask({
        data: {
          system: systemPrompt,
          messages: next.map((m) => ({
            role: m.r === "me" ? ("user" as const) : ("assistant" as const),
            text: m.t,
          })),
        },
      });
      setThread([...next, { r: "ai", t: reply || "…" }]);
    } catch (e) {
      setThread([
        ...next,
        { r: "ai", t: `⚠️ ${e instanceof Error ? e.message : "Request failed"}` },
      ]);
    } finally {
      setPending(false);
    }
  };

  return (
    <AppShell>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 h-[calc(100vh-7rem)]">
        <div className="glass rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border/60">
            <div className="h-10 w-10 rounded-full bg-[var(--gradient-gold)] flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-serif text-lg leading-tight">AURUM AI Tutor</div>
              <div className="text-[11px] text-muted-foreground">
                {industry.trackName} · step-by-step learning
              </div>
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] tracking-[0.3em] text-emerald-400/90">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {thread.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.r === "me" ? "justify-end" : "justify-start"} animate-fade-up`}
                style={{ animationDelay: `${i * 60}ms` }}
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
            {pending && (
              <div className="text-xs text-muted-foreground italic">Tutor is composing…</div>
            )}
          </div>

          <div className="border-t border-border/60 p-4">
            <div className="glass rounded-xl flex items-center gap-2 pl-5 pr-2 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder={`Ask the tutor to explain a ${industry.label.toLowerCase()} concept…`}
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={() => void send()}
                disabled={pending}
                className="h-9 w-9 rounded-full bg-[var(--gradient-gold)] flex items-center justify-center text-primary-foreground disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-4 overflow-y-auto">
          <div className="glass rounded-xl p-5">
            <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-4">
              LESSON STARTERS
            </div>
            <div className="space-y-2">
              {suggestions.map((t, i) => {
                const I = promptIcons[i % promptIcons.length];
                return (
                  <button
                    key={t}
                    onClick={() => void send(t)}
                    disabled={pending}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 text-left text-sm transition-colors disabled:opacity-50"
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
              ACTIVE TRACK
            </div>
            <ul className="text-xs text-foreground/90 space-y-2">
              <li>· {industry.trackName}</li>
              <li>· {industry.trackProgress}/{industry.trackModules} modules complete</li>
              <li>· Mode · {industry.modeLabel}</li>
              <li>· Phase · {industry.phaseLabel}</li>
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
