"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bus, Users, CalendarX, CheckCircle2, Clock, Loader2,
  PlayCircle, StopCircle, MapPin, AlertTriangle, TrendingUp
} from "lucide-react";

interface Stop { id: string; name: string; scheduledTime: string; orderIndex: number; }
interface Route {
  id: string; name: string; startTime: string; endTime: string; status: string;
  school: { name: string };
  stops: Stop[];
  _count: { students: number };
}
interface TripLog {
  id: string; date: string; status: string; startedAt: string; completedAt: string | null;
  _count: { attendances: number };
  route: { name: string };
}
interface DashboardData {
  route: Route | null;
  todayTrip: TripLog | null;
  recentTrips: TripLog[];
  absentToday: number;
  studentCount: number;
}

export default function DriverHomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);

  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<number>(0);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/driver/dashboard");
      const d = await res.json();
      setData(d);
      setIsOffline(false);
    } catch (err) {
      setIsOffline(true);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Location tracking effect with throttling and error handling
  useEffect(() => {
    if (!data?.todayTrip || data.todayTrip.status !== "ONGOING") {
      setGpsError(null);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        setGpsError(null);
        const { latitude, longitude } = pos.coords;
        const now = Date.now();

        // Throttle updates (5 seconds)
        if (now - lastSentTime < 5000) {
          console.log("[TRACE-UI] Skipping location update (throttled)");
          return;
        }

        try {
          const res = await fetch("/api/driver/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tripId: data.todayTrip?.id,
              latitude,
              longitude,
            }),
          });
          
          if (!res.ok) {
            const err = await res.json();
            console.error("Location reporting rejected:", err);
          } else {
            setLastSentTime(now);
            setIsOffline(false);
          }
        } catch (err) {
          console.error("Failed to send location - network likely offline", err);
          setIsOffline(true);
        }
      },
      (err) => {
        let msg = "GPS error";
        if (err.code === 1) msg = "Please enable Location permissions.";
        else if (err.code === 2) msg = "GPS position unavailable.";
        else if (err.code === 3) msg = "GPS timeout.";
        setGpsError(msg);
        console.error("Geolocation error", err);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [data?.todayTrip?.id, data?.todayTrip?.status, lastSentTime]);

  async function startTrip() {
    setStarting(true);
    await fetch("/api/driver/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    await load();
    setStarting(false);
  }

  async function completeTrip() {
    if (!data?.todayTrip) return;
    setCompleting(true);
    await fetch(`/api/driver/trips/${data.todayTrip.id}/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    await load();
    setCompleting(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
    </div>
  );

  const { route, todayTrip, recentTrips, absentToday, studentCount } = data!;
  const presentToday = studentCount - absentToday;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Status Banners */}
        <div className="space-y-3">
          {gpsError && (
            <div className="bg-rose-900/40 border border-rose-500/50 rounded-xl p-4 flex items-center gap-3 text-rose-200 animate-pulse">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold">GPS Error</p>
                <p className="opacity-80">{gpsError}</p>
              </div>
            </div>
          )}
          {isOffline && (
            <div className="bg-slate-900/80 border border-slate-600 rounded-xl p-4 flex items-center gap-3 text-slate-300">
              <Loader2 className="w-5 h-5 animate-spin shrink-0 text-slate-500" />
              <div className="text-sm">
                <p className="font-semibold">Network Offline</p>
                <p className="opacity-80">Check your internet connection. Retrying updates...</p>
              </div>
            </div>
          )}
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Driver Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            {new Date().toLocaleDateString("en-SE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Trip Action Banner */}
        {route && (
          <div className={`rounded-2xl p-5 border shadow-xl flex items-center justify-between gap-4 ${
            todayTrip
              ? todayTrip.status === "ONGOING"
                ? "bg-emerald-900/30 border-emerald-500/40"
                : "bg-slate-800/50 border-slate-700"
              : "bg-cyan-900/20 border-cyan-500/30"
          }`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                {todayTrip ? (
                  todayTrip.status === "ONGOING"
                    ? <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> TRIP IN PROGRESS</span>
                    : <span className="text-xs text-slate-400 font-medium">TRIP COMPLETED</span>
                ) : (
                  <span className="text-xs text-cyan-400 font-medium">READY TO START</span>
                )}
              </div>
              <p className="text-white font-semibold">{route.name}</p>
              <p className="text-slate-400 text-sm">{route.startTime} – {route.endTime} · {route.school.name}</p>
            </div>
            {!todayTrip ? (
              <button
                onClick={startTrip}
                disabled={starting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-sm transition"
              >
                {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                Start Trip
              </button>
            ) : todayTrip.status === "ONGOING" ? (
              <button
                onClick={completeTrip}
                disabled={completing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm transition"
              >
                {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <StopCircle className="w-4 h-4" />}
                Complete Trip
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-sm text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Done for today
              </span>
            )}
          </div>
        )}

        {!route && (
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-5 flex items-center gap-3 text-amber-300">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm">No route assigned to you yet. Please contact the administrator.</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Students", value: studentCount, icon: Users, color: "text-cyan-400", bg: "from-cyan-600/20 to-cyan-800/10 border-cyan-500/30", href: "/driver/students" },
            { label: "Present Today", value: presentToday, icon: CheckCircle2, color: "text-emerald-400", bg: "from-emerald-600/20 to-emerald-800/10 border-emerald-500/30", href: "/driver/attendance" },
            { label: "Absent Today", value: absentToday, icon: CalendarX, color: "text-rose-400", bg: "from-rose-600/20 to-rose-800/10 border-rose-500/30", href: "/driver/absences" },
            { label: "Stops", value: route?.stops.length ?? 0, icon: MapPin, color: "text-indigo-400", bg: "from-indigo-600/20 to-indigo-800/10 border-indigo-500/30", href: "/driver/route" },
          ].map(({ label, value, icon: Icon, color, bg, href }) => (
            <Link key={label} href={href} className={`bg-gradient-to-br ${bg} border rounded-2xl p-4 shadow-xl hover:scale-[1.02] transition-transform`}>
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{label}</div>
            </Link>
          ))}
        </div>

        {/* Route Stops Preview */}
        {route && route.stops.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" /> Today's Stops
              </h2>
              <Link href="/driver/route" className="text-xs text-cyan-400 hover:text-cyan-300 transition">View full route →</Link>
            </div>
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 space-y-0">
              {route.stops.slice(0, 5).map((stop, idx) => (
                <div key={stop.id} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 border-2 border-cyan-400 mt-0.5 flex-shrink-0" />
                    {idx < Math.min(route.stops.length, 5) - 1 && <div className="w-0.5 bg-slate-700 flex-1 my-1 h-5" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-white text-sm font-medium">{stop.name}</p>
                    <p className="text-cyan-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{stop.scheduledTime}</p>
                  </div>
                </div>
              ))}
              {route.stops.length > 5 && (
                <p className="text-slate-600 text-xs pl-6">+{route.stops.length - 5} more stops</p>
              )}
            </div>
          </div>
        )}

        {/* Recent Trips */}
        {recentTrips.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Recent Trips
            </h2>
            <div className="space-y-2">
              {recentTrips.map((t) => (
                <div key={t.id} className="bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm font-medium">{new Date(t.date).toLocaleDateString("en-SE", { weekday: "short", month: "short", day: "numeric" })}</p>
                    <p className="text-slate-500 text-xs">{t._count.attendances} students recorded</p>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                    t.status === "COMPLETED" ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/30"
                    : t.status === "ONGOING" ? "bg-amber-600/20 text-amber-300 border-amber-500/30"
                    : "bg-slate-700 text-slate-400 border-slate-600"
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
