import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  ArrowUpRight,
  Flame,
  Trophy,
  Radio,
  Sparkles,
  ChevronRight,
  Calendar,
  MessageCircle,
  Check,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/aurum/AppShell";
import { SectionHeading } from "@/components/aurum/SectionHeading";
import villaImg from "@/assets/eco-villa.jpg";
import jetImg from "@/assets/eco-jet.jpg";
import carImg from "@/assets/eco-car.jpg";
import yachtImg from "@/assets/hero-yacht.jpg";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

const dailyTasks = [
  { t: "Message 5 yacht brokers in Monaco", done: true },
  { t: "Publish LinkedIn market insight on Med charter season", done: true },
  { t: "Follow up with 2 prospects from Cannes", done: false },
  { t: "Complete: Luxury sales psychology — Module 04", done: false },
  { t: "Engage with 6 industry posts (taste & visibility)", done: false },
];

const intelFeed = [
  {
    tag: "MARKET",
    title: "Benetti delivers 67m Oasis hull #4 — charter inventory tightens",
    note: "Mediterranean charter availability down 18% YoY. Operators should reposition early.",
    time: "12m",
  },
  {
    tag: "PEOPLE",
    title: "Sergey K. (Russian UHNW) listed B.Now 50M with Camper & Nicholsons",
    note: "Soft-listed at €38.5M. Indicates intent to upgrade — opportunity window.",
    time: "1h",
  },
  {
    tag: "EVENT",
    title: "Monaco Yacht Show — VIP previews open Sept 24",
    note: "12 of your network attending. Suggested intro: Marco D. (Edmiston).",
    time: "3h",
  },
  {
    tag: "TREND",
    title: "Hybrid superyachts: search volume up 240% on luxury portals",
    note: "Authority opportunity: publish before competitors. Draft suggested.",
    time: "5h",
  },
];

function Dashboard() {
  return (
    <AppShell>
      {/* Hero greeting */}
      <section className="mb-10 animate-fade-up">
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">
          TUESDAY · 19 MAY · MONACO TIME 08:42
        </div>
        <div className="flex items-end justify-between flex-wrap gap-6">
          <h1 className="font-serif text-3xl sm:text-[42px] leading-tight">
            Good morning, Alexander.
            <br />
            <span className="text-muted-foreground">
              The market is moving — and so are you.
            </span>
          </h1>
          <div className="flex items-center gap-3">
            <Link
              to="/mentor"
              className="inline-flex items-center gap-2 bg-[var(--gradient-gold)] text-primary-foreground rounded-full px-5 py-2.5 text-sm shadow-[var(--shadow-gold)]"
            >
              <Sparkles className="h-4 w-4" />
              Speak with AURUM
            </Link>
          </div>
        </div>
      </section>

      {/* Metric strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <Metric label="MOMENTUM" value="87" delta="+6" hint="of 100 · top 8%" highlight />
        <Metric label="AUTHORITY" value="42" delta="+3" hint="LinkedIn + IG composite" />
        <Metric label="STREAK" value="12d" hint="Consecutive execution" />
        <Metric label="RELATIONSHIPS" value="184" delta="+9" hint="Tier-1: 23" />
      </section>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT — Daily OS */}
        <section className="lg:col-span-2 space-y-6">
          <div className="glass rounded-xl p-6 sm:p-7 relative overflow-hidden">
            <SectionHeading
              eyebrow="DAILY OPERATING SYSTEM"
              title="Today's execution"
              action={
                <span className="text-xs text-muted-foreground font-mono">
                  2 / 5 complete
                </span>
              }
            />
            <div className="space-y-2">
              {dailyTasks.map((task, i) => (
                <div
                  key={i}
                  className={`group flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    task.done
                      ? "border-border/40 bg-secondary/20"
                      : "border-border hover:border-primary/40 bg-secondary/40"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                      task.done
                        ? "bg-primary border-primary"
                        : "border-border group-hover:border-primary"
                    }`}
                  >
                    {task.done && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <div
                    className={`flex-1 text-sm ${
                      task.done ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                  >
                    {task.t}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
            <button className="mt-4 flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add custom ritual
            </button>
          </div>

          {/* Intelligence feed */}
          <div className="glass rounded-xl p-6 sm:p-7">
            <SectionHeading
              eyebrow="LIVE INTELLIGENCE"
              title={
                <>
                  Market <span className="italic text-gold-gradient">terminal</span>
                </>
              }
              action={
                <Link
                  to="/intelligence"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  All signals <ArrowUpRight className="h-3 w-3" />
                </Link>
              }
            />
            <div className="space-y-1">
              {intelFeed.map((item, i) => (
                <div
                  key={i}
                  className="group p-4 -mx-2 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-[9px] tracking-[0.3em] text-primary/80 px-2 py-0.5 border border-primary/30 rounded">
                      {item.tag}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {item.time}
                    </span>
                  </div>
                  <div className="text-[15px] text-foreground leading-snug group-hover:text-primary transition-colors">
                    {item.title}
                  </div>
                  <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 mt-0.5 text-primary/70 shrink-0" />
                    <span>{item.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT — Ecosystem & micro panels */}
        <aside className="space-y-6">
          {/* Active ecosystem */}
          <div className="glass rounded-xl overflow-hidden relative group">
            <img
              src={yachtImg}
              alt="Yacht ecosystem"
              className="h-44 w-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
              loading="lazy"
              width={1920}
              height={1080}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
            <div className="absolute inset-0 p-5 flex flex-col justify-end">
              <div className="text-[10px] tracking-[0.34em] text-primary/90">
                YOUR ECOSYSTEM
              </div>
              <div className="font-serif text-2xl mt-1">Yacht Mode</div>
              <div className="text-xs text-muted-foreground mt-1">
                Phase 02 · Brokerage immersion
              </div>
            </div>
          </div>

          {/* Switch ecosystem */}
          <div className="glass rounded-xl p-5">
            <div className="text-[10px] tracking-[0.34em] text-muted-foreground mb-4">
              EXPLORE
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { img: villaImg, name: "Villas" },
                { img: jetImg, name: "Jets" },
                { img: carImg, name: "Cars" },
              ].map((e) => (
                <button
                  key={e.name}
                  className="group relative aspect-square rounded-md overflow-hidden border border-border hover:border-primary/60 transition-all"
                >
                  <img
                    src={e.img}
                    alt={e.name}
                    className="h-full w-full object-cover opacity-60 group-hover:opacity-90 transition-opacity"
                    loading="lazy"
                    width={400}
                    height={400}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
                  <div className="absolute bottom-1.5 left-2 text-[11px] tracking-wide text-foreground">
                    {e.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* AI suggestions */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <div className="text-[10px] tracking-[0.34em] text-foreground">
                AI RECOMMENDATION
              </div>
            </div>
            <div className="font-serif text-lg leading-snug">
              "Reach out to <span className="text-gold-gradient">Edmiston's</span>{" "}
              Monaco office before the show — your authority profile fits their
              charter pipeline."
            </div>
            <button className="mt-4 w-full text-sm bg-secondary hover:bg-secondary/80 transition-colors rounded-md py-2.5 border border-border">
              Generate outreach draft
            </button>
          </div>

          {/* Upcoming */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-primary" />
              <div className="text-[10px] tracking-[0.34em] text-foreground">
                UPCOMING
              </div>
            </div>
            <div className="space-y-3">
              {[
                ["Sept 24", "Monaco Yacht Show — VIP preview"],
                ["Oct 02", "Mastermind: Charter Season Q4"],
                ["Oct 11", "1:1 with Marco D. (Edmiston)"],
              ].map(([d, t]) => (
                <div key={t} className="flex items-baseline gap-3 text-sm">
                  <span className="font-mono text-[10px] text-primary/80 w-14 tracking-widest shrink-0">
                    {d}
                  </span>
                  <span className="text-foreground/90">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Achievements row */}
      <section className="mt-12">
        <SectionHeading eyebrow="PROGRESSION" title="Recently unlocked" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Flame, name: "10-day streak", note: "Daily execution unlocked" },
            { icon: Trophy, name: "First listing intro", note: "Tier-2 broker secured" },
            { icon: Radio, name: "Authority threshold", note: "Crossed 40 · top 14%" },
            { icon: MessageCircle, name: "Mentor sync", note: "5 strategy sessions" },
          ].map(({ icon: Icon, name, note }) => (
            <div key={name} className="glass rounded-xl p-5 group hover:ring-gold transition-all">
              <Icon className="h-5 w-5 text-primary mb-3" />
              <div className="font-serif text-lg">{name}</div>
              <div className="text-xs text-muted-foreground mt-1">{note}</div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  delta,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative rounded-xl p-5 glass overflow-hidden ${
        highlight ? "ring-gold" : ""
      }`}
    >
      {highlight && (
        <div className="absolute inset-0 bg-[var(--gradient-gold)] opacity-[0.04] pointer-events-none" />
      )}
      <div className="text-[10px] tracking-[0.34em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className={`font-serif text-4xl ${highlight ? "text-gold-gradient" : "text-foreground"}`}>
          {value}
        </span>
        {delta && (
          <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-400/90">
            <TrendingUp className="h-3 w-3" /> {delta}
          </span>
        )}
      </div>
      {hint && (
        <div className="mt-2 text-[11px] text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}
