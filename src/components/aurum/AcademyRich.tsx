import { useMemo, useState } from "react";
import { Check, Flame, Quote, RotateCw } from "lucide-react";

// ─── Rich, animated rendering of Academy page bodies ────────────────────────
// Page bodies are simple HTML (<p>, <b>, <em>, <br/>, &bull;). This turns them
// into staggered animated blocks: section headings, tappable bullet cards, quote
// callouts and text. Anything unexpected falls back to the raw HTML.

type Item = { label: string | null; html: string };
type Block =
  | { kind: "heading"; html: string }
  | { kind: "list"; items: Item[] }
  | { kind: "quote"; html: string }
  | { kind: "text"; html: string };

function parseBlocks(html: string): Block[] | null {
  if (!/<p[\s>]/i.test(html) || /<(ul|ol|div|h[1-6]|table)[\s>]/i.test(html)) return null;
  const parts = html
    .split(/<\/p>/i)
    .map((s) => s.replace(/^\s*<p[^>]*>/i, "").trim())
    .filter(Boolean);
  return parts.map((p): Block => {
    if (/^<b>[^<]+<\/b>$/i.test(p)) return { kind: "heading", html: p.replace(/<\/?b>/gi, "") };
    if (/^&bull;/.test(p)) {
      const items = p
        .split(/<br\s*\/?>/i)
        .map((x) => x.replace(/^\s*&bull;\s*/, "").trim())
        .filter(Boolean)
        .map((x): Item => {
          const m = x.match(/^<b>([\s\S]*?)<\/b>\s*([\s\S]*)$/);
          return m && m[2] ? { label: m[1], html: m[2] } : { label: null, html: x };
        });
      return { kind: "list", items };
    }
    if (/^<em>[\s\S]*<\/em>$/i.test(p) && (p.match(/<em>/gi)?.length ?? 0) === 1) {
      return { kind: "quote", html: p.replace(/^<em>|<\/em>$/gi, "") };
    }
    return { kind: "text", html: p };
  });
}

function ListCards({ items, start }: { items: Item[]; start: number }) {
  const [got, setGot] = useState<Record<number, boolean>>({});
  return (
    <div className="grid gap-2.5 my-4">
      {items.map((it, i) => {
        const on = !!got[i];
        return (
          <button
            key={i}
            type="button"
            onClick={() => setGot((g) => ({ ...g, [i]: !g[i] }))}
            style={{ ["--i" as string]: Math.min(start + i, 14) }}
            className={`rd-in rd-card text-left flex items-start gap-3 rounded-xl border p-3.5 ${
              on ? "border-primary/60 bg-primary/10" : "border-border/60 bg-secondary/20 hover:border-primary/40"
            }`}
          >
            <span
              className={`mt-0.5 h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-medium transition-all ${
                on ? "bg-primary text-primary-foreground animate-pop" : "border border-primary/40 text-primary"
              }`}
            >
              {on ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className="text-sm leading-relaxed text-foreground/90 [&_b]:text-foreground [&_em]:text-primary/80">
              {it.label && <span className="font-medium text-primary mr-1.5" dangerouslySetInnerHTML={{ __html: it.label }} />}
              <span dangerouslySetInnerHTML={{ __html: it.html }} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function RichBody({ html }: { html: string }) {
  const blocks = useMemo(() => parseBlocks(html), [html]);
  if (!blocks) {
    return (
      <div
        className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed text-foreground/90 [&_p]:mb-3 [&_b]:text-foreground [&_em]:text-primary/80"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  let n = 0;
  return (
    <div className="text-sm leading-relaxed text-foreground/90">
      {blocks.map((b, bi) => {
        const idx = n++;
        const style = { ["--i" as string]: Math.min(idx, 14) };
        if (b.kind === "heading")
          return (
            <h4 key={bi} style={style} className="rd-in flex items-center gap-3 font-serif text-lg sm:text-xl text-primary mt-6 mb-2 first:mt-0">
              <span className="h-px w-7 bg-gradient-to-r from-primary to-transparent" />
              <span dangerouslySetInnerHTML={{ __html: b.html }} />
            </h4>
          );
        if (b.kind === "list") {
          const start = n;
          n += b.items.length;
          return <ListCards key={bi} items={b.items} start={start} />;
        }
        if (b.kind === "quote")
          return (
            <blockquote
              key={bi}
              style={style}
              className="rd-in relative my-4 rounded-xl border border-primary/25 border-l-2 border-l-primary bg-primary/5 p-4 pl-5 italic text-foreground/90"
            >
              <Quote className="absolute right-3 top-3 h-4 w-4 text-primary/30" />
              <span dangerouslySetInnerHTML={{ __html: b.html }} />
            </blockquote>
          );
        return (
          <p key={bi} style={style} className="rd-in mb-3 [&_b]:text-foreground [&_b]:font-medium [&_em]:text-primary/80" dangerouslySetInnerHTML={{ __html: b.html }} />
        );
      })}
    </div>
  );
}

// ─── Celebration bits ───────────────────────────────────────────────────────

const CONFETTI_COLORS = ["bg-primary", "bg-amber-300", "bg-emerald-400", "bg-sky-400", "bg-rose-400"];

export function Confetti({ seed }: { seed: string }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 26 + Math.random() * 0.4;
        const d = 70 + Math.random() * 110;
        return {
          dx: Math.cos(a) * d,
          dy: Math.sin(a) * d - 30,
          r: (Math.random() - 0.5) * 720,
          c: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          delay: Math.random() * 90,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`rd-confetti-piece ${p.c}`}
          style={{ ["--dx" as string]: `${p.dx}px`, ["--dy" as string]: `${p.dy}px`, ["--r" as string]: `${p.r}deg`, animationDelay: `${p.delay}ms` }}
        />
      ))}
    </div>
  );
}

export function StreakChip({ streak }: { streak: number }) {
  if (streak < 2) return null;
  return (
    <span key={streak} className="animate-pop inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] text-primary">
      <Flame className="h-3.5 w-3.5" /> {streak} in a row
    </span>
  );
}

export function ProgressBar({ fraction }: { fraction: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, fraction)) * 100);
  return (
    <div className="h-1.5 w-full rounded-full bg-secondary/40 overflow-hidden">
      <div className="rd-bar-fill h-full rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── End-of-module recap: flip cards ────────────────────────────────────────

function snippetOf(html: string): string {
  const text = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&bull;/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= 170) return text;
  const cut = text.slice(0, 170);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "));
  return (end > 60 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "")) + (end > 60 ? "" : "…");
}

export function RecapCards({ pages, streak }: { pages: { id: string; heading: string; body_html: string }[]; streak: number }) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const flippedCount = Object.values(flipped).filter(Boolean).length;
  return (
    <div className="glass rounded-xl p-6 sm:p-8 mb-6 animate-fade-up">
      <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">MODULE RECAP</div>
      <h3 className="font-serif text-2xl mb-1">You made it through.</h3>
      <p className="text-sm text-muted-foreground mb-5">
        Tap a card to flip it and refresh the key idea. {flippedCount}/{pages.length} revisited{streak >= 2 ? ` · best run ${streak} in a row` : ""}.
      </p>
      <ProgressBar fraction={pages.length ? flippedCount / pages.length : 0} />
      <div className="grid sm:grid-cols-2 gap-3 mt-5">
        {pages.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setFlipped((f) => ({ ...f, [p.id]: !f[p.id] }))}
            style={{ ["--i" as string]: Math.min(i, 14), minHeight: 156 }}
            className={`rd-in rd-flip block w-full text-left relative ${flipped[p.id] ? "is-flipped" : ""}`}
          >
            <div className="rd-flip-inner absolute inset-0">
              <div className="rd-face rounded-xl border border-border/60 bg-secondary/20 p-4 flex flex-col justify-between">
                <span className="text-[10px] tracking-[0.3em] text-primary/80">PAGE {String(i + 1).padStart(2, "0")}</span>
                <span className="font-serif text-base leading-snug">{p.heading}</span>
                <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1"><RotateCw className="h-3 w-3" /> tap to flip</span>
              </div>
              <div className="rd-face rd-face-back rounded-xl border border-primary/50 bg-primary/10 p-4 overflow-hidden">
                <span className="text-xs leading-relaxed text-foreground/90">{snippetOf(p.body_html)}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
