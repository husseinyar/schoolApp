
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

export default function StudentsPage() {
  const { t } = useTranslation("common");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  
  // Fetch logic
  const fetchData = async () => {
    setLoading(true);
    try {
      const pageParam = searchParams.get("page") || "1";
      const searchParam = searchParams.get("search") || "";
      const schoolParam = searchParams.get("schoolId") || "";
      
      const query = new URLSearchParams({
          page: pageParam,
          search: searchParam,
          schoolId: schoolParam
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
    setIsOpen(true);
  };

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
        {/* TODO: School Filter Select */}
      </div>

      <DataTable 
        columns={columns} 
        data={data} 
        pageCount={Math.ceil(total / 10)} 
        onPageChange={handlePageChange}
        currentPage={page}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
                <DialogTitle>{t("students.add_student")}</DialogTitle>
            </DialogHeader>
            <StudentForm 
                onCancel={() => setIsOpen(false)} 
                onSubmit={async () => {}} // Placeholder
            />
        </DialogContent>
      </Dialog>
    </div>
  );
}
