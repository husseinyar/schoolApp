"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList, Loader2, PlayCircle, CheckCircle2, XCircle, Clock, AlertTriangle, GraduationCap
} from "lucide-react";

interface AttendanceRecord {
  id: string;
  status: "BOARDED" | "ABSENT" | "LATE";
  note: string | null;
  student: { id: string; name: string; studentCode: string; grade: number; photoURL: string | null };
}

interface Trip {
  id: string; status: string; startedAt: string;
}

const STATUS_CONFIG = {
  BOARDED: { label: "Boarded", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-600/20 border-emerald-500/30" },
  ABSENT:  { label: "Absent",  icon: XCircle,      color: "text-rose-400",    bg: "bg-rose-600/20 border-rose-500/30" },
  LATE:    { label: "Late",    icon: Clock,         color: "text-amber-400",   bg: "bg-amber-600/20 border-amber-500/30" },
};

export default function AttendancePage() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  async function loadTrip() {
    const dashRes = await fetch("/api/driver/dashboard");
    const dashData = await dashRes.json();
    const t = dashData.todayTrip;
    setTrip(t);

    if (t) {
      const attRes = await fetch(`/api/driver/attendance?tripLogId=${t.id}`);
      const attData = await attRes.json();
      setRecords(attData.attendances ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { loadTrip(); }, []);

  async function startTrip() {
    setStarting(true);
    await fetch("/api/driver/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    await loadTrip();
    setStarting(false);
  }

  async function setAttendance(studentId: string, status: "BOARDED" | "ABSENT" | "LATE") {
    if (!trip) return;
    setRecords((prev) => prev.map((r) => r.student.id === studentId ? { ...r, status } : r));
    await fetch("/api/driver/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripLogId: trip.id, studentId, status }),
    });
  }

  const counts = records.reduce((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-600/20 border border-cyan-500/30">
            <ClipboardList className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Attendance</h1>
            <p className="text-slate-400 text-sm">Mark student boarding status for today's trip</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : !trip ? (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-8 text-center">
            <PlayCircle className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">No active trip</p>
            <p className="text-slate-400 text-sm mb-4">Start today's trip from the dashboard to record attendance.</p>
            <button
              onClick={startTrip}
              disabled={starting}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-sm transition flex items-center gap-2 mx-auto"
            >
              {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              Start Trip & Begin Attendance
            </button>
          </div>
        ) : (
          <>
            {/* Trip summary */}
            <div className={`rounded-xl px-4 py-3 border flex items-center gap-3 ${
              trip.status === "ONGOING"
                ? "bg-emerald-900/20 border-emerald-500/30"
                : "bg-slate-800/50 border-slate-700"
            }`}>
              <span className={`text-xs font-medium flex items-center gap-1.5 ${trip.status === "ONGOING" ? "text-emerald-400" : "text-slate-400"}`}>
                {trip.status === "ONGOING" && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                Trip {trip.status === "ONGOING" ? "IN PROGRESS" : "COMPLETED"}
              </span>
              <span className="text-slate-600 text-xs ml-auto">
                Started {new Date(trip.startedAt).toLocaleTimeString("en-SE", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {/* Summary pills */}
            {records.length > 0 && (
              <div className="flex gap-3">
                {(["BOARDED", "ABSENT", "LATE"] as const).map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  const Icon = cfg.icon;
                  return (
                    <div key={s} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium ${cfg.bg} ${cfg.color}`}>
                      <Icon className="w-4 h-4" /> {counts[s] ?? 0} {cfg.label}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Attendance list */}
            {records.length === 0 ? (
              <div className="text-slate-500 text-center py-8">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No students on this route yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((rec) => {
                  const cfg = STATUS_CONFIG[rec.status];
                  return (
                    <div key={rec.id} className={`bg-slate-900/60 border rounded-2xl px-4 py-4 flex items-center gap-4 transition ${
                      rec.status === "BOARDED" ? "border-emerald-500/20" : rec.status === "ABSENT" ? "border-rose-500/20" : "border-amber-500/20"
                    }`}>
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                        {rec.student.photoURL
                          ? <img src={rec.student.photoURL} alt={rec.student.name} className="w-10 h-10 rounded-full object-cover" />
                          : <GraduationCap className="w-5 h-5 text-slate-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm">{rec.student.name}</p>
                        <p className="text-slate-500 text-xs">{rec.student.studentCode} · Grade {rec.student.grade}</p>
                      </div>
                      {/* Status buttons — only editable when trip is ONGOING */}
                      <div className="flex gap-1.5">
                        {(["BOARDED", "ABSENT", "LATE"] as const).map((s) => {
                          const c = STATUS_CONFIG[s];
                          const Icon = c.icon;
                          const active = rec.status === s;
                          return (
                            <button
                              key={s}
                              onClick={() => trip.status === "ONGOING" && setAttendance(rec.student.id, s)}
                              disabled={trip.status !== "ONGOING"}
                              title={c.label}
                              className={`p-2 rounded-xl border transition ${
                                active ? `${c.bg} ${c.color}` : "border-slate-700 text-slate-600 hover:text-slate-400"
                              } disabled:cursor-not-allowed`}
                            >
                              <Icon className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
