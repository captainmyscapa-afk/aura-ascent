import { Linkedin, Instagram, Twitter, Music2, Youtube, FileText, MapPin } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

// Read-only "who is this" card for another community member, opened by
// clicking a name in Network or Calendar. Mirrors the header of the real
// Identity page (avatar, name, "<Mode> <Level> · <Location>", location pin,
// social icons) using exactly what public_profiles exposes for other users:
// full_name, photo_url, location, the industry mode/level badge, and any
// social links the member has entered themselves. It never shows anything
// private — no bio/mission/goal, no Aurum Score breakdown, no social_accounts
// tokens (see CAP-68). Clicking your OWN name instead routes to the real
// /profile page.

function initials(name: string | null) {
  if (!name) return "AU";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Note: building this via `mode?.[0]?.toUpperCase() + mode?.slice(1)` breaks
// when mode/level is null — `undefined + ""` coerces to the *string*
// "undefined", which is truthy, so a naive `|| fallback` never fires.
function capitalize(value: string | null | undefined): string {
  if (!value) return "";
  return value[0].toUpperCase() + value.slice(1);
}

function titleFor(mode: string | null, level: string | null) {
  const m = capitalize(mode);
  const l = capitalize(level);
  return `${m || "Aurum"} ${l || "Initiate"}`;
}

export type UserCardSocials = {
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
  substackUrl?: string | null;
};

export function UserCardDialog({
  open,
  onClose,
  name,
  photoUrl,
  location,
  activeMode,
  currentLevel,
  ...socials
}: {
  open: boolean;
  onClose: () => void;
  name: string | null;
  photoUrl: string | null;
  location?: string | null;
  activeMode?: string | null;
  currentLevel?: string | null;
} & UserCardSocials) {
  const { t } = useLanguage();

  const socialLinks = [
    { url: socials.linkedinUrl, icon: Linkedin, label: "LinkedIn" },
    { url: socials.instagramUrl, icon: Instagram, label: "Instagram" },
    { url: socials.twitterUrl, icon: Twitter, label: "X / Twitter" },
    { url: socials.tiktokUrl, icon: Music2, label: "TikTok" },
    { url: socials.youtubeUrl, icon: Youtube, label: "YouTube" },
    { url: socials.substackUrl, icon: FileText, label: "Substack" },
  ].filter((s): s is { url: string; icon: typeof Linkedin; label: string } => !!s.url);

  const hasTitleInfo = !!(activeMode || currentLevel);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-xs">
        <div className="flex flex-col items-center text-center py-4">
          <div className="h-20 w-20 rounded-full bg-background border-4 border-background flex items-center justify-center font-serif text-2xl text-gold-gradient bg-[var(--gradient-card)] overflow-hidden ring-2 ring-primary/30">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(name)
            )}
          </div>
          <h3 className="font-serif text-xl mt-4">{name || t.profUnnamedOperator}</h3>
          {hasTitleInfo && (
            <p className="text-muted-foreground text-sm mt-1">
              {titleFor(activeMode ?? null, currentLevel ?? null)}
              {location ? ` · ${location}` : ""}
            </p>
          )}
          {(location || socialLinks.length > 0) && (
            <div className="flex items-center gap-3 mt-3 text-muted-foreground text-sm">
              {location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {location}
                </span>
              )}
              {socialLinks.map(({ url, icon: Icon, label }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="hover:text-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
