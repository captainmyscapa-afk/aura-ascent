import { createFileRoute, Link } from "@tanstack/react-router";
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
  Zap,
  FileText,
  Video,
  Film,
  Instagram,
  Linkedin,
  ArrowUpRight,
  Pencil,
  Calendar,
  Clock,
  Twitter,
  Youtube,
  Facebook,
  CheckSquare,
  Square,
} from "lucide-react";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { INDUSTRY_TO_CATEGORY } from "@/lib/industry/categoryMap";
import { useProGate, UsageBar } from "@/components/aurum/ProGate";
import { UpgradeModal } from "@/components/aurum/UpgradeModal";
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
type Format = "post" | "image" | "video";

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
  const [videoDuration, setVideoDuration] = useState<10 | 15 | 30 | 60>(15);
  const [orientation, setOrientation] = useState<"portrait" | "landscape" | "auto">("auto");
  const [idea, setIdea] = useState("");
  const [goal, setGoal] = useState("");
  const [intel, setIntel] = useState<IntelEntry[]>([]);
  const [selectedIntel, setSelectedIntel] = useState<Set<string>>(new Set());
  const [plan, setPlan] = useState<StudioContentPlan | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const studioGate = useProGate("studio_drafts");
  const [copied, setCopied] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [loadStep, setLoadStep] = useState(0);
  const [editablePlan, setEditablePlan] = useState<StudioContentPlan | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(new Set());

  const LOAD_STEPS = [
    "Scanning market signals…",
    "Architecting your hook…",
    "Writing platform captions…",
    "Optimising for virality…",
  ];

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
    if (user) {
      loadHistory();
      // Load connected social platforms
      (supabase.from("social_accounts") as any)
        .select("platform")
        .eq("user_id", user.id)
        .then(({ data }: { data: { platform: string }[] | null }) => {
          setConnectedPlatforms(new Set((data ?? []).map((a) => a.platform)));
        });
    }
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

  const deleteFromHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await (supabase.from("user_content_history") as any)
      .delete()
      .eq("id", id)
      .eq("user_id", user?.id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
    if (lastSavedId === id) {
      setLastSavedId(null);
      setPlan(null);
    }
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
    setEditablePlan(null); // reset, will be set after setPlan below
    setImageUrl(entry.image_url || null);
    setLastSavedId(entry.id);
    setPlan({
      title: entry.title || "",
      viralHook: entry.viral_hook || "",
      platforms: Object.fromEntries([
        ["instagram", entry.instagram_caption],
        ["tiktok", entry.tiktok_caption],
        ["linkedin", entry.linkedin_caption],
      ].filter(([, v]) => !!v) as [string, string][]),
      script: [],
      hashtags: entry.hashtags || [],
      visualPrompt: entry.visual_prompt || "",
      format: entry.mode || "post",
    });
    setShowHistory(false);
    // Rebuild editable plan from history entry
    const hp: StudioContentPlan = {
      title: entry.title || "",
      viralHook: entry.viral_hook || "",
      platforms: Object.fromEntries([
        ["instagram", entry.instagram_caption],
        ["tiktok", entry.tiktok_caption],
        ["linkedin", entry.linkedin_caption],
      ].filter(([, v]) => !!v) as [string, string][]),
      script: [],
      hashtags: entry.hashtags || [],
      visualPrompt: entry.visual_prompt || "",
      format: entry.mode || "post",
    };
    setEditablePlan(hp);
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
    if (!studioGate.gate("You've used your free content draft. Upgrade to Pro for unlimited generation.")) return;
    setError(null);
    setPlan(null);
    setImageUrl(null);
    setImageError(false);
    setLastSavedId(null);
    setLoadStep(0);
    setPending(true);
    const stepInterval = setInterval(() => setLoadStep((s) => Math.min(s + 1, LOAD_STEPS.length - 1)), 4000);


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
          format,
          orientation: format !== "post" ? orientation : undefined,
          goal: goal || undefined,
          userIdea: mode === "assisted" ? idea || undefined : undefined,
          intelligenceContext,
        },
      });

      setPlan(result);
      setEditablePlan(result);
      await studioGate.increment("studio_drafts");
      await saveToHistory(result);
      await updateMemory(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      clearInterval(stepInterval);
      setPending(false);
    }
  };

  const generateImage = async (visualPrompt: string) => {
    setImageLoading(true);
    setImageError(false);
    setImageUrl(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        "https://ooliwsmmtpggejyjmone.supabase.co/functions/v1/generate-image",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
          },
          body: JSON.stringify({ prompt: visualPrompt }),
        }
      );

      if (!res.ok) throw new Error("Image generation failed");
      const data = await res.json() as { type: "url" | "base64"; url?: string; data?: string; mimeType?: string };

      let finalUrl: string;
      if (data.type === "base64" && data.data) {
        // Convert base64 to blob URL for display
        const byteChars = atob(data.data);
        const byteArr = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteArr], { type: data.mimeType ?? "image/png" });
        finalUrl = URL.createObjectURL(blob);
      } else if (data.type === "url" && data.url) {
        // Pollinations URL — verify it loads
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Image load failed"));
          setTimeout(() => reject(new Error("Timeout")), 30_000);
          img.src = data.url!;
        });
        finalUrl = data.url;
      } else {
        throw new Error("No image returned");
      }

      setImageUrl(finalUrl);
      if (lastSavedId) {
        await (supabase.from("user_content_history") as any)
          .update({ image_url: finalUrl })
          .eq("id", lastSavedId);
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

  // Share to any connected platform
  const [sharing, setSharing] = useState<string | null>(null);

  const shareToplatform = async (platform: string, text: string, key: string) => {
    setSharing(key);
    try {
      await navigator.clipboard.writeText(text);
      const urls: Record<string, string> = {
        twitter:   `https://twitter.com/intent/tweet?text=${encodeURIComponent(text.slice(0, 280))}`,
        linkedin:  `https://www.linkedin.com/feed/?shareActive=true`,
        instagram: `https://www.instagram.com/`,
        tiktok:    `https://www.tiktok.com/upload`,
        youtube:   `https://studio.youtube.com/`,
        substack:  `https://substack.com/publish/post/new`,
      };
      const url = urls[platform];
      if (url) window.open(url, "_blank");
    } finally {
      setTimeout(() => setSharing(null), 1500);
    }
  };

  const linkedinPosting = null; // kept for type compat below

  const canRun = (mode === "intelligence" ? intel.length > 0 : idea.trim().length > 2) && studioGate.canUse;

  return (
    <AppShell>
      <UpgradeModal
        open={studioGate.showUpgrade}
        onClose={() => studioGate.setShowUpgrade(false)}
        reason="You've used your free content draft. Upgrade to Pro for unlimited AI content generation."
      />
      {/* ── Header ── */}
      <div className="relative mb-10 animate-fade-up overflow-hidden rounded-2xl glass p-8 sm:p-10">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full opacity-[0.07] blur-3xl" style={{ background: "var(--gradient-gold)" }} />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <div className="text-[10px] tracking-[0.4em] text-primary/80 uppercase">
                Content Studio · {industry.modeLabel}
              </div>
              {!studioGate.isPro && (
                <div className="ml-2">
                  <UsageBar used={studioGate.limit - studioGate.remaining} limit={studioGate.limit} label="free draft" />
                </div>
              )}
            </div>
            <h1 className="font-serif text-4xl sm:text-[52px] leading-[1.05] tracking-tight">
              Viral content,{" "}
              <span className="italic text-gold-gradient">on demand.</span>
            </h1>
            <p className="mt-4 text-muted-foreground max-w-xl text-sm leading-relaxed">
              AURUM's AI creative director crafts post-ready content for the{" "}
              <span className="text-foreground/80">{industry.label.toLowerCase()}</span> world — hooks, captions,
              scripts, hashtags, visuals. Ready in under 30 seconds.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Viral hooks", "Platform captions", "Hashtags", "AI visuals"].map((tag) => (
                <span key={tag} className="text-[10px] tracking-[0.2em] px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs tracking-[0.2em] uppercase border transition-all ${showHistory ? "border-primary/60 text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-primary hover:border-primary/40"}`}
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
              <div key={entry.id} className="flex items-start gap-1 rounded-lg border border-border hover:border-primary/40 transition-all">
                <button
                  onClick={() => loadFromHistory(entry)}
                  className="flex-1 text-left p-3 min-w-0"
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
                <button
                  onClick={(e) => void deleteFromHistory(entry.id, e)}
                  className="shrink-0 p-2 mt-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete draft"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <ModeTab
              active={mode === "assisted"}
              onClick={() => setMode("assisted")}
              icon={Wand2}
              label="AI Assisted"
              sub="Write from your own idea"
              color="gold"
            />
            <ModeTab
              active={mode === "intelligence"}
              onClick={() => setMode("intelligence")}
              icon={Radio}
              label="Live Intel"
              sub="Amplify today's signals"
              color="violet"
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

          <div className="glass rounded-xl p-5 space-y-5">
            <div>
              <Label>FORMAT</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { f: "post" as Format, icon: FileText, label: "Post", desc: "Facebook · X · LinkedIn" },
                  { f: "image" as Format, icon: ImageIcon, label: "Image", desc: "TikTok · IG · YouTube" },
                  { f: "video" as Format, icon: Video, label: "Video", desc: "TikTok · IG · YouTube" },
                ]).map(({ f, icon: Icon, label, desc }) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`flex flex-col items-center gap-1.5 py-4 rounded-xl border transition-all ${
                      format === f
                        ? "border-primary/60 bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${format === f ? "text-primary" : ""}`} />
                    <span className="text-[11px] font-medium tracking-wide">{label}</span>
                    <span className="text-[9px] text-muted-foreground">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {format === "video" && (
              <div>
                <Label>DURATION</Label>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { d: 10 as const, label: "10s" },
                    { d: 15 as const, label: "15s" },
                    { d: 30 as const, label: "30s" },
                    { d: 60 as const, label: "1 min" },
                  ]).map(({ d, label }) => (
                    <button
                      key={d}
                      onClick={() => setVideoDuration(d)}
                      className={`text-xs py-2.5 rounded-lg border transition-all font-mono ${videoDuration === d ? "border-primary/60 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/30"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(format === "image" || format === "video") && (
              <div>
                <Label>ORIENTATION</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { o: "portrait" as const, label: "Portrait", desc: "9:16" },
                    { o: "landscape" as const, label: "Landscape", desc: "16:9" },
                    { o: "auto" as const, label: "Auto", desc: "Adaptive" },
                  ]).map(({ o, label, desc }) => (
                    <button
                      key={o}
                      onClick={() => setOrientation(o)}
                      className={`flex flex-col items-center gap-0.5 py-3 rounded-xl border transition-all ${orientation === o ? "border-primary/60 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/30"}`}
                    >
                      <span className="text-[11px] font-medium tracking-wide">{label}</span>
                      <span className="text-[9px] text-muted-foreground">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => void run()}
            disabled={!canRun || pending}
            className="relative w-full h-14 rounded-xl text-primary-foreground font-medium flex items-center justify-center gap-2.5 disabled:opacity-50 transition-all overflow-hidden group"
            style={{ background: "var(--gradient-gold)" }}
          >
            {/* shimmer sweep on hover */}
            <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm tracking-wide">{LOAD_STEPS[loadStep]}</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                <span className="text-sm tracking-[0.08em] font-semibold">Generate viral content</span>
                {canRun && <span className="text-[10px] opacity-70 ml-1">~30s</span>}
              </>
            )}
          </button>

          {error && <div className="text-xs text-destructive border border-destructive/40 rounded-lg p-3">{error}</div>}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
          {!plan && !pending && (
            <div className="relative glass rounded-2xl p-10 text-center overflow-hidden">
              <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full opacity-[0.06] blur-3xl" style={{ background: "var(--gradient-gold)" }} />
              <div className="relative">
                <div className="relative h-16 w-16 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" />
                  <div className="absolute inset-0 rounded-full border border-primary/10" />
                  <div className="absolute inset-3 rounded-full flex items-center justify-center" style={{ background: "var(--gradient-gold)" }}>
                    <Sparkles className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
                <div className="font-serif text-2xl mb-2">Your content, ready in 30s</div>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Hook · Captions · Script · Hashtags · Visual — all in one shot, tuned for {industry.label.toLowerCase()}.
                </p>
                <div className="mt-6 flex justify-center gap-4 text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                  <span className="flex items-center gap-1"><Instagram className="h-3 w-3" /> Instagram</span>
                  <span className="flex items-center gap-1"><Send className="h-3 w-3" /> TikTok</span>
                  <span className="flex items-center gap-1"><Linkedin className="h-3 w-3" /> LinkedIn</span>
                </div>
              </div>
            </div>
          )}

          {pending && !plan && (
            <div className="relative glass rounded-2xl overflow-hidden">
              <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ background: "var(--gradient-gold)" }} />
              <div className="relative p-10 text-center">
                <div className="relative h-14 w-14 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border border-primary/30 animate-spin" style={{ borderTopColor: "transparent" }} />
                  <div className="absolute inset-3 rounded-full flex items-center justify-center" style={{ background: "var(--gradient-gold)" }}>
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
                <div className="font-serif text-xl mb-3">Composing your content…</div>
                <div className="space-y-2 max-w-xs mx-auto">
                  {LOAD_STEPS.map((step, i) => (
                    <div key={step} className={`flex items-center gap-2 text-xs transition-all ${i <= loadStep ? "text-foreground" : "text-muted-foreground/30"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 transition-all ${i < loadStep ? "bg-primary" : i === loadStep ? "bg-emerald-400 animate-pulse" : "bg-border"}`} />
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(plan || editablePlan) && (
            <PlanOutput
              plan={editablePlan ?? plan!}
              onPlanChange={setEditablePlan}
              copied={copied}
              onCopy={copy}
              imageUrl={imageUrl}
              imageLoading={imageLoading}
              imageError={imageError}
              onGenerateImage={() => generateImage((editablePlan ?? plan!).visualPrompt)}
              onDownloadImage={downloadImage}
              onShare={shareToplatform}
              sharing={sharing}
              format={format}
              connectedPlatforms={connectedPlatforms}
              session={supabase}
              userId={user?.id}
              industryId={industryId}
              lastSavedId={lastSavedId}
            />
          )}
        </div>
      </div>

      <div className="mt-14">
        <SectionHeading eyebrow="LIVE SIGNALS" title="Ideas to expand" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Live intelligence articles as content ideas */}
          {intel
            .filter(e => e.category === INDUSTRY_TO_CATEGORY[industryId as keyof typeof INDUSTRY_TO_CATEGORY] || !e.category)
            .slice(0, 8)
            .map((e) => (
              <button
                key={e.id}
                onClick={() => {
                  setMode("intelligence");
                  setSelectedIntel(new Set([e.id]));
                  setIdea("");
                }}
                className="glass rounded-xl p-4 text-left hover:ring-gold transition-all group"
              >
                <div className="text-[9px] tracking-[0.3em] text-primary/80 mb-2 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                  {e.source ?? "LIVE SIGNAL"}
                </div>
                <div className="text-sm font-serif leading-snug group-hover:text-primary transition-colors">{e.title}</div>
              </button>
            ))}
          {/* Fallback to config prompts if no intelligence yet */}
          {intel.filter(e => e.category === INDUSTRY_TO_CATEGORY[industryId as keyof typeof INDUSTRY_TO_CATEGORY]).length === 0 &&
            industry.contentPrompts.map((p) => (
              <button
                key={p.t}
                onClick={() => { setMode("assisted"); setIdea(p.t); }}
                className="glass rounded-xl p-4 text-left hover:ring-gold transition-all"
              >
                <div className="text-[9px] tracking-[0.3em] text-primary/80 mb-2">{p.type}</div>
                <div className="text-sm font-serif leading-snug">{p.t}</div>
              </button>
            ))
          }
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
  color,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Wand2;
  label: string;
  sub: string;
  color: "gold" | "violet";
}) {
  return (
    <button
      onClick={onClick}
      className={`relative glass rounded-xl p-5 text-left transition-all overflow-hidden group ${
        active ? "ring-1 ring-primary/50" : "hover:border-primary/30"
      }`}
    >
      {active && (
        <div className={`pointer-events-none absolute inset-0 opacity-[0.06] ${color === "gold" ? "" : "bg-violet-500"}`}
          style={color === "gold" ? { background: "var(--gradient-gold)" } : {}} />
      )}
      <div className="relative">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 transition-all ${
          active
            ? color === "gold" ? "text-primary-foreground" : "bg-violet-500/20 text-violet-400"
            : "bg-secondary text-muted-foreground"
        }`} style={active && color === "gold" ? { background: "var(--gradient-gold)" } : {}}>
          <Icon className="h-4 w-4" />
        </div>
        <div className={`text-sm font-semibold mb-0.5 ${active ? "text-foreground" : "text-foreground/70"}`}>{label}</div>
        <div className="text-[11px] text-muted-foreground leading-snug">{sub}</div>
      </div>
    </button>
  );
}

const PLATFORM_META: Record<string, { label: string; icon: typeof Send; color: string; badge: string; shareKey: string }> = {
  facebook:      { label: "Facebook",       icon: ArrowUpRight, color: "from-blue-600/20 to-blue-500/10",   badge: "bg-blue-600/20 text-blue-300",   shareKey: "facebook" },
  twitter:       { label: "X / Twitter",    icon: Send,         color: "from-foreground/10 to-foreground/5", badge: "bg-foreground/10 text-foreground/70", shareKey: "twitter" },
  linkedin:      { label: "LinkedIn",       icon: Linkedin,     color: "from-blue-500/20 to-blue-400/10",   badge: "bg-blue-500/20 text-blue-300",   shareKey: "linkedin" },
  tiktok:        { label: "TikTok",         icon: Film,         color: "from-foreground/10 to-foreground/5", badge: "bg-foreground/10 text-foreground/70", shareKey: "tiktok" },
  instagram:     { label: "Instagram",      icon: Instagram,    color: "from-pink-500/20 to-violet-500/20", badge: "bg-pink-500/20 text-pink-300",    shareKey: "instagram" },
  youtube_shorts:{ label: "YouTube Shorts", icon: Video,        color: "from-red-500/20 to-red-400/10",     badge: "bg-red-500/20 text-red-300",      shareKey: "youtube" },
};

function PlanOutput({
  plan,
  onPlanChange,
  copied,
  onCopy,
  imageUrl,
  imageLoading,
  imageError,
  onGenerateImage,
  onDownloadImage,
  onShare,
  sharing,
  format,
  connectedPlatforms,
  session: supabaseClient,
  userId,
  industryId,
  lastSavedId,
}: {
  plan: StudioContentPlan;
  onPlanChange: (p: StudioContentPlan) => void;
  copied: string | null;
  onCopy: (k: string, t: string) => void;
  imageUrl: string | null;
  imageLoading: boolean;
  imageError: boolean;
  onGenerateImage: () => void;
  onDownloadImage: () => void;
  onShare?: (platform: string, text: string, key: string) => void;
  sharing?: string | null;
  format: string;
  connectedPlatforms: Set<string>;
  session: typeof supabase;
  userId?: string;
  industryId: string;
  lastSavedId: string | null;
}) {
  const platformKeys = Object.keys(plan.platforms).filter((k) => plan.platforms[k]);
  const [activeTab, setActiveTab] = useState(platformKeys[0] ?? "");

  // Inline editing
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [editingScript, setEditingScript] = useState(false);
  const [scriptDraft, setScriptDraft] = useState("");
  const [editingHashtags, setEditingHashtags] = useState(false);
  const [hashtagsDraft, setHashtagsDraft] = useState("");
  const [editingVisual, setEditingVisual] = useState(false);
  const [visualDraft, setVisualDraft] = useState("");

  const activeMeta = PLATFORM_META[activeTab] ?? PLATFORM_META["instagram"];
  const activePlatform = {
    key: activeTab,
    text: plan.platforms[activeTab] ?? "",
    ...activeMeta,
  };

  const updateCaption = (key: string, text: string) => {
    onPlanChange({ ...plan, platforms: { ...plan.platforms, [key]: text } });
  };

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Title + Hook */}
      <div className="relative glass rounded-2xl p-6 overflow-hidden ring-gold">
        <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={{ background: "var(--gradient-gold)" }} />
        <div className="relative">
          <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">CONTENT TITLE</div>
          <div className="font-serif text-2xl leading-tight mb-5">{plan.title}</div>
          <div className="border-t border-border/40 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] tracking-[0.3em] text-primary/80 uppercase">Viral Hook · First 2 Seconds</span>
            </div>
            <div className="text-[17px] italic leading-snug text-foreground/90 font-serif">
              "{plan.viralHook}"
            </div>
          </div>
        </div>
      </div>

      {/* Platform tabs */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex border-b border-border/60 overflow-x-auto">
          {platformKeys.map((key) => {
            const meta = PLATFORM_META[key];
            if (!meta) return null;
            const Icon = meta.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-3 px-2 text-[10px] tracking-[0.15em] uppercase whitespace-nowrap transition-all border-b-2 ${
                  activeTab === key
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3 w-3 shrink-0" />
                <span className="truncate">{meta.label}</span>
              </button>
            );
          })}
        </div>

        <div className={`p-5 bg-gradient-to-br ${activePlatform.color}`}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <span className={`text-[9px] tracking-[0.3em] uppercase px-2 py-1 rounded-full ${activePlatform.badge}`}>
              {activePlatform.label}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditingCaption(activeTab); setCaptionDraft(activePlatform.text); }}
                className="flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors"
              >
                <Pencil className="h-3 w-3" /> Modify
              </button>
              {onShare && (
                <button
                  onClick={() => onShare(activePlatform.shareKey, activePlatform.text, activeTab)}
                  disabled={sharing === activeTab}
                  className="flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase text-primary/80 hover:text-primary transition-colors disabled:opacity-50"
                >
                  {sharing === activeTab ? <><Loader2 className="h-3 w-3 animate-spin" /> Opening…</> : <><ArrowUpRight className="h-3 w-3" /> Open</>}
                </button>
              )}
              <CopyBtn id={activeTab} copied={copied} onClick={() => onCopy(activeTab, activePlatform.text)} />
            </div>
          </div>
          {editingCaption === activeTab ? (
            <div className="space-y-2">
              <textarea
                value={captionDraft}
                onChange={(e) => setCaptionDraft(e.target.value)}
                rows={6}
                className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 resize-y transition-colors"
              />
              <div className="flex gap-2">
                <button onClick={() => { updateCaption(activeTab, captionDraft); setEditingCaption(null); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-primary-foreground text-xs" style={{ background: "var(--gradient-gold)" }}>
                  <Check className="h-3 w-3" /> Save
                </button>
                <button onClick={() => setEditingCaption(null)} className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{activePlatform.text}</div>
          )}
        </div>
      </div>

      {plan.script.length > 0 && (
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] tracking-[0.34em] text-primary/80">CONTENT SCRIPT</div>
            <button onClick={() => { setEditingScript(true); setScriptDraft(plan.script.join("\n")); }} className="flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors">
              <Pencil className="h-3 w-3" /> Modify
            </button>
          </div>
          {editingScript ? (
            <div className="space-y-2">
              <textarea value={scriptDraft} onChange={(e) => setScriptDraft(e.target.value)} rows={8} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 resize-y transition-colors" placeholder="One beat per line…" />
              <div className="flex gap-2">
                <button onClick={() => { onPlanChange({ ...plan, script: scriptDraft.split("\n").filter(Boolean) }); setEditingScript(false); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-primary-foreground text-xs" style={{ background: "var(--gradient-gold)" }}>
                  <Check className="h-3 w-3" /> Save
                </button>
                <button onClick={() => setEditingScript(false)} className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              </div>
            </div>
          ) : (
            <ol className="space-y-2">
              {plan.script.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="text-primary/80 font-mono text-xs pt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] tracking-[0.34em] text-primary/80 flex items-center gap-2">
            <Hash className="h-3 w-3" /> HASHTAGS
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setEditingHashtags(true); setHashtagsDraft(plan.hashtags.join(" ")); }} className="flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors">
              <Pencil className="h-3 w-3" /> Modify
            </button>
            <CopyBtn id="tags" copied={copied} onClick={() => onCopy("tags", plan.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "))} />
          </div>
        </div>
        {editingHashtags ? (
          <div className="space-y-2">
            <input value={hashtagsDraft} onChange={(e) => setHashtagsDraft(e.target.value)} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors" placeholder="#yacht #luxury …" />
            <div className="flex gap-2">
              <button onClick={() => { onPlanChange({ ...plan, hashtags: hashtagsDraft.split(/\s+/).filter(Boolean) }); setEditingHashtags(false); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-primary-foreground text-xs" style={{ background: "var(--gradient-gold)" }}>
                <Check className="h-3 w-3" /> Save
              </button>
              <button onClick={() => setEditingHashtags(false)} className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {plan.hashtags.map((h, i) => (
              <span key={h} className={`text-[11px] px-2.5 py-1 rounded-full border cursor-default ${
                i % 3 === 0 ? "border-primary/30 text-primary/80 bg-primary/5"
                : i % 3 === 1 ? "border-violet-400/30 text-violet-400/80 bg-violet-400/5"
                : "border-border text-muted-foreground"
              }`}>
                {h.startsWith("#") ? h : `#${h}`}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] tracking-[0.34em] text-primary/80 flex items-center gap-2">
            <ImageIcon className="h-3 w-3" /> VISUAL PROMPT
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setEditingVisual(true); setVisualDraft(plan.visualPrompt); }} className="flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors">
              <Pencil className="h-3 w-3" /> Modify
            </button>
            <CopyBtn id="vis" copied={copied} onClick={() => onCopy("vis", plan.visualPrompt)} />
          </div>
        </div>
        {editingVisual ? (
          <div className="space-y-2 mb-4">
            <textarea value={visualDraft} onChange={(e) => setVisualDraft(e.target.value)} rows={4} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 resize-y transition-colors" />
            <div className="flex gap-2">
              <button onClick={() => { onPlanChange({ ...plan, visualPrompt: visualDraft }); setEditingVisual(false); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-primary-foreground text-xs" style={{ background: "var(--gradient-gold)" }}>
                <Check className="h-3 w-3" /> Save
              </button>
              <button onClick={() => setEditingVisual(false)} className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="text-sm leading-relaxed text-foreground/90 italic mb-4">{plan.visualPrompt}</div>
        )}

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

      {/* Publish Panel */}
      <PublishPanel
        plan={plan}
        connectedPlatforms={connectedPlatforms}
        supabaseClient={supabaseClient}
        userId={userId}
        industryId={industryId}
        imageUrl={imageUrl}
        lastSavedId={lastSavedId}
      />
    </div>
  );
}

// ─── Publish Panel ────────────────────────────────────────────────────────────

const ALL_PUBLISH_PLATFORMS = [
  { key: "instagram",      label: "Instagram",       icon: Instagram,    shareKey: "instagram" },
  { key: "tiktok",         label: "TikTok",           icon: Film,         shareKey: "tiktok" },
  { key: "youtube_shorts", label: "YouTube Shorts",  icon: Youtube,      shareKey: "youtube" },
  { key: "facebook",       label: "Facebook",         icon: Facebook,     shareKey: "facebook" },
  { key: "linkedin",       label: "LinkedIn",         icon: Linkedin,     shareKey: "linkedin" },
  { key: "twitter",        label: "X / Twitter",      icon: Twitter,      shareKey: "twitter" },
];

function PublishPanel({
  plan, connectedPlatforms, supabaseClient, userId, industryId, imageUrl, lastSavedId,
}: {
  plan: StudioContentPlan;
  connectedPlatforms: Set<string>;
  supabaseClient: typeof supabase;
  userId?: string;
  industryId: string;
  imageUrl: string | null;
  lastSavedId: string | null;
}) {
  const availablePlatforms = ALL_PUBLISH_PLATFORMS.filter((p) => plan.platforms[p.key]);
  const [selected, setSelected] = useState<Set<string>>(new Set(availablePlatforms.map((p) => p.key)));
  const [postStatus, setPostStatus] = useState<Record<string, "idle" | "posting" | "done" | "error">>({});
  const [showScheduler, setShowScheduler] = useState(false);
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("09:00");
  const [saving, setSaving] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [saved, setSaved] = useState(false);
  const [scheduled, setScheduled] = useState(false);

  const togglePlatform = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const postNow = async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const token = session?.access_token ?? "";

    for (const key of selected) {
      if (!plan.platforms[key]) continue;
      setPostStatus((s) => ({ ...s, [key]: "posting" }));

      if (connectedPlatforms.has(key)) {
        try {
          const res = await fetch("https://ooliwsmmtpggejyjmone.supabase.co/functions/v1/post-content", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ platform: key, text: plan.platforms[key], imageUrl: imageUrl ?? undefined }),
          });
          const data = await res.json() as { success?: boolean; manualPost?: boolean; error?: string };
          if (data.success || data.manualPost) {
            setPostStatus((s) => ({ ...s, [key]: "done" }));
            // Fallback: open platform if manual
            if (data.manualPost) {
              await navigator.clipboard.writeText(plan.platforms[key] ?? "");
              const urls: Record<string, string> = { instagram: "https://www.instagram.com/", tiktok: "https://www.tiktok.com/upload", youtube_shorts: "https://studio.youtube.com/", facebook: "https://www.facebook.com/", linkedin: "https://www.linkedin.com/feed/?shareActive=true", twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent((plan.platforms[key] ?? "").slice(0, 280))}` };
              if (urls[key]) window.open(urls[key], "_blank");
            }
          } else {
            setPostStatus((s) => ({ ...s, [key]: "error" }));
          }
        } catch {
          setPostStatus((s) => ({ ...s, [key]: "error" }));
        }
      } else {
        // Not connected — copy + open
        await navigator.clipboard.writeText(plan.platforms[key] ?? "");
        const urls: Record<string, string> = { instagram: "https://www.instagram.com/", tiktok: "https://www.tiktok.com/upload", youtube_shorts: "https://studio.youtube.com/", facebook: "https://www.facebook.com/", linkedin: "https://www.linkedin.com/feed/?shareActive=true", twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent((plan.platforms[key] ?? "").slice(0, 280))}` };
        if (urls[key]) window.open(urls[key], "_blank");
        setPostStatus((s) => ({ ...s, [key]: "done" }));
      }
    }
  };

  const schedulePost = async () => {
    if (!userId || !schedDate) return;
    setScheduling(true);
    const scheduledAt = new Date(`${schedDate}T${schedTime}:00`).toISOString();
    await (supabaseClient.from("scheduled_posts") as any).insert({
      user_id: userId,
      industry: industryId,
      format: plan.format,
      title: plan.title,
      viral_hook: plan.viralHook,
      platforms: plan.platforms,
      selected_platforms: Array.from(selected),
      hashtags: plan.hashtags,
      script: plan.script,
      visual_prompt: plan.visualPrompt,
      image_url: imageUrl,
      scheduled_at: scheduledAt,
      status: "scheduled",
    });
    setScheduling(false);
    setScheduled(true);
    setShowScheduler(false);
    setTimeout(() => setScheduled(false), 3000);
  };

  const saveNow = async () => {
    if (!userId) return;
    setSaving(true);
    await (supabaseClient.from("scheduled_posts") as any).insert({
      user_id: userId,
      industry: industryId,
      format: plan.format,
      title: plan.title,
      viral_hook: plan.viralHook,
      platforms: plan.platforms,
      selected_platforms: Array.from(selected),
      hashtags: plan.hashtags,
      script: plan.script,
      visual_prompt: plan.visualPrompt,
      image_url: imageUrl,
      scheduled_at: new Date().toISOString(),
      status: "saved",
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (availablePlatforms.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-6 border border-primary/20 space-y-5">
      <div className="text-[10px] tracking-[0.34em] text-primary/80">POST YOUR CONTENT ON</div>

      {/* Platform multi-select */}
      <div className="space-y-2">
        {availablePlatforms.map((p) => {
          const Icon = p.icon;
          const isSelected = selected.has(p.key);
          const isConnected = connectedPlatforms.has(p.key);
          const status = postStatus[p.key] ?? "idle";
          return (
            <button
              key={p.key}
              onClick={() => togglePlatform(p.key)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                isSelected ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
              }`}
            >
              {isSelected ? <CheckSquare className="h-4 w-4 text-primary shrink-0" /> : <Square className="h-4 w-4 text-muted-foreground shrink-0" />}
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sm">{p.label}</span>
              {isConnected ? (
                <span className="text-[9px] tracking-[0.2em] text-emerald-400 uppercase">Connected</span>
              ) : (
                <Link to="/profile" className="text-[9px] tracking-[0.2em] text-muted-foreground hover:text-primary uppercase transition-colors" onClick={(e) => e.stopPropagation()}>
                  Connect →
                </Link>
              )}
              {status === "posting" && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />}
              {status === "done" && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
              {status === "error" && <X className="h-3.5 w-3.5 text-destructive shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Caption preview for selected platforms */}
      {selected.size > 0 && (
        <div className="text-[11px] text-muted-foreground">
          Caption linked: {Array.from(selected).filter((k) => plan.platforms[k]).map((k) => {
            const p = ALL_PUBLISH_PLATFORMS.find((x) => x.key === k);
            return p?.label;
          }).join(", ")}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <button
          onClick={postNow}
          disabled={selected.size === 0}
          className="w-full h-12 rounded-xl text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all group relative overflow-hidden"
          style={{ background: "var(--gradient-gold)" }}
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <Zap className="h-4 w-4" />
          Post your content now
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={saveNow}
            disabled={saving}
            className="h-10 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 flex items-center justify-center gap-2 transition-all"
          >
            {saved ? <><Check className="h-3.5 w-3.5 text-emerald-400" /> Saved!</> : saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : "Save"}
          </button>
          <button
            onClick={() => setShowScheduler(!showScheduler)}
            className={`h-10 rounded-xl border text-sm flex items-center justify-center gap-2 transition-all ${showScheduler ? "border-primary/50 text-primary bg-primary/5" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"}`}
          >
            <Clock className="h-3.5 w-3.5" /> Schedule post
          </button>
        </div>

        {scheduled && (
          <div className="flex items-center gap-2 text-sm text-emerald-400 justify-center">
            <Check className="h-4 w-4" /> Post scheduled successfully
          </div>
        )}

        {/* Scheduler */}
        {showScheduler && (
          <div className="border border-primary/20 rounded-xl p-4 space-y-3 bg-secondary/10 animate-fade-up">
            <div className="text-[10px] tracking-[0.3em] text-primary/80">SCHEDULE POST</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Date</div>
                <input
                  type="date"
                  value={schedDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setSchedDate(e.target.value)}
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Time</div>
                <input
                  type="time"
                  value={schedTime}
                  onChange={(e) => setSchedTime(e.target.value)}
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
            <button
              onClick={schedulePost}
              disabled={!schedDate || scheduling}
              className="w-full h-10 rounded-xl text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "var(--gradient-gold)" }}
            >
              {scheduling ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Scheduling…</> : <><Calendar className="h-3.5 w-3.5" /> Confirm schedule</>}
            </button>
          </div>
        )}
      </div>
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
