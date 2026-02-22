"use client";

import { useState } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FormGrid, FormSection } from "@/components/ui/form-layout";

// Schema (matching API validation roughly)
const studentSchema = z.object({
    name: z.string().min(1, "Name is required"),
    dateOfBirth: z.string().min(1, "Date of Birth is required"), // Keeping as string YYYY-MM-DD for simplicity in Input type="date"
    grade: z.coerce.number().min(0, "Grade must be 0 or higher").max(12, "Grade must be 12 or lower"),
    schoolId: z.string().min(1, "School is required"),
    parentId: z.string().optional().nullable(),
    routeId: z.string().optional().nullable(),
    status: z.enum(["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED"]).default("ACTIVE"),
    
    // Address
    addressStreet: z.string().min(1, "Street address is required"),
    addressCity: z.string().min(1, "City is required"),
    addressPostal: z.string().min(1, "Postal code is required"),
    
    // Coordinates (optional for manual entry, but good enough)
    latitude: z.number().optional().default(0),
    longitude: z.number().optional().default(0),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
    initialData?: any;
    onSubmit: (data: StudentFormValues) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    schools?: { id: string; name: string }[];
    routes?: { id: string; name: string }[];
    parents?: { id: string; name: string; email: string }[];
}

export function StudentForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading,
    schools = [],
    routes = [],
    parents = []
}: StudentFormProps) {
    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema) as any,
        defaultValues: initialData ? {
            ...initialData,
            dateOfBirth: initialData.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : "",
            grade: initialData.grade,
            latitude: initialData.latitude || 0,
            longitude: initialData.longitude || 0,
            parentId: initialData.parentId || "null", // Handle "null" string logic if needed, or clearable select
            routeId: initialData.routeId || "null",
        } : {
            name: "",
            dateOfBirth: "",
            grade: 0,
            schoolId: "",
            status: "ACTIVE",
            addressStreet: "",
            addressCity: "",
            addressPostal: "",
            latitude: 0,
            longitude: 0,
        },
    });

    const onSubmitHandler: SubmitHandler<z.infer<typeof studentSchema>> = async (values) => {
        // Transformations if needed
        // Clean up "null" strings from selects if we used that technique
        const cleanData = { ...values };
        if (cleanData.parentId === "null") cleanData.parentId = null;
        if (cleanData.routeId === "null") cleanData.routeId = null;
        
        return onSubmit(cleanData);
    };

    return (
        <form onSubmit={handleSubmit(onSubmitHandler as any)} className="space-y-8">
            <FormSection title="Basic Information" description="Personal details of the student.">
                <FormGrid>
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" placeholder="John Doe" {...register("name")} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
                        {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="grade">Grade</Label>
                        <Input id="grade" type="number" {...register("grade")} />
                        {errors.grade && <p className="text-sm text-destructive">{errors.grade.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Controller
                            control={control}
                            name="status"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                                        <SelectItem value="GRADUATED">Graduated</SelectItem>
                                        <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                         {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
                    </div>
                </FormGrid>
            </FormSection>

            <FormSection title="School & Assignment" description="School, route, and parent association.">
                <FormGrid>
                   <div className="space-y-2">
                        <Label htmlFor="schoolId">School</Label>
                        <Controller
                            control={control}
                            name="schoolId"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select school" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {schools.map((school) => (
                                            <SelectItem key={school.id} value={school.id}>
                                                {school.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.schoolId && <p className="text-sm text-destructive">{errors.schoolId.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="routeId">Route (Optional)</Label>
                        <Controller
                            control={control}
                            name="routeId"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value || "null"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select route" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="null">None</SelectItem>
                                        {routes.map((route) => (
                                            <SelectItem key={route.id} value={route.id}>
                                                {route.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="parentId">Parent (Optional)</Label>
                         <Controller
                            control={control}
                            name="parentId"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value || "null"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select parent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="null">None</SelectItem>
                                        {parents.map((parent) => (
                                            <SelectItem key={parent.id} value={parent.id}>
                                                {parent.name} ({parent.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </FormGrid>
            </FormSection>

             <FormSection title="Address" description="Primary residence address.">
                <FormGrid>
                    <div className="space-y-2">
                        <Label htmlFor="addressStreet">Street Address</Label>
                        <Input id="addressStreet" {...register("addressStreet")} />
                        {errors.addressStreet && <p className="text-sm text-destructive">{errors.addressStreet.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="addressCity">City</Label>
                        <Input id="addressCity" {...register("addressCity")} />
                         {errors.addressCity && <p className="text-sm text-destructive">{errors.addressCity.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="addressPostal">Postal Code</Label>
                        <Input id="addressPostal" {...register("addressPostal")} />
                         {errors.addressPostal && <p className="text-sm text-destructive">{errors.addressPostal.message}</p>}
                    </div>
                </FormGrid>
            </FormSection>

            <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" type="button" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : initialData ? "Update Student" : "Create Student"}
                </Button>
            </div>
        </form>
    );
}
