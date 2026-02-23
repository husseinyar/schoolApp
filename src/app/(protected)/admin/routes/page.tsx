
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { RouteForm } from "@/components/routes/route-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function RoutesPage() {
  const { t } = useTranslation("common");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [editRoute, setEditRoute] = useState<any | null>(null);

  // Fetch logic
  const fetchData = async () => {
    setLoading(true);
    try {
      const pageParam = searchParams.get("page") || "1";
      const searchParam = searchParams.get("search") || "";
      
      const res = await fetch(`/api/routes?page=${pageParam}&search=${searchParam}`);
      const json = await res.json();
      
      if (json.success) {
        setData(json.data.routes);
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

  // Handle Edit param
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId) {
       fetch(`/api/routes/${editId}`).then(res => res.json()).then(json => {
           if (json.success) {
               setEditRoute(json.data);
               setIsOpen(true);
           }
       });
    } else {
        setEditRoute(null);
        setIsOpen(false);
    }
  }, [searchParams]);

  const handleSave = async (formData: any) => {
      try {
          const url = editRoute ? `/api/routes/${editRoute.id}` : "/api/routes";
          const method = editRoute ? "PATCH" : "POST";

          const res = await fetch(url, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData)
          });

          if (res.ok) {
              setIsOpen(false);
              const params = new URLSearchParams(searchParams);
              params.delete("edit");
              router.replace(`/admin/routes?${params.toString()}`);
              fetchData(); 
          } else {
              const json = await res.json();
              alert(json.error?.message || "Error saving");
          }
      } catch (error) {
          console.error(error);
      }
  };

  const handleAddClick = () => {
    setEditRoute(null);
    setIsOpen(true);
    const params = new URLSearchParams(searchParams);
    params.delete("edit");
    router.replace(`/admin/routes?${params.toString()}`);
  };

  const handleCancel = () => {
      setIsOpen(false);
      const params = new URLSearchParams(searchParams);
      params.delete("edit");
      router.replace(`/admin/routes?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("routes.title")}
        description={t("routes.description")}
      >
        <Button onClick={handleAddClick}>{t("routes.add_route")}</Button>
      </PageHeader>

      <div className="flex items-center py-4">
        {/* Placeholder filter controls could go here (School/Driver filter) */}
      </div>

      <DataTable 
        columns={columns} 
        data={data} 
        pageCount={Math.ceil(total / 10)} 
        onPageChange={(p) => router.push(`/admin/routes?page=${p}`)}
        currentPage={page}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
                <DialogTitle>{editRoute ? "Edit Route" : t("routes.add_route")}</DialogTitle>
            </DialogHeader>
            <RouteForm 
                key={editRoute?.id || "new"} 
                initialData={editRoute || undefined} 
                onSubmit={handleSave}
                onCancel={handleCancel}
            />
        </DialogContent>
      </Dialog>
    </div>
  );
}
