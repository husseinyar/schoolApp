"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Send, Users, Shield, UserCircle, Globe, Clock, CheckCircle, XCircle } from "lucide-react";

type Target = "ALL" | "ROLE" | "USER";

interface HistoryItem {
  id: string;
  title: string;
  body: string;
  targetType: Target;
  targetValue: string | null;
  successCount: number;
  failureCount: number;
  sentAt: string;
  sentBy: { name: string; email: string };
}

const ROLES = ["ADMIN", "DRIVER", "PARENT", "STUDENT"] as const;

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<Target>("ALL");
  const [roleTarget, setRoleTarget] = useState("DRIVER");
  const [userId, setUserId] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/notifications/history");
      const data = await res.json();
      setHistory(data.notifications ?? []);
      setHistoryLoaded(true);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const payload: Record<string, string> = { title, body, target };
      if (target === "ROLE") payload.roleTarget = roleTarget;
      if (target === "USER") payload.userId = userId;

      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({
          ok: true,
          message: `✓ Sent! ${data.successCount} delivered, ${data.failureCount} failed.`,
        });
        setTitle("");
        setBody("");
        if (historyLoaded) loadHistory();
      } else {
        setResult({ ok: false, message: data.error ?? "Unknown error" });
      }
    } catch {
      setResult({ ok: false, message: "Network error. Please try again." });
    } finally {
      setSending(false);
    }
  }

  function targetLabel(item: HistoryItem) {
    if (item.targetType === "ALL") return "All Users";
    if (item.targetType === "ROLE") return `Role: ${item.targetValue}`;
    return `User: ${item.targetValue?.slice(0, 8)}…`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30">
            <Bell className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Push Notifications</h1>
            <p className="text-slate-400 text-sm">Send real-time notifications via Firebase Cloud Messaging</p>
          </div>
        </div>

        {/* Send Form */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-400" /> Send Notification
          </h2>

          <form onSubmit={handleSend} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Route Update"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="e.g. Route A will be 10 minutes late today."
                required
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition resize-none"
              />
            </div>

            {/* Target Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Target Audience</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "ALL", label: "All Users", icon: Globe },
                  { value: "ROLE", label: "By Role", icon: Shield },
                  { value: "USER", label: "Specific User", icon: UserCircle },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTarget(value as Target)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition text-sm font-medium ${
                      target === value
                        ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
                        : "border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional: Role selector */}
            {target === "ROLE" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
                <select
                  value={roleTarget}
                  onChange={(e) => setRoleTarget(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Conditional: User ID input */}
            {target === "USER" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">User ID</label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Paste the user's ID"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            )}

            {/* Result */}
            {result && (
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                  result.ok
                    ? "bg-emerald-600/20 border border-emerald-500/40 text-emerald-300"
                    : "bg-red-600/20 border border-red-500/40 text-red-300"
                }`}
              >
                {result.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {result.message}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition flex items-center justify-center gap-2"
            >
              {sending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? "Sending…" : "Send Notification"}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" /> Sent History
            </h2>
            {!historyLoaded ? (
              <button
                onClick={loadHistory}
                disabled={loadingHistory}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition disabled:opacity-50"
              >
                {loadingHistory ? "Loading…" : "Load History"}
              </button>
            ) : (
              <button
                onClick={loadHistory}
                disabled={loadingHistory}
                className="text-sm text-slate-400 hover:text-slate-300 transition"
              >
                Refresh
              </button>
            )}
          </div>

          {!historyLoaded ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Click &quot;Load History&quot; to see past notifications
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No notifications sent yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 pr-4 text-slate-400 font-medium">Title</th>
                    <th className="text-left py-2 pr-4 text-slate-400 font-medium">Message</th>
                    <th className="text-left py-2 pr-4 text-slate-400 font-medium">Target</th>
                    <th className="text-right py-2 pr-4 text-slate-400 font-medium">✓</th>
                    <th className="text-right py-2 pr-4 text-slate-400 font-medium">✗</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition">
                      <td className="py-3 pr-4 text-white font-medium">{item.title}</td>
                      <td className="py-3 pr-4 text-slate-400 max-w-[200px] truncate">{item.body}</td>
                      <td className="py-3 pr-4">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                          {targetLabel(item)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right text-emerald-400 font-mono">{item.successCount}</td>
                      <td className="py-3 pr-4 text-right text-red-400 font-mono">{item.failureCount}</td>
                      <td className="py-3 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(item.sentAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
