import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-foreground">
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar />
        <main className="px-5 sm:px-8 lg:px-12 pb-24 pt-6">{children}</main>
      </div>
    </div>
  );
}
