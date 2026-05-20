import { useEffect, useState } from "react";
import { Globe2 } from "lucide-react";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import type { IndustryId } from "@/lib/industry/types";

type City = { city: string; flag: string; tz: string };

const CITIES_BY_INDUSTRY: Record<IndustryId, City[]> = {
  yachts: [
    { city: "Monaco", flag: "🇲🇨", tz: "Europe/Monaco" },
    { city: "Miami", flag: "🇺🇸", tz: "America/New_York" },
    { city: "Hong Kong", flag: "🇭🇰", tz: "Asia/Hong_Kong" },
  ],
  villas: [
    { city: "Cannes", flag: "🇫🇷", tz: "Europe/Paris" },
    { city: "Los Angeles", flag: "🇺🇸", tz: "America/Los_Angeles" },
    { city: "Dubai", flag: "🇦🇪", tz: "Asia/Dubai" },
  ],
  jets: [
    { city: "New York", flag: "🇺🇸", tz: "America/New_York" },
    { city: "London", flag: "🇬🇧", tz: "Europe/London" },
    { city: "Tokyo", flag: "🇯🇵", tz: "Asia/Tokyo" },
  ],
  cars: [
    { city: "Abu Dhabi", flag: "🇦🇪", tz: "Asia/Dubai" },
    { city: "Monaco", flag: "🇲🇨", tz: "Europe/Monaco" },
    { city: "Dubai", flag: "🇦🇪", tz: "Asia/Dubai" },
  ],
};

function useTick(ms = 1000) {
  const [, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((x) => x + 1), ms);
    return () => clearInterval(i);
  }, [ms]);
}

function formatTime(tz: string, d: Date) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return "--:--";
  }
}

function formatSeconds(tz: string, d: Date) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      second: "2-digit",
    }).format(d);
  } catch {
    return "--";
  }
}

function tzOffsetLabel(tz: string, d: Date) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(d);
    const off = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    return off.replace("GMT", "UTC");
  } catch {
    return "";
  }
}

function dayDelta(tz: string, d: Date) {
  try {
    const local = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
    const here = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
    if (local === here) return "TODAY";
    return local > here ? "TOMORROW" : "YESTERDAY";
  } catch {
    return "";
  }
}

export function GlobalTimeHub({ compact = false }: { compact?: boolean } = {}) {
  useTick(1000);
  const { industry, industryId } = useIndustry();
  const cities = CITIES_BY_INDUSTRY[industryId];
  const now = new Date();

  if (compact) {
    return (
      <section
        key={industryId}
        className="relative rounded-xl overflow-hidden border border-border/60 glass-strong w-full animate-fade-in"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-20 w-[220px] h-[220px] rounded-full opacity-25 blur-3xl"
          style={{ background: "var(--gradient-gold)" }}
        />
        <div className="relative p-3.5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-[9px] tracking-[0.35em] text-primary/80 uppercase">
              <Globe2 className="h-2.5 w-2.5" />
              {industry.modeLabel} · Live
            </div>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
          </div>

          <div className="space-y-1">
            {cities.map((c, idx) => {
              const time = formatTime(c.tz, now);
              const hour = Number(time.split(":")[0]);
              const isNight = hour >= 20 || hour < 6;
              const day = dayDelta(c.tz, now);
              return (
                <div
                  key={`${industryId}-${idx}`}
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        isNight ? "bg-primary/40" : "bg-primary"
                      } shadow-[0_0_8px_currentColor]`}
                    />
                    <span className="text-sm leading-none">{c.flag}</span>
                    <span className="text-[11px] tracking-[0.2em] uppercase text-foreground/90 truncate">
                      {c.city}
                    </span>
                    {day !== "TODAY" && (
                      <span className="text-[8px] tracking-[0.25em] text-primary/70 uppercase">
                        {day === "TOMORROW" ? "+1" : "-1"}
                      </span>
                    )}
                  </div>
                  <span className="font-serif text-base tabular-nums text-foreground">
                    {time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      key={industryId}
      className="relative rounded-2xl overflow-hidden border border-border/60 glass-strong animate-fade-in"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-32 w-[360px] h-[360px] rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />

      <div className="relative p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4 mb-5 sm:mb-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.4em] text-primary/80 uppercase mb-2">
              <Globe2 className="h-3 w-3" />
              {industry.modeLabel} · Live
            </div>
            <h3 className="font-serif text-xl sm:text-2xl leading-tight">
              The rhythm of the <span className="italic text-gold-gradient">world</span>
            </h3>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Live
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {cities.map((c, idx) => {
            const time = formatTime(c.tz, now);
            const secs = formatSeconds(c.tz, now);
            const off = tzOffsetLabel(c.tz, now);
            const day = dayDelta(c.tz, now);
            const hour = Number(time.split(":")[0]);
            const isNight = hour >= 20 || hour < 6;
            return (
              <div
                key={`${industryId}-${idx}`}
                className="group relative rounded-xl border border-border/60 bg-card/40 hover:bg-card/70 hover:border-primary/40 p-4 sm:p-5 transition-all overflow-hidden"
              >
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background:
                      "radial-gradient(circle at top right, color-mix(in oklab, var(--primary) 18%, transparent), transparent 60%)",
                  }}
                />
                <div className="relative flex items-start justify-between mb-5">
                  <div>
                    <div className="text-[10px] tracking-[0.35em] text-muted-foreground uppercase">
                      {day}
                    </div>
                    <div className="mt-1 text-sm tracking-[0.25em] uppercase text-foreground/90 flex items-center gap-2">
                      <span className="text-base leading-none">{c.flag}</span>
                      {c.city}
                    </div>
                  </div>
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      isNight ? "bg-primary/40" : "bg-primary"
                    } shadow-[0_0_10px_currentColor]`}
                  />
                </div>

                <div className="relative flex items-baseline gap-1.5">
                  <span className="font-serif text-4xl sm:text-5xl tracking-tight tabular-nums text-foreground">
                    {time}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-primary/70">
                    :{secs}
                  </span>
                </div>

                <div className="relative mt-4 flex items-center justify-between text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                  <span>{off || c.tz.split("/")[1]?.replace("_", " ")}</span>
                  <span>{isNight ? "Evening" : hour < 12 ? "Morning" : "Daylight"}</span>
                </div>

                <div className="relative mt-4 h-px w-full overflow-hidden bg-border/40">
                  <div
                    className="absolute inset-y-0 left-0 w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700"
                    style={{ background: "var(--gradient-gold)" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
