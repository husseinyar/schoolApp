"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2, AlertCircle, Globe, Shield, UserCircle, RefreshCw } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  body: string;
  targetType: "ALL" | "ROLE" | "USER";
  targetValue: string | null;
  sentAt: string;
  sentBy: { name: string };
}

const TARGET_ICONS = {
  ALL: Globe,
  ROLE: Shield,
  USER: UserCircle,
};

const TARGET_LABELS: Record<string, string> = {
  ALL: "All Users",
  ROLE: "Parents",
  USER: "You",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ParentNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  function load() {
    setLoading(true);
    fetch("/api/parent/notifications")
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => setError("Failed to load notifications."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30">
              <Bell className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Notifications</h1>
              <p className="text-slate-400 text-sm">
                {total > 0 ? `${total} message${total !== 1 ? "s" : ""}` : "Your inbox"}
              </p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-40 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No notifications yet.</p>
            <p className="text-xs mt-1">You'll see messages from the school here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const Icon = TARGET_ICONS[notif.targetType];
              return (
                <div
                  key={notif.id}
                  className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-2xl p-5 shadow-xl hover:border-indigo-500/30 transition group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-white font-semibold text-sm leading-tight">{notif.title}</h3>
                        <span className="text-slate-500 text-xs flex-shrink-0 mt-0.5">
                          {timeAgo(notif.sentAt)}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mt-1 leading-relaxed">{notif.body}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-600/15 text-indigo-400 border border-indigo-500/20">
                          {TARGET_LABELS[notif.targetType] ?? notif.targetType}
                        </span>
                        <span className="text-slate-600 text-xs">from {notif.sentBy.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
