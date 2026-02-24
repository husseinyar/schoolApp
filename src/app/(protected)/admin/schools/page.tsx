
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { SchoolForm } from "@/components/schools/school-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { School } from "@prisma/client";

export default function SchoolsPage() {
  const { t } = useTranslation("common");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [editSchool, setEditSchool] = useState<School | null>(null);

  // Fetch logic
  const fetchData = async () => {
    setLoading(true);
    try {
      const pageParam = searchParams.get("page") || "1";
      const searchParam = searchParams.get("search") || "";
      
      const res = await fetch(`/api/schools?page=${pageParam}&search=${searchParam}`);
      const json = await res.json();
      
      if (json.success) {
        setData(json.data.schools);
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

  // Handle Modal state via URL
  useEffect(() => {
    const editId = searchParams.get("edit");
    const isNew = searchParams.get("new") === "true";

    if (editId) {
       fetch(`/api/schools/${editId}`).then(res => res.json()).then(json => {
           if (json.success) {
               setEditSchool(json.data);
               setIsOpen(true);
           }
       });
    } else if (isNew) {
        setEditSchool(null);
        setIsOpen(true);
    } else {
        setEditSchool(null);
        setIsOpen(false);
    }
  }, [searchParams]);

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) params.set("search", term);
    else params.delete("search");
    router.replace(`/admin/schools?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("page", newPage.toString());
      router.replace(`/admin/schools?${params.toString()}`);
  };

  const handleSave = async (formData: any) => {
      try {
          const url = editSchool ? `/api/schools/${editSchool.id}` : "/api/schools";
          const method = editSchool ? "PATCH" : "POST";

          const res = await fetch(url, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData)
          });

          if (res.ok) {
              const params = new URLSearchParams(searchParams);
              params.delete("edit");
              params.delete("new");
              router.replace(`/admin/schools?${params.toString()}`);
              fetchData(); 
          } else {
              alert("Error saving");
          }
      } catch (error) {
          console.error(error);
      }
  };

  const handleAddClick = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("edit");
    params.set("new", "true");
    router.push(`/admin/schools?${params.toString()}`);
  };

  const handleCancel = () => {
      const params = new URLSearchParams(searchParams);
      params.delete("edit");
      params.delete("new");
      router.replace(`/admin/schools?${params.toString()}`);
  };

  const onOpenChange = (open: boolean) => {
      if (!open) handleCancel();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("schools.title")}
        description={t("schools.description")}
      >
        <Button onClick={handleAddClick}>{t("schools.add_school")}</Button>
      </PageHeader>

      <div className="flex items-center py-4">
        <Input
          placeholder={t("schools.name") + "..."}
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

      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
                <DialogTitle>{editSchool ? "Edit School" : t("schools.add_school")}</DialogTitle>
            </DialogHeader>
            <SchoolForm 
                key={editSchool?.id || "new"} 
                initialData={editSchool || undefined} 
                onSubmit={handleSave}
                onCancel={handleCancel}
            />
        </DialogContent>
      </Dialog>
    </div>
  );
}
