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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("students.title")}
        description={t("students.description")}
      >
        <Button onClick={handleAddClick}>{t("students.add_student")}</Button>
      </PageHeader>

      <div className="flex items-center py-4 gap-4">
        <Input
          placeholder={t("students.name") + " / Code..."}
          className="max-w-sm"
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        pageCount={Math.ceil(total / 10)}
        onPageChange={handlePageChange}
        currentPage={page}
      />

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
