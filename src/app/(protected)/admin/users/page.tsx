
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

  const [mounted, setMounted] = useState(false);
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
    setMounted(true);
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

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {t("users.title")}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {t("users.description")}
          </p>
        </div>
        <Button 
          onClick={handleAddClick}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6"
        >
          {t("users.add_user")}
        </Button>
      </div>

      <div className="premium-card p-6">
        <div className="flex items-center pb-6 gap-4">
          <Input
            placeholder={t("users.name") + "..."}
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
