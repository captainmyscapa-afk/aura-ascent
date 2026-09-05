import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/aurum/AppShell";
import { GraduationCap, Send, BookOpen, Lightbulb, ListChecks, HelpCircle, Plus, Clock, X } from "lucide-react";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { askGemini } from "@/lib/gemini.functions";
import { generateConversationTitle } from "@/lib/mentor.functions";
import { useMentorConversations } from "@/hooks/useMentorConversations";
import type { ConversationMessage } from "@/hooks/useMentorConversations";
import { useProGate, PageLock } from "@/components/aurum/ProGate";
import { useAcademyProgress } from "@/hooks/useAcademyProgress";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/aurum/UpgradeModal";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { T } from "@/lib/i18n/translations";

export const Route = createFileRoute("/tutor")({
  component: Tutor,
});

const promptIcons = [BookOpen, Lightbulb, ListChecks, HelpCircle];

function formatDate(iso: string, t: T, dateLocale: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return t.tutMinsAgo(mins);
  if (hours < 24) return t.tutHoursAgo(hours);
  if (days === 1) return t.tutYesterday;
  return d.toLocaleDateString(dateLocale, { day: "numeric", month: "short" });
}

function Tutor() {
  const { t, lang } = useLanguage();
  const dateLocale = lang === "fr" ? "fr-FR" : "en-GB";
  const { industry, industryId } = useIndustry();
  const academyProgress = useAcademyProgress(industryId);
  const ask = useServerFn(askGemini);
  const genTitle = useServerFn(generateConversationTitle);
  const { conversations, loading: convsLoading, createConversation, updateConversation, deleteConversation } = useMentorConversations();

  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const tutorGate = useProGate("tutor_messages");
  const { isPro, loading: subLoading } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
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

  const opener = t.tutOpener(industry.trackName);
  const seed: ConversationMessage[] = [{ r: "ai", t: opener }];
  const displayMessages = messages.length > 0 ? messages : seed;

  const suggestions = t.tutSuggestions(industryId);

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

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || pending) return;
    if (!tutorGate.gate(t.tutGateMessage)) return;
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
      await tutorGate.increment("tutor_messages");
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

  // Free-plan users see a locked page instead of the tutor — no chat, no lesson history.
  if (!subLoading && !isPro) {
    return (
      <AppShell>
        <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason={t.tutLockDesc} />
        <PageLock
          icon={GraduationCap}
          eyebrow={t.proFeatureLabel}
          title={t.tutLockTitle}
          description={t.tutLockDesc}
          features={t.tutLockFeatures}
          upgradeLabel={t.setUpgradeToPro}
          onUpgrade={() => setUpgradeOpen(true)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <UpgradeModal open={tutorGate.showUpgrade} onClose={() => tutorGate.setShowUpgrade(false)} reason={t.tutGateMessage} />
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 h-[calc(100vh-7rem)]">
        <div className="glass rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border/60">
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "var(--gradient-gold)" }}>
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-serif text-lg leading-tight">{t.tutTitle}</div>
              <div className="text-[11px] text-muted-foreground">{t.tutSubtitle(industry.trackName)}</div>
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] tracking-[0.3em] text-emerald-400/90">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t.tutOnline}
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
            {pending && <div className="text-xs text-muted-foreground italic">{t.tutComposing}</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border/60 p-4">
            <div className="glass rounded-xl flex items-center gap-2 pl-5 pr-2 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
                placeholder={t.tutPlaceholder(industryId)}
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
            {t.tutNewLesson}
          </button>

          {!convsLoading && tutorConversations.length > 0 && (
            <div className="glass rounded-xl p-5">
              <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-3">{t.tutRecentLessons}</div>
              <div className="space-y-2">
                {tutorConversations.map((conv) => (
                  <div key={conv.id} className={"flex items-start gap-1 rounded-lg border transition-colors " + (activeConvId === conv.id ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/40")}>
                    <button onClick={() => loadConversation(conv)} className="flex-1 flex flex-col gap-1 p-3 text-left text-sm min-w-0">
                      <span className="font-medium leading-tight line-clamp-2">{conv.title}</span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(conv.updated_at, t, dateLocale)} · {t.tutMessagesCount(conv.messages.length)}
                      </span>
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (activeConvId === conv.id) startFresh();
                        await deleteConversation(conv.id);
                      }}
                      className="shrink-0 p-2 mt-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      title={t.tutDeleteLesson}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass rounded-xl p-5">
            <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-4">{t.tutLessonStarters}</div>
            <div className="space-y-2">
              {suggestions.map((s, i) => {
                const I = promptIcons[i % promptIcons.length];
                return (
                  <button key={s} onClick={() => void send(s)} disabled={pending} className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 text-left text-sm transition-colors disabled:opacity-50">
                    <I className="h-4 w-4 text-primary shrink-0" />
                    <span>{s}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-3">{t.tutActiveTrackLabel}</div>
            <ul className="text-xs text-foreground/90 space-y-2">
              <li>· {industry.trackName}</li>
              {!academyProgress.loading && (
                <li>· {t.tutModulesComplete(academyProgress.completed, academyProgress.total)}</li>
              )}
              <li>· {t.tutModeLine(industry.modeLabel)}</li>
              {academyProgress.phaseNumber != null && (
                <li>· {t.acadPhase(academyProgress.phaseNumber, t.acadPhaseTitle(academyProgress.phaseNumber, academyProgress.phaseTitle ?? ""))}</li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
