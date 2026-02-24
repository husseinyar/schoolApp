"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap, Bell, Bus, Shield, Loader2, ChevronRight,
  CalendarX, Users, AlertTriangle, CheckCircle2, Clock, Navigation
} from "lucide-react";

interface RouteInfo {
  name: string;
  startTime: string;
  monday: boolean; tuesday: boolean; wednesday: boolean; thursday: boolean; friday: boolean;
  driver: { name: string };
  tripLogs: { status: string }[];
}

interface StudentSummary {
  id: string; name: string; status: string;
  route: RouteInfo | null;
}

interface NextAbsence {
  date: string;
  student: { name: string };
}

interface DashboardData {
  totalChildren: number;
  activeChildren: number;
  assignedRoutes: number;
  notificationCount: number;
  nextAbsence: NextAbsence | null;
  students: StudentSummary[];
}

const TODAY_INDEX = new Date().getDay(); // 0=Sun, 1=Mon … 5=Fri, 6=Sat
const DAY_KEYS = ["", "monday", "tuesday", "wednesday", "thursday", "friday", ""] as const;
const DAY_LABELS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", ""] as const;

function getTodayKey() {
  const k = DAY_KEYS[TODAY_INDEX];
  return k || null;
}

export default function ParentHomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/parent/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (!data) return null;

  const todayKey = getTodayKey();
  const isWeekend = !todayKey;

  const activeRoutes = data.students.filter(s => s.route?.tripLogs && s.route.tripLogs.length > 0);
  const isAnyBusLive = activeRoutes.length > 0;

  const statCards = [
    {
      label: "My Children",
      value: data.totalChildren,
      sub: `${data.activeChildren} active`,
      icon: GraduationCap,
      color: "from-indigo-600/20 to-indigo-800/10 border-indigo-500/30",
      iconColor: "text-indigo-400",
      href: "/parent/children",
    },
    {
      label: "Routes Assigned",
      value: data.assignedRoutes,
      sub: `of ${data.totalChildren} children`,
      icon: Bus,
      color: "from-blue-600/20 to-blue-800/10 border-blue-500/30",
      iconColor: "text-blue-400",
      href: "/parent/children",
    },
    {
      label: "Notifications",
      value: data.notificationCount,
      sub: "total messages",
      icon: Bell,
      color: "from-amber-600/20 to-amber-800/10 border-amber-500/30",
      iconColor: "text-amber-400",
      href: "/parent/notifications",
    },
    {
      label: "Absences Reported",
      value: data.nextAbsence ? "1 upcoming" : "None",
      sub: data.nextAbsence
        ? `${data.nextAbsence.student.name} · ${new Date(data.nextAbsence.date).toLocaleDateString("en-SE")}`
        : "All children scheduled",
      icon: CalendarX,
      color: "from-rose-600/20 to-rose-800/10 border-rose-500/30",
      iconColor: "text-rose-400",
      href: "/parent/absences",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Parent Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Welcome back — here's an overview of your children's bus status.</p>
        </div>

        {/* Weekend alert */}
        {isWeekend && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-400 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            No bus service today — it's the weekend.
          </div>
        )}

        {/* Live Trip Banner */}
        {isAnyBusLive && (
          <Link 
            href="/parent/map"
            className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 transition shadow-lg shadow-emerald-900/20"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Navigation className="w-6 h-6 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
              </div>
              <div>
                <p className="font-bold text-sm">Bus is LIVE</p>
                <p className="text-xs text-emerald-400/80">Track your child's bus in real-time on the map</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-400" />
          </Link>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, sub, icon: Icon, color, iconColor, href }) => (
            <Link
              key={label}
              href={href}
              className={`bg-gradient-to-br ${color} border rounded-2xl p-4 shadow-xl hover:scale-[1.02] transition-transform group`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${iconColor}`} />
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
              </div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{label}</div>
              <div className="text-xs text-slate-600 mt-1">{sub}</div>
            </Link>
          ))}
        </div>

        {/* Today's Bus Info */}
        <div>
          <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Today's Bus Schedule
          </h2>
          <div className="space-y-3">
            {data.students.map((student) => {
              const route = student.route;
              const runsToday = route && todayKey
                ? (route as unknown as Record<string, boolean>)[todayKey]
                : false;

              return (
                <div
                  key={student.id}
                  className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-white font-semibold">{student.name}</p>
                    {route ? (
                      <p className="text-slate-400 text-sm">
                        {route.name} · Departs {route.startTime} · Driver: {route.driver.name}
                      </p>
                    ) : (
                      <p className="text-slate-500 text-sm italic">No route assigned</p>
                    )}
                  </div>
                  {route ? (
                    isWeekend ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700 text-slate-400 border border-slate-600">Weekend</span>
                    ) : route.tripLogs.length > 0 ? (
                      <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold animate-pulse shadow-lg shadow-emerald-900/40">
                        <Navigation className="w-3 h-3" /> LIVE
                      </span>
                    ) : runsToday ? (
                      <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> On Today
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700 text-slate-400 border border-slate-600">Not Today</span>
                    )
                  ) : null}
                </div>
              );
            })}
            {data.students.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-6">No children found.</p>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/parent/map", label: "Live Bus Map", icon: Navigation, color: "text-indigo-400" },
              { href: "/parent/absences", label: "Report Absence", icon: CalendarX, color: "text-rose-400" },
              { href: "/parent/emergency-contacts", label: "Emergency Contacts", icon: Users, color: "text-emerald-400" },
              { href: "/parent/consents", label: "Manage Consents", icon: Shield, color: "text-blue-400" },
            ].map(({ href, label, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-2xl p-4 hover:border-indigo-500/40 transition group flex flex-col items-center text-center gap-2"
              >
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="text-slate-300 text-xs font-medium group-hover:text-white transition">{label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
