"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bus, User, Phone, Mail, MapPin, Clock, ArrowLeft,
  CheckCircle2, Circle, Loader2, AlertCircle, GraduationCap, Calendar
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
  dateOfBirth: string;
  addressStreet: string;
  addressPostal: string;
  addressCity: string;
  school: { name: string; addressStreet: string; addressCity: string };
  route: Route | null;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const DAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function ChildDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/parent/children")
      .then((r) => r.json())
      .then((d) => {
        const found = (d.students as Student[]).find((s) => s.id === id);
        if (found) setStudent(found);
        else setError("Child not found.");
      })
      .catch(() => setError("Failed to load data."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300 mt-4">
        <AlertCircle className="w-5 h-5" /> {error ?? "Student not found."}
      </div>
    );
  }

  const dob = new Date(student.dateOfBirth).toLocaleDateString("en-SE", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back */}
        <Link href="/parent/children" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition">
          <ArrowLeft className="w-4 h-4" /> Back to My Children
        </Link>

        {/* Student Card */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30">
              <GraduationCap className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{student.name}</h1>
              <p className="text-slate-400 text-sm">{student.studentCode} · Grade {student.grade}</p>
            </div>
            <span className="ml-auto text-xs px-3 py-1 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 font-medium">
              {student.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-slate-400"><span className="text-slate-500 text-xs block mb-0.5">Date of Birth</span>{dob}</div>
            <div className="text-slate-400"><span className="text-slate-500 text-xs block mb-0.5">School</span>{student.school.name}</div>
            <div className="text-slate-400 col-span-2">
              <span className="text-slate-500 text-xs block mb-0.5">Home Address</span>
              {student.addressStreet}, {student.addressPostal} {student.addressCity}
            </div>
          </div>
        </div>

        {/* Route Card */}
        {student.route ? (
          <>
            <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-2xl p-6 shadow-xl">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Bus className="w-4 h-4 text-indigo-400" /> Route Information
              </h2>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="text-slate-400"><span className="text-slate-500 text-xs block mb-0.5">Route Name</span>{student.route.name}</div>
                <div className="text-slate-400">
                  <span className="text-slate-500 text-xs block mb-0.5">Time</span>
                  {student.route.startTime} – {student.route.endTime}
                </div>
              </div>
              {/* Days */}
              <div>
                <p className="text-slate-500 text-xs mb-2">Schedule Days</p>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((d, i) => (
                    <span
                      key={d}
                      className={`text-sm px-3 py-1 rounded-full flex items-center gap-1.5 border font-medium ${
                        student.route![d]
                          ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/30"
                          : "bg-slate-800/50 text-slate-600 border-slate-700"
                      }`}
                    >
                      {student.route![d]
                        ? <CheckCircle2 className="w-3.5 h-3.5" />
                        : <Circle className="w-3.5 h-3.5" />}
                      {DAY_FULL[i]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Driver Card */}
            <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-2xl p-6 shadow-xl">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" /> Driver
              </h2>
              <div className="flex flex-col gap-2 text-sm">
                <p className="text-white font-medium">{student.route.driver.name}</p>
                {student.route.driver.phone && (
                  <a href={`tel:${student.route.driver.phone}`}
                    className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition">
                    <Phone className="w-4 h-4" /> {student.route.driver.phone}
                  </a>
                )}
                <a href={`mailto:${student.route.driver.email}`}
                  className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition">
                  <Mail className="w-4 h-4" /> {student.route.driver.email}
                </a>
              </div>
            </div>

            {/* Stops Timeline */}
            <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-2xl p-6 shadow-xl">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" /> Stops Timeline
              </h2>
              <div className="space-y-0">
                {student.route.stops.map((stop, idx) => {
                  const isLast = idx === student.route!.stops.length - 1;
                  return (
                    <div key={stop.id} className="flex gap-3">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-indigo-400 mt-1 flex-shrink-0" />
                        {!isLast && <div className="w-0.5 bg-slate-700 flex-1 my-1" />}
                      </div>
                      {/* Content */}
                      <div className={`pb-4 ${isLast ? "" : ""}`}>
                        <p className="text-white text-sm font-medium">{stop.name}</p>
                        <p className="text-slate-500 text-xs">{stop.address}</p>
                        <p className="text-indigo-400 text-xs flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {stop.scheduledTime}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {/* School destination */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-emerald-400 mt-0.5 flex-shrink-0" />
                  </div>
                  <div>
                    <p className="text-emerald-300 text-sm font-medium">{student.school.name}</p>
                    <p className="text-slate-500 text-xs">{student.school.addressCity} — Destination</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 text-center text-slate-500">
            <Bus className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No route assigned to this child yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
