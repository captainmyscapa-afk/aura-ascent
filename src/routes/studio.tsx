import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/aurum/AppShell";
import { SectionHeading } from "@/components/aurum/SectionHeading";
import { Video, FileText, Sparkles, Play, Wand2 } from "lucide-react";
import yachtImg from "@/assets/hero-yacht.jpg";
import villaImg from "@/assets/eco-villa.jpg";
import jetImg from "@/assets/eco-jet.jpg";

export const Route = createFileRoute("/studio")({
  component: Studio,
});

const drafts = [
  { type: "LinkedIn", t: "Why hybrid superyachts will define the next decade", img: yachtImg, status: "Ready to publish" },
  { type: "Reel", t: "60s tour: inside a €38M Benetti", img: yachtImg, status: "Rendering · 2m" },
  { type: "Carousel", t: "5 things a senior broker notices that you don't", img: villaImg, status: "Draft" },
  { type: "Short", t: "Why this jet's resale value just climbed 14%", img: jetImg, status: "Script ready" },
];

function Studio() {
  return (
    <AppShell>
      <div className="mb-10 animate-fade-up">
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">CONTENT STUDIO</div>
        <h1 className="font-serif text-4xl sm:text-5xl">
          Your authority — <span className="italic text-gold-gradient">on rails.</span>
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl text-sm">
          AURUM crafts cinematic videos, market commentary and authority posts
          tuned to your voice. Publish weekly. Compound monthly.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        {[
          { i: Wand2, l: "Generate from market signal", d: "Auto-draft from today's intelligence" },
          { i: Video, l: "AI cinematic reel", d: "Upload clips → finished luxury edit" },
          { i: FileText, l: "Authority essay", d: "Long-form for LinkedIn / Substack" },
        ].map(({ i: I, l, d }) => (
          <button
            key={l}
            className="glass rounded-xl p-5 text-left hover:ring-gold transition-all"
          >
            <I className="h-5 w-5 text-primary mb-3" />
            <div className="font-serif text-lg">{l}</div>
            <div className="text-xs text-muted-foreground mt-1">{d}</div>
          </button>
        ))}
      </div>

      <SectionHeading
        eyebrow="QUEUE"
        title="In production"
        action={<span className="text-xs text-muted-foreground">4 items · AI working</span>}
      />
      <div className="grid sm:grid-cols-2 gap-4">
        {drafts.map((d) => (
          <div key={d.t} className="glass rounded-xl overflow-hidden group">
            <div className="relative aspect-[16/9] overflow-hidden">
              <img
                src={d.img}
                alt={d.t}
                className="h-full w-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                loading="lazy"
                width={1600}
                height={900}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <div className="absolute top-3 left-3 text-[9px] tracking-[0.3em] text-primary/90 px-2 py-1 border border-primary/40 rounded glass">
                {d.type}
              </div>
              <button className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-[var(--gradient-gold)] flex items-center justify-center text-primary-foreground">
                <Play className="h-4 w-4 ml-0.5" />
              </button>
            </div>
            <div className="p-5">
              <div className="font-serif text-lg leading-snug">{d.t}</div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <Sparkles className="h-3 w-3 text-primary/80" />
                <span className="text-muted-foreground">{d.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
