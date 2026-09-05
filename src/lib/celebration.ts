import { useCallback, useEffect, useState, type ComponentType } from "react";

export type CelebrationPayload = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
};

// Deliberately not a React Context: any page can fire a celebration with a
// plain import, no provider wiring, no re-render of the whole tree on every
// mount. CelebrationOverlay (mounted once in AppShell) is the only listener.
let listeners: Array<(payload: CelebrationPayload) => void> = [];

export function celebrate(payload: CelebrationPayload) {
  listeners.forEach((l) => l(payload));
}

/** Internal — used by CelebrationOverlay only. */
export function useCelebrationFeed(): { active: CelebrationPayload | null; dismiss: () => void } {
  const [active, setActive] = useState<CelebrationPayload | null>(null);

  const onCelebrate = useCallback((payload: CelebrationPayload) => {
    setActive(payload);
  }, []);

  useEffect(() => {
    listeners.push(onCelebrate);
    return () => {
      listeners = listeners.filter((l) => l !== onCelebrate);
    };
  }, [onCelebrate]);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setActive(null), 4500);
    return () => clearTimeout(timer);
  }, [active]);

  const dismiss = useCallback(() => setActive(null), []);

  return { active, dismiss };
}
