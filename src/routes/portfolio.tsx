import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Check, Loader2, Mail, MapPin, Pencil, Phone, Globe, Anchor, X } from "lucide-react";
import { AppShell } from "@/components/aurum/AppShell";
import { FieldInput } from "@/components/aurum/ExerciseForm";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { INDUSTRIES } from "@/lib/industry/config";
import {
  PORTFOLIO_SECTIONS,
  parseExercise,
  type ExerciseAnswers,
  type ExerciseGroup,
  type PortfolioSectionId,
} from "@/lib/academy/exercise";

export const Route = createFileRoute("/portfolio")({
  component: BrokerPortfolio,
});

type PortfolioProfile = {
  display_name: string | null;
  headline: string | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
};

const EMPTY_PROFILE: PortfolioProfile = { display_name: null, headline: null, location: null, email: null, phone: null, website: null };

type Block = {
  key: string;
  pageId: string;
  moduleNumber: number;
  moduleTitle: string;
  group: ExerciseGroup;
  order: number;
};

function BrokerPortfolio() {
  const { user } = useAuth();
  const { profile: userProfile } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<Record<PortfolioSectionId, Block[]>>({ profile: [], yachts: [], sales: [], market: [], services: [], testimonials: [] });
  const [answersByPage, setAnswersByPage] = useState<Record<string, ExerciseAnswers>>({});
  const [pf, setPf] = useState<PortfolioProfile>(EMPTY_PROFILE);
  const [editingProfile, setEditingProfile] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: mods } = await (supabase.from("academy_modules") as any)
        .select("id, title, module_number").eq("track", "yachts").order("module_number");
      const modList = (mods ?? []) as { id: string; title: string; module_number: number }[];
      const ids = modList.map((m) => m.id);

      const [{ data: pageData }, { data: ansData }, { data: profData }] = await Promise.all([
        ids.length
          ? (supabase.from("academy_module_pages") as any).select("id, module_id, page_number, exercise").in("module_id", ids).not("exercise", "is", null).order("page_number")
          : Promise.resolve({ data: [] }),
        ids.length
          ? (supabase.from("academy_exercise_answers") as any).select("page_id, answers").eq("user_id", user.id).in("module_id", ids)
          : Promise.resolve({ data: [] }),
        (supabase.from("broker_portfolio_profiles") as any).select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      const answers: Record<string, ExerciseAnswers> = {};
      for (const r of (ansData ?? []) as { page_id: string; answers: ExerciseAnswers }[]) answers[r.page_id] = r.answers ?? {};
      setAnswersByPage(answers);
      setPf({ ...EMPTY_PROFILE, ...((profData as Partial<PortfolioProfile> | null) ?? {}) });

      const modById = new Map(modList.map((m) => [m.id, m]));
      const bySection: Record<PortfolioSectionId, Block[]> = { profile: [], yachts: [], sales: [], market: [], services: [], testimonials: [] };
      const pages = ((pageData ?? []) as { id: string; module_id: string; page_number: number; exercise: unknown }[])
        .map((p) => ({ ...p, mod: modById.get(p.module_id) }))
        .filter((p) => p.mod)
        .sort((a, b) => a.mod!.module_number - b.mod!.module_number || a.page_number - b.page_number);
      pages.forEach((p, pi) => {
        const def = parseExercise(p.exercise);
        if (!def) return;
        def.groups.forEach((g, gi) => {
          bySection[g.section].push({
            key: `${p.id}:${gi}`,
            pageId: p.id,
            moduleNumber: p.mod!.module_number,
            moduleTitle: p.mod!.title,
            group: g,
            order: pi * 100 + gi,
          });
        });
      });
      setBlocks(bySection);
    } catch (e) {
      console.error("Loading broker portfolio failed:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const hasAnswer = (b: Block) => b.group.fields.some((f) => (answersByPage[b.pageId]?.[f.key] ?? "").trim() !== "");

  const filledSections = PORTFOLIO_SECTIONS.filter((s) => blocks[s.id].some(hasAnswer)).length;
  const totalAnswers = Object.values(answersByPage).reduce((n, a) => n + Object.values(a).filter((v) => (v ?? "").trim() !== "").length, 0);

  const displayName = pf.display_name || userProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Your name";
  const headline = pf.headline || "Yacht Broker · in training";
  const location = pf.location || userProfile?.location || "";
  const photo = userProfile?.photo_url ?? null;
  const email = pf.email || "";

  const saveAnswers = async (pageId: string, draft: ExerciseAnswers) => {
    const { data, error } = await (supabase as any).rpc("save_exercise_answers", { p_page_id: pageId, p_answers: draft, p_complete: false });
    if (error) throw error;
    setAnswersByPage((prev) => ({ ...prev, [pageId]: (data as { answers: ExerciseAnswers }).answers }));
  };

  const saveProfile = async (next: PortfolioProfile) => {
    if (!user) return;
    const clean = Object.fromEntries(Object.entries(next).map(([k, v]) => [k, (v ?? "").trim() || null]));
    const { error } = await (supabase.from("broker_portfolio_profiles") as any)
      .upsert({ user_id: user.id, ...clean, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) throw error;
    setPf({ ...EMPTY_PROFILE, ...(clean as Partial<PortfolioProfile>) });
  };

  return (
    <AppShell>
      {/* ── Cover ─────────────────────────────────────────────── */}
      <header className="relative overflow-hidden rounded-2xl border border-border/60 mb-10 animate-fade-up">
        <img src={INDUSTRIES.yachts.ambientImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
        <div className="relative px-6 sm:px-12 pt-24 sm:pt-36 pb-8 sm:pb-12">
          <div className="text-[10px] tracking-[0.42em] text-primary/90 mb-5 flex items-center gap-2">
            <Anchor className="h-3.5 w-3.5" /> YACHT BROKER PORTFOLIO
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-8">
            <div className="h-24 w-24 sm:h-32 sm:w-32 shrink-0 rounded-full border border-primary/50 overflow-hidden bg-background/60 backdrop-blur flex items-center justify-center shadow-[var(--shadow-gold)]">
              {photo ? (
                <img src={photo} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span className="font-serif text-3xl sm:text-4xl text-gold-gradient">
                  {displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-4xl sm:text-6xl leading-[1.05]">{displayName}</h1>
              <p className="mt-3 text-base sm:text-lg text-foreground/80 italic font-serif">{headline}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-foreground/80">
                {location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" />{location}</span>}
                {email && <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"><Mail className="h-3.5 w-3.5 text-primary" />{email}</a>}
                {pf.phone && <a href={`tel:${pf.phone}`} className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"><Phone className="h-3.5 w-3.5 text-primary" />{pf.phone}</a>}
                {pf.website && (
                  <a href={/^https?:\/\//.test(pf.website) ? pf.website : `https://${pf.website}`} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
                    <Globe className="h-3.5 w-3.5 text-primary" />{pf.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-5">
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <span><span className="font-serif text-xl text-foreground mr-1.5">{filledSections}</span>of {PORTFOLIO_SECTIONS.length} sections started</span>
              <span><span className="font-serif text-xl text-foreground mr-1.5">{totalAnswers}</span>answers written</span>
            </div>
            <button
              onClick={() => setEditingProfile((v) => !v)}
              className="inline-flex items-center gap-1.5 glass rounded-full px-4 py-2 text-xs border border-border/60 hover:border-primary/50 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5 text-primary" /> {editingProfile ? "Close" : "Edit name & contact"}
            </button>
          </div>
        </div>
      </header>

      {editingProfile && (
        <ProfileEditor
          initial={{ ...pf, display_name: pf.display_name ?? (displayName === "Your name" ? "" : displayName), location: pf.location ?? location, email: pf.email ?? user?.email ?? "" }}
          onSave={async (next) => { await saveProfile(next); setEditingProfile(false); }}
          onCancel={() => setEditingProfile(false)}
        />
      )}

      {/* ── Sections ──────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <div className="space-y-14 sm:space-y-20">
          {PORTFOLIO_SECTIONS.map((s) => {
            const items = blocks[s.id].filter(hasAnswer);
            return (
              <section key={s.id} className="animate-fade-up">
                <div className="flex items-end gap-4 mb-6">
                  <div>
                    <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">{s.eyebrow}</div>
                    <h2 className="font-serif text-2xl sm:text-4xl leading-tight">{s.title}</h2>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-primary/40 to-transparent mb-2" />
                </div>
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 px-6 py-8 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-4">
                    <span>{s.empty}</span>
                    <Link to="/academy" search={{ track: "yachts" }} className="inline-flex items-center gap-1.5 text-primary hover:underline text-xs">
                      Open the Academy <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {items.map((b) => (
                      <GroupCard
                        key={b.key}
                        block={b}
                        answers={answersByPage[b.pageId] ?? {}}
                        wide={b.group.fields.length > 6 || (b.group.fields.length === 1 && b.group.fields[0].type === "long")}
                        onSave={(draft) => saveAnswers(b.pageId, draft)}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

// ─── Group card (view + inline edit) ─────────────────────────────────────────

function GroupCard({
  block, answers, wide, onSave,
}: {
  block: Block;
  answers: ExerciseAnswers;
  wide: boolean;
  onSave: (draft: ExerciseAnswers) => Promise<void>;
}) {
  const { group } = block;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ExerciseAnswers>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const start = () => {
    const d: ExerciseAnswers = {};
    for (const f of group.fields) d[f.key] = answers[f.key] ?? "";
    setDraft(d); setErr(null); setEditing(true);
  };
  const save = async () => {
    setSaving(true); setErr(null);
    try { await onSave(draft); setEditing(false); }
    catch (e) { setErr((e as { message?: string })?.message ?? "Could not save"); }
    finally { setSaving(false); }
  };

  const allRatings = group.fields.every((f) => f.type === "rating");
  const numbered = group.fields.every((f) => /^\d+$/.test(f.label));
  const filled = group.fields.filter((f) => (answers[f.key] ?? "").trim() !== "");

  return (
    <article className={`glass rounded-2xl p-6 sm:p-7 border border-border/50 ${wide ? "md:col-span-2" : ""}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-serif text-xl">{group.title || "Notes"}</h3>
          <div className="text-[10px] tracking-[0.2em] text-muted-foreground mt-1">MODULE {block.moduleNumber} · {block.moduleTitle.toUpperCase()}</div>
        </div>
        {!editing && (
          <button onClick={start} className="text-muted-foreground hover:text-primary transition-colors shrink-0" title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          {group.fields.map((f) => (
            <FieldInput key={f.key} field={f} value={draft[f.key] ?? ""} onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))} compact />
          ))}
          {err && <div className="text-xs text-destructive">{err}</div>}
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-primary-foreground text-xs disabled:opacity-50"
              style={{ background: "var(--gradient-gold)" }}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
            </button>
            <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs hover:border-primary/40 transition-colors">
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        </div>
      ) : allRatings ? (
        <ul className="space-y-2.5">
          {group.fields.map((f) => {
            const n = Number(answers[f.key] ?? 0) || 0;
            return (
              <li key={f.key} className="flex items-center gap-3 text-sm">
                <span className="w-44 shrink-0 text-foreground/85">{f.label}</span>
                <span className="flex-1 h-1.5 rounded-full bg-secondary/40 overflow-hidden">
                  <span className="block h-full rounded-full" style={{ width: `${(n / 5) * 100}%`, background: "var(--gradient-gold)" }} />
                </span>
                <span className="w-8 text-right font-mono text-xs text-muted-foreground">{n || "–"}/5</span>
              </li>
            );
          })}
        </ul>
      ) : numbered ? (
        <ol className="space-y-2">
          {filled.map((f, i) => (
            <li key={f.key} className="flex gap-3 text-sm leading-relaxed">
              <span className="font-serif text-primary text-lg leading-none mt-0.5 w-5 shrink-0">{i + 1}</span>
              <span className="text-foreground/90">{answers[f.key]}</span>
            </li>
          ))}
        </ol>
      ) : (
        <dl className="space-y-4">
          {filled.map((f) => (
            <div key={f.key}>
              <dt className="text-[11px] text-muted-foreground mb-1">{f.label}</dt>
              <dd className={`whitespace-pre-line break-words [overflow-wrap:anywhere] min-w-0 leading-relaxed ${f.type === "long" ? "text-sm text-foreground/90 border-l-2 border-primary/40 pl-4" : "text-sm text-foreground"}`}>
                {answers[f.key]}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}

// ─── Name & contact editor ───────────────────────────────────────────────────

function ProfileEditor({
  initial, onSave, onCancel,
}: {
  initial: PortfolioProfile;
  onSave: (next: PortfolioProfile) => Promise<void>;
  onCancel: () => void;
}) {
  const [v, setV] = useState<PortfolioProfile>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const rows: [keyof PortfolioProfile, string, string][] = [
    ["display_name", "Name", "Your full name"],
    ["headline", "Headline", "e.g. Yacht Broker · Motor yachts 30–60m · Côte d'Azur"],
    ["location", "Based in", "City, country"],
    ["email", "Email", "you@example.com"],
    ["phone", "Phone", "+33 …"],
    ["website", "Website / LinkedIn", "linkedin.com/in/…"],
  ];
  return (
    <div className="glass rounded-2xl p-6 mb-10 border border-primary/20 animate-fade-up">
      <div className="grid sm:grid-cols-2 gap-4">
        {rows.map(([k, label, ph]) => (
          <label key={k} className="block">
            <span className="block text-[11px] text-muted-foreground mb-1">{label}</span>
            <input
              value={v[k] ?? ""}
              onChange={(e) => setV((p) => ({ ...p, [k]: e.target.value }))}
              placeholder={ph}
              maxLength={k === "headline" || k === "email" || k === "website" ? 200 : 120}
              className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
            />
          </label>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3">Your photo comes from your Profile settings.</p>
      {err && <div className="text-xs text-destructive mt-3">{err}</div>}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={async () => {
            setSaving(true); setErr(null);
            try { await onSave(v); } catch (e) { setErr((e as { message?: string })?.message ?? "Could not save"); } finally { setSaving(false); }
          }}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-primary-foreground text-sm disabled:opacity-50"
          style={{ background: "var(--gradient-gold)" }}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-border text-sm hover:border-primary/40 transition-colors">Cancel</button>
      </div>
    </div>
  );
}
