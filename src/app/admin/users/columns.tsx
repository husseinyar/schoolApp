
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { User, Role } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
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
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiHandler } from "@/lib/api-utils"; // We might not need this here if we fetch directly

// Helper component for Actions column to use hooks
const ActionCell = ({ user }: { user: User }) => {
    const { t } = useTranslation("common");
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
        if (!confirm(t("users.confirm_delete"))) return;

        try {
            const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
            if (res.ok) {
                router.refresh();
            } else {
                alert("Failed to delete");
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
            <DropdownMenuLabel>{t("users.actions")}</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push(`/admin/users?edit=${user.id}`)} // Or open modal
            >
                <Pencil className="mr-2 h-4 w-4" />
                {t("users.edit_user")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash className="mr-2 h-4 w-4" />
                {t("users.delete_user", "Delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
    );
};

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name", // We'll handle translation wrapper in the Page or make header a component
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as Role;
      return (
        <Badge variant={role === "ADMIN" ? "default" : "secondary"}>
          {role}
        </Badge>
      );
    },
  },
  {
    accessorKey: "school.name",
    header: "School",
    cell: ({ row }) => {
        // @ts-ignore - access nested
        return row.original.school?.name || "-";
    }
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell user={row.original} />,
  },
];
