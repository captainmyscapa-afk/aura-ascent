import { useEffect, useRef, useState } from "react";
import { Check, Globe2, Pencil, X } from "lucide-react";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { IndustryId } from "@/lib/industry/types";

type City = { city: string; flag: string; tz: string };

// ── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_CITIES: Record<IndustryId, City[]> = {
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

// ── City database for lookup / autocomplete ──────────────────────────────────
const CITY_DB: { name: string; flag: string; tz: string }[] = [
  { name: "Abu Dhabi", flag: "🇦🇪", tz: "Asia/Dubai" },
  { name: "Amsterdam", flag: "🇳🇱", tz: "Europe/Amsterdam" },
  { name: "Antibes", flag: "🇫🇷", tz: "Europe/Paris" },
  { name: "Athens", flag: "🇬🇷", tz: "Europe/Athens" },
  { name: "Auckland", flag: "🇳🇿", tz: "Pacific/Auckland" },
  { name: "Bali", flag: "🇮🇩", tz: "Asia/Makassar" },
  { name: "Bangkok", flag: "🇹🇭", tz: "Asia/Bangkok" },
  { name: "Barcelona", flag: "🇪🇸", tz: "Europe/Madrid" },
  { name: "Beijing", flag: "🇨🇳", tz: "Asia/Shanghai" },
  { name: "Berlin", flag: "🇩🇪", tz: "Europe/Berlin" },
  { name: "Bogota", flag: "🇨🇴", tz: "America/Bogota" },
  { name: "Brussels", flag: "🇧🇪", tz: "Europe/Brussels" },
  { name: "Buenos Aires", flag: "🇦🇷", tz: "America/Argentina/Buenos_Aires" },
  { name: "Cairo", flag: "🇪🇬", tz: "Africa/Cairo" },
  { name: "Cannes", flag: "🇫🇷", tz: "Europe/Paris" },
  { name: "Cape Town", flag: "🇿🇦", tz: "Africa/Johannesburg" },
  { name: "Capri", flag: "🇮🇹", tz: "Europe/Rome" },
  { name: "Chicago", flag: "🇺🇸", tz: "America/Chicago" },
  { name: "Copenhagen", flag: "🇩🇰", tz: "Europe/Copenhagen" },
  { name: "Dallas", flag: "🇺🇸", tz: "America/Chicago" },
  { name: "Delhi", flag: "🇮🇳", tz: "Asia/Kolkata" },
  { name: "Denver", flag: "🇺🇸", tz: "America/Denver" },
  { name: "Doha", flag: "🇶🇦", tz: "Asia/Qatar" },
  { name: "Dubai", flag: "🇦🇪", tz: "Asia/Dubai" },
  { name: "Dubrovnik", flag: "🇭🇷", tz: "Europe/Zagreb" },
  { name: "Dublin", flag: "🇮🇪", tz: "Europe/Dublin" },
  { name: "Frankfurt", flag: "🇩🇪", tz: "Europe/Berlin" },
  { name: "Geneva", flag: "🇨🇭", tz: "Europe/Zurich" },
  { name: "Hong Kong", flag: "🇭🇰", tz: "Asia/Hong_Kong" },
  { name: "Honolulu", flag: "🇺🇸", tz: "Pacific/Honolulu" },
  { name: "Ibiza", flag: "🇪🇸", tz: "Europe/Madrid" },
  { name: "Istanbul", flag: "🇹🇷", tz: "Europe/Istanbul" },
  { name: "Jakarta", flag: "🇮🇩", tz: "Asia/Jakarta" },
  { name: "Johannesburg", flag: "🇿🇦", tz: "Africa/Johannesburg" },
  { name: "Kuala Lumpur", flag: "🇲🇾", tz: "Asia/Kuala_Lumpur" },
  { name: "Lagos", flag: "🇳🇬", tz: "Africa/Lagos" },
  { name: "Lisbon", flag: "🇵🇹", tz: "Europe/Lisbon" },
  { name: "London", flag: "🇬🇧", tz: "Europe/London" },
  { name: "Los Angeles", flag: "🇺🇸", tz: "America/Los_Angeles" },
  { name: "Madrid", flag: "🇪🇸", tz: "Europe/Madrid" },
  { name: "Maldives", flag: "🇲🇻", tz: "Indian/Maldives" },
  { name: "Manila", flag: "🇵🇭", tz: "Asia/Manila" },
  { name: "Marbella", flag: "🇪🇸", tz: "Europe/Madrid" },
  { name: "Melbourne", flag: "🇦🇺", tz: "Australia/Melbourne" },
  { name: "Mexico City", flag: "🇲🇽", tz: "America/Mexico_City" },
  { name: "Miami", flag: "🇺🇸", tz: "America/New_York" },
  { name: "Milan", flag: "🇮🇹", tz: "Europe/Rome" },
  { name: "Monaco", flag: "🇲🇨", tz: "Europe/Monaco" },
  { name: "Moscow", flag: "🇷🇺", tz: "Europe/Moscow" },
  { name: "Mumbai", flag: "🇮🇳", tz: "Asia/Kolkata" },
  { name: "Munich", flag: "🇩🇪", tz: "Europe/Berlin" },
  { name: "Mykonos", flag: "🇬🇷", tz: "Europe/Athens" },
  { name: "Nairobi", flag: "🇰🇪", tz: "Africa/Nairobi" },
  { name: "Nassau", flag: "🇧🇸", tz: "America/Nassau" },
  { name: "New York", flag: "🇺🇸", tz: "America/New_York" },
  { name: "Oslo", flag: "🇳🇴", tz: "Europe/Oslo" },
  { name: "Palma", flag: "🇪🇸", tz: "Europe/Madrid" },
  { name: "Panama City", flag: "🇵🇦", tz: "America/Panama" },
  { name: "Paris", flag: "🇫🇷", tz: "Europe/Paris" },
  { name: "Phuket", flag: "🇹🇭", tz: "Asia/Bangkok" },
  { name: "Portofino", flag: "🇮🇹", tz: "Europe/Rome" },
  { name: "Prague", flag: "🇨🇿", tz: "Europe/Prague" },
  { name: "Riyadh", flag: "🇸🇦", tz: "Asia/Riyadh" },
  { name: "Rome", flag: "🇮🇹", tz: "Europe/Rome" },
  { name: "San Francisco", flag: "🇺🇸", tz: "America/Los_Angeles" },
  { name: "Santiago", flag: "🇨🇱", tz: "America/Santiago" },
  { name: "Santorini", flag: "🇬🇷", tz: "Europe/Athens" },
  { name: "São Paulo", flag: "🇧🇷", tz: "America/Sao_Paulo" },
  { name: "Seoul", flag: "🇰🇷", tz: "Asia/Seoul" },
  { name: "Shanghai", flag: "🇨🇳", tz: "Asia/Shanghai" },
  { name: "Singapore", flag: "🇸🇬", tz: "Asia/Singapore" },
  { name: "St Barts", flag: "🇧🇱", tz: "America/Guadeloupe" },
  { name: "St Tropez", flag: "🇫🇷", tz: "Europe/Paris" },
  { name: "Stockholm", flag: "🇸🇪", tz: "Europe/Stockholm" },
  { name: "Sydney", flag: "🇦🇺", tz: "Australia/Sydney" },
  { name: "Taipei", flag: "🇹🇼", tz: "Asia/Taipei" },
  { name: "Tel Aviv", flag: "🇮🇱", tz: "Asia/Jerusalem" },
  { name: "Tokyo", flag: "🇯🇵", tz: "Asia/Tokyo" },
  { name: "Toronto", flag: "🇨🇦", tz: "America/Toronto" },
  { name: "Vancouver", flag: "🇨🇦", tz: "America/Vancouver" },
  { name: "Vienna", flag: "🇦🇹", tz: "Europe/Vienna" },
  { name: "Warsaw", flag: "🇵🇱", tz: "Europe/Warsaw" },
  { name: "Washington DC", flag: "🇺🇸", tz: "America/New_York" },
  { name: "Zurich", flag: "🇨🇭", tz: "Europe/Zurich" },
];

// ── localStorage persistence ─────────────────────────────────────────────────
const STORAGE_KEY = "aurum_custom_cities_v2";

function loadCustomCities(): Partial<Record<IndustryId, City[]>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCustomCities(data: Partial<Record<IndustryId, City[]>>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function lookupCity(input: string): { name: string; flag: string; tz: string } | null {
  const q = input.trim().toLowerCase();
  if (!q) return null;
  return CITY_DB.find((c) => c.name.toLowerCase() === q) ?? null;
}

// ── Tick hook ────────────────────────────────────────────────────────────────
function useTick(ms = 1000) {
  const [, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((x) => x + 1), ms);
    return () => clearInterval(i);
  }, [ms]);
}

// ── Time helpers ─────────────────────────────────────────────────────────────
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

// ── Inline city editor ───────────────────────────────────────────────────────
interface CityEditorProps {
  city: City;
  onSave: (city: City) => void;
  onCancel: () => void;
}

function CityEditor({ city, onSave, onCancel }: CityEditorProps) {
  const [value, setValue] = useState(city.city);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const confirm = () => {
    const found = lookupCity(value);
    if (!found) { setError(true); return; }
    setError(false);
    onSave({ city: found.name, flag: found.flag, tz: found.tz });
  };

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          list="aurum-city-suggestions"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(false); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirm();
            if (e.key === "Escape") onCancel();
          }}
          className="text-[11px] tracking-[0.15em] uppercase bg-transparent border-b border-primary/60 outline-none w-28 text-foreground/90 placeholder:text-muted-foreground/40 py-0.5"
          placeholder={t.cityPlaceholder}
        />
        <datalist id="aurum-city-suggestions">
          {CITY_DB.filter(
            (c) => value.length > 0 && c.name.toLowerCase().includes(value.toLowerCase()),
          )
            .slice(0, 10)
            .map((c) => (
              <option key={c.name} value={c.name} />
            ))}
        </datalist>
        <button
          onClick={confirm}
          className="text-primary/80 hover:text-primary transition-colors"
          title="Save"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Cancel"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      {error && (
        <span className="text-[9px] tracking-[0.2em] text-destructive/80 uppercase">
          {t.cityNotFound}
        </span>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function GlobalTimeHub({ compact = false }: { compact?: boolean } = {}) {
  useTick(1000);
  const { industry, industryId } = useIndustry();
  const { t } = useLanguage();

  const [customCitiesAll, setCustomCitiesAll] = useState<
    Partial<Record<IndustryId, City[]>>
  >(() => loadCustomCities());
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const cities = customCitiesAll[industryId] ?? DEFAULT_CITIES[industryId];
  const now = new Date();

  // Close editor when switching modes
  useEffect(() => { setEditingIdx(null); }, [industryId]);

  function updateCity(idx: number, city: City) {
    const base = customCitiesAll[industryId] ?? DEFAULT_CITIES[industryId];
    const updated = base.map((c, i) => (i === idx ? city : c));
    const next = { ...customCitiesAll, [industryId]: updated };
    setCustomCitiesAll(next);
    saveCustomCities(next);
    setEditingIdx(null);
  }

  // ── Compact layout ──────────────────────────────────────────────────────
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
              {industry.modeLabel} · {t.live}
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
              const dayRaw = dayDelta(c.tz, now);
              const day = dayRaw === "TODAY" ? t.today : dayRaw === "TOMORROW" ? t.tomorrow : t.yesterday;
              const isEditing = editingIdx === idx;
              return (
                <div
                  key={`${industryId}-${idx}`}
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-secondary/30 transition-colors group/row"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        isNight ? "bg-primary/40" : "bg-primary"
                      } shadow-[0_0_8px_currentColor]`}
                    />
                    <span className="text-sm leading-none">{c.flag}</span>
                    {isEditing ? (
                      <CityEditor
                        city={c}
                        onSave={(city) => updateCity(idx, city)}
                        onCancel={() => setEditingIdx(null)}
                      />
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingIdx(idx)}
                          className="text-[11px] tracking-[0.2em] uppercase text-foreground/90 truncate hover:text-primary transition-colors flex items-center gap-1"
                          title="Click to change city"
                        >
                          {c.city}
                          <Pencil className="h-2 w-2 opacity-0 group-hover/row:opacity-50 transition-opacity" />
                        </button>
                        {day !== "TODAY" && (
                          <span className="text-[8px] tracking-[0.25em] text-primary/70 uppercase">
                            {day === "TOMORROW" ? "+1" : "-1"}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <span className="font-serif text-base tabular-nums text-foreground">
                      {time}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // ── Full layout ─────────────────────────────────────────────────────────
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
              {industry.modeLabel} · {t.live}
            </div>
            <h3 className="font-serif text-xl sm:text-2xl leading-tight">
              {t.worldRhythmPre}{" "}
              <span className="italic text-gold-gradient">{t.worldRhythmEm}</span>
            </h3>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            {t.live}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {cities.map((c, idx) => {
            const time = formatTime(c.tz, now);
            const secs = formatSeconds(c.tz, now);
            const off = tzOffsetLabel(c.tz, now);
            const dayRaw = dayDelta(c.tz, now);
            const day = dayRaw === "TODAY" ? t.today : dayRaw === "TOMORROW" ? t.tomorrow : t.yesterday;
            const hour = Number(time.split(":")[0]);
            const isNight = hour >= 20 || hour < 6;
            const isEditing = editingIdx === idx;
            return (
              <div
                key={`${industryId}-${idx}`}
                className="group relative rounded-xl border border-border/60 bg-card/40 hover:bg-card/70 hover:border-primary/40 p-4 sm:p-5 transition-all overflow-visible"
              >
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
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
                      {isEditing ? (
                        <CityEditor
                          city={c}
                          onSave={(city) => updateCity(idx, city)}
                          onCancel={() => setEditingIdx(null)}
                        />
                      ) : (
                        <button
                          onClick={() => setEditingIdx(idx)}
                          className="group/city flex items-center gap-1.5 hover:text-primary transition-colors"
                          title="Click to change city"
                        >
                          {c.city}
                          <Pencil className="h-2.5 w-2.5 opacity-0 group-hover/city:opacity-60 transition-opacity" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${
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
                  <span>
                    {isNight ? t.evening : hour < 12 ? t.morning : t.daylight}
                  </span>
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
