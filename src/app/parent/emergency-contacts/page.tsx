"use client";

import { useEffect, useState } from "react";
import {
  Users, Loader2, Plus, Trash2, Pencil, Phone, Mail, Crown,
  CheckCircle2, ChevronDown, AlertCircle, X
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  isPrimary: boolean;
}

interface Student { id: string; name: string; studentCode: string; }

const defaultForm = { name: "", relationship: "", phone: "", email: "", isPrimary: false };

export default function EmergencyContactsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/parent/children")
      .then((r) => r.json())
      .then((d) => {
        const list = d.students ?? [];
        setStudents(list);
        if (list.length > 0) setSelectedStudentId(list[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedStudentId) return;
    setLoading(true);
    fetch(`/api/parent/emergency-contacts?studentId=${selectedStudentId}`)
      .then((r) => r.json())
      .then((d) => setContacts(d.contacts ?? []))
      .finally(() => setLoading(false));
  }, [selectedStudentId]);

  function openEdit(contact: Contact) {
    setEditing(contact);
    setForm({ name: contact.name, relationship: contact.relationship, phone: contact.phone, email: contact.email ?? "", isPrimary: contact.isPrimary });
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditing(null); setForm(defaultForm); setError(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setSubmitting(true);
    try {
      const method = editing ? "PUT" : "POST";
      const payload = editing
        ? { id: editing.id, studentId: selectedStudentId, ...form }
        : { studentId: selectedStudentId, ...form };
      const res = await fetch("/api/parent/emergency-contacts", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (editing) {
        setContacts((prev) => prev.map((c) => c.id === editing.id ? data.contact : (form.isPrimary ? { ...c, isPrimary: false } : c)));
      } else {
        if (form.isPrimary) setContacts((prev) => prev.map((c) => ({ ...c, isPrimary: false })));
        setContacts((prev) => [...prev, data.contact]);
      }
      setSuccess(editing ? "Contact updated." : "Contact added.");
      closeForm();
    } catch {
      setError("Could not save contact. Please check the details.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this emergency contact?")) return;
    await fetch(`/api/parent/emergency-contacts?id=${id}`, { method: "DELETE" });
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-600/20 border border-emerald-500/30">
              <Users className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Emergency Contacts</h1>
              <p className="text-slate-400 text-sm">Manage who to contact if your child needs help</p>
            </div>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditing(null); setForm(defaultForm); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>

        {/* Student selector */}
        {students.length > 1 && (
          <div className="relative">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm appearance-none focus:outline-none focus:border-emerald-500/60"
            >
              {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.studentCode})</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-sm">
            <CheckCircle2 className="w-4 h-4" /> {success}
          </div>
        )}

        {/* Contacts list */}
        {loading ? (
          <div className="flex items-center text-slate-400 text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading contacts…
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p>No emergency contacts added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((c) => (
              <div
                key={c.id}
                className={`bg-slate-900/60 backdrop-blur border rounded-2xl p-5 shadow-xl transition ${c.isPrimary ? "border-emerald-500/40" : "border-slate-700/50"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{c.name}</h3>
                      {c.isPrimary && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-600/20 text-amber-300 border border-amber-500/30">
                          <Crown className="w-3 h-3" /> Primary
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{c.relationship}</p>
                    <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm mt-2 transition">
                      <Phone className="w-3.5 h-3.5" /> {c.phone}
                    </a>
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm mt-0.5 transition">
                        <Mail className="w-3.5 h-3.5" /> {c.email}
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-700 transition">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal/Slide-in Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <h3 className="text-white font-semibold">{editing ? "Edit Contact" : "Add Emergency Contact"}</h3>
                <button onClick={closeForm} className="text-slate-500 hover:text-white transition"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {[
                  { key: "name", label: "Full Name", type: "text", required: true, placeholder: "e.g. Sarah Doe" },
                  { key: "relationship", label: "Relationship", type: "text", required: true, placeholder: "e.g. Mother, Grandfather" },
                  { key: "phone", label: "Phone Number", type: "tel", required: true, placeholder: "+46 70 123 4567" },
                  { key: "email", label: "Email (optional)", type: "email", required: false, placeholder: "sarah@example.com" },
                ].map(({ key, label, type, required, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm text-slate-400 mb-1.5">{label}</label>
                    <input
                      type={type}
                      required={required}
                      placeholder={placeholder}
                      value={(form as Record<string, string | boolean>)[key] as string}
                      onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/60"
                    />
                  </div>
                ))}

                {/* Primary toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setForm((prev) => ({ ...prev, isPrimary: !prev.isPrimary }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${form.isPrimary ? "bg-emerald-600" : "bg-slate-700"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isPrimary ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                  <span className="text-slate-300 text-sm">Set as primary contact</span>
                </label>

                {error && (
                  <div className="flex items-center gap-2 text-red-300 text-sm">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeForm} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {editing ? "Update" : "Add Contact"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
