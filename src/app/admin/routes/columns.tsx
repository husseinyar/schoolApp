
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Route } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash, Eye } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

// Extend Route type to include relations
type RouteWithRelations = Route & {
    school: { name: string };
    driver: { name: string; email: string };
    _count: { students: number; stops: number };
};

const ActionCell = ({ route }: { route: RouteWithRelations }) => {
    const { t } = useTranslation("common");
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm(t("routes.confirm_delete"))) return;

        try {
            const res = await fetch(`/api/routes/${route.id}`, { method: "DELETE" });
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
            <DropdownMenuLabel>{t("routes.actions")}</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push(`/admin/routes/${route.id}`)}
            >
                <Eye className="mr-2 h-4 w-4" />
                {t("routes.view_details", "View Details")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/admin/routes?edit=${route.id}`)}
            >
                <Pencil className="mr-2 h-4 w-4" />
                {t("routes.edit_route")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash className="mr-2 h-4 w-4" />
                {t("routes.delete_route", "Delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
    );
};

export const columns: ColumnDef<RouteWithRelations>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "school.name",
    header: "School",
    cell: ({ row }) => row.original.school?.name,
  },
  {
    accessorKey: "driver.name",
    header: "Driver",
    cell: ({ row }) => (
        <div className="flex flex-col">
            <span>{row.original.driver?.name}</span>
            <span className="text-xs text-muted-foreground">{row.original.driver?.email}</span>
        </div>
    ),
  },
    {
    accessorKey: "capacity",
    header: "Capacity",
    cell: ({ row }) => (
        <div className="flex items-center gap-2">
            <span>{row.original._count.students} / {row.original.capacity}</span>
        </div>
    )
  },
  {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell route={row.original} />,
  },
];
