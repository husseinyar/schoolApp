"use client";

import { useEffect, useState } from "react";
import { CalendarX, Loader2, GraduationCap, Phone, Mail, RefreshCw, AlertCircle } from "lucide-react";

interface AbsenceRecord {
  id: string;
  date: string;
  reason: string | null;
  note: string | null;
  student: { id: string; name: string; studentCode: string; grade: number; photoURL: string | null };
  reportedBy: { name: string; email: string };
}

export default function DriverAbsencesPage() {
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  function load(d: string) {
    setLoading(true);
    fetch(`/api/driver/absences?date=${d}`)
      .then((r) => r.json())
      .then((data) => setAbsences(data.absences ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(date); }, [date]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-600/20 border border-rose-500/30">
              <CalendarX className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Absence Reports</h1>
              <p className="text-slate-400 text-sm">Students reported absent by their parents</p>
            </div>
          </div>
          <button onClick={() => load(date)} disabled={loading} className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500/60"
          />
          <button
            onClick={() => setDate(new Date().toISOString().split("T")[0])}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition"
          >
            Today
          </button>
        </div>

        {loading ? (
          <div className="flex items-center text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : absences.length === 0 ? (
          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-8 text-center">
            <AlertCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-emerald-300 font-semibold">All students expected today</p>
            <p className="text-slate-500 text-sm mt-1">No absences reported for {new Date(date + "T12:00:00").toLocaleDateString("en-SE", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/10 border border-rose-500/20 text-rose-300 text-sm">
              <CalendarX className="w-4 h-4" />
              <strong>{absences.length}</strong> student{absences.length !== 1 ? "s" : ""} absent on {new Date(date + "T12:00:00").toLocaleDateString("en-SE", { weekday: "long", month: "short", day: "numeric" })}
            </div>

            <div className="space-y-3">
              {absences.map((a) => (
                <div key={a.id} className="bg-slate-900/60 border border-rose-500/20 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                      {a.student.photoURL
                        ? <img src={a.student.photoURL} alt={a.student.name} className="w-10 h-10 rounded-full object-cover" />
                        : <GraduationCap className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{a.student.name}</p>
                      <p className="text-slate-500 text-xs">{a.student.studentCode} · Grade {a.student.grade}</p>
                    </div>
                    {a.reason && (
                      <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-rose-600/20 text-rose-300 border border-rose-500/30">
                        {a.reason}
                      </span>
                    )}
                  </div>
                  {a.note && (
                    <p className="text-slate-400 text-sm bg-slate-800/50 rounded-xl px-3 py-2 mb-3 border border-slate-700">
                      "{a.note}"
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Reported by: <span className="text-slate-400">{a.reportedBy.name}</span></span>
                    <a href={`mailto:${a.reportedBy.email}`} className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition">
                      <Mail className="w-3 h-3" /> Contact
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
