import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/aurum/AppShell";
import { GraduationCap, Send, BookOpen, Lightbulb, ListChecks, HelpCircle, Plus, Clock } from "lucide-react";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { askGemini } from "@/lib/gemini.functions";
import { generateConversationTitle } from "@/lib/mentor.functions";
import { useMentorConversations } from "@/hooks/useMentorConversations";
import type { ConversationMessage } from "@/hooks/useMentorConversations";

export const Route = createFileRoute("/tutor")({
  component: Tutor,
});

const promptIcons = [BookOpen, Lightbulb, ListChecks, HelpCircle];

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return mins + "m ago";
  if (hours < 24) return hours + "h ago";
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function Tutor() {
  const { industry, industryId } = useIndustry();
  const ask = useServerFn(askGemini);
  const genTitle = useServerFn(generateConversationTitle);
  const { conversations, loading: convsLoading, createConversation, updateConversation } = useMentorConversations();

  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const systemPrompt = `You are AURUM AI Tutor, an educational assistant for the ${industry.label} (${industry.trackName}) curriculum. Teach topics step-by-step in a simple, structured way:
1) Start with a one-sentence definition.
2) Break the concept into 3-5 numbered steps or key points.
3) Give a concrete example from ${industry.label.toLowerCase()}.
4) End with a short check-for-understanding question.
Use clear markdown formatting (headings, bullet lists, bold for key terms). Keep tone calm, precise, and encouraging. Reference industry terminology: client="${industry.terms.client}", asset="${industry.terms.asset}", market="${industry.terms.market}".`;

  const opener = "Welcome to the " + industry.trackName + " track. I am your AI Tutor — ask me to explain any module, term, or concept and I will break it down step-by-step. Where would you like to start?";
  const seed: ConversationMessage[] = [{ r: "ai", t: opener }];
  const displayMessages = messages.length > 0 ? messages : seed;

  const suggestions = [
    "Explain the fundamentals of the " + industry.label.toLowerCase() + " " + industry.terms.market.toLowerCase(),
    "Walk me through module 1 of the " + industry.trackName + " step-by-step",
    "What insider terminology should I master first?",
    "Quiz me on a key concept from this track",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, pending]);

  const scheduleSave = (msgs: ConversationMessage[], convId: string | null) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (convId) await updateConversation(convId, msgs);
    }, 2000);
  };

  const loadConversation = (conv: typeof conversations[0]) => {
    setActiveConvId(conv.id);
    setMessages(conv.messages);
  };

  const startFresh = () => {
    setActiveConvId(null);
    setMessages([]);
    setInput("");
  };

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || pending) return;
    const next: ConversationMessage[] = [...displayMessages, { r: "me", t: text }];
    setMessages(next);
    setInput("");
    setPending(true);
    try {
      const { text: reply } = await ask({
        data: {
          system: systemPrompt,
          messages: next.map((m) => ({ role: m.r === "me" ? "user" as const : "assistant" as const, text: m.t })),
        },
      });
      const final: ConversationMessage[] = [...next, { r: "ai", t: reply || "..." }];
      setMessages(final);
      if (!activeConvId) {
        const firstUserMsg = next.find((m) => m.r === "me")?.t ?? text;
        const { title } = await genTitle({ data: { firstMessage: firstUserMsg, industry: industryId } });
        const newConv = await createConversation(industryId + "-tutor", final, title);
        if (newConv) setActiveConvId(newConv.id);
      } else {
        scheduleSave(final, activeConvId);
      }
    } catch (e) {
      const errMsg = "Error: " + (e instanceof Error ? e.message : "Request failed");
      setMessages([...next, { r: "ai", t: errMsg }]);
    } finally {
      setPending(false);
    }
  };

  const tutorConversations = conversations.filter((c) => c.industry.endsWith("-tutor"));

  return (
    <AppShell>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 h-[calc(100vh-7rem)]">
        <div className="glass rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border/60">
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "var(--gradient-gold)" }}>
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-serif text-lg leading-tight">AURUM AI Tutor</div>
              <div className="text-[11px] text-muted-foreground">{industry.trackName} · step-by-step learning</div>
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] tracking-[0.3em] text-emerald-400/90">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {displayMessages.map((m, i) => (
              <div key={i} className={"flex " + (m.r === "me" ? "justify-end" : "justify-start") + " animate-fade-up"} style={{ animationDelay: i * 60 + "ms" }}>
                <div className={"max-w-[78%] text-[15px] leading-relaxed whitespace-pre-line " + (m.r === "me" ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-5 py-3" : "text-foreground")}>
                  {m.t}
                </div>
              </div>
            ))}
            {pending && <div className="text-xs text-muted-foreground italic">Tutor is composing...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border/60 p-4">
            <div className="glass rounded-xl flex items-center gap-2 pl-5 pr-2 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
                placeholder={"Ask the tutor to explain a " + industry.label.toLowerCase() + " concept..."}
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button onClick={() => void send()} disabled={pending} className="h-9 w-9 rounded-full flex items-center justify-center text-primary-foreground disabled:opacity-50" style={{ background: "var(--gradient-gold)" }}>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-4 overflow-y-auto">
          <button onClick={startFresh} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:border-primary/40 text-sm transition-colors">
            <Plus className="h-4 w-4" />
            New lesson
          </button>

          {!convsLoading && tutorConversations.length > 0 && (
            <div className="glass rounded-xl p-5">
              <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-3">RECENT LESSONS</div>
              <div className="space-y-2">
                {tutorConversations.map((conv) => (
                  <button key={conv.id} onClick={() => loadConversation(conv)} className={"w-full flex flex-col gap-1 p-3 rounded-lg border text-left text-sm transition-colors " + (activeConvId === conv.id ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/40")}>
                    <span className="font-medium leading-tight line-clamp-2">{conv.title}</span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(conv.updated_at)} · {conv.messages.length} messages
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="glass rounded-xl p-5">
            <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-4">LESSON STARTERS</div>
            <div className="space-y-2">
              {suggestions.map((t, i) => {
                const I = promptIcons[i % promptIcons.length];
                return (
                  <button key={t} onClick={() => void send(t)} disabled={pending} className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 text-left text-sm transition-colors disabled:opacity-50">
                    <I className="h-4 w-4 text-primary shrink-0" />
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-3">ACTIVE TRACK</div>
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
