"use client";

import { useEffect, useState } from "react";
import { Users, Loader2, GraduationCap, MapPin } from "lucide-react";

interface Student {
  id: string; name: string; studentCode: string; grade: number; photoURL: string | null;
  addressStreet: string; addressCity: string; status: string;
}

export default function StudentRosterPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/driver/route-detail")
      .then((r) => r.json())
      .then((d) => setStudents(d.route?.students ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.studentCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-600/20 border border-cyan-500/30">
            <Users className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Student Roster</h1>
            <p className="text-slate-400 text-sm">{students.length} students on your route</p>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name or student code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/60"
        />

        {loading ? (
          <div className="flex items-center text-slate-400 text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading students…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p>No students found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <div key={s.id} className="bg-slate-900/60 border border-slate-700/50 rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-cyan-500/30 transition">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                  {s.photoURL
                    ? <img src={s.photoURL} alt={s.name} className="w-10 h-10 rounded-full object-cover" />
                    : <GraduationCap className="w-5 h-5 text-cyan-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold truncate">{s.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
                      s.status === "ACTIVE" ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/30" : "bg-slate-700 text-slate-400 border-slate-600"
                    }`}>{s.status}</span>
                  </div>
                  <p className="text-slate-500 text-xs">{s.studentCode} · Grade {s.grade}</p>
                  <p className="text-slate-600 text-xs flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {s.addressStreet}, {s.addressCity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
