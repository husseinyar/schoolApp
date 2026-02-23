"use client";

import { useState } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
import { FormGrid, FormSection } from "@/components/ui/form-layout";
import { AddressAutocomplete, PlaceDetails } from "@/components/shared/AddressAutocomplete";

// ── Schema ─────────────────────────────────────────────────────────────────────

const studentSchema = z.object({
    name: z.string().min(1, "Name is required"),
    dateOfBirth: z.string().min(1, "Date of Birth is required"),
    grade: z.coerce.number().min(0, "Grade must be 0 or higher").max(12, "Grade must be 12 or lower"),
    schoolId: z.string().min(1, "School is required"),
    parentId: z.string().optional().nullable(),
    routeId: z.string().optional().nullable(),
    status: z.enum(["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED"]).default("ACTIVE"),

    // Address — single formatted string from Google
    addressStreet: z.string().min(3, "Address is required"),
    addressCity: z.string().optional().default(""),
    addressPostal: z.string().optional().default(""),

    // Coordinates
    latitude: z.number().default(0),
    longitude: z.number().default(0),
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
    parents = [],
}: StudentFormProps) {
    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema) as any,
        defaultValues: initialData
            ? {
                  ...initialData,
                  dateOfBirth: initialData.dateOfBirth
                      ? new Date(initialData.dateOfBirth).toISOString().split("T")[0]
                      : "",
                  grade: initialData.grade,
                  latitude: initialData.latitude || 0,
                  longitude: initialData.longitude || 0,
                  parentId: initialData.parentId || "null",
                  routeId: initialData.routeId || "null",
              }
            : {
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

    // The visible address input value (controlled separately for the autocomplete)
    const addressStreet = watch("addressStreet");

    function handleAddressSelect(details: PlaceDetails) {
        setValue("addressStreet", details.formattedAddress, { shouldValidate: true });
        setValue("addressCity", details.city ?? "");
        setValue("addressPostal", details.postalCode ?? "");
        setValue("latitude", details.lat);
        setValue("longitude", details.lng);
    }

    const onSubmitHandler: SubmitHandler<StudentFormValues> = async (values) => {
        const cleanData = { ...values };
        if (cleanData.parentId === "null") cleanData.parentId = null;
        if (cleanData.routeId === "null") cleanData.routeId = null;
        return onSubmit(cleanData);
    };

    return (
        <form onSubmit={handleSubmit(onSubmitHandler as any)} className="space-y-8">
            {/* ── Basic Information ── */}
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
                        {errors.dateOfBirth && (
                            <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
                        )}
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
                    </div>
                </FormGrid>
            </FormSection>

            {/* ── School & Assignment ── */}
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
                        {errors.schoolId && (
                            <p className="text-sm text-destructive">{errors.schoolId.message}</p>
                        )}
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

            {/* ── Address ── */}
            <FormSection
                title="Home Address"
                description="Start typing to search for a Swedish address. Selecting a suggestion auto-fills coordinates."
            >
                <div className="space-y-2">
                    <Label htmlFor="addressStreet">Address</Label>
                    <AddressAutocomplete
                        id="addressStreet"
                        value={addressStreet}
                        onChange={(val) => setValue("addressStreet", val)}
                        onSelect={handleAddressSelect}
                        placeholder="e.g. Ribbings väg 5A, Sollentuna"
                        error={errors.addressStreet?.message}
                    />
                </div>

                {/* Read-only derived fields */}
                <FormGrid className="mt-4">
                    <div className="space-y-2">
                        <Label>City</Label>
                        <Input readOnly value={watch("addressCity") || ""} placeholder="Auto-filled" className="bg-muted/40" />
                    </div>
                    <div className="space-y-2">
                        <Label>Postal Code</Label>
                        <Input readOnly value={watch("addressPostal") || ""} placeholder="Auto-filled" className="bg-muted/40" />
                    </div>
                    <div className="space-y-2">
                        <Label>Latitude</Label>
                        <Input readOnly value={watch("latitude") || ""} placeholder="Auto-filled" className="bg-muted/40 font-mono text-xs" />
                    </div>
                    <div className="space-y-2">
                        <Label>Longitude</Label>
                        <Input readOnly value={watch("longitude") || ""} placeholder="Auto-filled" className="bg-muted/40 font-mono text-xs" />
                    </div>
                </FormGrid>
            </FormSection>

            {/* Hidden inputs ensure lat/lng are submitted */}
            <input type="hidden" {...register("latitude", { valueAsNumber: true })} />
            <input type="hidden" {...register("longitude", { valueAsNumber: true })} />
            <input type="hidden" {...register("addressCity")} />
            <input type="hidden" {...register("addressPostal")} />

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
