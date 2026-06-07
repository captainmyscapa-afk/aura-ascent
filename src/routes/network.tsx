import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/aurum/AppShell";
import { SectionHeading } from "@/components/aurum/SectionHeading";
import {
  Users, Plus, Mail, Linkedin, Instagram, Facebook,
  Sparkles, Copy, Check, Loader2, Send, Trash2, Clock,
  X, Phone, Building, User, FileText,
} from "lucide-react";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { generateIntroMessage } from "@/lib/network.functions";
import { useProGate } from "@/components/aurum/ProGate";
import { UpgradeModal } from "@/components/aurum/UpgradeModal";

export const Route = createFileRoute("/network")({
  component: Network,
});

type Contact = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  role: string | null;
  phone: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  notes: string | null;
  industry: string | null;
};

type Draft = {
  id: string;
  contact_name: string | null;
  platform: string;
  category: string | null;
  subject: string | null;
  body: string;
  status: string;
  sent_at: string | null;
  created_at: string;
};

const PLATFORMS = [
  { key: "email",     label: "Email",     icon: Mail },
  { key: "linkedin",  label: "LinkedIn",  icon: Linkedin },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "facebook",  label: "Facebook",  icon: Facebook },
] as const;

const CATEGORIES: Record<string, string[]> = {
  yachts: ["Charter Broker", "Sales Broker", "Captain / Crew", "Shipyard", "Marina", "Charter Management", "Insurance", "Survey / Refit"],
  villas: ["Developer", "Prime Agent", "Property Manager", "Interior Designer", "Insurance", "Legal / Tax", "Private Bank"],
  jets:   ["Broker", "Charter Operator", "Maintenance (MRO)", "FBO", "Insurance", "Family Office", "Management Co."],
  cars:   ["Dealer", "Auction House", "Collector", "Specialist / Restorer", "Insurance", "Transport", "Concours Organiser"],
};

const DEFAULT_CATEGORIES = ["Management", "Broker", "Insurance", "Agency", "Owner", "Investor", "Media"];

function formatDate(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function Network() {
  const { industry, industryId } = useIndustry();
  const { profile } = useUserProfile();
  const { user } = useAuth();
  const genIntro = useServerFn(generateIntroMessage);

  const [tab, setTab] = useState<"contacts" | "compose" | "drafts">("contacts");

  // Contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Contact>>({});
  const [savingContact, setSavingContact] = useState(false);

  // Compose
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [platform, setPlatform] = useState<string>("email");
  const [category, setCategory] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const networkGate = useProGate("network_drafts");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Drafts
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);

  // Load contacts
  const loadContacts = useCallback(async () => {
    if (!user) return;
    setContactsLoading(true);
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setContacts((data as Contact[]) ?? []);
    setContactsLoading(false);
  }, [user]);

  // Load drafts
  const loadDrafts = useCallback(async () => {
    if (!user) return;
    setDraftsLoading(true);
    const { data } = await supabase
      .from("message_drafts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setDrafts((data as Draft[]) ?? []);
    setDraftsLoading(false);
  }, [user]);

  useEffect(() => { loadContacts(); }, [loadContacts]);
  useEffect(() => { loadDrafts(); }, [loadDrafts]);

  async function saveContact() {
    if (!user || !newContact.name?.trim()) return;
    setSavingContact(true);
    await supabase.from("contacts" as any).insert({
      user_id: user.id,
      name: newContact.name,
      email: newContact.email || null,
      company: newContact.company || null,
      role: newContact.role || null,
      phone: newContact.phone || null,
      linkedin_url: newContact.linkedin_url || null,
      instagram_url: newContact.instagram_url || null,
      facebook_url: newContact.facebook_url || null,
      notes: newContact.notes || null,
      industry: industryId,
    });
    setNewContact({});
    setShowAddContact(false);
    setSavingContact(false);
    loadContacts();
  }

  async function deleteContact(id: string) {
    if (!user) return;
    await supabase.from("contacts" as any).delete().eq("id", id).eq("user_id", user.id);
    setContacts(c => c.filter(x => x.id !== id));
  }

  async function draftMessage() {
    if (!selectedContact) {
      setDraftError("Select a contact first.");
      return;
    }
    if (!networkGate.gate("You've used your 2 free message drafts. Upgrade to Pro for unlimited outreach.")) return;
    setDrafting(true);
    setDraftError(null);
    try {
      const { message } = await genIntro({
        data: {
          personName: selectedContact.name,
          personRole: selectedContact.role ?? selectedContact.company ?? "professional",
          personCity: "",
          industry: industry.label,
          introContext: category
            ? `Reaching out about ${category} in the ${industry.label} world.`
            : industry.introContext,
          userGoal: profile?.goal ?? undefined,
          userName: profile?.full_name ?? undefined,
        },
      });
      setBody(message);
      await networkGate.increment("network_drafts");
      if (platform === "email" && !subject) {
        setSubject(`Introduction — ${selectedContact.name}`);
      }
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : "Draft generation failed. Try again.");
    } finally {
      setDrafting(false);
    }
  }

  async function saveDraft(status: "draft" | "sent") {
    if (!user || !body.trim()) return;
    setSaving(true);
    await supabase.from("message_drafts" as any).insert({
      user_id: user.id,
      contact_id: selectedContact?.id ?? null,
      contact_name: selectedContact?.name ?? null,
      platform,
      category: category || null,
      subject: subject || null,
      body,
      status,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    });
    setSaving(false);
    loadDrafts();
    if (status === "sent") {
      // Open platform
      if (platform === "linkedin" && selectedContact?.linkedin_url) window.open(selectedContact.linkedin_url, "_blank");
      else if (platform === "instagram" && selectedContact?.instagram_url) window.open(selectedContact.instagram_url, "_blank");
      else if (platform === "facebook" && selectedContact?.facebook_url) window.open(selectedContact.facebook_url, "_blank");
      else if (platform === "email" && selectedContact?.email) window.open(`mailto:${selectedContact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
    }
    setTab("drafts");
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const cats = CATEGORIES[industryId] ?? DEFAULT_CATEGORIES;

  return (
    <AppShell>
      <UpgradeModal open={networkGate.showUpgrade} onClose={() => networkGate.setShowUpgrade(false)} reason="You've used your 2 free message drafts. Upgrade to Pro for unlimited outreach." />
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">
          NETWORK · {industry.modeLabel.toUpperCase()}
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl">
          The room you're <span className="italic text-gold-gradient">already in.</span>
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl text-sm">
          Manage your contacts, draft tailored outreach for every category, and track every message sent.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-border/60">
        {(["contacts", "compose", "drafts"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors capitalize border-b-2 -mb-px ${
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "contacts" ? `Contacts (${contacts.length})` : t === "drafts" ? `Drafts & Sent (${drafts.length})` : "Compose"}
          </button>
        ))}
      </div>

      {/* ── CONTACTS TAB ─────────────────────────────────── */}
      {tab === "contacts" && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <SectionHeading eyebrow="YOUR NETWORK" title="Contacts" />
            <button
              onClick={() => setShowAddContact(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
              style={{ background: "var(--gradient-gold)", color: "#080808" }}
            >
              <Plus className="h-4 w-4" /> Add contact
            </button>
          </div>

          {/* Add contact form */}
          {showAddContact && (
            <div className="glass rounded-xl p-6 mb-6 border border-primary/20 animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <div className="font-serif text-lg">New contact</div>
                <button onClick={() => setShowAddContact(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { field: "name",          icon: User,     label: "Full name *",   placeholder: "Marco Donatelli" },
                  { field: "company",       icon: Building, label: "Company",        placeholder: "Edmiston" },
                  { field: "role",          icon: User,     label: "Role / Title",   placeholder: "Senior Broker" },
                  { field: "email",         icon: Mail,     label: "Email",          placeholder: "marco@edmiston.com" },
                  { field: "phone",         icon: Phone,    label: "Phone",          placeholder: "+377 1234 5678" },
                  { field: "linkedin_url",  icon: Linkedin, label: "LinkedIn URL",   placeholder: "linkedin.com/in/marco" },
                  { field: "instagram_url", icon: Instagram,label: "Instagram",      placeholder: "@marco" },
                  { field: "facebook_url",  icon: Facebook, label: "Facebook URL",   placeholder: "fb.com/marco" },
                ].map(({ field, icon: Icon, label, placeholder }) => (
                  <div key={field} className="flex items-center gap-2 glass rounded-lg px-3 py-2 border border-border/60">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <input
                      value={(newContact as any)[field] ?? ""}
                      onChange={e => setNewContact(prev => ({ ...prev, [field]: e.target.value }))}
                      placeholder={placeholder}
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                    />
                  </div>
                ))}
                <div className="sm:col-span-2 flex items-start gap-2 glass rounded-lg px-3 py-2 border border-border/60">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                  <textarea
                    value={newContact.notes ?? ""}
                    onChange={e => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notes…"
                    rows={2}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowAddContact(false)} className="px-4 py-2 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button
                  onClick={saveContact}
                  disabled={!newContact.name?.trim() || savingContact}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg disabled:opacity-50"
                  style={{ background: "var(--gradient-gold)", color: "#080808" }}
                >
                  {savingContact ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Save contact
                </button>
              </div>
            </div>
          )}

          {contactsLoading && <div className="text-sm text-muted-foreground py-8 text-center">Loading contacts…</div>}

          {!contactsLoading && contacts.length === 0 && (
            <div className="glass rounded-xl p-12 text-center">
              <Users className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-serif text-lg mb-1">No contacts yet</p>
              <p className="text-sm text-muted-foreground">Add your first contact to start drafting tailored outreach.</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((c) => (
              <div key={c.id} className="glass rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-11 w-11 rounded-full bg-[var(--gradient-gold)] flex items-center justify-center font-mono text-sm text-primary-foreground shrink-0" style={{ color: "#080808" }}>
                    {c.name.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <button onClick={() => deleteContact(c.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="font-serif text-lg leading-tight">{c.name}</div>
                {c.role && <div className="text-xs text-muted-foreground mt-0.5">{c.role}</div>}
                {c.company && <div className="text-xs text-primary/70 font-mono mt-0.5">{c.company}</div>}
                {c.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2 border-t border-border/40 pt-2">{c.notes}</p>}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => { setSelectedContact(c); setTab("compose"); }}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border border-border hover:border-primary/40 transition-colors"
                  >
                    <Sparkles className="h-3 w-3 text-primary" /> Draft message
                  </button>
                  <div className="flex gap-1">
                    {c.linkedin_url  && <a href={c.linkedin_url}  target="_blank" rel="noreferrer" className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Linkedin  className="h-3.5 w-3.5" /></a>}
                    {c.instagram_url && <a href={c.instagram_url} target="_blank" rel="noreferrer" className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Instagram className="h-3.5 w-3.5" /></a>}
                    {c.email         && <a href={`mailto:${c.email}`}                             className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Mail       className="h-3.5 w-3.5" /></a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── COMPOSE TAB ──────────────────────────────────── */}
      {tab === "compose" && (
        <div className="max-w-2xl animate-fade-up">
          <SectionHeading eyebrow="OUTREACH" title="Draft a message" />

          {/* Contact selector */}
          <div className="mb-5">
            <div className="text-[10px] tracking-[0.3em] text-muted-foreground mb-2">TO</div>
            <div className="flex flex-wrap gap-2">
              {contacts.length === 0 ? (
                <button onClick={() => setTab("contacts")} className="text-sm text-primary hover:underline">Add a contact first →</button>
              ) : contacts.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedContact(selectedContact?.id === c.id ? null : c)}
                  className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                    selectedContact?.id === c.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div className="mb-5">
            <div className="text-[10px] tracking-[0.3em] text-muted-foreground mb-2">PLATFORM</div>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map(p => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.key}
                    onClick={() => setPlatform(p.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                      platform === p.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />{p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div className="mb-5">
            <div className="text-[10px] tracking-[0.3em] text-muted-foreground mb-2">THEIR ROLE / CATEGORY</div>
            <div className="flex flex-wrap gap-2">
              {cats.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(category === c ? "" : c)}
                  className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                    category === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Subject (email only) */}
          {platform === "email" && (
            <div className="mb-4">
              <div className="text-[10px] tracking-[0.3em] text-muted-foreground mb-2">SUBJECT</div>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Introduction — Your Name"
                className="w-full glass rounded-lg px-4 py-2.5 text-sm outline-none border border-border/60 focus:border-primary/40 transition-colors"
              />
            </div>
          )}

          {/* Generate button */}
          {!selectedContact && (
            <p className="mb-3 text-xs text-amber-400/80 border border-amber-400/20 bg-amber-400/5 rounded-lg px-3 py-2">
              ↑ Select a contact above to generate a tailored message
            </p>
          )}
          {draftError && (
            <p className="mb-3 text-xs text-destructive border border-destructive/30 bg-destructive/5 rounded-lg px-3 py-2">
              {draftError}
            </p>
          )}
          <button
            onClick={draftMessage}
            disabled={drafting || !selectedContact}
            className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-lg text-sm disabled:opacity-40 transition-all hover:opacity-90"
            style={{ background: "var(--gradient-gold)", color: "#080808" }}
          >
            {drafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {drafting ? "Drafting…" : selectedContact ? `Draft message to ${selectedContact.name}` : "Select a contact first"}
          </button>

          {/* Message body */}
          <div className="mb-4">
            <div className="text-[10px] tracking-[0.3em] text-muted-foreground mb-2">MESSAGE</div>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Your message will appear here after generation, or type directly…"
              rows={10}
              className="w-full glass rounded-lg px-4 py-3 text-sm outline-none border border-border/60 focus:border-primary/40 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={copyMessage}
              disabled={!body.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-30"
            >
              {copied ? <><Check className="h-3.5 w-3.5 text-primary" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
            </button>
            <button
              onClick={() => saveDraft("draft")}
              disabled={!body.trim() || saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-30"
            >
              <FileText className="h-3.5 w-3.5" /> Save draft
            </button>
            <button
              onClick={() => saveDraft("sent")}
              disabled={!body.trim() || saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm disabled:opacity-30 transition-all hover:opacity-90"
              style={{ background: "var(--gradient-gold)", color: "#080808" }}
            >
              <Send className="h-3.5 w-3.5" /> Mark sent & open platform
            </button>
          </div>
        </div>
      )}

      {/* ── DRAFTS & SENT TAB ─────────────────────────────── */}
      {tab === "drafts" && (
        <div>
          <SectionHeading eyebrow="HISTORY" title="Drafts & Sent" />

          {draftsLoading && <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>}

          {!draftsLoading && drafts.length === 0 && (
            <div className="glass rounded-xl p-12 text-center">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-serif text-lg mb-1">No messages yet</p>
              <p className="text-sm text-muted-foreground">Draft and send messages from the Compose tab.</p>
            </div>
          )}

          <DraftsList drafts={drafts} platforms={PLATFORMS} />
        </div>
      )}
    </AppShell>
  );
}

function DraftsList({
  drafts,
  platforms,
}: {
  drafts: Draft[];
  platforms: typeof PLATFORMS;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(id: string, body: string) {
    await navigator.clipboard.writeText(body);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-3">
      {drafts.map((d) => {
        const PlatformIcon = platforms.find(p => p.key === d.platform)?.icon ?? Mail;
        const isExpanded = expanded === d.id;

        return (
          <div key={d.id} className="glass rounded-xl overflow-hidden">
            {/* Header row — always visible, clickable to expand */}
            <button
              onClick={() => setExpanded(isExpanded ? null : d.id)}
              className="w-full flex items-start gap-4 p-5 text-left hover:bg-secondary/20 transition-colors"
            >
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                d.status === "sent" ? "bg-emerald-400/10" : "bg-secondary"
              }`}>
                <PlatformIcon className={`h-4 w-4 ${d.status === "sent" ? "text-emerald-400" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {d.contact_name && <span className="text-sm font-medium">{d.contact_name}</span>}
                  {d.category && (
                    <span className="text-[10px] tracking-[0.2em] text-primary/70 bg-primary/5 px-2 py-0.5 rounded">
                      {d.category}
                    </span>
                  )}
                  <span className={`text-[9px] tracking-[0.25em] px-2 py-0.5 rounded-full uppercase ${
                    d.status === "sent" ? "text-emerald-400 bg-emerald-400/10" : "text-muted-foreground bg-secondary"
                  }`}>
                    {d.status}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground font-mono shrink-0">
                    <Clock className="h-3 w-3" />{formatDate(d.created_at)}
                  </span>
                </div>
                {d.subject && <div className="text-xs text-muted-foreground mb-1">Re: {d.subject}</div>}
                <p className={`text-sm text-foreground/70 leading-relaxed ${isExpanded ? "" : "line-clamp-1"}`}>
                  {d.body}
                </p>
              </div>
              <span className="text-muted-foreground text-xs shrink-0 mt-1">
                {isExpanded ? "▲" : "▼"}
              </span>
            </button>

            {/* Expanded body */}
            {isExpanded && (
              <div className="px-5 pb-5 border-t border-border/40">
                <div className="mt-4 bg-secondary/20 rounded-lg p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{d.body}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => copy(d.id, d.body)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    {copied === d.id ? <><Check className="h-3 w-3 text-primary" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
