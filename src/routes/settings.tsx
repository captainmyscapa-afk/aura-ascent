import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/aurum/AppShell";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  return (
    <AppShell>
      <div className="max-w-2xl">
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">PREFERENCES</div>
        <h1 className="font-serif text-4xl">Tune your operating system</h1>
        <div className="mt-10 space-y-2">
          {[
            ["Daily ritual intensity", "Moderate · 5 tasks / day"],
            ["Intelligence feed cadence", "Every 2 hours"],
            ["Mentor tone", "Strategic · Calm · Direct"],
            ["Notification windows", "07:00–09:00 · 18:00–20:00"],
            ["Identity privacy", "Visible to Tier-1 only"],
          ].map(([l, v]) => (
            <div
              key={l}
              className="glass rounded-xl p-5 flex items-center justify-between hover:ring-gold transition-all cursor-pointer"
            >
              <div>
                <div className="text-sm">{l}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{v}</div>
              </div>
              <span className="text-xs text-muted-foreground">Edit</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
