import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { AmbientBackdrop } from "./AmbientBackdrop";
import { MobileBottomNav } from "./MobileBottomNav";
import { useIndustry } from "@/lib/industry/IndustryProvider";

export function AppShell({ children }: { children: ReactNode }) {
  const { industryId } = useIndustry();
  return (
    <div className="min-h-screen text-foreground">
      <AmbientBackdrop />
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar />
        <main
          className="px-4 sm:px-8 lg:px-12 pt-5 lg:pt-6 pb-28 lg:pb-24 animate-fade-up"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 7rem)" }}
        >
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
