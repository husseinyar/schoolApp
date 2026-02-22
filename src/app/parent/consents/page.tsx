"use client";

import { useEffect, useState } from "react";
import { Shield, Loader2, AlertCircle, CheckCircle2, XCircle, Save } from "lucide-react";

const CONSENT_TYPES = [
  {
    type: "DATA_PROCESSING",
    label: "Data Processing",
    description: "Allow us to process and store your child's personal data for school bus operations.",
  },
  {
    type: "LOCATION_TRACKING",
    label: "Location Tracking",
    description: "Allow real-time GPS tracking of the bus route so you can see where your child is.",
  },
  {
    type: "PHOTO",
    label: "Photo Usage",
    description: "Allow photos of your child to be stored for identification and safety purposes.",
  },
  {
    type: "MEDICAL_INFO",
    label: "Medical Information",
    description: "Allow storage of relevant medical information to ensure driver awareness in emergencies.",
  },
] as const;

type ConsentType = (typeof CONSENT_TYPES)[number]["type"];

interface ConsentRecord {
  type: ConsentType;
  granted: boolean;
  grantedAt: string;
  version: string;
}

export default function ConsentsPage() {
  const [consents, setConsents] = useState<Partial<Record<ConsentType, ConsentRecord>>>({});
  const [toggles, setToggles] = useState<Partial<Record<ConsentType, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/consent")
      .then((r) => r.json())
      .then((d) => {
        const map: Partial<Record<ConsentType, ConsentRecord>> = {};
        const tog: Partial<Record<ConsentType, boolean>> = {};
        // Most recent first — de-dupe by type
        for (const c of (d.consents ?? []) as ConsentRecord[]) {
          if (!map[c.type]) {
            map[c.type] = c;
            tog[c.type] = c.granted;
          }
        }
        setConsents(map);
        setToggles(tog);
      })
      .catch(() => setError("Failed to load consent data."))
      .finally(() => setLoading(false));
  }, []);

  function toggle(type: ConsentType) {
    setToggles((prev) => ({ ...prev, [type]: !prev[type] }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = CONSENT_TYPES.map(({ type }) => ({
        type,
        granted: toggles[type] ?? false,
      }));
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consents: payload, userAgent: navigator.userAgent }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
    } catch {
      setError("Failed to save consents. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading consents…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Privacy & Consents</h1>
            <p className="text-slate-400 text-sm">Manage your GDPR data processing preferences</p>
          </div>
        </div>

        {/* Consent Cards */}
        <div className="space-y-4">
          {CONSENT_TYPES.map(({ type, label, description }) => {
            const record = consents[type];
            const isGranted = toggles[type] ?? false;
            return (
              <div
                key={type}
                className={`bg-slate-900/60 backdrop-blur border rounded-2xl p-5 shadow-xl transition-all ${
                  isGranted ? "border-indigo-500/40" : "border-slate-700/50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      {isGranted
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        : <XCircle className="w-4 h-4 text-slate-500" />}
                      {label}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">{description}</p>
                    {record && (
                      <p className="text-slate-600 text-xs mt-2">
                        Last updated: {new Date(record.grantedAt).toLocaleDateString("en-SE")} · v{record.version}
                      </p>
                    )}
                  </div>

                  {/* Toggle switch */}
                  <button
                    onClick={() => toggle(type)}
                    className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                      isGranted ? "bg-indigo-600" : "bg-slate-700"
                    }`}
                    aria-checked={isGranted}
                    role="switch"
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        isGranted ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-600/20 border border-red-500/40 text-red-300 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Saved */}
        {saved && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-sm">
            <CheckCircle2 className="w-4 h-4" /> Preferences saved successfully.
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving…" : "Save Preferences"}
        </button>

        <p className="text-center text-xs text-slate-600">
          You can change your preferences at any time. Previously granted consents are stored for audit purposes.
        </p>
      </div>
    </div>
  );
}
