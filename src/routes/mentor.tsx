import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/aurum/AppShell";
import { Sparkles, Send, MessageCircle, Compass, Target, Zap, RefreshCw, Plus, Clock } from "lucide-react";
import { useIndustry, useIndustrySystemPrompt } from "@/lib/industry/IndustryProvider";
import { askGemini } from "@/lib/gemini.functions";
import { useAurumCoreState } from "@/hooks/useAurumCoreState";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useMentorConversations } from "@/hooks/useMentorConversations";
import { generateConversationTitle } from "@/lib/mentor.functions";
import type { ConversationMessage } from "@/hooks/useMentorConversations";

export const Route = createFileRoute("/mentor")({
  component: Mentor,
});

const promptIcons = [Target, Compass, Zap, MessageCircle];

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

function Mentor() {
  const { industry, industryId } = useIndustry();
  const { state: core } = useAurumCoreState();
  const { profile: userProfile } = useUserProfile();
  const systemPrompt = useIndustrySystemPrompt(core?.current_level ?? undefined, userProfile?.mentor_tone ?? undefined);
  const ask = useServerFn(askGemini);
  const genTitle = useServerFn(generateConversationTitle);
  const { conversations, loading: convsLoading, createConversation, updateConversation } = useMentorConversations();
  const mentorConversations = conversations.filter((c) => !c.industry.endsWith("-tutor"));

  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [prompts, setPrompts] = useState<string[]>([...industry.mentorPrompts]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userName = userProfile?.full_name?.split(" ")[0] ?? "Operator";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const opener = "Good " + greeting + ", " + userName + ". I am your AURUM " + industry.mentorPersona.replace("AURUM · ", "") + " — here to help you break into " + industry.label.toLowerCase() + " at the highest level. What is your most pressing challenge right now?";

  const seed: ConversationMessage[] = [{ r: "ai", t: opener }];
  const displayMessages = messages.length > 0 ? messages : seed;

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

  const send = async () => {
    const text = input.trim();
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
        const newConv = await createConversation(industryId, final, title);
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

  return (
    <AppShell>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 h-[calc(100vh-7rem)]">
        <div className="glass rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border/60">
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "var(--gradient-gold)" }}>
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
            {displayMessages.map((m, i) => (
              <div key={i} className={"flex " + (m.r === "me" ? "justify-end" : "justify-start") + " animate-fade-up"} style={{ animationDelay: i * 80 + "ms" }}>
                <div className={"max-w-[78%] text-[15px] leading-relaxed whitespace-pre-line " + (m.r === "me" ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-5 py-3" : "text-foreground")}>
                  {m.t}
                </div>
              </div>
            ))}
            {pending && <div className="text-xs text-muted-foreground italic">AURUM is thinking...</div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-border/60 p-4">
            <div className="glass rounded-xl flex items-center gap-2 pl-5 pr-2 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
                placeholder={"Ask AURUM about " + industry.label.toLowerCase() + " — strategy, outreach, the market..."}
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
            New conversation
          </button>

          {!convsLoading && mentorConversations.length > 0 && (
            <div className="glass rounded-xl p-5">
              <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-3">RECENT CONVERSATIONS</div>
              <div className="space-y-2">
                {mentorConversations.map((conv) => (
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
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] tracking-[0.34em] text-muted-foreground">QUICK INVOCATIONS</div>
              <button onClick={() => setPrompts([...industry.mentorPrompts].sort(() => Math.random() - 0.5))} className="text-muted-foreground hover:text-primary transition-colors">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              {prompts.map((t, i) => {
                const I = promptIcons[i % promptIcons.length];
                return (
                  <button key={t} onClick={() => setInput(t)} className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 text-left text-sm transition-colors">
                    <I className="h-4 w-4 text-primary shrink-0" />
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-3">CONTEXT LOADED</div>
            <ul className="text-xs text-foreground/90 space-y-2">
              <li>· {industry.modeLabel} · {industry.phaseLabel}</li>
              <li>· {(core?.streak ?? 0) + "-day execution streak"}</li>
              <li>· {(core?.execution_score ?? 0) + " execution score"}</li>
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
