import type { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { AmbientBackdrop } from "./AmbientBackdrop";
import { ParticleLayer } from "./ParticleLayer";
import { MobileBottomNav } from "./MobileBottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
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
    </div>
  );
}
