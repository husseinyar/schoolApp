
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
    MoreHorizontal,
    Plus,
    Search,
    Pencil,
    Trash2,
    Loader2
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

import { DataTable } from "@/components/ui/data-table";
import { StudentForm } from "@/components/students/student-form";
import { Badge } from "@/components/ui/badge";

// Types
type StudentRow = {
    id: string;
    name: string;
    studentCode: string;
    grade: number;
    dateOfBirth: string;
    status: "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED";
    school: { id: string; name: string };
    route?: { id: string; name: string };
    parent?: { id: string; name: string; email: string };
    addressStreet: string;
    addressCity: string;
    addressPostal: string;
    latitude: number;
    longitude: number;
    parentId?: string;
    routeId?: string;
    schoolId: string;
};

export default function StudentsPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<StudentRow | null>(null);

    // Queries
    const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
        queryKey: ["students", page, search],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                search,
            });
            const res = await fetch(`/api/students?${params}`);
            if (!res.ok) throw new Error("Failed to fetch students");
            return res.json();
        },
    });

    const { data: schoolsData } = useQuery({
        queryKey: ["schools"],
        queryFn: async () => {
            const res = await fetch("/api/schools?limit=100"); // Fetch all schools for dropdown
            if (!res.ok) throw new Error("Failed to fetch schools");
            return res.json();
        },
    });

    const { data: routesData } = useQuery({
        queryKey: ["routes"],
        queryFn: async () => {
            // Check if routes API exists, if not return empty
            try {
                const res = await fetch("/api/routes?limit=100");
                if (!res.ok) return { routes: [] };
                return res.json();
            } catch (e) {
                return { routes: [] };
            }
        },
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch("/api/students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to create student");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            setIsSheetOpen(false);
            setSelectedStudent(null);
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/students/${selectedStudent?.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update student");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            setIsSheetOpen(false);
            setSelectedStudent(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/students/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete student");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            setIsDeleteDialogOpen(false);
            setStudentToDelete(null);
        },
    });

    // Handlers
    const handleAddClick = () => {
        setSelectedStudent(null);
        setIsSheetOpen(true);
    };

    const handleEditClick = (student: StudentRow) => {
        setSelectedStudent(student);
        setIsSheetOpen(true);
    };

    const handleDeleteClick = (student: StudentRow) => {
        setStudentToDelete(student);
        setIsDeleteDialogOpen(true);
    };

    const handleFormSubmit = async (data: any) => {
        if (selectedStudent) {
            await updateMutation.mutateAsync(data);
        } else {
            await createMutation.mutateAsync(data);
        }
    };

    // Columns
    const columns: ColumnDef<StudentRow>[] = [
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.original.name}</span>
                    <span className="text-xs text-muted-foreground">{row.original.studentCode}</span>
                </div>
            ),
        },
        {
            accessorKey: "grade",
            header: "Grade",
        },
        {
            accessorKey: "school.name",
            header: "School",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
                        {status}
                    </Badge>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const student = row.original;
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
                            <DropdownMenuItem onClick={() => handleEditClick(student)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteClick(student)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    if (isLoadingStudents) {
        return <div className="p-8 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Students</h2>
                    <p className="text-muted-foreground">
                        Manage students, their schools, and route assignments.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={handleAddClick}>
                        <Plus className="mr-2 h-4 w-4" /> Add Student
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search students..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={studentsData?.data?.students || []}
                    pageCount={studentsData?.data?.pagination?.pages || 1}
                    currentPage={page}
                    onPageChange={setPage}
                />
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{selectedStudent ? "Edit Student" : "Add Student"}</SheetTitle>
                        <SheetDescription>
                            {selectedStudent
                                ? "Make changes to the student profile here."
                                : "Add a new student to the system. Click save when you're done."}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-6">
                        <StudentForm
                            initialData={selectedStudent}
                            onSubmit={handleFormSubmit}
                            onCancel={() => setIsSheetOpen(false)}
                            isLoading={createMutation.isPending || updateMutation.isPending}
                            schools={schoolsData?.data?.schools || []}
                            routes={routesData?.data?.routes || []}
                            parents={[]} // TODO: Fetch parents if needed
                        />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation */}
            {isDeleteDialogOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="bg-popover p-6 rounded-lg shadow-lg border max-w-sm w-full space-y-4">
                        <h3 className="text-lg font-semibold">Are you sure?</h3>
                        <p className="text-sm text-muted-foreground">
                            This action cannot be undone. This will permanently delete {studentToDelete?.name}.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                            <Button 
                                variant="destructive" 
                                onClick={() => studentToDelete && deleteMutation.mutate(studentToDelete.id)}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? "Deleting..." : "Delete"}
                            </Button>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
}
