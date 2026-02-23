
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { School } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

const ActionCell = ({ school }: { school: School }) => {
    const { t } = useTranslation("common");
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm(t("schools.confirm_delete"))) return;

        try {
            const res = await fetch(`/api/schools/${school.id}`, { method: "DELETE" });
            const json = await res.json();
            
            if (res.ok) {
                router.refresh();
            } else {
                alert(json.error?.message || "Failed to delete");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("schools.actions")}</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push(`/admin/schools?edit=${school.id}`)}
            >
                <Pencil className="mr-2 h-4 w-4" />
                {t("schools.edit_school")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash className="mr-2 h-4 w-4" />
                {t("schools.delete_school", "Delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
    );
};

export const columns: ColumnDef<School>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "addressCity",
    header: "City",
  },
  {
    accessorKey: "contactEmail",
    header: "Email",
    cell: ({ row }) => row.getValue("contactEmail") || "-",
  },
    {
    accessorKey: "contactPhone",
    header: "Phone",
    cell: ({ row }) => row.getValue("contactPhone") || "-",
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell school={row.original} />,
  },
];
