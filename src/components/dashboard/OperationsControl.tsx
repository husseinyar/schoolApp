"use client";

import { useState } from "react";
import { ClipboardList, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export function OperationsControl() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const generateTrips = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const res = await fetch("/api/admin/trips/generate", { method: "POST" });
            const data = await res.json();
            
            if (data.success) {
                setStatus({ 
                    type: "success", 
                    message: data.message 
                });
                // Refresh the page to show updated stats
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                setStatus({ type: "error", message: data.error || "Failed to generate trips" });
            }
        } catch (err) {
            setStatus({ type: "error", message: "Connection error. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-400" /> Operational Controls
            </h2>
            <p className="text-slate-400 text-xs mb-4">
                Initialize daily trip logs for all scheduled routes today.
            </p>
            
            <button
                onClick={generateTrips}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
                {loading ? "Generating..." : "Generate Today's Trips"}
            </button>

            {status && (
                <div className={`mt-3 flex items-center gap-2 text-xs p-2 rounded-lg border ${
                    status.type === "success" 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}>
                    {status.type === "success" ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {status.message}
                </div>
            )}
        </div>
    );
}
