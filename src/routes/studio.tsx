import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/aurum/AppShell";
import { SectionHeading } from "@/components/aurum/SectionHeading";
import {
  Sparkles,
  Wand2,
  Radio,
  ImageIcon,
  Hash,
  Copy,
  Check,
  Send,
  Loader2,
  Download,
  History,
  X,
} from "lucide-react";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateStudioContent, type StudioContentPlan } from "@/lib/studio.functions";

export const Route = createFileRoute("/studio")({
  component: Studio,
  validateSearch: (search: Record<string, unknown>) => ({
    intel: search.intel as string | undefined,
    idea: search.idea as string | undefined,
  }),
});

type Mode = "assisted" | "intelligence";
type Format = "post" | "reel" | "video";

type IntelEntry = {
  id: string;
  title: string;
  source: string;
  category: string | null;
  description: string | null;
};

type HistoryEntry = {
  id: string;
  industry: string;
  mode: string;
  idea: string | null;
  goal: string | null;
  title: string | null;
  viral_hook: string | null;
  instagram_caption: string | null;
  tiktok_caption: string | null;
  linkedin_caption: string | null;
  hashtags: string[] | null;
  visual_prompt: string | null;
  image_url: string | null;
  created_at: string;
};

function Studio() {
  const { industry, industryId } = useIndustry();
  const { user } = useAuth();
  const generate = useServerFn(generateStudioContent);

  const [mode, setMode] = useState<Mode>("assisted");
  const [format, setFormat] = useState<Format>("post");
  const [videoDuration, setVideoDuration] = useState<5 | 10 | 15 | 30>(15);
  const [userLevel, setUserLevel] = useState<"beginner" | "advanced">("advanced");
  const [idea, setIdea] = useState("");
  const [goal, setGoal] = useState("");

  const [intel, setIntel] = useState<IntelEntry[]>([]);
  const [selectedIntel, setSelectedIntel] = useState<Set<string>>(new Set());

  const [plan, setPlan] = useState<StudioContentPlan | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  const { intel: preselectedIntel, idea: preselectedIdea } = Route.useSearch();

  useEffect(() => {
    if (preselectedIntel && intel.length > 0) {
      setMode("intelligence");
      setSelectedIntel(new Set([preselectedIntel]));
    }
  }, [preselectedIntel, intel.length]);

  useEffect(() => {
    if (preselectedIdea) {
      setMode("assisted");
      setIdea(preselectedIdea);
      setGoal("Create content to build authority and visibility before this event");
    }
  }, [preselectedIdea]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("live_intelligence") as any)
        .select("id,title,source,category,description")
        .order("created_at", { ascending: false })
        .limit(500);
      setIntel((data as IntelEntry[]) || []);
    })();
  }, []);

  useEffect(() => {
    if (user) loadHistory();
  }, [user, industryId]);

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await (supabase.from("user_content_history") as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("industry", industryId)
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory((data as HistoryEntry[]) || []);
  };

  const saveToHistory = async (result: StudioContentPlan) => {
    if (!user) return;
    const { data } = await (supabase.from("user_content_history") as any)
      .insert({
        user_id: user.id,
        industry: industryId,
        mode,
        idea: idea || null,
        goal: goal || null,
        title: result.title,
        viral_hook: result.viralHook,
        instagram_caption: result.platforms.instagram,
        tiktok_caption: result.platforms.tiktok,
        linkedin_caption: result.platforms.linkedin || null,
        hashtags: result.hashtags,
        visual_prompt: result.visualPrompt,
        image_url: null,
      })
      .select("id")
      .single();
    if (data?.id) setLastSavedId(data.id);
    loadHistory();
  };

  const updateMemory = async (result: StudioContentPlan) => {
    if (!user) return;
    const topics = history
      .map((h) => h.title)
      .filter(Boolean)
      .slice(0, 10) as string[];
    if (result.title) topics.unshift(result.title);
    await (supabase.from("user_memory") as any).upsert(
      {
        user_id: user.id,
        industry: industryId,
        content_topics: topics.slice(0, 10),
        mentor_context: `User has created content about: ${topics.slice(0, 5).join(", ")}. Latest: "${result.title}". Goal: "${goal || "not specified"}".`,
        last_updated: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  };

  const loadFromHistory = (entry: HistoryEntry) => {
    setIdea(entry.idea || "");
    setGoal(entry.goal || "");
    setImageUrl(entry.image_url || null);
    setLastSavedId(entry.id);
    setPlan({
      title: entry.title || "",
      viralHook: entry.viral_hook || "",
      platforms: {
        instagram: entry.instagram_caption || "",
        tiktok: entry.tiktok_caption || "",
        linkedin: entry.linkedin_caption || undefined,
      },
      script: [],
      hashtags: entry.hashtags || [],
      visualPrompt: entry.visual_prompt || "",
    });
    setShowHistory(false);
  };

  const toggleIntel = (id: string) => {
    setSelectedIntel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const run = async () => {
    if (pending) return;
    setError(null);
    setPlan(null);
    setImageUrl(null);
    setImageError(false);
    setLastSavedId(null);
    setPending(true);

    if (format === "reel" || format === "video") {
      setPending(false);
      setPlan({
        title: "Coming Soon",
        viralHook: `Cinematic ${format} generation with scene-by-scene breakdown, camera direction, and motion design — launching in the next update.`,
        platforms: {
          instagram: `Our AI creative director is learning to build ${format}-ready scripts with shot lists, pacing curves, and platform-native hooks.`,
          tiktok: `${format} generation is in final training — fully automated script, visual prompt, and hashtag kit coming shortly.`,
          linkedin: `We're calibrating ${format} output for luxury brand storytelling. Stay tuned.`,
        },
        script: [`Cinematic ${format} generation is in final beta.`, "Switch to Post to generate content right now."],
        hashtags: ["#ComingSoon", "#AurumStudio"],
        visualPrompt: `A premium ${format === "reel" ? "vertical 9:16" : "horizontal 16:9"} frame featuring a glowing gold AURUM logo against a dark cinematic backdrop — luxury, minimal, teaser.`,
      });
      return;
    }

    try {
      const intelligenceContext =
        mode === "intelligence"
          ? intel
              .filter((e) => (selectedIntel.size === 0 ? true : selectedIntel.has(e.id)))
              .slice(0, 5)
              .map(
                (e) =>
                  `- [${e.source}${e.category ? ` · ${e.category}` : ""}] ${e.title}${e.description ? ` — ${e.description}` : ""}`,
              )
              .join("\n")
          : undefined;

      const { plan: result } = await generate({
        data: {
          industry: industryId,
          industryLabel: industry.label,
          userLevel,
          goal: goal || undefined,
          userIdea: mode === "assisted" ? idea || undefined : undefined,
          intelligenceContext,
        },
      });

      setPlan(result);
      await saveToHistory(result);
      await updateMemory(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setPending(false);
    }
  };

  const generateImage = async (visualPrompt: string) => {
    setImageLoading(true);
    setImageError(false);
    setImageUrl(null);
    try {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(visualPrompt + ", luxury lifestyle, cinematic, editorial photography, high end, 4K")}?width=1024&height=1024&nologo=true&enhance=true&model=flux`;
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load"));
        img.src = url;
      });
      setImageUrl(url);
      if (lastSavedId) {
        await (supabase.from("user_content_history") as any).update({ image_url: url }).eq("id", lastSavedId);
        loadHistory();
      }
    } catch {
      setImageError(true);
    } finally {
      setImageLoading(false);
    }
  };

  const downloadImage = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `aurum-visual-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(imageUrl, "_blank");
    }
  };

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const canRun = mode === "intelligence" ? intel.length > 0 : idea.trim().length > 2;

  return (
    <AppShell>
      <div className="mb-8 animate-fade-up">
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">
          CONTENT STUDIO · {industry.modeLabel.toUpperCase()}
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl">
              Viral content, <span className="italic text-gold-gradient">on demand.</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl text-sm">
              AURUM's AI creative director crafts post-ready content for the {industry.label.toLowerCase()} world —
              hooks, scripts, captions, hashtags, cinematic visuals. Optimized per platform. Ready in under 30 seconds.
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="shrink-0 flex items-center gap-2 glass rounded-xl px-4 py-2 text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors"
            >
              <History className="h-4 w-4" />
              History ({history.length})
            </button>
          )}
        </div>
      </div>

      {showHistory && (
        <div className="glass rounded-xl p-5 mb-6 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] tracking-[0.34em] text-primary/80">
              CONTENT HISTORY · {industry.label.toUpperCase()}
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => loadFromHistory(entry)}
                className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/40 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-serif truncate">{entry.title || "Untitled"}</div>
                    {entry.idea && (
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{entry.idea}</div>
                    )}
                  </div>
                  <div className="shrink-0 text-[10px] text-muted-foreground font-mono">
                    {new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
                {entry.image_url && (
                  <img src={entry.image_url} alt="" className="mt-2 h-12 w-20 object-cover rounded" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
        <div className="space-y-5">
          <div className="glass rounded-xl p-1.5 grid grid-cols-2 gap-1.5">
            <ModeTab
              active={mode === "assisted"}
              onClick={() => setMode("assisted")}
              icon={Wand2}
              label="AI Assisted"
              sub="From your idea"
            />
            <ModeTab
              active={mode === "intelligence"}
              onClick={() => setMode("intelligence")}
              icon={Radio}
              label="From Live Intel"
              sub="Today's signals"
            />
          </div>

          <div className="glass rounded-xl p-5">
            {mode === "assisted" ? (
              <>
                <Label>YOUR IDEA</Label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder={`e.g. "Why hybrid superyachts are the new status symbol in Monaco"`}
                  rows={4}
                  className="w-full bg-transparent outline-none text-sm resize-none border border-border rounded-lg p-3 focus:border-primary/50 transition-colors"
                />
              </>
            ) : (
              <>
                <Label>SIGNALS · pick what to amplify</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {intel.length === 0 && (
                    <div className="text-xs text-muted-foreground italic py-4">
                      No live signals yet. Switch to AI Assisted to write from your own idea.
                    </div>
                  )}
                  {intel.map((e) => {
                    const on = selectedIntel.has(e.id);
                    return (
                      <button
                        key={e.id}
                        onClick={() => toggleIntel(e.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${on ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/30"}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] tracking-[0.3em] text-primary/80 px-1.5 py-0.5 border border-primary/30 rounded uppercase">
                            {e.source}
                          </span>
                          {e.category && (
                            <span className="text-[9px] tracking-[0.3em] text-muted-foreground uppercase">
                              {e.category}
                            </span>
                          )}
                        </div>
                        <div className="text-sm leading-snug">{e.title}</div>
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] text-muted-foreground mt-2">
                  {selectedIntel.size === 0
                    ? "None selected → AURUM will scan today's top signals."
                    : `${selectedIntel.size} signal${selectedIntel.size > 1 ? "s" : ""} selected.`}
                </div>
              </>
            )}
          </div>

          <div className="glass rounded-xl p-5">
            <Label>
              GOAL <span className="text-muted-foreground/60 normal-case tracking-normal">(optional)</span>
            </Label>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. attract UHNW charter clients"
              className="w-full bg-transparent outline-none text-sm border border-border rounded-lg p-3 focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="glass rounded-xl p-5 space-y-4">
            <div>
              <Label>FORMAT</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["post", "reel", "video"] as Format[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`text-xs uppercase tracking-[0.2em] py-2 rounded-lg border transition-all ${format === f ? "border-primary/60 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/30"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {format === "video" && (
              <div>
                <Label>DURATION</Label>
                <div className="grid grid-cols-4 gap-2">
                  {([5, 10, 15, 30] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setVideoDuration(d)}
                      className={`text-xs py-2 rounded-lg border transition-all ${videoDuration === d ? "border-primary/60 bg-primary/10" : "border-border text-muted-foreground hover:border-primary/30"}`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>STRATEGY LEVEL</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["beginner", "advanced"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setUserLevel(l)}
                    className={`text-xs uppercase tracking-[0.2em] py-2 rounded-lg border transition-all ${userLevel === l ? "border-primary/60 bg-primary/10" : "border-border text-muted-foreground hover:border-primary/30"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => void run()}
            disabled={!canRun || pending}
            className="w-full h-12 rounded-xl text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-[var(--shadow-gold)]"
            style={{ background: "var(--gradient-gold)" }}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                AURUM is composing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate viral content
              </>
            )}
          </button>

          {error && <div className="text-xs text-destructive border border-destructive/40 rounded-lg p-3">{error}</div>}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
          {!plan && !pending && (
            <div className="glass rounded-xl p-10 text-center">
              <Sparkles className="h-6 w-6 text-primary/80 mx-auto mb-4" />
              <div className="font-serif text-xl mb-2">Your content will appear here</div>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Title, viral hook, platform captions, full script, hashtags, visual prompt and AI-generated image — all
                tuned to {industry.modeLabel}.
              </p>
            </div>
          )}

          {pending && !plan && (
            <div className="glass rounded-xl p-10 text-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto mb-4" />
              <div className="font-serif text-lg">Drafting your post-ready plan…</div>
              <p className="text-xs text-muted-foreground mt-2">
                Pulling {industry.label.toLowerCase()} signals · structuring hook · optimizing per platform
              </p>
            </div>
          )}

          {plan && (
            <PlanOutput
              plan={plan}
              copied={copied}
              onCopy={copy}
              imageUrl={imageUrl}
              imageLoading={imageLoading}
              imageError={imageError}
              onGenerateImage={() => generateImage(plan.visualPrompt)}
              onDownloadImage={downloadImage}
            />
          )}
        </div>
      </div>

      <div className="mt-14">
        <SectionHeading eyebrow="STARTERS" title="Ideas to expand" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {industry.contentPrompts.map((p) => (
            <button
              key={p.t}
              onClick={() => {
                setMode("assisted");
                setIdea(p.t);
              }}
              className="glass rounded-xl p-4 text-left hover:ring-gold transition-all"
            >
              <div className="text-[9px] tracking-[0.3em] text-primary/80 mb-2">{p.type}</div>
              <div className="text-sm font-serif leading-snug">{p.t}</div>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-3 uppercase">{children}</div>;
}

function ModeTab({
  active,
  onClick,
  icon: Icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Wand2;
  label: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg p-3 text-left transition-all ${active ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-foreground/5"}`}
    >
      <Icon className={`h-4 w-4 mb-1.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
      <div className="text-sm font-medium leading-tight">{label}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </button>
  );
}

function PlanOutput({
  plan,
  copied,
  onCopy,
  imageUrl,
  imageLoading,
  imageError,
  onGenerateImage,
  onDownloadImage,
}: {
  plan: StudioContentPlan;
  copied: string | null;
  onCopy: (k: string, t: string) => void;
  imageUrl: string | null;
  imageLoading: boolean;
  imageError: boolean;
  onGenerateImage: () => void;
  onDownloadImage: () => void;
}) {
  return (
    <div className="space-y-4 animate-fade-up">
      <div className="glass rounded-xl p-5 ring-gold">
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">TITLE</div>
        <div className="font-serif text-2xl leading-tight">{plan.title}</div>
        <div className="mt-5 border-t border-border/60 pt-4">
          <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2 flex items-center gap-2">
            <Send className="h-3 w-3" /> VIRAL HOOK · first 2 seconds
          </div>
          <div className="text-base italic">"{plan.viralHook}"</div>
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-4">PLATFORM VERSIONS</div>
        <div className="space-y-4">
          <PlatformBlock label="Instagram" text={plan.platforms.instagram} id="ig" copied={copied} onCopy={onCopy} />
          <PlatformBlock label="TikTok" text={plan.platforms.tiktok} id="tt" copied={copied} onCopy={onCopy} />
          {plan.platforms.linkedin && (
            <PlatformBlock label="LinkedIn" text={plan.platforms.linkedin} id="li" copied={copied} onCopy={onCopy} />
          )}
        </div>
      </div>

      {plan.script.length > 0 && (
        <div className="glass rounded-xl p-5">
          <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-3">CONTENT SCRIPT</div>
          <ol className="space-y-2">
            {plan.script.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="text-primary/80 font-mono text-xs pt-0.5 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] tracking-[0.34em] text-primary/80 flex items-center gap-2">
            <Hash className="h-3 w-3" /> HASHTAGS
          </div>
          <CopyBtn
            id="tags"
            copied={copied}
            onClick={() => onCopy("tags", plan.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "))}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {plan.hashtags.map((h) => (
            <span key={h} className="text-[11px] px-2 py-1 rounded-full border border-border text-muted-foreground">
              {h.startsWith("#") ? h : `#${h}`}
            </span>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] tracking-[0.34em] text-primary/80 flex items-center gap-2">
            <ImageIcon className="h-3 w-3" /> VISUAL PROMPT
          </div>
          <CopyBtn id="vis" copied={copied} onClick={() => onCopy("vis", plan.visualPrompt)} />
        </div>
        <div className="text-sm leading-relaxed text-foreground/90 italic mb-4">{plan.visualPrompt}</div>

        {!imageUrl && !imageLoading && (
          <button
            onClick={onGenerateImage}
            className="w-full h-10 rounded-xl border border-primary/40 text-primary text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/10 transition-all"
          >
            <ImageIcon className="h-4 w-4" /> Generate image
          </button>
        )}

        {imageLoading && (
          <div className="w-full h-64 rounded-xl border border-border/40 flex flex-col items-center justify-center gap-3 bg-secondary/10">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <div className="text-xs text-muted-foreground">Generating your visual…</div>
          </div>
        )}

        {imageError && !imageLoading && (
          <div className="w-full rounded-xl border border-destructive/40 p-4 text-center">
            <div className="text-xs text-destructive mb-2">Image generation failed. Try again.</div>
            <button onClick={onGenerateImage} className="text-xs text-primary hover:underline">
              Retry
            </button>
          </div>
        )}

        {imageUrl && !imageLoading && (
          <div className="space-y-3">
            <img src={imageUrl} alt="Generated visual" className="w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onDownloadImage}
                className="h-10 rounded-xl text-primary-foreground text-sm font-medium flex items-center justify-center gap-2"
                style={{ background: "var(--gradient-gold)" }}
              >
                <Download className="h-4 w-4" /> Download
              </button>
              <button
                onClick={onGenerateImage}
                className="h-10 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 flex items-center justify-center gap-2 transition-all"
              >
                <ImageIcon className="h-4 w-4" /> Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlatformBlock({
  label,
  text,
  id,
  copied,
  onCopy,
}: {
  label: string;
  text: string;
  id: string;
  copied: string | null;
  onCopy: (k: string, t: string) => void;
}) {
  return (
    <div className="border border-border/60 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">{label}</span>
        <CopyBtn id={id} copied={copied} onClick={() => onCopy(id, text)} />
      </div>
      <div className="text-sm whitespace-pre-wrap leading-relaxed">{text}</div>
    </div>
  );
}

function CopyBtn({ id, copied, onClick }: { id: string; copied: string | null; onClick: () => void }) {
  const isCopied = copied === id;
  return (
    <button
      onClick={onClick}
      className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
    >
      {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {isCopied ? "Copied" : "Copy"}
    </button>
  );
}
