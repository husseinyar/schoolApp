"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns, StudentRow } from "./columns";
import { StudentForm } from "@/components/students/student-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface SelectOption { id: string; name: string; }
interface ParentOption extends SelectOption { email: string; }
interface RouteOption extends SelectOption {}

export default function StudentsPage() {
  const { t } = useTranslation("common");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown data for the form
  const [schools, setSchools] = useState<SelectOption[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [parents, setParents] = useState<ParentOption[]>([]);

  // ── Fetch dropdown data once on mount ─────────────────────────────────────

  useEffect(() => {
    setMounted(true);
    fetch("/api/schools?limit=100")
      .then((r) => r.json())
      .then((j) => j.success && setSchools(j.data.schools));

    fetch("/api/routes?limit=100")
      .then((r) => r.json())
      .then((j) => j.success && setRoutes(j.data.routes ?? []));

    fetch("/api/users?role=PARENT&limit=200")
      .then((r) => r.json())
      .then((j) => j.success && setParents(j.data.users ?? []));
  }, []);

  // ── Fetch student list ─────────────────────────────────────────────────────

  const fetchData = async () => {
    setLoading(true);
    try {
      const pageParam = searchParams.get("page") || "1";
      const searchParam = searchParams.get("search") || "";
      const schoolParam = searchParams.get("schoolId") || "";

      const query = new URLSearchParams({
        page: pageParam,
        search: searchParam,
        schoolId: schoolParam,
      });

      const res = await fetch(`/api/students?${query.toString()}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data.students);
        setTotal(json.data.pagination.total);
        setPage(json.data.pagination.page);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  // Handle edit/new param from URL
  useEffect(() => {
    const editId = searchParams.get("edit");
    const isNew = searchParams.get("new") === "true";

    if (editId) {
      fetch(`/api/students/${editId}`)
        .then((r) => r.json())
        .then((j) => {
          if (j.success) {
            setEditStudent(j.data);
            setIsOpen(true);
          }
        });
    } else if (isNew) {
      setEditStudent(null);
      setIsOpen(true);
    } else {
      setEditStudent(null);
      setIsOpen(false);
    }
  }, [searchParams]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) params.set("search", term);
    else params.delete("search");
    router.replace(`/admin/students?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.replace(`/admin/students?${params.toString()}`);
  };

  const handleAddClick = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("edit");
    params.set("new", "true");
    router.push(`/admin/students?${params.toString()}`);
  };

  const handleCancel = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("edit");
    params.delete("new");
    router.replace(`/admin/students?${params.toString()}`);
  };

  const handleSave = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const url = editStudent ? `/api/students/${editStudent.id}` : "/api/students";
      const method = editStudent ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        const params = new URLSearchParams(searchParams);
        params.delete("edit");
        params.delete("new");
        router.replace(`/admin/students?${params.toString()}`);
        fetchData();
      } else {
        alert(json.error?.message || "Error saving student");
      }
    } catch (error) {
      console.error(error);
      alert("Unexpected error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {t("students.title")}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {t("students.description")}
          </p>
        </div>
        <Button 
          onClick={handleAddClick}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6"
        >
          {t("students.add_student")}
        </Button>
      </div>

      <div className="premium-card p-6">
        <div className="flex items-center pb-6 gap-4">
          <Input
            placeholder={t("students.name") + " / Code..."}
            className="max-w-sm bg-slate-950/40 border-slate-800 text-white placeholder:text-slate-500 rounded-xl"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="rounded-2xl overflow-hidden border border-white/5">
          <DataTable
            columns={columns}
            data={data}
            pageCount={Math.ceil(total / 10)}
            onPageChange={handlePageChange}
            currentPage={page}
          />
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editStudent ? "Edit Student" : t("students.add_student")}
            </DialogTitle>
          </DialogHeader>
          <StudentForm
            key={editStudent?.id || "new"}
            initialData={editStudent ?? undefined}
            onSubmit={handleSave}
            onCancel={handleCancel}
            isLoading={isSubmitting}
            schools={schools}
            routes={routes}
            parents={parents}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
