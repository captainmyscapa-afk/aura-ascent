import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { AmbientBackdrop } from "./AmbientBackdrop";
import { useIndustry } from "@/lib/industry/IndustryProvider";

export function AppShell({ children }: { children: ReactNode }) {
  const { industryId } = useIndustry();
  return (
    <div className="min-h-screen text-foreground">
      <AmbientBackdrop />
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar />
        <main key={industryId} className="px-5 sm:px-8 lg:px-12 pb-24 pt-6 animate-fade-up">
          {children}
        </main>
      </div>
    </div>
  );
}
