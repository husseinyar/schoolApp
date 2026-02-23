
"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormGrid, FormSection } from "@/components/ui/form-layout";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AddressAutocomplete, PlaceDetails } from "@/components/shared/AddressAutocomplete";
import { Route, School, User } from "@prisma/client";
import { Trash2, PlusCircle, GripVertical } from "lucide-react";

// ── Schemas ───────────────────────────────────────────────────────────────────

const stopSchema = z.object({
    id: z.string().optional(),              // present when editing an existing stop
    name: z.string().min(1, "Stop name is required"),
    address: z.string().min(3, "Address is required"),
    latitude: z.number().default(0),
    longitude: z.number().default(0),
    postalCode: z.string().optional().default(""),
    city: z.string().optional().default(""),
    scheduledTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time (HH:MM)"),
    orderIndex: z.number().int().min(0),
});

const routeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    schoolId: z.string().min(1, "School is required"),
    driverId: z.string().min(1, "Driver is required"),
    capacity: z.coerce.number().min(1),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    monday: z.boolean(),
    tuesday: z.boolean(),
    wednesday: z.boolean(),
    thursday: z.boolean(),
    friday: z.boolean(),
    stops: z.array(stopSchema).optional().default([]),
});

type RouteFormData = z.infer<typeof routeSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface RouteFormProps {
    initialData?: Route & { stops?: any[] };
    onSubmit: (data: RouteFormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RouteForm({ initialData, onSubmit, onCancel, isLoading }: RouteFormProps) {
    const { t } = useTranslation("common");
    const [schools, setSchools] = useState<School[]>([]);
    const [drivers, setDrivers] = useState<User[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        control,
    } = useForm<RouteFormData>({
        resolver: zodResolver(routeSchema) as any,
        defaultValues: {
            name: initialData?.name || "",
            schoolId: initialData?.schoolId || "",
            driverId: initialData?.driverId || "",
            capacity: initialData?.capacity || 40,
            startTime: initialData?.startTime || "07:00",
            endTime: initialData?.endTime || "08:30",
            monday: initialData?.monday ?? true,
            tuesday: initialData?.tuesday ?? true,
            wednesday: initialData?.wednesday ?? true,
            thursday: initialData?.thursday ?? true,
            friday: initialData?.friday ?? true,
            stops: (initialData?.stops ?? []).map((s: any, i: number) => ({
                id: s.id,
                name: s.name,
                address: s.address ?? "",
                latitude: s.latitude ?? 0,
                longitude: s.longitude ?? 0,
                postalCode: s.postalCode ?? "",
                city: s.city ?? "",
                scheduledTime: s.scheduledTime ?? "07:00",
                orderIndex: s.orderIndex ?? i,
            })),
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "stops" });

    // Fetch dropdowns
    useEffect(() => {
        fetch("/api/schools?limit=100")
            .then((r) => r.json())
            .then((j) => j.success && setSchools(j.data.schools));
        fetch("/api/users?role=DRIVER&limit=100")
            .then((r) => r.json())
            .then((j) => j.success && setDrivers(j.data.users));
    }, []);

    function addStop() {
        append({
            name: "",
            address: "",
            latitude: 0,
            longitude: 0,
            postalCode: "",
            city: "",
            scheduledTime: "07:00",
            orderIndex: fields.length,
        });
    }

    function handleStopAddressSelect(index: number, details: PlaceDetails) {
        setValue(`stops.${index}.address`, details.formattedAddress, { shouldValidate: true });
        setValue(`stops.${index}.latitude`, details.lat);
        setValue(`stops.${index}.longitude`, details.lng);
        setValue(`stops.${index}.postalCode`, details.postalCode ?? "");
        setValue(`stops.${index}.city`, details.city ?? "");
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
            {/* ── Route Details ── */}
            <FormSection title={t("routes.title")} description={t("routes.description")}>
                <FormGrid>
                    <div className="space-y-2">
                        <Label htmlFor="name">{t("routes.name")}</Label>
                        <Input id="name" {...register("name")} />
                        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="schoolId">{t("routes.school")}</Label>
                        <Select onValueChange={(val) => setValue("schoolId", val)} defaultValue={initialData?.schoolId || ""}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select School" />
                            </SelectTrigger>
                            <SelectContent>
                                {schools.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.schoolId && <p className="text-red-500 text-xs">{errors.schoolId.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="driverId">{t("routes.driver")}</Label>
                        <Select onValueChange={(val) => setValue("driverId", val)} defaultValue={initialData?.driverId || ""}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Driver" />
                            </SelectTrigger>
                            <SelectContent>
                                {drivers.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.driverId && <p className="text-red-500 text-xs">{errors.driverId.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="capacity">{t("routes.capacity")}</Label>
                        <Input id="capacity" type="number" {...register("capacity")} />
                        {errors.capacity && <p className="text-red-500 text-xs">{errors.capacity.message}</p>}
                    </div>
                </FormGrid>
            </FormSection>

            {/* ── Schedule ── */}
            <FormSection title={t("routes.schedule")} description="Operational days and times.">
                <FormGrid>
                    <div className="space-y-2">
                        <Label htmlFor="startTime">{t("routes.start_time")}</Label>
                        <Input id="startTime" type="time" {...register("startTime")} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endTime">{t("routes.end_time")}</Label>
                        <Input id="endTime" type="time" {...register("endTime")} />
                    </div>
                </FormGrid>
                <div className="grid grid-cols-5 gap-4 mt-4">
                    {(["monday", "tuesday", "wednesday", "thursday", "friday"] as const).map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                            <Checkbox
                                id={day}
                                checked={watch(day) as boolean}
                                onCheckedChange={(checked) => setValue(day, checked as boolean)}
                            />
                            <Label htmlFor={day} className="capitalize">{day}</Label>
                        </div>
                    ))}
                </div>
            </FormSection>

            {/* ── Stops ── */}
            <FormSection
                title="Route Stops"
                description="Add pickup stops in order. Search for an address to auto-fill coordinates."
            >
                <div className="space-y-4">
                    {fields.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                            No stops yet. Add a stop to begin building the route.
                        </p>
                    )}

                    {fields.map((field, index) => (
                        <div
                            key={field.id}
                            className="relative border rounded-lg p-4 space-y-3 bg-muted/20"
                        >
                            {/* Stop header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    Stop {index + 1}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <FormGrid>
                                {/* Stop name */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Stop Name*</Label>
                                    <Input
                                        placeholder="e.g. Ribbings väg Corner"
                                        {...register(`stops.${index}.name`)}
                                    />
                                    {errors.stops?.[index]?.name && (
                                        <p className="text-xs text-destructive">
                                            {errors.stops[index]?.name?.message}
                                        </p>
                                    )}
                                </div>

                                {/* Scheduled time */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Scheduled Time*</Label>
                                    <Input type="time" {...register(`stops.${index}.scheduledTime`)} />
                                    {errors.stops?.[index]?.scheduledTime && (
                                        <p className="text-xs text-destructive">
                                            {errors.stops[index]?.scheduledTime?.message}
                                        </p>
                                    )}
                                </div>
                            </FormGrid>

                            {/* Address autocomplete */}
                            <div className="space-y-1.5">
                                <Label className="text-xs">Address*</Label>
                                <AddressAutocomplete
                                    value={watch(`stops.${index}.address`)}
                                    onChange={(val) =>
                                        setValue(`stops.${index}.address`, val, { shouldValidate: true })
                                    }
                                    onSelect={(details) => handleStopAddressSelect(index, details)}
                                    placeholder="Search for stop address…"
                                    error={errors.stops?.[index]?.address?.message}
                                />
                            </div>

                            {/* Derived read-only fields */}
                            <div className="grid grid-cols-4 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">City</Label>
                                    <Input
                                        readOnly
                                        value={watch(`stops.${index}.city`) || ""}
                                        placeholder="—"
                                        className="h-8 text-xs bg-muted/40"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Postal</Label>
                                    <Input
                                        readOnly
                                        value={watch(`stops.${index}.postalCode`) || ""}
                                        placeholder="—"
                                        className="h-8 text-xs bg-muted/40"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Lat</Label>
                                    <Input
                                        readOnly
                                        value={watch(`stops.${index}.latitude`) || ""}
                                        placeholder="—"
                                        className="h-8 text-xs bg-muted/40 font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Lng</Label>
                                    <Input
                                        readOnly
                                        value={watch(`stops.${index}.longitude`) || ""}
                                        placeholder="—"
                                        className="h-8 text-xs bg-muted/40 font-mono"
                                    />
                                </div>
                            </div>

                            {/* Hidden inputs for submission */}
                            <input type="hidden" {...register(`stops.${index}.latitude`, { valueAsNumber: true })} />
                            <input type="hidden" {...register(`stops.${index}.longitude`, { valueAsNumber: true })} />
                            <input type="hidden" {...register(`stops.${index}.postalCode`)} />
                            <input type="hidden" {...register(`stops.${index}.city`)} />
                            <input type="hidden" {...register(`stops.${index}.orderIndex`, { valueAsNumber: true })} value={index} />
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={addStop}
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Stop
                    </Button>
                </div>
            </FormSection>

            {/* ── Footer ── */}
            <div className="flex justify-end gap-4 py-2 sticky bottom-0 bg-background border-t -mx-1 px-1">
                <Button variant="outline" type="button" onClick={onCancel}>
                    {t("example_form.cancel")}
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? t("login.loading") : t("example_form.save")}
                </Button>
            </div>
        </form>
    );
}
