import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

// Read-only "who is this" card for another community member, opened by
// clicking a name in Network or Calendar. Deliberately shows only what's
// already public (public_profiles exposes just full_name + photo_url by
// design — everything else on Identity, bio, location, socials, the Aurum
// Score breakdown, is private to each user). Clicking your OWN name instead
// routes to the real /profile page, which is the actual Identity view.
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

export function UserCardDialog({
  open,
  onClose,
  name,
  photoUrl,
}: {
  open: boolean;
  onClose: () => void;
  name: string | null;
  photoUrl: string | null;
}) {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xs">
        <div className="flex flex-col items-center text-center py-4">
          <div className="h-20 w-20 rounded-full bg-background border-4 border-background flex items-center justify-center font-serif text-2xl text-gold-gradient bg-[var(--gradient-card)] overflow-hidden ring-2 ring-primary/30">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(name)
            )}
          </div>
          <h3 className="font-serif text-xl mt-4">{name || t.comMember}</h3>
          <span className="text-[10px] tracking-[0.3em] px-3 py-1 mt-2 rounded-full ring-1 ring-primary/40 text-primary uppercase">
            {t.comMember}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
