"use client";

import { useEffect, useState } from "react";
import { MapPin, Clock, Bus, Users, Loader2, CheckCircle2, Circle, School } from "lucide-react";

interface Stop {
  id: string; name: string; address: string; scheduledTime: string; orderIndex: number;
}
interface Student { id: string; name: string; studentCode: string; grade: number; }
interface Route {
  id: string; name: string; startTime: string; endTime: string; capacity: number; currentStudents: number; status: string;
  monday: boolean; tuesday: boolean; wednesday: boolean; thursday: boolean; friday: boolean;
  school: { name: string; addressStreet: string; addressCity: string };
  stops: Stop[];
  students: Student[];
  _count: { students: number };
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function MyRoutePage() {
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/driver/route-detail")
      .then((r) => r.json())
      .then((d) => { if (d.route) setRoute(d.route); else setError("No route assigned."); })
      .catch(() => setError("Failed to load route."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…</div>;
  if (error || !route) return <div className="p-4 text-amber-300 bg-amber-900/20 border border-amber-500/30 rounded-xl m-6">{error ?? "No route assigned."}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-600/20 border border-cyan-500/30">
            <Bus className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{route.name}</h1>
            <p className="text-slate-400 text-sm">{route.school.name}</p>
          </div>
        </div>

        {/* Route Info Card */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl grid grid-cols-2 gap-4">
          <div><p className="text-slate-500 text-xs mb-1">Departure</p><p className="text-white font-semibold">{route.startTime}</p></div>
          <div><p className="text-slate-500 text-xs mb-1">Arrive By</p><p className="text-white font-semibold">{route.endTime}</p></div>
          <div><p className="text-slate-500 text-xs mb-1">Capacity</p><p className="text-white font-semibold">{route._count.students} / {route.capacity} students</p></div>
          <div><p className="text-slate-500 text-xs mb-1">Status</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">{route.status}</span>
          </div>
        </div>

        {/* Schedule Days */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
          <h2 className="text-sm font-semibold text-white mb-3">Weekly Schedule</h2>
          <div className="flex gap-2">
            {DAYS.map((d, i) => (
              <span key={d} className={`flex-1 text-center py-2 text-xs rounded-xl font-medium border ${
                route[d] ? "bg-cyan-600/20 text-cyan-300 border-cyan-500/30" : "bg-slate-800/50 text-slate-600 border-slate-700"
              }`}>
                {DAY_LABELS[i]}
              </span>
            ))}
          </div>
        </div>

        {/* Stops Timeline */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" /> Stops ({route.stops.length})
          </h2>
          {route.stops.map((stop, idx) => {
            const isLast = idx === route.stops.length - 1;
            return (
              <div key={stop.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-cyan-500 border-2 border-cyan-400 mt-0.5 flex-shrink-0" />
                  {!isLast && <div className="w-0.5 bg-slate-700 flex-1 my-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-white text-sm font-medium">{stop.name}</p>
                  <p className="text-slate-500 text-xs">{stop.address}</p>
                  <p className="text-cyan-400 text-xs flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {stop.scheduledTime}
                  </p>
                </div>
              </div>
            );
          })}
          {/* School destination */}
          <div className="flex gap-3">
            <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-emerald-300 text-sm font-medium">{route.school.name}</p>
              <p className="text-slate-500 text-xs">{route.school.addressCity} — Destination</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
