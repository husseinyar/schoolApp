"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bus, User, MapPin, Clock, ChevronRight, AlertCircle, Loader2, GraduationCap
} from "lucide-react";

interface Stop {
  id: string;
  name: string;
  address: string;
  scheduledTime: string;
  orderIndex: number;
}

interface Route {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  status: string;
  monday: boolean; tuesday: boolean; wednesday: boolean; thursday: boolean; friday: boolean;
  driver: { name: string; phone: string | null; email: string };
  stops: Stop[];
}

interface Student {
  id: string;
  name: string;
  studentCode: string;
  grade: number;
  status: string;
  school: { name: string; addressCity: string };
  route: Route | null;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  INACTIVE: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  GRADUATED: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  TRANSFERRED: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

export default function MyChildrenPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/parent/children")
      .then((r) => r.json())
      .then((d) => setStudents(d.students ?? []))
      .catch(() => setError("Failed to load your children's data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300 mt-4">
        <AlertCircle className="w-5 h-5" /> {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30">
            <GraduationCap className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">My Children</h1>
            <p className="text-slate-400 text-sm">View route and bus information for your children</p>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No children assigned to your account yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {students.map((student) => (
              <div
                key={student.id}
                className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-2xl p-5 shadow-xl hover:border-indigo-500/40 transition-all group"
              >
                {/* Student Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white group-hover:text-indigo-300 transition">
                      {student.name}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      Grade {student.grade} · {student.studentCode}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">{student.school.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[student.status] ?? STATUS_COLORS.INACTIVE}`}>
                    {student.status}
                  </span>
                </div>

                {/* Route Info */}
                {student.route ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Bus className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="font-medium">{student.route.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{student.route.startTime} – {student.route.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <User className="w-4 h-4 flex-shrink-0" />
                      <span>Driver: {student.route.driver.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{student.route.stops.length} stops</span>
                    </div>

                    {/* Schedule pills */}
                    <div className="flex gap-1 mt-1">
                      {DAYS.map((d, i) => (
                        <span
                          key={d}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            student.route![d]
                              ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30"
                              : "bg-slate-800 text-slate-600 border border-slate-700"
                          }`}
                        >
                          {DAY_LABELS[i]}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm italic">No route assigned</p>
                )}

                {/* Detail link */}
                <Link
                  href={`/parent/children/${student.id}`}
                  className="mt-4 flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition font-medium"
                >
                  View full details <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
