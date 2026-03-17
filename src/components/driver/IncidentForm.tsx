"use client";

import { useState } from "react";
import { AlertTriangle, X, Loader2, CheckCircle2 } from "lucide-react";

interface IncidentFormProps {
  tripLogId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const INCIDENT_TYPES = [
  { id: "ACCIDENT", label: "Accident" },
  { id: "TRAFFIC", label: "Traffic / Roadwork" },
  { id: "VEHICLE_ISSUE", label: "Vehicle Issue" },
  { id: "MEDICAL", label: "Medical Emergency" },
  { id: "OTHER", label: "Other" },
];

const SEVERITIES = [
  { id: "LOW", label: "Low", color: "text-blue-400" },
  { id: "MEDIUM", label: "Medium", color: "text-amber-400" },
  { id: "HIGH", label: "High", color: "text-orange-400" },
  { id: "CRITICAL", label: "Critical", color: "text-rose-500 font-bold" },
];

export function IncidentForm({ tripLogId, onClose, onSuccess }: IncidentFormProps) {
  const [type, setType] = useState("TRAFFIC");
  const [severity, setSeverity] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/driver/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, severity, description, tripLogId }),
      });

      if (!res.ok) throw new Error("Failed to submit incident report");

      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error(err);
      setError("Could not submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="font-bold text-lg text-white">Report Incident</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <div>
              <p className="text-white font-bold text-xl">Report Submitted</p>
              <p className="text-slate-400 text-sm mt-1">Administrators have been notified.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Issue Type</label>
              <div className="grid grid-cols-2 gap-2">
                {INCIDENT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`px-3 py-2 rounded-xl border text-sm transition ${
                      type === t.id
                        ? "bg-rose-600/20 border-rose-500 text-rose-300"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Severity Level</label>
              <div className="flex bg-slate-800 p-1 rounded-xl">
                {SEVERITIES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSeverity(s.id)}
                    className={`flex-1 py-2 text-xs rounded-lg transition ${
                      severity === s.id ? "bg-slate-700 text-white shadow-lg" : "text-slate-500 hover:text-slate-400"
                    }`}
                  >
                    <span className={severity === s.id ? s.color : ""}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="What is happening? Provide brief details..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-rose-500 transition resize-none h-24"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Emergency Report"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
