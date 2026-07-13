import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/aurum/AppShell";
import { Sparkles, Send, MessageCircle, Compass, Target, Zap, RefreshCw, Plus, Clock, X } from "lucide-react";
import { useIndustry, useIndustrySystemPrompt } from "@/lib/industry/IndustryProvider";
import { askGemini } from "@/lib/gemini.functions";
import { useAurumCoreState } from "@/hooks/useAurumCoreState";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useProGate, UsageBar } from "@/components/aurum/ProGate";
import { UpgradeModal } from "@/components/aurum/UpgradeModal";
import { useMentorConversations } from "@/hooks/useMentorConversations";
import { generateConversationTitle } from "@/lib/mentor.functions";
import type { ConversationMessage } from "@/hooks/useMentorConversations";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { T } from "@/lib/i18n/translations";

export const Route = createFileRoute("/mentor")({
  component: Mentor,
  validateSearch: (search: Record<string, unknown>) => ({
    prompt: search.prompt as string | undefined,
  }),
});

const promptIcons = [Target, Compass, Zap, MessageCircle];

function formatDate(iso: string, t: T, dateLocale: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return t.mentorMinAgo(mins);
  if (hours < 24) return t.mentorHourAgo(hours);
  if (days === 1) return t.mentorYesterday;
  return d.toLocaleDateString(dateLocale, { day: "numeric", month: "short" });
}

function Mentor() {
  const { t, lang } = useLanguage();
  const dateLocale = lang === "fr" ? "fr-FR" : "en-GB";
  const { industry, industryId } = useIndustry();
  const { state: core } = useAurumCoreState();
  const { profile: userProfile } = useUserProfile();
  const systemPrompt = useIndustrySystemPrompt(core?.current_level ?? undefined, userProfile?.mentor_tone ?? undefined);
  const ask = useServerFn(askGemini);
  const genTitle = useServerFn(generateConversationTitle);
  const { conversations, loading: convsLoading, createConversation, updateConversation, deleteConversation } = useMentorConversations();
  const mentorConversations = conversations.filter((c) => !c.industry.endsWith("-tutor"));

  const mentorContent = t.mentorContent(industryId);

  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const mentorGate = useProGate("mentor_messages");
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [prompts, setPrompts] = useState<string[]>([...mentorContent.prompts]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { prompt: seedPrompt } = Route.useSearch();
  const firedSeedPrompt = useRef(false);

  const userName = userProfile?.full_name?.split(" ")[0] ?? "Operator";
  const hour = new Date().getHours();
  const greetingPeriod = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const opener = t.mentorOpener(t.greeting(greetingPeriod), userName, mentorContent.persona.replace("AURUM · ", ""), industry.label);

  const seed: ConversationMessage[] = [{ r: "ai", t: opener }];
  const displayMessages = messages.length > 0 ? messages : seed;

  useEffect(() => {
    if (messages.length === 0 && !pending) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

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

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || pending) return;
    if (!mentorGate.gate(t.mentorGateMessage)) return;
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
      await mentorGate.increment("mentor_messages");
      if (!activeConvId) {
        const firstUserMsg = next.find((m) => m.r === "me")?.t ?? text;
        const { title } = await genTitle({ data: { firstMessage: firstUserMsg, industry: industryId } });
        const newConv = await createConversation(industryId, final, title);
        if (newConv) setActiveConvId(newConv.id);
      } else {
        scheduleSave(final, activeConvId);
      }
    } catch (e) {
      const errMsg = t.mentorErrorPrefix + (e instanceof Error ? e.message : "Request failed");
      setMessages([...next, { r: "ai", t: errMsg }]);
    } finally {
      setPending(false);
    }
  };

  // Deep-link support: ?prompt= arrives from Roadmap's "get help" action and
  // auto-sends once, so the user lands with an answer already forming.
  useEffect(() => {
    if (!seedPrompt || firedSeedPrompt.current) return;
    firedSeedPrompt.current = true;
    void send(seedPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedPrompt]);

  return (
    <AppShell>
      <UpgradeModal
        open={mentorGate.showUpgrade}
        onClose={() => mentorGate.setShowUpgrade(false)}
        reason={t.mentorGateMessageModal}
      />
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 h-[calc(100vh-7rem)]">
        <div className="glass rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border/60">
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "var(--gradient-gold)" }}>
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-serif text-lg leading-tight">{mentorContent.persona}</div>
              <div className="text-[11px] text-muted-foreground">{mentorContent.specialty}</div>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {!mentorGate.isPro && (
                <UsageBar used={mentorGate.limit - mentorGate.remaining} limit={mentorGate.limit} label={t.mentorFreeMessages} />
              )}
              <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.3em] text-emerald-400/90">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t.mentorOnline}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {displayMessages.map((m, i) => (
              <div key={i} className={"flex " + (m.r === "me" ? "justify-end" : "justify-start") + " animate-fade-up"} style={{ animationDelay: i * 80 + "ms" }}>
                <div className={"max-w-[78%] text-[15px] leading-relaxed whitespace-pre-line " + (m.r === "me" ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-5 py-3" : "text-foreground")}>
                  {m.t}
                </div>
              </div>
            ))}
            {pending && <div className="text-xs text-muted-foreground italic">{t.mentorThinking}</div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-border/60 p-4">
            <div className="glass rounded-xl flex items-center gap-2 pl-5 pr-2 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
                placeholder={t.mentorPlaceholder(industry.label)}
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
            {t.mentorNewConversation}
          </button>

          {!convsLoading && mentorConversations.length > 0 && (
            <div className="glass rounded-xl p-5">
              <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-3">{t.mentorRecentConversations}</div>
              <div className="space-y-2">
                {mentorConversations.map((conv) => (
                  <div key={conv.id} className={"flex items-start gap-1 rounded-lg border transition-colors " + (activeConvId === conv.id ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/40")}>
                    <button onClick={() => loadConversation(conv)} className="flex-1 flex flex-col gap-1 p-3 text-left text-sm min-w-0">
                      <span className="font-medium leading-tight line-clamp-2">{conv.title}</span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {t.mentorConvMeta(formatDate(conv.updated_at, t, dateLocale), conv.messages.length)}
                      </span>
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (activeConvId === conv.id) startFresh();
                        await deleteConversation(conv.id);
                      }}
                      className="shrink-0 p-2 mt-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      title={t.mentorDeleteConversation}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] tracking-[0.34em] text-muted-foreground">{t.mentorQuickInvocations}</div>
              <button onClick={() => setPrompts([...mentorContent.prompts].sort(() => Math.random() - 0.5))} className="text-muted-foreground hover:text-primary transition-colors">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              {prompts.map((p, i) => {
                const I = promptIcons[i % promptIcons.length];
                return (
                  <button key={p} onClick={() => setInput(p)} className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 text-left text-sm transition-colors">
                    <I className="h-4 w-4 text-primary shrink-0" />
                    <span>{p}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-3">{t.mentorContextLoaded}</div>
            <ul className="text-xs text-foreground/90 space-y-2">
              <li>· {industry.modeLabel} · {industry.phaseLabel}</li>
              <li>· {t.mentorExecutionStreak(core?.streak ?? 0)}</li>
              <li>· {t.mentorTasksCompletedToday(core?.execution_score ?? 0)}</li>
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
