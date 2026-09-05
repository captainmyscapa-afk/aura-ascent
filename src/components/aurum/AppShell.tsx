import type { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { AmbientBackdrop } from "./AmbientBackdrop";
import { ParticleLayer } from "./ParticleLayer";
import { MobileBottomNav } from "./MobileBottomNav";
import { PageIntro } from "./PageIntro";
import { PAGE_INTROS } from "./PageIntroConfig";
import { CelebrationOverlay } from "./CelebrationOverlay";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const intro = PAGE_INTROS[pathname];
  return (
    <div className="min-h-screen text-foreground">
      <AmbientBackdrop />
      <ParticleLayer />
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar />
        {/* key={pathname} forces remount on navigation, re-triggering the animation */}
        <main
          key={pathname}
          className="px-4 sm:px-8 lg:px-12 pt-5 lg:pt-6 pb-28 lg:pb-24 animate-page-enter"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 7rem)" }}
        >
          {children}
        </main>
      </div>
      <MobileBottomNav />
      <CelebrationOverlay />
      {/* key={pathname} resets the overlay's local "entered" state on every
          navigation, so it re-shows on each visit unless permanently dismissed. */}
      {intro && (
        <PageIntro
          key={pathname}
          pageKey={intro.pageKey}
          icon={intro.icon}
          eyebrow={t.introEyebrow}
          title={intro.title(t)}
          description={intro.description(t)}
          features={intro.features(t)}
          enterLabel={t.introEnterCta}
          dontShowAgainLabel={t.introDontShowAgain}
        />
      )}
    </div>
  );
}
