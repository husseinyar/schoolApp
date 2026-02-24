import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardStats } from "@/lib/dashboard-service";
import Link from "next/link";
import {
  Users, Bus, School, UserCheck, Bell, CalendarX,
  ClipboardList, ChevronRight, Activity, MapPin, TrendingUp
} from "lucide-react";
import { OperationsControl } from "@/components/dashboard/OperationsControl";

const STATUS_COLOR: Record<string, string> = {
  IDLE:               "bg-slate-600/20 text-slate-400 border-slate-600/40",
  EN_ROUTE_TO_SCHOOL: "bg-cyan-600/20 text-cyan-300 border-cyan-500/30",
  AT_SCHOOL:          "bg-emerald-600/20 text-emerald-300 border-emerald-500/30",
  EN_ROUTE_FROM_SCHOOL:"bg-indigo-600/20 text-indigo-300 border-indigo-500/30",
  COMPLETED:          "bg-slate-700/40 text-slate-500 border-slate-700",
  DELAYED:            "bg-amber-600/20 text-amber-300 border-amber-500/30",
  EMERGENCY:          "bg-red-600/20 text-red-300 border-red-500/30",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const data = await getDashboardStats();
  const { counts, activeRoutes, recentActivity } = data;

  const isAdmin = session?.user?.role === "ADMIN";

  const statCards = [
    { label: "Active Students", value: counts.students,         icon: Users,         color: "text-indigo-400", bg: "from-indigo-600/20 to-indigo-900/10 border-indigo-500/30", href: "/admin/students" },
    { label: "Routes",          value: counts.routes,           icon: Bus,           color: "text-cyan-400",   bg: "from-cyan-600/20 to-cyan-900/10 border-cyan-500/30",       href: "/admin/routes"   },
    { label: "Schools",         value: counts.schools,          icon: School,        color: "text-emerald-400",bg: "from-emerald-600/20 to-emerald-900/10 border-emerald-500/30",href: "/admin/schools" },
    { label: "Total Users",     value: counts.users,            icon: UserCheck,     color: "text-violet-400", bg: "from-violet-600/20 to-violet-900/10 border-violet-500/30",  href: "/admin/users"    },
    { label: "Trips Today",     value: counts.tripsToday,       icon: ClipboardList, color: "text-blue-400",   bg: "from-blue-600/20 to-blue-900/10 border-blue-500/30",        href: "/admin/routes"   },
    { label: "Absent Today",    value: counts.absentToday,      icon: CalendarX,     color: "text-rose-400",   bg: "from-rose-600/20 to-rose-900/10 border-rose-500/30",        href: "/admin/students" },
    { label: "Notifications",   value: counts.notificationsSent,icon: Bell,          color: "text-amber-400",  bg: "from-amber-600/20 to-amber-900/10 border-amber-500/30",     href: "/admin/notifications"},
    { label: "Parents",         value: counts.parents,          icon: Users,         color: "text-teal-400",   bg: "from-teal-600/20 to-teal-900/10 border-teal-500/30",        href: "/admin/users"    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isAdmin ? "Admin Dashboard" : "Dashboard"}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Welcome back, <span className="text-white font-medium">{session?.user?.name}</span> ·{" "}
              {new Date().toLocaleDateString("en-SE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          {isAdmin && (
            <Link
              href="/admin/students/new"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
            >
              + Add Student
            </Link>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg, href }) => (
            <Link
              key={label}
              href={href}
              className={`bg-gradient-to-br ${bg} border rounded-2xl p-4 shadow-xl hover:scale-[1.02] transition-transform group`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-500 transition" />
              </div>
              <div className="text-3xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{label}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Active Routes */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Bus className="w-4 h-4 text-cyan-400" /> Active Routes
              </h2>
              <Link href="/admin/routes" className="text-xs text-cyan-400 hover:text-cyan-300 transition">View all →</Link>
            </div>
            {activeRoutes.length === 0 ? (
              <p className="text-slate-500 text-sm py-8 text-center">No routes yet.</p>
            ) : (
              activeRoutes.map((route) => (
                <div key={route.id} className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 hover:border-indigo-500/30 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-600/10 border border-cyan-500/20">
                      <Bus className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{route.name}</p>
                      <p className="text-slate-500 text-xs flex items-center gap-1"><Users className="w-3 h-3" /> {route._count.students} students · {route.driver.name}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLOR[route.status] ?? STATUS_COLOR.IDLE}`}>
                    {route.status.replace(/_/g, " ")}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Quick Actions */}
            <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" /> Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { href: "/admin/routes",        label: "Routes",        icon: Bus,         color: "text-cyan-400"    },
                  { href: "/admin/notifications",  label: "Notify",        icon: Bell,        color: "text-amber-400"   },
                  { href: "/admin/students",       label: "Students",      icon: Users,       color: "text-indigo-400"  },
                  { href: "/admin/users",          label: "Users",         icon: UserCheck,   color: "text-violet-400"  },
                  { href: "/admin/schools",        label: "Schools",       icon: School,      color: "text-emerald-400" },
                  { href: "/admin/map",            label: "Live Map",      icon: MapPin,      color: "text-rose-400"    },
                ].map(({ href, label, icon: Icon, color }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:text-white hover:border-indigo-500/40 transition text-sm"
                  >
                    <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Operations Control (Admin Only) */}
            {isAdmin && <OperationsControl />}

            {/* Recent Activity */}
            <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" /> Recent Activity
              </h2>
              {recentActivity.length === 0 ? (
                <p className="text-slate-600 text-xs">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((log) => (
                    <div key={log.id} className="flex gap-3 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-slate-300 text-xs font-medium truncate">{log.action}</p>
                        <p className="text-slate-600 text-xs">{log.user.name} · {new Date(log.timestamp).toLocaleTimeString("en-SE", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}