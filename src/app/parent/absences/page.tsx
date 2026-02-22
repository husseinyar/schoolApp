"use client";

import { useEffect, useState } from "react";
import {
  CalendarX, Loader2, AlertCircle, Trash2, Plus, ChevronDown, CheckCircle2
} from "lucide-react";

interface Student { id: string; name: string; studentCode: string; }
interface Absence {
  id: string;
  date: string;
  reason: string | null;
  note: string | null;
  student: { name: string; studentCode: string };
}

const REASONS = [
  "Sick", "Doctor appointment", "Family emergency", "Holiday", "Other"
];

export default function AbsencesPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    fetch("/api/parent/children")
      .then((r) => r.json())
      .then((d) => {
        setStudents(d.students ?? []);
        if (d.students?.length > 0) setStudentId(d.students[0].id);
      });
    loadAbsences();
  }, []);

  function loadAbsences() {
    setLoading(true);
    fetch("/api/parent/absences")
      .then((r) => r.json())
      .then((d) => setAbsences(d.absences ?? []))
      .finally(() => setLoading(false));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/parent/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, date, reason: reason || undefined, note: note || undefined }),
      });
      if (!res.ok) throw new Error("Failed to report absence");
      setSuccess(true);
      setNote("");
      setReason("");
      loadAbsences();
    } catch {
      setError("Could not report absence. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Cancel this absence report?")) return;
    await fetch(`/api/parent/absences?id=${id}`, { method: "DELETE" });
    setAbsences((prev) => prev.filter((a) => a.id !== id));
  }

  const upcoming = absences.filter((a) => new Date(a.date) >= new Date());
  const past = absences.filter((a) => new Date(a.date) < new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-600/20 border border-rose-500/30">
            <CalendarX className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Report an Absence</h1>
            <p className="text-slate-400 text-sm">Let the school know your child won't be on the bus</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-2xl p-6 shadow-xl space-y-4">
          {/* Student */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Child</label>
            <div className="relative">
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm appearance-none focus:outline-none focus:border-rose-500/60"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.studentCode})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Date of Absence</label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500/60"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Reason</label>
            <div className="relative">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm appearance-none focus:outline-none focus:border-rose-500/60"
              >
                <option value="">Select a reason (optional)</option>
                {REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Additional Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Optional note for the driver…"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-rose-500/60 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-emerald-300 text-sm">
              <CheckCircle2 className="w-4 h-4" /> Absence reported successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !studentId}
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {submitting ? "Reporting…" : "Report Absence"}
          </button>
        </form>

        {/* Upcoming Absences */}
        {(loading || upcoming.length > 0) && (
          <div>
            <h2 className="text-base font-semibold text-white mb-3">Upcoming Absences</h2>
            {loading ? (
              <div className="text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Loading…</div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <div key={a.id} className="bg-slate-900/60 border border-rose-500/20 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-white font-medium">{a.student.name}</p>
                      <p className="text-slate-400 text-sm">{new Date(a.date).toLocaleDateString("en-SE", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}</p>
                      {a.reason && <p className="text-rose-400 text-xs mt-0.5">{a.reason}</p>}
                      {a.note && <p className="text-slate-500 text-xs">{a.note}</p>}
                    </div>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition"
                      title="Cancel absence"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Past Absences */}
        {past.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-slate-500 mb-3">Past Absences</h2>
            <div className="space-y-2">
              {past.slice(0, 5).map((a) => (
                <div key={a.id} className="bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
                  <CalendarX className="w-4 h-4 text-slate-600" />
                  <div>
                    <span className="text-slate-400 text-sm">{a.student.name}</span>
                    <span className="text-slate-600 text-xs ml-2">{new Date(a.date).toLocaleDateString("en-SE")}</span>
                    {a.reason && <span className="text-slate-600 text-xs ml-2">· {a.reason}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
