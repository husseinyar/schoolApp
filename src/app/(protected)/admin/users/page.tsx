
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { UserForm } from "@/components/users/user-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { User } from "@prisma/client";

export default function UsersPage() {
  const { t } = useTranslation("common");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  // Fetch logic
  const fetchData = async () => {
    setLoading(true);
    try {
      const pageParam = searchParams.get("page") || "1";
      const searchParam = searchParams.get("search") || "";
      
      const res = await fetch(`/api/users?page=${pageParam}&search=${searchParam}`);
      const json = await res.json();
      
      if (json.success) {
        setData(json.data.users);
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

  // Handle Edit/Add param via URL
  useEffect(() => {
    const editId = searchParams.get("edit");
    const isNew = searchParams.get("new") === "true";

    if (editId) {
       fetch(`/api/users/${editId}`).then(res => res.json()).then(json => {
           if (json.success) {
               setEditUser(json.data);
               setIsOpen(true);
           }
       });
    } else if (isNew) {
        setEditUser(null);
        setIsOpen(true);
    } else {
        setEditUser(null);
        setIsOpen(false);
    }
  }, [searchParams]);

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) params.set("search", term);
    else params.delete("search");
    router.replace(`/admin/users?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("page", newPage.toString());
      router.replace(`/admin/users?${params.toString()}`);
  };

  const handleSave = async (formData: any) => {
      try {
          const url = editUser ? `/api/users/${editUser.id}` : "/api/users";
          const method = editUser ? "PATCH" : "POST";

          const res = await fetch(url, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData)
          });

          if (res.ok) {
              const params = new URLSearchParams(searchParams);
              params.delete("edit");
              params.delete("new");
              router.replace(`/admin/users?${params.toString()}`);
              fetchData(); // Refresh list
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
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleCancel = () => {
      const params = new URLSearchParams(searchParams);
      params.delete("edit");
      params.delete("new");
      router.replace(`/admin/users?${params.toString()}`);
  };

  const onOpenChange = (open: boolean) => {
      if (!open) handleCancel();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("users.title")}
        description={t("users.description")}
      >
        <Button onClick={handleAddClick}>{t("users.add_user")}</Button>
      </PageHeader>

      <div className="flex items-center py-4">
        <Input
          placeholder={t("users.name") + "..."}
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
                 <DialogTitle>{editUser ? "Edit User" : t("users.add_user")}</DialogTitle>
             </DialogHeader>
             {/* Key forces remount on user change */}
            <UserForm 
                key={editUser?.id || "new"} 
                initialData={editUser ? { ...editUser, schoolId: editUser.schoolId || "" } : undefined} 
                onSubmit={handleSave}
                onCancel={handleCancel}
            />
        </DialogContent>
      </Dialog>
    </div>
  );
}
