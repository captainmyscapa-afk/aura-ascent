import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  Plus,
  Flag,
  Library,
  Paperclip,
} from "lucide-react";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { INDUSTRY_TO_CATEGORY } from "@/lib/industry/categoryMap";
import { useProGate, UsageBar } from "@/components/aurum/ProGate";
import { UpgradeModal } from "@/components/aurum/UpgradeModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateStudioContent, type StudioContentPlan } from "@/lib/studio.functions";
import { useReferencePhotos, type ReferencePhoto } from "@/hooks/useReferencePhotos";
import { useGeneratedLibrary } from "@/hooks/useGeneratedLibrary";
import { useMediaCollections } from "@/hooks/useMediaCollections";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { T } from "@/lib/i18n/translations";

export const Route = createFileRoute("/studio")({
  component: Studio,
  validateSearch: (search: Record<string, unknown>) => ({
    intel: search.intel as string | undefined,
    idea: search.idea as string | undefined,
    // CAP-126: Calendar's "Open in Studio" on a scheduled post links straight
    // here so the generated content loads immediately, instead of landing on
    // a blank Studio the person then has to dig through history to find.
    scheduledPostId: search.scheduledPostId as string | undefined,
  }),
});

type Mode = "assisted" | "intelligence";

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
  platforms: Record<string, string> | null;
  script: string[] | null;
  hashtags: string[] | null;
  visual_prompt: string | null;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
};

// CAP-126: the row shape read back from scheduled_posts when jumping in from
// Calendar's "Open in Studio" — a narrower set of fields than HistoryEntry
// since scheduled_posts has no idea/goal/video_url columns.
type ScheduledPostRow = {
  id: string;
  format: string | null;
  title: string | null;
  viral_hook: string | null;
  platforms: Record<string, string> | null;
  script: string[] | null;
  hashtags: string[] | null;
  visual_prompt: string | null;
  image_url: string | null;
};

function useTilt(strength = 8) {
  const [style, setStyle] = useState<React.CSSProperties>({
    transform: "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)",
  });
  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setStyle({
      transform: `perspective(900px) rotateX(${(-py * strength).toFixed(2)}deg) rotateY(${(px * strength).toFixed(2)}deg) translateZ(4px)`,
    });
  };
  const onMouseLeave = () => {
    setStyle({ transform: "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)" });
  };
  return { style, onMouseMove, onMouseLeave };
}

/** Scroll-reveal: element fades/rises into place the first time it enters the viewport. */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

function Studio() {
  const { t, lang } = useLanguage();
  const dateLocale = lang === "fr" ? "fr-FR" : "en-GB";
  const { industry, industryId } = useIndustry();
  const { user } = useAuth();
  const generate = useServerFn(generateStudioContent);

  const [mode, setMode] = useState<Mode>("assisted");
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
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoComingSoon, setVideoComingSoon] = useState(false);
  // CAP-127: holds the real reason video generation is unavailable right
  // now (not eligible / monthly cap reached / launching soon / transient
  // error) so the UI can say something accurate instead of a blanket
  // "coming soon" once video generation is a real, gated, paid feature.
  const [videoUnavailableMessage, setVideoUnavailableMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [loadStep, setLoadStep] = useState(0);
  const [editablePlan, setEditablePlan] = useState<StudioContentPlan | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(new Set());
  // CAP-133: saved reference photos let generation stay accurate to the
  // real boat instead of hallucinating one. Selection is per-generation;
  // the library itself persists across sessions.
  const referencePhotoLibrary = useReferencePhotos();
  const [selectedReferenceIds, setSelectedReferenceIds] = useState<Set<string>>(new Set());
  // CAP-134: every image/video Studio generates is logged here permanently
  // (separate from history, which only keeps the latest per content item)
  // so nothing generated is ever lost, even if it gets flagged/replaced.
  const generatedLibrary = useGeneratedLibrary();
  const [showGeneratedLibrary, setShowGeneratedLibrary] = useState(false);
  // CAP-135: named folders grouping a boat's reference photos AND its
  // generated images together, shared across both Library sub-tabs.
  const mediaCollections = useMediaCollections();
  const [libraryTab, setLibraryTab] = useState<"added" | "generated">("added");
  const [libraryCollectionFilter, setLibraryCollectionFilter] = useState<string | null>(null);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  // CAP-138: "Add picture" back in the Library panel too (in addition to
  // the Reference Photos panel) -- same file-or-library + folder pattern,
  // scoped with its own state since this one lives at the Library panel
  // level, not inside PlanOutput.
  const [showAddPicture, setShowAddPicture] = useState(false);
  const [addPictureMode, setAddPictureMode] = useState<"file" | "library">("file");
  const [addPictureFile, setAddPictureFile] = useState<File | null>(null);
  const [addPictureRightsChecked, setAddPictureRightsChecked] = useState(false);
  const [addPictureUploading, setAddPictureUploading] = useState(false);
  const [addPictureCollectionId, setAddPictureCollectionId] = useState<string | null>(null);
  const [addPictureCreatingFolder, setAddPictureCreatingFolder] = useState(false);
  const [addPictureNewFolderName, setAddPictureNewFolderName] = useState("");
  // CAP-134: surfaced under the flag form after a flagged regenerate --
  // tells the user whether that regenerate was free or just counted
  // against their normal monthly quota (10 free flags/month).
  const [flagNotice, setFlagNotice] = useState<string | null>(null);

  // CAP-146: once a generation exists, the page shows ONLY the generated
  // content -- no header, no form, no library/history panels, no "ideas to
  // expand" feed -- so the result reads like a finished piece, not a work
  // area. The "AI Assisted + Live Intel" pill (top-left, in place of the
  // header) is the only way back to the creation form; clicking it clears
  // just the output-related state below, not the idea/goal the user typed,
  // so a quick tweak-and-regenerate doesn't require retyping anything.
  const hasPlan = !!(plan || editablePlan);
  const startNewCreation = () => {
    setPlan(null);
    setEditablePlan(null);
    setImageUrl(null);
    setImageLoading(false);
    setImageError(false);
    setVideoUrl(null);
    setVideoLoading(false);
    setVideoError(false);
    setVideoComingSoon(false);
    setVideoUnavailableMessage(null);
    setError(null);
    setFlagNotice(null);
    setLastSavedId(null);
    setCopied(null);
  };

  const LOAD_STEPS = t.stuLoadSteps;

  const { intel: preselectedIntel, idea: preselectedIdea, scheduledPostId } = Route.useSearch();

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

  // CAP-126: land directly on the generated content when Calendar links in with
  // a specific scheduled post, instead of a blank Studio.
  useEffect(() => {
    if (!scheduledPostId || !user) return;
    (async () => {
      const { data } = await supabase
        .from("scheduled_posts")
        .select(
          "id, format, title, viral_hook, platforms, script, hashtags, visual_prompt, image_url",
        )
        .eq("id", scheduledPostId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) loadFromScheduledPost(data as unknown as ScheduledPostRow);
    })();
  }, [scheduledPostId, user]);

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
        platforms: result.platforms,
        script: result.script,
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
    setVideoUrl(entry.video_url || null);
    setVideoError(false);
    setVideoComingSoon(false);
    setLastSavedId(entry.id);
    const restoredPlan: StudioContentPlan = {
      title: entry.title || "",
      viralHook: entry.viral_hook || "",
      platforms: entry.platforms || {},
      script: entry.script || [],
      hashtags: entry.hashtags || [],
      visualPrompt: entry.visual_prompt || "",
      format: entry.mode || "post",
    };
    setPlan(restoredPlan);
    setShowHistory(false);
    // Rebuild editable plan from history entry
    setEditablePlan({ ...restoredPlan });
  };

  // CAP-126: same shape as loadFromHistory, sourced from scheduled_posts instead —
  // no idea/goal (not columns on that table) and no video_url (scheduled_posts
  // predates the video feature's video_url column, so any generated video for a
  // scheduled post was never persisted). lastSavedId is deliberately left alone:
  // scheduled_posts and user_content_history are different tables/ids, so a
  // regenerate here shouldn't try to write an image/video update against the
  // wrong table.
  const loadFromScheduledPost = (row: ScheduledPostRow) => {
    setEditablePlan(null);
    setImageUrl(row.image_url || null);
    setVideoUrl(null);
    setVideoError(false);
    setVideoComingSoon(false);
    const restoredPlan: StudioContentPlan = {
      title: row.title || "",
      viralHook: row.viral_hook || "",
      platforms: row.platforms || {},
      script: row.script || [],
      hashtags: row.hashtags || [],
      visualPrompt: row.visual_prompt || "",
      format: row.format || "post",
    };
    setPlan(restoredPlan);
    setShowHistory(false);
    setEditablePlan({ ...restoredPlan });
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
    if (!studioGate.gate(t.stuGateMessage)) return;
    setError(null);
    setPlan(null);
    setImageUrl(null);
    setImageError(false);
    setLastSavedId(null);
    setLoadStep(0);
    setPending(true);
    const stepInterval = setInterval(
      () => setLoadStep((s) => Math.min(s + 1, LOAD_STEPS.length - 1)),
      4000,
    );

    try {
      const intelligenceContext =
        mode === "intelligence"
          ? (selectedIntel.size === 0 ? modeIntel : intel.filter((e) => selectedIntel.has(e.id)))
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
          goal: goal || undefined,
          userIdea: mode === "assisted" ? idea || undefined : undefined,
          intelligenceContext,
          language: lang,
        },
      });

      setPlan(result);
      setEditablePlan(result);
      await studioGate.increment("studio_drafts");
      await saveToHistory(result);
      await updateMemory(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.stuGenerationFailed);
    } finally {
      clearInterval(stepInterval);
      setPending(false);
    }
  };

  // CAP-133: fetches the currently-selected saved reference photos and
  // converts each to base64 so they can ride along in the generate-image
  // request body -- this is what lets Nano Banana Pro composite around the
  // real boat instead of hallucinating one from the text prompt alone.
  const fetchSelectedReferenceImages = async (): Promise<{ data: string; mimeType: string }[]> => {
    const selected = referencePhotoLibrary.photos.filter((p) => selectedReferenceIds.has(p.id));
    const results: { data: string; mimeType: string }[] = [];
    for (const photo of selected) {
      try {
        const res = await fetch(photo.image_url);
        const blob = await res.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
          reader.onerror = () => reject(new Error("Failed to read reference photo"));
          reader.readAsDataURL(blob);
        });
        if (base64) results.push({ data: base64, mimeType: blob.type || "image/jpeg" });
      } catch {
        // A single bad reference photo shouldn't block generation -- it's
        // just skipped, same spirit as every other fallback in this flow.
      }
    }
    return results;
  };

  // CAP-134: uploads a generated image/video blob to permanent storage
  // (public-assets, generated-media/{user}/...) instead of only ever
  // producing an ephemeral blob: URL -- this is what makes history and the
  // Generated Library survive a page reload. Returns null on any upload
  // failure so the caller can fall back to the old blob: behavior rather
  // than losing the generation outright.
  const uploadPersistentMedia = async (
    blob: Blob,
    kind: "image" | "video",
  ): Promise<{ url: string; storagePath: string } | null> => {
    if (!user) return null;
    try {
      const ext = kind === "video" ? "mp4" : "png";
      const path = `generated-media/${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("public-assets").upload(path, blob, {
        contentType: blob.type || (kind === "video" ? "video/mp4" : "image/png"),
        upsert: false,
      });
      if (error) return null;
      const { data } = supabase.storage.from("public-assets").getPublicUrl(path);
      return { url: data.publicUrl, storagePath: path };
    } catch {
      return null;
    }
  };

  const generateImage = async (
    visualPrompt: string,
    opts?: { referenceImages?: { data: string; mimeType: string }[]; flagReason?: string },
  ) => {
    setImageLoading(true);
    setImageError(false);
    setImageUrl(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        "https://ooliwsmmtpggejyjmone.supabase.co/functions/v1/generate-image",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
          },
          body: JSON.stringify({
            prompt: visualPrompt,
            referenceImages: opts?.referenceImages?.length ? opts.referenceImages : undefined,
            flagReason: opts?.flagReason,
          }),
        },
      );

      if (!res.ok) throw new Error("Image generation failed");
      const data = (await res.json()) as {
        type: "url" | "base64";
        url?: string;
        data?: string;
        mimeType?: string;
        freeRegeneration?: boolean;
        flagFreeRemaining?: number | null;
      };

      let finalUrl: string;
      let storagePath: string | null = null;
      if (data.type === "base64" && data.data) {
        const byteChars = atob(data.data);
        const byteArr = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteArr], { type: data.mimeType ?? "image/png" });
        // CAP-134: persist to storage instead of only an ephemeral blob:
        // URL -- falls back to the blob URL if the upload itself fails, so
        // a storage hiccup never blocks showing the generated image.
        const uploaded = await uploadPersistentMedia(blob, "image");
        if (uploaded) {
          finalUrl = uploaded.url;
          storagePath = uploaded.storagePath;
        } else {
          finalUrl = URL.createObjectURL(blob);
        }
      } else if (data.type === "url" && data.url) {
        // Pollinations URL — verify it loads. Already a permanent,
        // externally-hosted URL; no upload needed.
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
      // CAP-134: tell the user whether a flagged regenerate was actually
      // free or just spent a normal generation (10 free flags/month cap).
      setFlagNotice(
        !opts?.flagReason
          ? null
          : data.freeRegeneration
            ? t.stuFlagFreeRemaining(data.flagFreeRemaining ?? 0)
            : t.stuFlagBilledNotice,
      );
      if (lastSavedId) {
        await (supabase.from("user_content_history") as any)
          .update({ image_url: finalUrl })
          .eq("id", lastSavedId);
        loadHistory();
      }
      // CAP-134: every generation lands in the permanent Generated Library,
      // flagged or not, saved or not -- nothing generated is ever lost.
      void generatedLibrary.logItem({
        type: "image",
        mediaUrl: finalUrl,
        storagePath,
        prompt: visualPrompt,
        contentHistoryId: lastSavedId,
        flagged: !!opts?.flagReason,
        flagReason: opts?.flagReason ?? null,
      });
    } catch {
      setImageError(true);
    } finally {
      setImageLoading(false);
    }
  };

  // CAP-133: the actual entry points wired to the UI -- both pull in
  // whichever reference photos are currently selected, so accuracy applies
  // whether this is a first attempt or a flagged retry.
  const generateImageWithReferences = async (visualPrompt: string) => {
    const referenceImages = await fetchSelectedReferenceImages();
    await generateImage(visualPrompt, { referenceImages });
  };

  // CAP-134/135: an optional attachment photo on the flag itself -- e.g. a
  // close-up of what's wrong, or a better angle of the real boat -- rides
  // along as just another reference image, on top of whatever's selected
  // from the saved library (capped at 6 total server-side). The attachment
  // can be a fresh upload OR a picture already saved to the library
  // (reference photo or a past generation), since the point is reusing a
  // photo the user already has of the same boat.
  const fileToReferenceImage = async (file: File): Promise<{ data: string; mimeType: string }> => {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
      reader.onerror = () => reject(new Error("Failed to read attached photo"));
      reader.readAsDataURL(file);
    });
    return { data: base64, mimeType: file.type || "image/jpeg" };
  };

  const urlToReferenceImage = async (url: string): Promise<{ data: string; mimeType: string }> => {
    const res = await fetch(url);
    const blob = await res.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
      reader.onerror = () => reject(new Error("Failed to read library photo"));
      reader.readAsDataURL(blob);
    });
    return { data: base64, mimeType: blob.type || "image/jpeg" };
  };

  const flagAndRegenerateImage = async (
    visualPrompt: string,
    reason: string,
    attachment?: { file: File } | { url: string } | null,
  ) => {
    const referenceImages = await fetchSelectedReferenceImages();
    if (attachment) {
      try {
        referenceImages.push(
          "file" in attachment
            ? await fileToReferenceImage(attachment.file)
            : await urlToReferenceImage(attachment.url),
        );
      } catch {
        // A bad attachment shouldn't block the flagged regenerate itself.
      }
    }
    await generateImage(visualPrompt, { referenceImages, flagReason: reason });
  };

  // CAP-137: "choose from library" in the Reference Photos panel -- copies
  // an already generated image into Added-to-Library as its own reference
  // photo (a fresh storage object, not a pointer to the generated one, so
  // deleting either copy later never breaks the other), optionally straight
  // into a chosen folder, so it's selectable as a reference for future
  // generations of the same boat without re-uploading it.
  const importGeneratedImageAsReference = async (
    item: { id: string; media_url: string; prompt: string | null },
    collectionId: string | null,
  ): Promise<ReferencePhoto | null> => {
    const res = await fetch(item.media_url);
    const blob = await res.blob();
    const ext = (item.media_url.split("?")[0].split(".").pop() || "jpg").slice(0, 5);
    const file = new File([blob], `generated-${item.id}.${ext}`, {
      type: blob.type || "image/jpeg",
    });
    const created = await referencePhotoLibrary.upload(
      file,
      item.prompt?.slice(0, 60) || "Generated image",
      true,
    );
    if (created && collectionId)
      await referencePhotoLibrary.setCollection(created.id, collectionId);
    return created;
  };

  // CAP-138: submits the Library panel's own "Add picture" (file mode).
  const submitAddPictureFile = async () => {
    if (!addPictureFile) return;
    setAddPictureUploading(true);
    const created = await referencePhotoLibrary.upload(addPictureFile, "", addPictureRightsChecked);
    if (created && addPictureCollectionId)
      await referencePhotoLibrary.setCollection(created.id, addPictureCollectionId);
    setAddPictureUploading(false);
    if (created) {
      setShowAddPicture(false);
      setAddPictureFile(null);
      setAddPictureRightsChecked(false);
      setAddPictureCollectionId(null);
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

  // Video generation bases itself on the content script (mirrors
  // generateImage's shape/UX exactly). generate-video is currently a stub
  // that returns { available: false } until an AI video provider is
  // connected — see that function's source for the exact contract a real
  // provider integration should return, which needs no frontend changes.
  const generateVideo = async (script: string[]) => {
    setVideoLoading(true);
    setVideoError(false);
    setVideoComingSoon(false);
    setVideoUnavailableMessage(null);
    setVideoUrl(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        "https://ooliwsmmtpggejyjmone.supabase.co/functions/v1/generate-video",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
          },
          body: JSON.stringify({ script: script.join("\n") }),
        },
      );

      if (!res.ok) throw new Error("Video generation failed");
      const data = (await res.json()) as {
        available: boolean;
        type?: "url" | "base64";
        url?: string;
        data?: string;
        mimeType?: string;
        message?: string;
      };

      if (!data.available) {
        setVideoComingSoon(true);
        setVideoUnavailableMessage(data.message ?? null);
        return;
      }

      let finalUrl: string;
      let storagePath: string | null = null;
      if (data.type === "base64" && data.data) {
        const byteChars = atob(data.data);
        const byteArr = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteArr], { type: data.mimeType ?? "video/mp4" });
        // CAP-134: persist to storage instead of only an ephemeral blob:
        // URL, same as the image path -- falls back to the blob URL if the
        // upload itself fails.
        const uploaded = await uploadPersistentMedia(blob, "video");
        if (uploaded) {
          finalUrl = uploaded.url;
          storagePath = uploaded.storagePath;
        } else {
          finalUrl = URL.createObjectURL(blob);
        }
      } else if (data.type === "url" && data.url) {
        finalUrl = data.url;
      } else {
        throw new Error("No video returned");
      }

      setVideoUrl(finalUrl);
      if (lastSavedId) {
        await (supabase.from("user_content_history") as any)
          .update({ video_url: finalUrl })
          .eq("id", lastSavedId);
        loadHistory();
      }
      void generatedLibrary.logItem({
        type: "video",
        mediaUrl: finalUrl,
        storagePath,
        prompt: script.join("\n"),
        contentHistoryId: lastSavedId,
      });
    } catch {
      setVideoError(true);
    } finally {
      setVideoLoading(false);
    }
  };

  const downloadVideo = async () => {
    if (!videoUrl) return;
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `aurum-video-${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(videoUrl, "_blank");
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
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text.slice(0, 280))}`,
        linkedin: `https://www.linkedin.com/feed/?shareActive=true`,
        instagram: `https://www.instagram.com/`,
        tiktok: `https://www.tiktok.com/upload`,
        youtube: `https://studio.youtube.com/`,
        substack: `https://substack.com/publish/post/new`,
      };
      const url = urls[platform];
      if (url) window.open(url, "_blank");
    } finally {
      setTimeout(() => setSharing(null), 1500);
    }
  };

  const linkedinPosting = null; // kept for type compat below

  // Signals scoped to the active industry mode (yacht mode → yachting signals, etc.)
  // — falls back to un-categorized signals so nothing silently disappears.
  const modeIntel = intel.filter(
    (e) =>
      !e.category ||
      e.category === INDUSTRY_TO_CATEGORY[industryId as keyof typeof INDUSTRY_TO_CATEGORY],
  );

  const canRun =
    (mode === "intelligence" ? modeIntel.length > 0 : idea.trim().length > 2) && studioGate.canUse;

  return (
    <AppShell>
      <UpgradeModal
        open={studioGate.showUpgrade}
        onClose={() => studioGate.setShowUpgrade(false)}
        reason={t.stuUpgradeReason}
      />

      {/* CAP-146: result-only view -- everything else on the page is
          hidden once there's a plan, so the generated content is all the
          user sees, with a single small way back to create something new. */}
      {hasPlan && (
        <div className="animate-fade-up">
          <button
            onClick={startNewCreation}
            title={t.stuNewCreationHint}
            className="group inline-flex items-center gap-2 rounded-full border border-border/60 glass px-4 py-2.5 text-[10px] tracking-[0.2em] uppercase text-muted-foreground transition-all hover:border-primary/40 hover:text-primary hover:-translate-y-0.5"
          >
            <Wand2 className="h-3.5 w-3.5 text-primary/80" />
            <Radio className="h-3.5 w-3.5 text-violet-400/80 -ml-1.5" />
            {t.stuNewCreationBadge}
          </button>

          <div className="mt-8 max-w-2xl mx-auto">
            <PlanOutput
              plan={editablePlan ?? plan!}
              onPlanChange={setEditablePlan}
              copied={copied}
              onCopy={copy}
              imageUrl={imageUrl}
              imageLoading={imageLoading}
              imageError={imageError}
              onGenerateImage={() =>
                generateImageWithReferences((editablePlan ?? plan!).visualPrompt)
              }
              onFlagInaccurate={(reason, attachment) =>
                flagAndRegenerateImage((editablePlan ?? plan!).visualPrompt, reason, attachment)
              }
              flagNotice={flagNotice}
              flagAttachmentChoices={[
                ...referencePhotoLibrary.photos.map((p) => ({
                  id: `ref-${p.id}`,
                  url: p.image_url,
                  label: p.label,
                })),
                ...generatedLibrary.items
                  .filter((m) => m.type === "image")
                  .map((m) => ({ id: `gen-${m.id}`, url: m.media_url, label: m.prompt ?? "" })),
              ]}
              onDownloadImage={downloadImage}
              referencePhotos={referencePhotoLibrary.photos}
              referencePhotosLoading={referencePhotoLibrary.loading}
              referencePhotoError={referencePhotoLibrary.error}
              selectedReferenceIds={selectedReferenceIds}
              onToggleReferencePhoto={(id) =>
                setSelectedReferenceIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
              onUploadReferencePhoto={referencePhotoLibrary.upload}
              mediaCollections={mediaCollections.collections}
              onCreateCollection={mediaCollections.create}
              onSetReferencePhotoCollection={referencePhotoLibrary.setCollection}
              generatedImages={generatedLibrary.items
                .filter((m) => m.type === "image")
                .map((m) => ({
                  id: m.id,
                  media_url: m.media_url,
                  prompt: m.prompt,
                  collection_id: m.collection_id,
                }))}
              onImportGeneratedImage={importGeneratedImageAsReference}
              videoUrl={videoUrl}
              videoLoading={videoLoading}
              videoError={videoError}
              videoComingSoon={videoComingSoon}
              videoUnavailableMessage={videoUnavailableMessage}
              onGenerateVideo={() => generateVideo((editablePlan ?? plan!).script)}
              onDownloadVideo={downloadVideo}
              onShare={shareToplatform}
              sharing={sharing}
              connectedPlatforms={connectedPlatforms}
              session={supabase}
              userId={user?.id}
              industryId={industryId}
              lastSavedId={lastSavedId}
              t={t}
            />
          </div>
        </div>
      )}

      {!hasPlan && (
        <>
          {/* ── Header ── */}
          <div
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty(
                "--px",
                `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`,
              );
              e.currentTarget.style.setProperty(
                "--py",
                `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`,
              );
            }}
            className="relative mb-10 animate-fade-up overflow-hidden rounded-3xl glass p-8 sm:p-14"
            style={{ "--px": "70%", "--py": "20%" } as React.CSSProperties}
          >
            {/* Ambient glow — drifts on its own, and leans toward the cursor */}
            <div
              className="pointer-events-none absolute h-96 w-96 rounded-full opacity-[0.1] blur-3xl animate-orb-a transition-[left,top] duration-500 ease-out"
              style={{
                background: "var(--gradient-gold)",
                left: "var(--px)",
                top: "var(--py)",
                transform: "translate(-50%,-50%)",
              }}
            />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl animate-orb-b" />
            <div
              className="pointer-events-none absolute top-1/4 right-1/4 h-32 w-32 rounded-full opacity-[0.06] blur-2xl animate-orb-b"
              style={{ background: "var(--gradient-gold)", animationDelay: "-9s" }}
            />
            {/* faint constellation dots for depth */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.35]">
              <span className="absolute h-[3px] w-[3px] rounded-full bg-primary/60 top-[18%] left-[62%]" />
              <span className="absolute h-[2px] w-[2px] rounded-full bg-primary/50 top-[65%] left-[78%]" />
              <span className="absolute h-[2px] w-[2px] rounded-full bg-primary/40 top-[40%] left-[88%]" />
            </div>

            <div className="relative flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <div className="text-[10px] tracking-[0.4em] text-primary/80 uppercase">
                    {t.stuEyebrow(industry.modeLabel)}
                  </div>
                  {!studioGate.isPro && (
                    <div className="ml-2">
                      <UsageBar
                        used={studioGate.limit - studioGate.remaining}
                        limit={studioGate.limit}
                        label={t.stuFreeDraftLabel}
                      />
                    </div>
                  )}
                </div>
                <h1 className="font-serif text-5xl sm:text-[64px] leading-[1.02] tracking-tight">
                  {t.stuHeroPre} <span className="italic text-gold-gradient">{t.stuHeroEm}</span>
                </h1>
                <div className="mt-3 h-px w-24 hairline" />
                <p className="mt-5 text-muted-foreground max-w-xl text-[15px] leading-relaxed">
                  {t.stuSubtitle(industry.label.toLowerCase())}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {t.stuTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] tracking-[0.2em] px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground transition-all hover:border-primary/40 hover:text-primary hover:-translate-y-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {history.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs tracking-[0.2em] uppercase border transition-all hover:-translate-y-0.5 ${showHistory ? "border-primary/60 text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-primary hover:border-primary/40"}`}
                  >
                    <History className="h-4 w-4" />
                    {t.stuHistory(history.length)}
                  </button>
                )}
                {!generatedLibrary.loading && !referencePhotoLibrary.loading && (
                  <button
                    onClick={() => setShowGeneratedLibrary(!showGeneratedLibrary)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs tracking-[0.2em] uppercase border transition-all hover:-translate-y-0.5 ${showGeneratedLibrary ? "border-primary/60 text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-primary hover:border-primary/40"}`}
                  >
                    <Library className="h-4 w-4" />
                    {t.stuGeneratedLibrary(generatedLibrary.items.length)}
                  </button>
                )}
              </div>
            </div>
          </div>

          {showHistory && (
            <div className="glass rounded-xl p-5 mb-6 animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] tracking-[0.34em] text-primary/80">
                  {t.stuContentHistory(industry.label.toUpperCase())}
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
                  <div
                    key={entry.id}
                    className="flex items-start gap-1 rounded-lg border border-border hover:border-primary/40 transition-all"
                  >
                    <button
                      onClick={() => loadFromHistory(entry)}
                      className="flex-1 text-left p-3 min-w-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-serif truncate">
                            {entry.title || t.stuUntitled}
                          </div>
                          {entry.idea && (
                            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                              {entry.idea}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 text-[10px] text-muted-foreground font-mono">
                          {new Date(entry.created_at).toLocaleDateString(dateLocale, {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                      {entry.image_url && (
                        <img
                          src={entry.image_url}
                          alt=""
                          className="mt-2 h-12 w-20 object-cover rounded"
                        />
                      )}
                    </button>
                    <button
                      onClick={(e) => void deleteFromHistory(entry.id, e)}
                      className="shrink-0 p-2 mt-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      title={t.stuDeleteDraft}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showGeneratedLibrary && (
            <div className="glass rounded-xl p-5 mb-6 animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] tracking-[0.34em] text-primary/80">
                  {t.stuGeneratedLibraryTitle}
                </div>
                <div className="flex items-center gap-3">
                  {/* CAP-138: add a picture right from the Library panel too --
                  defaults into whichever folder is currently selected. */}
                  <button
                    onClick={() => {
                      setAddPictureCollectionId(libraryCollectionFilter);
                      setShowAddPicture((v) => !v);
                    }}
                    className={`flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase transition-colors ${showAddPicture ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                  >
                    <Plus className="h-3 w-3" /> {t.stuAddReferencePhoto}
                  </button>
                  <button
                    onClick={() => setShowGeneratedLibrary(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {showAddPicture && (
                <div className="space-y-2 p-3 rounded-lg border border-border mb-3">
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setAddPictureMode("file")}
                      className={`px-2 py-1 rounded-md border transition-colors ${addPictureMode === "file" ? "border-primary/60 text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      {t.stuFlagChooseFile}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddPictureMode("library")}
                      className={`px-2 py-1 rounded-md border transition-colors ${addPictureMode === "library" ? "border-primary/60 text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      {t.stuFlagChooseFromLibrary}
                    </button>
                  </div>

                  {addPictureMode === "file" ? (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAddPictureFile(e.target.files?.[0] ?? null)}
                      className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-primary/10 file:text-primary"
                    />
                  ) : generatedLibrary.items.filter((i) => i.type === "image").length === 0 ? (
                    <div className="text-[11px] text-muted-foreground">{t.stuFlagLibraryEmpty}</div>
                  ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-1.5 max-h-56 overflow-y-auto pr-1">
                      {generatedLibrary.items
                        .filter((i) => i.type === "image")
                        .map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            disabled={addPictureUploading}
                            title={item.prompt ?? ""}
                            onClick={async () => {
                              setAddPictureUploading(true);
                              const created = await importGeneratedImageAsReference(
                                item,
                                addPictureCollectionId,
                              );
                              setAddPictureUploading(false);
                              if (created) {
                                setShowAddPicture(false);
                                setAddPictureCollectionId(null);
                              }
                            }}
                            className="aspect-square rounded-md overflow-hidden border border-transparent hover:border-primary/40 transition-all disabled:opacity-40"
                          >
                            <img
                              src={item.media_url}
                              alt={item.prompt ?? ""}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                    </div>
                  )}

                  <select
                    value={addPictureCreatingFolder ? "__new__" : (addPictureCollectionId ?? "")}
                    onChange={(e) => {
                      if (e.target.value === "__new__") {
                        setAddPictureCreatingFolder(true);
                      } else {
                        setAddPictureCreatingFolder(false);
                        setAddPictureCollectionId(e.target.value || null);
                      }
                    }}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary/50 transition-colors"
                  >
                    <option value="">{t.stuLibraryNoFolder}</option>
                    {mediaCollections.collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__new__">+ {t.stuLibraryNewFolder}</option>
                  </select>
                  {addPictureCreatingFolder && (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={addPictureNewFolderName}
                        onChange={(e) => setAddPictureNewFolderName(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter" && addPictureNewFolderName.trim()) {
                            const created = await mediaCollections.create(
                              addPictureNewFolderName.trim(),
                            );
                            if (created) setAddPictureCollectionId(created.id);
                            setAddPictureNewFolderName("");
                            setAddPictureCreatingFolder(false);
                          } else if (e.key === "Escape") {
                            setAddPictureCreatingFolder(false);
                            setAddPictureNewFolderName("");
                          }
                        }}
                        placeholder={t.stuLibraryFolderNamePlaceholder}
                        className="flex-1 h-7 bg-transparent border border-border rounded-lg px-2 text-xs outline-none focus:border-primary/50"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (addPictureNewFolderName.trim()) {
                            const created = await mediaCollections.create(
                              addPictureNewFolderName.trim(),
                            );
                            if (created) setAddPictureCollectionId(created.id);
                          }
                          setAddPictureNewFolderName("");
                          setAddPictureCreatingFolder(false);
                        }}
                        className="text-[10px] text-primary hover:underline shrink-0"
                      >
                        {t.stuSave}
                      </button>
                    </div>
                  )}

                  {addPictureMode === "file" && (
                    <>
                      <label className="flex items-start gap-2 text-[11px] text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addPictureRightsChecked}
                          onChange={(e) => setAddPictureRightsChecked(e.target.checked)}
                          className="mt-0.5"
                        />
                        {t.stuReferencePhotoRightsLabel}
                      </label>
                      <button
                        disabled={!addPictureFile || addPictureUploading}
                        onClick={submitAddPictureFile}
                        className="w-full h-8 rounded-lg text-primary-foreground text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-40"
                        style={{ background: "var(--gradient-gold)" }}
                      >
                        {addPictureUploading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        {t.stuUploadReferencePhoto}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* CAP-135: "Added to Library" (uploaded reference photos) and
              "AI Generated" (everything Studio has generated) used to be
              two unrelated concepts -- now one Library, two tabs. */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setLibraryTab("added")}
                  className={`px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wide border transition-all ${libraryTab === "added" ? "border-primary/60 text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {t.stuLibraryAddedTab(referencePhotoLibrary.photos.length)}
                </button>
                <button
                  onClick={() => setLibraryTab("generated")}
                  className={`px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wide border transition-all ${libraryTab === "generated" ? "border-primary/60 text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {t.stuLibraryGeneratedTab(generatedLibrary.items.length)}
                </button>
              </div>

              {/* Folders group a boat's reference photos and generated images
              together across both tabs, so they're easy to find as a set
              next time. */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <button
                  onClick={() => setLibraryCollectionFilter(null)}
                  className={`px-2.5 py-1 rounded-full text-[10px] border transition-all ${libraryCollectionFilter === null ? "border-primary/60 text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {t.stuLibraryAllFolders}
                </button>
                {mediaCollections.collections.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setLibraryCollectionFilter(c.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] border transition-all ${libraryCollectionFilter === c.id ? "border-primary/60 text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {c.name}
                  </button>
                ))}
                {!showNewCollection ? (
                  <button
                    onClick={() => setShowNewCollection(true)}
                    className="px-2.5 py-1 rounded-full text-[10px] border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-all flex items-center gap-1"
                  >
                    <Plus className="h-2.5 w-2.5" /> {t.stuLibraryNewFolder}
                  </button>
                ) : (
                  <span className="flex items-center gap-1">
                    <input
                      autoFocus
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && newCollectionName.trim()) {
                          await mediaCollections.create(newCollectionName.trim());
                          setNewCollectionName("");
                          setShowNewCollection(false);
                        } else if (e.key === "Escape") {
                          setShowNewCollection(false);
                          setNewCollectionName("");
                        }
                      }}
                      placeholder={t.stuLibraryFolderNamePlaceholder}
                      className="h-6 w-28 bg-transparent border border-border rounded-full px-2 text-[10px] outline-none focus:border-primary/50"
                    />
                    <button
                      onClick={async () => {
                        if (newCollectionName.trim())
                          await mediaCollections.create(newCollectionName.trim());
                        setNewCollectionName("");
                        setShowNewCollection(false);
                      }}
                      className="text-[10px] text-primary hover:underline"
                    >
                      {t.stuSave}
                    </button>
                  </span>
                )}
              </div>

              {libraryTab === "added"
                ? (() => {
                    const filtered = referencePhotoLibrary.photos.filter(
                      (p) =>
                        libraryCollectionFilter === null ||
                        p.collection_id === libraryCollectionFilter,
                    );
                    return filtered.length === 0 ? (
                      <div className="text-[12px] text-muted-foreground text-center py-6">
                        {t.stuLibraryAddedEmpty}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-80 overflow-y-auto pr-1">
                        {filtered.map((photo) => (
                          <div
                            key={photo.id}
                            className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-all"
                          >
                            <img
                              src={photo.image_url}
                              alt={photo.label}
                              title={photo.label}
                              className="h-full w-full object-cover"
                            />
                            <button
                              onClick={() => referencePhotoLibrary.remove(photo)}
                              title={t.stuDeleteDraft}
                              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <select
                              value={photo.collection_id ?? ""}
                              onChange={(e) =>
                                referencePhotoLibrary.setCollection(
                                  photo.id,
                                  e.target.value || null,
                                )
                              }
                              className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] px-1 py-0.5 outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <option value="">{t.stuLibraryNoFolder}</option>
                              {mediaCollections.collections.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                : (() => {
                    const filtered = generatedLibrary.items.filter(
                      (m) =>
                        libraryCollectionFilter === null ||
                        m.collection_id === libraryCollectionFilter,
                    );
                    return filtered.length === 0 ? (
                      <div className="text-[12px] text-muted-foreground text-center py-6">
                        {t.stuGeneratedLibraryEmpty}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-80 overflow-y-auto pr-1">
                        {filtered.map((m) => (
                          <div
                            key={m.id}
                            className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-all"
                            title={m.prompt ?? ""}
                          >
                            <a
                              href={m.media_url}
                              target="_blank"
                              rel="noreferrer"
                              className="block h-full w-full"
                            >
                              {m.type === "video" ? (
                                <video
                                  src={m.media_url}
                                  className="h-full w-full object-cover"
                                  muted
                                />
                              ) : (
                                <img
                                  src={m.media_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </a>
                            {m.type === "video" && (
                              <div className="absolute top-1 left-1 rounded bg-black/60 p-0.5 pointer-events-none">
                                <Film className="h-3 w-3 text-white" />
                              </div>
                            )}
                            {m.flagged && (
                              <div
                                className="absolute top-1 right-1 rounded bg-destructive/80 p-0.5 pointer-events-none"
                                title={m.flag_reason ?? t.stuFlagInaccurate}
                              >
                                <Flag className="h-3 w-3 text-white" />
                              </div>
                            )}
                            <select
                              value={m.collection_id ?? ""}
                              onChange={(e) =>
                                generatedLibrary.setCollection(m.id, e.target.value || null)
                              }
                              className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] px-1 py-0.5 outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <option value="">{t.stuLibraryNoFolder}</option>
                              {mediaCollections.collections.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
            </div>
          )}

          <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <ModeTab
                  active={mode === "assisted"}
                  onClick={() => setMode("assisted")}
                  icon={Wand2}
                  label={t.stuModeAssisted}
                  sub={t.stuModeAssistedSub}
                  color="gold"
                />
                <ModeTab
                  active={mode === "intelligence"}
                  onClick={() => setMode("intelligence")}
                  icon={Radio}
                  label={t.stuModeIntel}
                  sub={t.stuModeIntelSub}
                  color="violet"
                />
              </div>

              <div className="glass rounded-xl p-5">
                {mode === "assisted" ? (
                  <>
                    <Label>{t.stuYourIdea}</Label>
                    <textarea
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      placeholder={t.stuIdeaPlaceholder}
                      rows={4}
                      className="w-full bg-transparent outline-none text-sm resize-none border border-border rounded-lg p-3 focus:border-primary/50 transition-colors"
                    />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <Label>{t.stuSignalsLabel}</Label>
                      <span className="text-[9px] tracking-[0.25em] text-muted-foreground/70 uppercase -mt-3">
                        {industry.modeLabel}
                      </span>
                    </div>

                    {/* Selected signals — always visible as removable chips, so unselecting never
                    requires scrolling/searching through the full list below. */}
                    {selectedIntel.size > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {intel
                          .filter((e) => selectedIntel.has(e.id))
                          .map((e) => (
                            <button
                              key={e.id}
                              onClick={() => toggleIntel(e.id)}
                              className="group flex items-center gap-1.5 max-w-full rounded-full border border-primary/50 bg-primary/10 py-1 pl-2.5 pr-1.5 text-[11px] text-foreground transition-all hover:border-destructive/50 hover:bg-destructive/10"
                              title={e.title}
                            >
                              <span className="max-w-[180px] truncate">{e.title}</span>
                              <X className="h-3 w-3 shrink-0 text-primary/70 transition-colors group-hover:text-destructive" />
                            </button>
                          ))}
                      </div>
                    )}

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {modeIntel.length === 0 && (
                        <div className="text-xs text-muted-foreground italic py-4">
                          {t.stuNoSignals}
                        </div>
                      )}
                      {modeIntel.map((e) => {
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
                        ? t.stuNoneSelected
                        : t.stuSignalsSelected(selectedIntel.size)}
                    </div>
                  </>
                )}
              </div>

              <div className="glass rounded-xl p-5">
                <Label>
                  {t.stuGoalLabel}{" "}
                  <span className="text-muted-foreground/60 normal-case tracking-normal">
                    {t.stuOptional}
                  </span>
                </Label>
                <input
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder={t.stuGoalPlaceholder}
                  className="w-full bg-transparent outline-none text-sm border border-border rounded-lg p-3 focus:border-primary/50 transition-colors"
                />
              </div>

              {/* CAP-128: the format/orientation picker is gone -- every
              generation now targets all 6 platforms at once. Video length
              moved under the Generate Video box itself (CAP-129) since it
              only matters once you're about to generate a video. */}

              <button
                onClick={() => void run()}
                onMouseMove={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty(
                    "--mx",
                    `${((e.clientX - r.left) / r.width) * 100}%`,
                  );
                  e.currentTarget.style.setProperty(
                    "--my",
                    `${((e.clientY - r.top) / r.height) * 100}%`,
                  );
                }}
                disabled={!canRun || pending}
                className="relative w-full h-16 rounded-2xl text-primary-foreground font-medium flex items-center justify-center gap-2.5 disabled:opacity-50 transition-all overflow-hidden group active:scale-[0.98] shadow-[var(--shadow-gold)]"
                style={{ background: "var(--gradient-gold)" }}
              >
                {/* cursor-tracked magnetic glow */}
                <span className="pointer-events-none absolute inset-0 magnetic-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                    <span className="text-sm tracking-[0.08em] font-semibold">
                      {t.stuGenerateButton}
                    </span>
                    {canRun && (
                      <span className="text-[10px] opacity-70 ml-1">{t.stuApprox30s}</span>
                    )}
                  </>
                )}
              </button>

              {error && (
                <div className="text-xs text-destructive border border-destructive/40 rounded-lg p-3">
                  {error}
                </div>
              )}
            </div>

            <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
              {!plan && !pending && (
                <div className="relative glass rounded-2xl p-10 text-center overflow-hidden">
                  <div
                    className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full opacity-[0.06] blur-3xl animate-orb-a"
                    style={{ background: "var(--gradient-gold)" }}
                  />
                  <div className="relative">
                    <div className="relative h-16 w-16 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" />
                      <div className="absolute inset-0 rounded-full border border-primary/10" />
                      <div className="absolute -inset-2 rounded-full border border-primary/10 [animation:spin_12s_linear_infinite]" />
                      <div
                        className="absolute inset-3 rounded-full flex items-center justify-center"
                        style={{ background: "var(--gradient-gold)" }}
                      >
                        <Sparkles className="h-5 w-5 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="font-serif text-2xl mb-2">{t.stuReadyTitle}</div>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      {t.stuReadyDesc(industry.label.toLowerCase())}
                    </p>
                    <div className="mt-6 flex justify-center gap-4 text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                      <span className="flex items-center gap-1">
                        <Instagram className="h-3 w-3" /> Instagram
                      </span>
                      <span className="flex items-center gap-1">
                        <Send className="h-3 w-3" /> TikTok
                      </span>
                      <span className="flex items-center gap-1">
                        <Linkedin className="h-3 w-3" /> LinkedIn
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {pending && !plan && (
                <div className="relative glass rounded-2xl overflow-hidden">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.04]"
                    style={{ background: "var(--gradient-gold)" }}
                  />
                  {/* rising sparkle particles for a live, "something is happening" feel */}
                  <div className="pointer-events-none absolute inset-0">
                    {[10, 24, 40, 58, 74, 88].map((left, i) => (
                      <span
                        key={left}
                        className="absolute bottom-8 h-1 w-1 rounded-full bg-primary animate-sparkle"
                        style={{
                          left: `${left}%`,
                          animationDelay: `${i * 0.4}s`,
                          animationDuration: `${2.2 + (i % 3) * 0.5}s`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="relative p-10 text-center">
                    <div className="relative h-14 w-14 mx-auto mb-6">
                      <div
                        className="absolute inset-0 rounded-full border border-primary/30 animate-spin"
                        style={{ borderTopColor: "transparent" }}
                      />
                      <div className="absolute inset-0 rounded-full border border-primary/10 [animation:spin_10s_linear_infinite]" />
                      <div
                        className="absolute inset-3 rounded-full flex items-center justify-center"
                        style={{ background: "var(--gradient-gold)" }}
                      >
                        <Sparkles className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="font-serif text-xl mb-3">{t.stuComposing}</div>
                    <div className="space-y-2 max-w-xs mx-auto">
                      {LOAD_STEPS.map((step, i) => (
                        <div
                          key={step}
                          className={`flex items-center gap-2 text-xs transition-all ${i <= loadStep ? "text-foreground" : "text-muted-foreground/30"}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full shrink-0 transition-all ${i < loadStep ? "bg-primary" : i === loadStep ? "bg-emerald-400 animate-pulse" : "bg-border"}`}
                          />
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-14">
            <SectionHeading eyebrow={t.stuLiveSignalsEyebrow} title={t.stuIdeasToExpand} />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Live intelligence articles as content ideas */}
              {intel
                .filter(
                  (e) =>
                    e.category ===
                      INDUSTRY_TO_CATEGORY[industryId as keyof typeof INDUSTRY_TO_CATEGORY] ||
                    !e.category,
                )
                .slice(0, 8)
                .map((e, i) => (
                  <IdeaCard
                    key={e.id}
                    index={i}
                    onClick={() => {
                      setMode("intelligence");
                      setSelectedIntel(new Set([e.id]));
                      setIdea("");
                    }}
                    eyebrow={e.source ?? t.stuLiveSignalFallback}
                    title={e.title}
                    live
                  />
                ))}
              {/* Fallback to config prompts if no intelligence yet */}
              {intel.filter(
                (e) =>
                  e.category ===
                  INDUSTRY_TO_CATEGORY[industryId as keyof typeof INDUSTRY_TO_CATEGORY],
              ).length === 0 &&
                industry.contentPrompts.map((p, i) => (
                  <IdeaCard
                    key={p.t}
                    index={i}
                    onClick={() => {
                      setMode("assisted");
                      setIdea(p.t);
                    }}
                    eyebrow={p.type}
                    title={p.t}
                  />
                ))}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-3 uppercase">
      {children}
    </div>
  );
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
  const tilt = useTilt(7);
  return (
    <button
      onClick={onClick}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      style={tilt.style}
      className={`relative glass tilt-card rounded-xl p-5 text-left transition-all overflow-hidden group ${
        active ? "ring-1 ring-primary/50 animate-pop" : "hover:border-primary/30"
      }`}
    >
      {active && (
        <div
          className={`pointer-events-none absolute inset-0 opacity-[0.06] ${color === "gold" ? "" : "bg-violet-500"}`}
          style={color === "gold" ? { background: "var(--gradient-gold)" } : {}}
        />
      )}
      <div className="relative">
        <div
          className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 transition-all ${
            active
              ? color === "gold"
                ? "text-primary-foreground"
                : "bg-violet-500/20 text-violet-400"
              : "bg-secondary text-muted-foreground"
          }`}
          style={active && color === "gold" ? { background: "var(--gradient-gold)" } : {}}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div
          className={`text-sm font-semibold mb-0.5 ${active ? "text-foreground" : "text-foreground/70"}`}
        >
          {label}
        </div>
        <div className="text-[11px] text-muted-foreground leading-snug">{sub}</div>
      </div>
    </button>
  );
}

function IdeaCard({
  onClick,
  eyebrow,
  title,
  live,
  index = 0,
}: {
  onClick: () => void;
  eyebrow: string;
  title: string;
  live?: boolean;
  index?: number;
}) {
  const tilt = useTilt(9);
  const reveal = useReveal<HTMLButtonElement>();
  return (
    <button
      ref={reveal.ref}
      onClick={onClick}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      style={{
        ...tilt.style,
        opacity: reveal.visible ? 1 : 0,
        transform: reveal.visible ? tilt.style.transform : "translateY(16px)",
        transition: reveal.visible
          ? "transform 0.2s ease-out"
          : `opacity 0.5s ease ${index * 0.06}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${index * 0.06}s`,
      }}
      className="tilt-card glass rounded-xl p-4 text-left hover:ring-gold group"
    >
      <div className="text-[9px] tracking-[0.3em] text-primary/80 mb-2 flex items-center gap-1.5">
        {live && <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />}
        {eyebrow}
      </div>
      <div className="text-sm font-serif leading-snug group-hover:text-primary transition-colors">
        {title}
      </div>
    </button>
  );
}

const PLATFORM_META: Record<
  string,
  { label: string; icon: typeof Send; color: string; badge: string; shareKey: string }
> = {
  facebook: {
    label: "Facebook",
    icon: ArrowUpRight,
    color: "from-blue-600/20 to-blue-500/10",
    badge: "bg-blue-600/20 text-blue-300",
    shareKey: "facebook",
  },
  twitter: {
    label: "X / Twitter",
    icon: Send,
    color: "from-foreground/10 to-foreground/5",
    badge: "bg-foreground/10 text-foreground/70",
    shareKey: "twitter",
  },
  linkedin: {
    label: "LinkedIn",
    icon: Linkedin,
    color: "from-blue-500/20 to-blue-400/10",
    badge: "bg-blue-500/20 text-blue-300",
    shareKey: "linkedin",
  },
  tiktok: {
    label: "TikTok",
    icon: Film,
    color: "from-foreground/10 to-foreground/5",
    badge: "bg-foreground/10 text-foreground/70",
    shareKey: "tiktok",
  },
  instagram: {
    label: "Instagram",
    icon: Instagram,
    color: "from-pink-500/20 to-violet-500/20",
    badge: "bg-pink-500/20 text-pink-300",
    shareKey: "instagram",
  },
  youtube_shorts: {
    label: "YouTube Shorts",
    icon: Video,
    color: "from-red-500/20 to-red-400/10",
    badge: "bg-red-500/20 text-red-300",
    shareKey: "youtube",
  },
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
  onFlagInaccurate,
  flagNotice,
  flagAttachmentChoices,
  onDownloadImage,
  referencePhotos,
  referencePhotosLoading,
  referencePhotoError,
  selectedReferenceIds,
  onToggleReferencePhoto,
  onUploadReferencePhoto,
  mediaCollections,
  onCreateCollection,
  onSetReferencePhotoCollection,
  generatedImages,
  onImportGeneratedImage,
  videoUrl,
  videoLoading,
  videoError,
  videoComingSoon,
  videoUnavailableMessage,
  onGenerateVideo,
  onDownloadVideo,
  onShare,
  sharing,
  connectedPlatforms,
  session: supabaseClient,
  userId,
  industryId,
  lastSavedId,
  t,
}: {
  plan: StudioContentPlan;
  onPlanChange: (p: StudioContentPlan) => void;
  copied: string | null;
  onCopy: (k: string, text: string) => void;
  imageUrl: string | null;
  imageLoading: boolean;
  imageError: boolean;
  onGenerateImage: () => void;
  onFlagInaccurate: (reason: string, attachment?: { file: File } | { url: string } | null) => void;
  flagNotice: string | null;
  flagAttachmentChoices: { id: string; url: string; label: string }[];
  onDownloadImage: () => void;
  referencePhotos: ReferencePhoto[];
  referencePhotosLoading: boolean;
  referencePhotoError: string | null;
  selectedReferenceIds: Set<string>;
  onToggleReferencePhoto: (id: string) => void;
  onUploadReferencePhoto: (
    file: File,
    label: string,
    rightsAcknowledged: boolean,
  ) => Promise<ReferencePhoto | null>;
  mediaCollections: { id: string; name: string }[];
  onCreateCollection: (name: string) => Promise<{ id: string; name: string } | null>;
  onSetReferencePhotoCollection: (photoId: string, collectionId: string | null) => Promise<void>;
  generatedImages: {
    id: string;
    media_url: string;
    prompt: string | null;
    collection_id: string | null;
  }[];
  onImportGeneratedImage: (
    item: { id: string; media_url: string; prompt: string | null },
    collectionId: string | null,
  ) => Promise<ReferencePhoto | null>;
  videoUrl: string | null;
  videoLoading: boolean;
  videoError: boolean;
  videoComingSoon: boolean;
  videoUnavailableMessage: string | null;
  onGenerateVideo: () => void;
  onDownloadVideo: () => void;
  onShare?: (platform: string, text: string, key: string) => void;
  sharing?: string | null;
  connectedPlatforms: Set<string>;
  session: typeof supabase;
  userId?: string;
  industryId: string;
  lastSavedId: string | null;
  t: T;
}) {
  const platformKeys = Object.keys(plan.platforms).filter((k) => plan.platforms[k]);
  const [activeTab, setActiveTab] = useState(platformKeys[0] ?? "");

  // CAP-133: local UI-only state for the reference-photo upload mini-form
  // and the flag-as-inaccurate mini-form -- both are transient, nothing
  // here needs to persist beyond this component.
  const [showReferenceUpload, setShowReferenceUpload] = useState(false);
  const [referenceUploadMode, setReferenceUploadMode] = useState<"file" | "library">("file");
  const [referenceUploadFile, setReferenceUploadFile] = useState<File | null>(null);
  // CAP-142: a real thumbnail preview of the picked file (not just its
  // filename) so "Choose file" shows the same box-with-x treatment as the
  // selected-reference-photos box above it.
  const [referenceUploadPreviewUrl, setReferenceUploadPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!referenceUploadFile) {
      setReferenceUploadPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(referenceUploadFile);
    setReferenceUploadPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [referenceUploadFile]);
  const [referenceRightsChecked, setReferenceRightsChecked] = useState(false);
  const [referenceUploading, setReferenceUploading] = useState(false);
  // CAP-137: which folder (if any) a newly added photo should land in --
  // picked from existing folders, or a brand new one created inline.
  const [referenceUploadCollectionId, setReferenceUploadCollectionId] = useState<string | null>(
    null,
  );
  const [referenceUploadCreatingFolder, setReferenceUploadCreatingFolder] = useState(false);
  const [referenceUploadNewFolderName, setReferenceUploadNewFolderName] = useState("");
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagReasonDraft, setFlagReasonDraft] = useState("");
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  // CAP-134/135: an optional photo attached to the flag itself -- e.g. a
  // close-up of what's wrong, or a clearer angle of the real boat -- to
  // help the regenerate get it right. Either a fresh upload or a picture
  // already saved to the library.
  const [flagAttachment, setFlagAttachment] = useState<{ file: File } | { url: string } | null>(
    null,
  );
  const [flagAttachmentMode, setFlagAttachmentMode] = useState<"file" | "library">("file");

  // Inline editing
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [editingScript, setEditingScript] = useState(false);
  const [scriptDraft, setScriptDraft] = useState("");
  const [editingHashtags, setEditingHashtags] = useState(false);
  const [hashtagsDraft, setHashtagsDraft] = useState("");
  const [editingVisual, setEditingVisual] = useState(false);
  const [visualDraft, setVisualDraft] = useState("");

  // Sliding tab indicator (measured against real DOM positions, Apple tab-bar style)
  const tabsRowRef = useRef<HTMLDivElement>(null);
  const tabBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  useEffect(() => {
    const el = tabBtnRefs.current[activeTab];
    const container = tabsRowRef.current;
    if (el && container) {
      const er = el.getBoundingClientRect();
      const cr = container.getBoundingClientRect();
      setIndicator({ left: er.left - cr.left + container.scrollLeft, width: er.width });
    }
  }, [activeTab, platformKeys.length]);

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
      <div className="relative glass tilt-card rounded-2xl p-6 overflow-hidden ring-gold animate-pop">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{ background: "var(--gradient-gold)" }}
        />
        <div className="relative">
          <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">
            {t.stuContentTitle}
          </div>
          <div className="font-serif text-2xl leading-tight mb-5">{plan.title}</div>
          <div className="border-t border-border/40 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] tracking-[0.3em] text-primary/80 uppercase">
                {t.stuViralHookLabel}
              </span>
            </div>
            <div className="text-[17px] italic leading-snug text-foreground/90 font-serif">
              "{plan.viralHook}"
            </div>
          </div>
        </div>
      </div>

      {/* Platform tabs */}
      <div className="glass rounded-2xl overflow-hidden">
        <div ref={tabsRowRef} className="relative flex border-b border-border/60 overflow-x-auto">
          <div
            className="pointer-events-none absolute bottom-0 h-0.5 rounded-full transition-all duration-300 ease-out"
            style={{
              left: indicator.left,
              width: indicator.width,
              background: "var(--gradient-gold)",
            }}
          />
          {platformKeys.map((key) => {
            const meta = PLATFORM_META[key];
            if (!meta) return null;
            const Icon = meta.icon;
            return (
              <button
                key={key}
                ref={(el) => {
                  tabBtnRefs.current[key] = el;
                }}
                onClick={() => setActiveTab(key)}
                className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-3 px-2 text-[10px] tracking-[0.15em] uppercase whitespace-nowrap transition-all ${
                  activeTab === key
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  className={`h-3 w-3 shrink-0 transition-transform ${activeTab === key ? "scale-110" : ""}`}
                />
                <span className="truncate">{meta.label}</span>
              </button>
            );
          })}
        </div>

        <div className={`p-5 bg-gradient-to-br ${activePlatform.color}`}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <span
              className={`text-[9px] tracking-[0.3em] uppercase px-2 py-1 rounded-full ${activePlatform.badge}`}
            >
              {activePlatform.label}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingCaption(activeTab);
                  setCaptionDraft(activePlatform.text);
                }}
                className="flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors"
              >
                <Pencil className="h-3 w-3" /> {t.stuModify}
              </button>
              {onShare && (
                <button
                  onClick={() => onShare(activePlatform.shareKey, activePlatform.text, activeTab)}
                  disabled={sharing === activeTab}
                  className="flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase text-primary/80 hover:text-primary transition-colors disabled:opacity-50"
                >
                  {sharing === activeTab ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" /> {t.stuOpening}
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-3 w-3" /> {t.stuOpen}
                    </>
                  )}
                </button>
              )}
              <CopyBtn
                id={activeTab}
                copied={copied}
                onClick={() => onCopy(activeTab, activePlatform.text)}
                t={t}
              />
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
                <button
                  onClick={() => {
                    updateCaption(activeTab, captionDraft);
                    setEditingCaption(null);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-primary-foreground text-xs"
                  style={{ background: "var(--gradient-gold)" }}
                >
                  <Check className="h-3 w-3" /> {t.stuSave}
                </button>
                <button
                  onClick={() => setEditingCaption(null)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t.stuCancel}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{activePlatform.text}</div>
          )}
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] tracking-[0.34em] text-primary/80 flex items-center gap-2">
            <Hash className="h-3 w-3" /> {t.stuHashtags}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingHashtags(true);
                setHashtagsDraft(plan.hashtags.join(" "));
              }}
              className="flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors"
            >
              <Pencil className="h-3 w-3" /> {t.stuModify}
            </button>
            <CopyBtn
              id="tags"
              copied={copied}
              onClick={() =>
                onCopy(
                  "tags",
                  plan.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "),
                )
              }
              t={t}
            />
          </div>
        </div>
        {editingHashtags ? (
          <div className="space-y-2">
            <input
              value={hashtagsDraft}
              onChange={(e) => setHashtagsDraft(e.target.value)}
              className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
              placeholder={t.stuHashtagsPlaceholder}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onPlanChange({ ...plan, hashtags: hashtagsDraft.split(/\s+/).filter(Boolean) });
                  setEditingHashtags(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-primary-foreground text-xs"
                style={{ background: "var(--gradient-gold)" }}
              >
                <Check className="h-3 w-3" /> {t.stuSave}
              </button>
              <button
                onClick={() => setEditingHashtags(false)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.stuCancel}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {plan.hashtags.map((h, i) => (
              <span
                key={h}
                className={`text-[11px] px-2.5 py-1 rounded-full border cursor-default ${
                  i % 3 === 0
                    ? "border-primary/30 text-primary/80 bg-primary/5"
                    : i % 3 === 1
                      ? "border-violet-400/30 text-violet-400/80 bg-violet-400/5"
                      : "border-border text-muted-foreground"
                }`}
              >
                {h.startsWith("#") ? h : `#${h}`}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] tracking-[0.34em] text-primary/80 flex items-center gap-2">
            <ImageIcon className="h-3 w-3" /> {t.stuVisualPrompt}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingVisual(true);
                setVisualDraft(plan.visualPrompt);
              }}
              className="flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors"
            >
              <Pencil className="h-3 w-3" /> {t.stuModify}
            </button>
            <CopyBtn
              id="vis"
              copied={copied}
              onClick={() => onCopy("vis", plan.visualPrompt)}
              t={t}
            />
          </div>
        </div>
        {editingVisual ? (
          <div className="space-y-2 mb-4">
            <textarea
              value={visualDraft}
              onChange={(e) => setVisualDraft(e.target.value)}
              rows={4}
              className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 resize-y transition-colors"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onPlanChange({ ...plan, visualPrompt: visualDraft });
                  setEditingVisual(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-primary-foreground text-xs"
                style={{ background: "var(--gradient-gold)" }}
              >
                <Check className="h-3 w-3" /> {t.stuSave}
              </button>
              <button
                onClick={() => setEditingVisual(false)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.stuCancel}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm leading-relaxed text-foreground/90 italic mb-4">
            {plan.visualPrompt}
          </div>
        )}

        {!imageUrl && !imageLoading && (
          <div className="space-y-3 mb-3">
            {/* CAP-133: saved reference photos -- select up to 6 real photos
                of the actual boat/asset so generation composites around it
                instead of hallucinating one from the text prompt alone. */}
            <div className="flex items-center justify-between">
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                {t.stuReferencePhotos}
              </div>
              <button
                onClick={() => setShowReferenceUpload((v) => !v)}
                className="text-[10px] tracking-[0.2em] uppercase text-primary hover:underline"
              >
                {t.stuAddReferencePhoto}
              </button>
            </div>

            {/* CAP-141: exactly what's being sent as reference for THIS
                generation -- separate from "Choose from library" (which
                browses everything you've ever saved), this only ever shows
                what's currently selected, with its own "x" to drop a wrong
                pick without touching the saved photo itself. */}
            {selectedReferenceIds.size > 0 && (
              <div className="space-y-1.5 p-2.5 rounded-lg border border-border/60 bg-secondary/10">
                <div className="text-[10px] text-muted-foreground">
                  {t.stuReferencePhotosSelected(selectedReferenceIds.size)}
                </div>
                <div className="flex flex-wrap gap-2">
                  {referencePhotos
                    .filter((photo) => selectedReferenceIds.has(photo.id))
                    .map((photo) => (
                      <div key={photo.id} className="relative h-14 w-14 shrink-0">
                        <img
                          src={photo.image_url}
                          alt={photo.label}
                          title={photo.label}
                          className="h-14 w-14 rounded-lg object-cover border-2 border-primary"
                        />
                        <button
                          onClick={() => onToggleReferencePhoto(photo.id)}
                          title={t.stuFlagClearPicture}
                          className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center shadow hover:scale-110 transition-transform"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
            {/* CAP-140: accuracy tip -- Nano Banana Pro's own docs say
                subject fidelity is "not always" perfect, and community
                testing found too many reference photos dilutes it. Purely
                informational, never blocks selection. */}
            <div className="text-[10px] text-muted-foreground/70">{t.stuReferencePhotosTip}</div>

            {showReferenceUpload && (
              <div className="space-y-2 p-3 rounded-lg border border-border">
                {/* CAP-137: a fresh upload, or pull in a photo Studio
                    already generated -- either way it lands in the folder
                    picked below. */}
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setReferenceUploadMode("file")}
                    className={`px-2 py-1 rounded-md border transition-colors ${referenceUploadMode === "file" ? "border-primary/60 text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {t.stuFlagChooseFile}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReferenceUploadMode("library")}
                    className={`px-2 py-1 rounded-md border transition-colors ${referenceUploadMode === "library" ? "border-primary/60 text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {t.stuFlagChooseFromLibrary}
                  </button>
                </div>

                {referenceUploadMode === "file" ? (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setReferenceUploadFile(e.target.files?.[0] ?? null)}
                      className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-primary/10 file:text-primary"
                    />
                    {/* CAP-142: same box-with-x preview as the selected
                        reference photos above -- a real thumbnail, not just
                        a filename, so a wrong pick is obvious before it's
                        even added. */}
                    {referenceUploadFile && referenceUploadPreviewUrl && (
                      <div className="relative h-14 w-14 shrink-0">
                        <img
                          src={referenceUploadPreviewUrl}
                          alt={referenceUploadFile.name}
                          title={referenceUploadFile.name}
                          className="h-14 w-14 rounded-lg object-cover border-2 border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setReferenceUploadFile(null)}
                          title={t.stuFlagClearPicture}
                          className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center shadow hover:scale-110 transition-transform"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  (() => {
                    // CAP-143: once a folder is picked below, narrow the
                    // library grid to just that folder's pictures -- with a
                    // lot of boats saved, browsing everything at once made it
                    // hard to find the right one.
                    const visibleReferencePhotos = referenceUploadCollectionId
                      ? referencePhotos.filter(
                          (p) => p.collection_id === referenceUploadCollectionId,
                        )
                      : referencePhotos;
                    const visibleGeneratedImages = referenceUploadCollectionId
                      ? generatedImages.filter(
                          (i) => i.collection_id === referenceUploadCollectionId,
                        )
                      : generatedImages;
                    if (
                      visibleReferencePhotos.length === 0 &&
                      visibleGeneratedImages.length === 0
                    ) {
                      return (
                        <div className="text-[11px] text-muted-foreground">
                          {t.stuFlagLibraryEmpty}
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-1.5">
                        {visibleReferencePhotos.length > 0 && (
                          <div className="flex items-center justify-end gap-3 text-[10px]">
                            <button
                              type="button"
                              onClick={() =>
                                visibleReferencePhotos.forEach((p) => {
                                  if (!selectedReferenceIds.has(p.id)) onToggleReferencePhoto(p.id);
                                })
                              }
                              className="text-primary hover:underline"
                            >
                              {t.stuLibrarySelectAll}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                visibleReferencePhotos.forEach((p) => {
                                  if (selectedReferenceIds.has(p.id)) onToggleReferencePhoto(p.id);
                                })
                              }
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {t.stuLibraryDeselectAll}
                            </button>
                          </div>
                        )}
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-1.5 max-h-56 overflow-y-auto pr-1">
                          {/* CAP-139: an already-saved reference photo just gets
                            selected for this generation (no re-upload needed) --
                            a generated image gets copied in as a new reference
                            photo and selected right away. */}
                          {visibleReferencePhotos.map((photo) => {
                            const selected = selectedReferenceIds.has(photo.id);
                            return (
                              <button
                                key={`ref-${photo.id}`}
                                type="button"
                                title={photo.label}
                                onClick={() => onToggleReferencePhoto(photo.id)}
                                className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${selected ? "border-primary" : "border-transparent hover:border-primary/40"}`}
                              >
                                <img
                                  src={photo.image_url}
                                  alt={photo.label}
                                  className="h-full w-full object-cover"
                                />
                                {selected && (
                                  <span className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-white drop-shadow" />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                          {visibleGeneratedImages.map((item) => (
                            <button
                              key={`gen-${item.id}`}
                              type="button"
                              disabled={referenceUploading}
                              title={item.prompt ?? ""}
                              onClick={async () => {
                                setReferenceUploading(true);
                                const result = await onImportGeneratedImage(
                                  item,
                                  referenceUploadCollectionId,
                                );
                                setReferenceUploading(false);
                                if (result) {
                                  onToggleReferencePhoto(result.id);
                                  setShowReferenceUpload(false);
                                  setReferenceUploadCollectionId(null);
                                }
                              }}
                              className="aspect-square rounded-md overflow-hidden border border-transparent hover:border-primary/40 transition-all disabled:opacity-40"
                            >
                              <img
                                src={item.media_url}
                                alt={item.prompt ?? ""}
                                className="h-full w-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* CAP-137: which folder this photo belongs to -- pick an
                    existing one or create a new one, right where the photo
                    is added instead of only from the Library panel. */}
                <select
                  value={
                    referenceUploadCreatingFolder ? "__new__" : (referenceUploadCollectionId ?? "")
                  }
                  onChange={(e) => {
                    if (e.target.value === "__new__") {
                      setReferenceUploadCreatingFolder(true);
                    } else {
                      setReferenceUploadCreatingFolder(false);
                      setReferenceUploadCollectionId(e.target.value || null);
                    }
                  }}
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary/50 transition-colors"
                >
                  <option value="">{t.stuLibraryNoFolder}</option>
                  {mediaCollections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="__new__">+ {t.stuLibraryNewFolder}</option>
                </select>
                {referenceUploadCreatingFolder && (
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      value={referenceUploadNewFolderName}
                      onChange={(e) => setReferenceUploadNewFolderName(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && referenceUploadNewFolderName.trim()) {
                          const created = await onCreateCollection(
                            referenceUploadNewFolderName.trim(),
                          );
                          if (created) setReferenceUploadCollectionId(created.id);
                          setReferenceUploadNewFolderName("");
                          setReferenceUploadCreatingFolder(false);
                        } else if (e.key === "Escape") {
                          setReferenceUploadCreatingFolder(false);
                          setReferenceUploadNewFolderName("");
                        }
                      }}
                      placeholder={t.stuLibraryFolderNamePlaceholder}
                      className="flex-1 h-7 bg-transparent border border-border rounded-lg px-2 text-xs outline-none focus:border-primary/50"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (referenceUploadNewFolderName.trim()) {
                          const created = await onCreateCollection(
                            referenceUploadNewFolderName.trim(),
                          );
                          if (created) setReferenceUploadCollectionId(created.id);
                        }
                        setReferenceUploadNewFolderName("");
                        setReferenceUploadCreatingFolder(false);
                      }}
                      className="text-[10px] text-primary hover:underline shrink-0"
                    >
                      {t.stuSave}
                    </button>
                  </div>
                )}

                {referenceUploadMode === "file" && (
                  <>
                    <label className="flex items-start gap-2 text-[11px] text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={referenceRightsChecked}
                        onChange={(e) => setReferenceRightsChecked(e.target.checked)}
                        className="mt-0.5"
                      />
                      {t.stuReferencePhotoRightsLabel}
                    </label>
                    {referencePhotoError && (
                      <div className="text-[11px] text-destructive">{referencePhotoError}</div>
                    )}
                    <button
                      disabled={!referenceUploadFile || referenceUploading}
                      onClick={async () => {
                        if (!referenceUploadFile) return;
                        setReferenceUploading(true);
                        const result = await onUploadReferencePhoto(
                          referenceUploadFile,
                          "",
                          referenceRightsChecked,
                        );
                        if (result && referenceUploadCollectionId) {
                          await onSetReferencePhotoCollection(
                            result.id,
                            referenceUploadCollectionId,
                          );
                        }
                        setReferenceUploading(false);
                        if (result) {
                          onToggleReferencePhoto(result.id);
                          setShowReferenceUpload(false);
                          setReferenceUploadFile(null);
                          setReferenceRightsChecked(false);
                          setReferenceUploadCollectionId(null);
                        }
                      }}
                      className="w-full h-8 rounded-lg text-primary-foreground text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-40"
                      style={{ background: "var(--gradient-gold)" }}
                    >
                      {referenceUploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      {t.stuUploadReferencePhoto}
                    </button>
                  </>
                )}
              </div>
            )}

            <button
              onClick={onGenerateImage}
              className="w-full h-10 rounded-xl border border-primary/40 text-primary text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/10 transition-all"
            >
              <ImageIcon className="h-4 w-4" /> {t.stuGenerateImage}
            </button>
          </div>
        )}

        {imageLoading && (
          <div className="w-full h-64 rounded-xl border border-border/40 flex flex-col items-center justify-center gap-3 bg-secondary/10">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <div className="text-xs text-muted-foreground">{t.stuGeneratingVisual}</div>
          </div>
        )}

        {imageError && !imageLoading && (
          <div className="w-full rounded-xl border border-destructive/40 p-4 text-center">
            <div className="text-xs text-destructive mb-2">{t.stuImageFailed}</div>
            <button onClick={onGenerateImage} className="text-xs text-primary hover:underline">
              {t.stuRetry}
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
                <Download className="h-4 w-4" /> {t.stuDownload}
              </button>
              <button
                onClick={onGenerateImage}
                className="h-10 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 flex items-center justify-center gap-2 transition-all"
              >
                <ImageIcon className="h-4 w-4" /> {t.stuRegenerate}
              </button>
            </div>

            {/* CAP-133/134: even with a reference photo, the model can
                still drift -- flagging gets a regenerate (free for the
                first 10 flags/month, then it counts as a normal
                generation), optionally with an attached photo to help get
                it right, and logs what went wrong. */}
            {!showFlagForm ? (
              <button
                onClick={() => setShowFlagForm(true)}
                className="w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
              >
                <Flag className="h-3 w-3" /> {t.stuFlagInaccurate}
              </button>
            ) : (
              <div className="space-y-2 p-3 rounded-lg border border-border">
                <textarea
                  value={flagReasonDraft}
                  onChange={(e) => setFlagReasonDraft(e.target.value)}
                  placeholder={t.stuFlagReasonPlaceholder}
                  rows={2}
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 resize-y transition-colors"
                />

                {/* CAP-135: attach a photo from a fresh upload, or pick one
                    already saved in the Library instead of re-uploading. */}
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setFlagAttachmentMode("file")}
                    className={`px-2 py-1 rounded-md border transition-colors ${flagAttachmentMode === "file" ? "border-primary/60 text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {t.stuFlagChooseFile}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlagAttachmentMode("library")}
                    className={`px-2 py-1 rounded-md border transition-colors ${flagAttachmentMode === "library" ? "border-primary/60 text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {t.stuFlagChooseFromLibrary}
                  </button>
                  {flagAttachment && (
                    <button
                      type="button"
                      onClick={() => setFlagAttachment(null)}
                      className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" /> {t.stuFlagClearPicture}
                    </button>
                  )}
                </div>

                {flagAttachmentMode === "file" ? (
                  <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setFlagAttachment(file ? { file } : null);
                      }}
                    />
                    <Paperclip className="h-3 w-3 shrink-0" />
                    {flagAttachment && "file" in flagAttachment
                      ? flagAttachment.file.name
                      : t.stuFlagAddPicture}
                  </label>
                ) : flagAttachmentChoices.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground">{t.stuFlagLibraryEmpty}</div>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-1.5 max-h-56 overflow-y-auto pr-1">
                    {flagAttachmentChoices.map((choice) => {
                      const selected =
                        !!flagAttachment &&
                        "url" in flagAttachment &&
                        flagAttachment.url === choice.url;
                      return (
                        <button
                          key={choice.id}
                          type="button"
                          title={choice.label}
                          onClick={() => setFlagAttachment({ url: choice.url })}
                          className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${selected ? "border-primary" : "border-transparent hover:border-primary/40"}`}
                        >
                          <img
                            src={choice.url}
                            alt={choice.label}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    disabled={!flagReasonDraft.trim() || flagSubmitting}
                    onClick={async () => {
                      setFlagSubmitting(true);
                      onFlagInaccurate(flagReasonDraft.trim(), flagAttachment);
                      setFlagSubmitting(false);
                      setShowFlagForm(false);
                      setFlagReasonDraft("");
                      setFlagAttachment(null);
                    }}
                    className="flex-1 h-8 rounded-lg text-primary-foreground text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-40"
                    style={{ background: "var(--gradient-gold)" }}
                  >
                    <Flag className="h-3.5 w-3.5" /> {t.stuFlagAndRegenerate}
                  </button>
                  <button
                    onClick={() => {
                      setShowFlagForm(false);
                      setFlagReasonDraft("");
                      setFlagAttachment(null);
                    }}
                    className="px-3 h-8 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t.stuCancel}
                  </button>
                </div>
              </div>
            )}
            {flagNotice && (
              <div className="text-[11px] text-muted-foreground text-center">{flagNotice}</div>
            )}
          </div>
        )}
      </div>

      {plan.script.length > 0 && (
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] tracking-[0.34em] text-primary/80">
              {t.stuContentScript}
            </div>
            <button
              onClick={() => {
                setEditingScript(true);
                setScriptDraft(plan.script.join("\n"));
              }}
              className="flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors"
            >
              <Pencil className="h-3 w-3" /> {t.stuModify}
            </button>
          </div>
          {editingScript ? (
            <div className="space-y-2">
              <textarea
                value={scriptDraft}
                onChange={(e) => setScriptDraft(e.target.value)}
                rows={8}
                className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 resize-y transition-colors"
                placeholder={t.stuScriptPlaceholder}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onPlanChange({ ...plan, script: scriptDraft.split("\n").filter(Boolean) });
                    setEditingScript(false);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-primary-foreground text-xs"
                  style={{ background: "var(--gradient-gold)" }}
                >
                  <Check className="h-3 w-3" /> {t.stuSave}
                </button>
                <button
                  onClick={() => setEditingScript(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t.stuCancel}
                </button>
              </div>
            </div>
          ) : (
            <ol className="space-y-2 mb-4">
              {plan.script.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="text-primary/80 font-mono text-xs pt-0.5 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          )}

          {/* CAP-130: Veo 3.1 only supports 4/6/8s per single call, and
              1080p forces 8s regardless -- the 5/10/15/20s picker (CAP-129)
              never mapped to a real option, so it's gone. Every video is a
              fixed 8s clip at 1080p, matching what Veo already generates. */}
          {!editingScript && !videoUrl && !videoLoading && !videoComingSoon && (
            <button
              onClick={onGenerateVideo}
              className="w-full h-10 rounded-xl border border-primary/40 text-primary text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/10 transition-all"
            >
              <Video className="h-4 w-4" /> {t.stuGenerateVideo}
            </button>
          )}

          {videoLoading && (
            <div className="w-full h-64 rounded-xl border border-border/40 flex flex-col items-center justify-center gap-3 bg-secondary/10">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <div className="text-xs text-muted-foreground">{t.stuGeneratingVideo}</div>
            </div>
          )}

          {videoError && !videoLoading && (
            <div className="w-full rounded-xl border border-destructive/40 p-4 text-center">
              <div className="text-xs text-destructive mb-2">{t.stuVideoFailed}</div>
              <button onClick={onGenerateVideo} className="text-xs text-primary hover:underline">
                {t.stuRetry}
              </button>
            </div>
          )}

          {videoComingSoon && !videoLoading && (
            <div className="w-full rounded-xl border border-border/40 p-4 text-center bg-secondary/10">
              <Video className="h-4 w-4 text-muted-foreground mx-auto mb-2" />
              <div className="text-xs text-muted-foreground">
                {videoUnavailableMessage ?? t.stuVideoComingSoon}
              </div>
            </div>
          )}

          {videoUrl && !videoLoading && (
            <div className="space-y-3">
              <video src={videoUrl} controls className="w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onDownloadVideo}
                  className="h-10 rounded-xl text-primary-foreground text-sm font-medium flex items-center justify-center gap-2"
                  style={{ background: "var(--gradient-gold)" }}
                >
                  <Download className="h-4 w-4" /> {t.stuDownload}
                </button>
                <button
                  onClick={onGenerateVideo}
                  className="h-10 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 flex items-center justify-center gap-2 transition-all"
                >
                  <Video className="h-4 w-4" /> {t.stuRegenerate}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Publish Panel */}
      <PublishPanel
        plan={plan}
        connectedPlatforms={connectedPlatforms}
        supabaseClient={supabaseClient}
        userId={userId}
        industryId={industryId}
        imageUrl={imageUrl}
        lastSavedId={lastSavedId}
        t={t}
      />
    </div>
  );
}

// ─── Publish Panel ────────────────────────────────────────────────────────────

const ALL_PUBLISH_PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: Instagram, shareKey: "instagram" },
  { key: "tiktok", label: "TikTok", icon: Film, shareKey: "tiktok" },
  { key: "youtube_shorts", label: "YouTube Shorts", icon: Youtube, shareKey: "youtube" },
  { key: "facebook", label: "Facebook", icon: Facebook, shareKey: "facebook" },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, shareKey: "linkedin" },
  { key: "twitter", label: "X / Twitter", icon: Twitter, shareKey: "twitter" },
];

function PublishPanel({
  plan,
  connectedPlatforms,
  supabaseClient,
  userId,
  industryId,
  imageUrl,
  lastSavedId,
  t,
}: {
  plan: StudioContentPlan;
  connectedPlatforms: Set<string>;
  supabaseClient: typeof supabase;
  userId?: string;
  industryId: string;
  imageUrl: string | null;
  lastSavedId: string | null;
  t: T;
}) {
  const availablePlatforms = ALL_PUBLISH_PLATFORMS.filter((p) => plan.platforms[p.key]);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(availablePlatforms.map((p) => p.key)),
  );
  const [postStatus, setPostStatus] = useState<
    Record<string, "idle" | "posting" | "done" | "error">
  >({});
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
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const postNow = async () => {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    const token = session?.access_token ?? "";

    for (const key of selected) {
      if (!plan.platforms[key]) continue;
      setPostStatus((s) => ({ ...s, [key]: "posting" }));

      if (connectedPlatforms.has(key)) {
        try {
          const res = await fetch(
            "https://ooliwsmmtpggejyjmone.supabase.co/functions/v1/post-content",
            {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                platform: key,
                text: plan.platforms[key],
                imageUrl: imageUrl ?? undefined,
              }),
            },
          );
          const data = (await res.json()) as {
            success?: boolean;
            manualPost?: boolean;
            error?: string;
          };
          if (data.success || data.manualPost) {
            setPostStatus((s) => ({ ...s, [key]: "done" }));
            // Fallback: open platform if manual
            if (data.manualPost) {
              await navigator.clipboard.writeText(plan.platforms[key] ?? "");
              const urls: Record<string, string> = {
                instagram: "https://www.instagram.com/",
                tiktok: "https://www.tiktok.com/upload",
                youtube_shorts: "https://studio.youtube.com/",
                facebook: "https://www.facebook.com/",
                linkedin: "https://www.linkedin.com/feed/?shareActive=true",
                twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent((plan.platforms[key] ?? "").slice(0, 280))}`,
              };
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
        const urls: Record<string, string> = {
          instagram: "https://www.instagram.com/",
          tiktok: "https://www.tiktok.com/upload",
          youtube_shorts: "https://studio.youtube.com/",
          facebook: "https://www.facebook.com/",
          linkedin: "https://www.linkedin.com/feed/?shareActive=true",
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent((plan.platforms[key] ?? "").slice(0, 280))}`,
        };
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
      <div className="text-[10px] tracking-[0.34em] text-primary/80">{t.stuPostOn}</div>

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
                isSelected
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              {isSelected ? (
                <CheckSquare className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Square className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sm">{p.label}</span>
              {isConnected ? (
                <span className="text-[9px] tracking-[0.2em] text-emerald-400 uppercase">
                  {t.stuConnected}
                </span>
              ) : (
                <Link
                  to="/profile"
                  className="text-[9px] tracking-[0.2em] text-muted-foreground hover:text-primary uppercase transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t.stuConnectArrow}
                </Link>
              )}
              {status === "posting" && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
              )}
              {status === "done" && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
              {status === "error" && <X className="h-3.5 w-3.5 text-destructive shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Caption preview for selected platforms */}
      {selected.size > 0 && (
        <div className="text-[11px] text-muted-foreground">
          {t.stuCaptionLinked(
            Array.from(selected)
              .filter((k) => plan.platforms[k])
              .map((k) => {
                const p = ALL_PUBLISH_PLATFORMS.find((x) => x.key === k);
                return p?.label;
              })
              .join(", "),
          )}
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
          {t.stuPostNow}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={saveNow}
            disabled={saving}
            className="h-10 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 flex items-center justify-center gap-2 transition-all"
          >
            {saved ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" /> {t.stuSavedExcl}
              </>
            ) : saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t.stuSaving}
              </>
            ) : (
              t.stuSave
            )}
          </button>
          <button
            onClick={() => setShowScheduler(!showScheduler)}
            className={`h-10 rounded-xl border text-sm flex items-center justify-center gap-2 transition-all ${showScheduler ? "border-primary/50 text-primary bg-primary/5" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"}`}
          >
            <Clock className="h-3.5 w-3.5" /> {t.stuSchedulePost}
          </button>
        </div>

        {scheduled && (
          <div className="flex items-center gap-2 text-sm text-emerald-400 justify-center">
            <Check className="h-4 w-4" /> {t.stuPostScheduled}
          </div>
        )}

        {/* Scheduler */}
        {showScheduler && (
          <div className="border border-primary/20 rounded-xl p-4 space-y-3 bg-secondary/10 animate-fade-up">
            <div className="text-[10px] tracking-[0.3em] text-primary/80">
              {t.stuScheduleHeader}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">{t.stuDate}</div>
                <input
                  type="date"
                  value={schedDate}
                  min={(() => {
                    const d = new Date();
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  })()}
                  onChange={(e) => setSchedDate(e.target.value)}
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">{t.stuTime}</div>
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
              {scheduling ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t.stuScheduling}
                </>
              ) : (
                <>
                  <Calendar className="h-3.5 w-3.5" /> {t.stuConfirmSchedule}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CopyBtn({
  id,
  copied,
  onClick,
  t,
}: {
  id: string;
  copied: string | null;
  onClick: () => void;
  t: T;
}) {
  const isCopied = copied === id;
  return (
    <button
      onClick={onClick}
      className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
    >
      {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {isCopied ? t.stuCopied : t.stuCopy}
    </button>
  );
}
