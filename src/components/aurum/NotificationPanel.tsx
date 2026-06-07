import { useState, useEffect, useRef } from "react";
import { Bell, GraduationCap, Radio, Sparkles, Info, Flame, X, CheckCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type NotifType = "streak" | "academy" | "intelligence" | "mentor" | "system" | "milestone";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string | null;
  url: string | null;
  read: boolean;
  created_at: string;
}

const TYPE_ICON: Record<NotifType, React.ElementType> = {
  streak: Flame,
  academy: GraduationCap,
  intelligence: Radio,
  mentor: Sparkles,
  system: Info,
  milestone: Flame,
};

const TYPE_COLOR: Record<NotifType, string> = {
  streak: "text-orange-400",
  academy: "text-primary",
  intelligence: "text-blue-400",
  mentor: "text-primary",
  system: "text-muted-foreground",
  milestone: "text-primary",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationPanel() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    ;(supabase as any)
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }: { data: Notification[] | null }) => {
        if (data) setNotifications(data);
      });
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications:" + user.id)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!unreadIds.length) return;
    await (supabase as any)
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    await (supabase as any).from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell trigger */}
      <button
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        style={{ WebkitTapHighlightColor: "transparent" }}
        className="relative h-9 w-9 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-11 w-80 max-h-[480px] flex flex-col glass-strong rounded-2xl shadow-[var(--shadow-elegant)] border border-border/60 overflow-hidden z-50"
          style={{ animation: "fade-up 0.18s ease both" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
            <span className="text-[11px] tracking-[0.28em] text-muted-foreground">NOTIFICATIONS</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Bell className="h-8 w-8 mb-3 opacity-30" />
                <p className="text-[13px]">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Info;
                const color = TYPE_COLOR[n.type] ?? "text-muted-foreground";
                const inner = (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-secondary/30 ${
                      !n.read ? "bg-secondary/10" : ""
                    }`}
                  >
                    <span className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 bg-secondary/50 ${color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[13px] leading-snug ${!n.read ? "text-foreground font-medium" : "text-foreground/80"}`}>
                        {n.title}
                      </div>
                      {n.body && (
                        <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                          {n.body}
                        </div>
                      )}
                      <div className="text-[10px] text-muted-foreground/60 mt-1">
                        {timeAgo(n.created_at)}
                      </div>
                    </div>
                    {!n.read && (
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                );
                return n.url ? (
                  <Link key={n.id} to={n.url as any} onClick={() => { markRead(n.id); setOpen(false); }}>
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
