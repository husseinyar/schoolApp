
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Student } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslation } from "react-i18next"

// Define the shape of data we get from API
export type StudentRow = Student & {
  school: { name: string } | null
  parent: { name: string; email: string; phone: string | null } | null
  route: { name: string } | null
}

const ActionCell = ({ student }: { student: StudentRow }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation("common")

  const handleEdit = () => {
    const params = new URLSearchParams(searchParams)
    params.set("edit", student.id)
    router.replace(`/admin/students?${params.toString()}`)
  }

  const handleDelete = async () => {
    if (!confirm(t("students.confirm_delete", `Are you sure you want to delete ${student.name}?`))) return

    try {
      const res = await fetch(`/api/students/${student.id}`, { method: "DELETE" })
      if (res.ok) {
        // We use router.refresh() or ideally we want to trigger the fetchData in the parent page.
        // Since the parent page listens to searchParams, we can just toggle a dummy param or just refresh.
        router.refresh()
        // Alternatively, the page.tsx has a fetchData function that we can't easily call from here
        // unless we pass it down. But router.refresh() works well with Server Actions/Suspense.
        // For this client-side state, we might need a better way.
        // Actually, if we just reload the page or change a param it might trigger.
        const params = new URLSearchParams(searchParams)
        params.set("_t", Date.now().toString()) // Force re-fetch by changing params
        router.replace(`/admin/students?${params.toString()}`)
      } else {
        const json = await res.json()
        alert(json.error?.message || "Failed to delete student")
      }
    } catch (error) {
      console.error(error)
      alert("An error occurred while deleting")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-destructive focus:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const columns: ColumnDef<StudentRow>[] = [
  {
    accessorKey: "studentCode",
    header: "Code",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "grade",
    header: "Grade",
  },
  {
    accessorKey: "school.name",
    header: "School",
    cell: ({ row }) => row.original.school?.name || "-",
  },
  {
      accessorKey: "route.name",
      header: "Route",
      cell: ({ row }) => row.original.route?.name || "-",
  },
  {
    accessorKey: "parent.name",
    header: "Parent",
    cell: ({ row }) => row.original.parent?.name || "-",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
          {status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell student={row.original} />,
  },
]
