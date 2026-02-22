
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { Route, School, User } from "@prisma/client";

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
});

type RouteFormData = z.infer<typeof routeSchema>;

interface RouteFormProps {
  initialData?: Route;
  onSubmit: (data: RouteFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

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
    },
  });

  // Fetch lists
  useEffect(() => {
    // Fetch Schools
    fetch("/api/schools?limit=100").then(res => res.json()).then(json => {
        if(json.success) setSchools(json.data.schools);
    });

    // Fetch Drivers (Users with role DRIVER)
    // NOTE: In a real app we might need a specific endpoint filter. 
    // Re-using GET /api/users, but we need to filter client-side or add parameter filter
    // Let's assume for now we list all users and filter in UI or add 'role=DRIVER' to API if supported.
    // The current Users API supports role filtering!
    fetch("/api/users?role=DRIVER&limit=100").then(res => res.json()).then(json => {
        if(json.success) setDrivers(json.data.users);
    });
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormSection
        title={t("routes.title")}
        description={t("routes.description")}
      >
        <FormGrid>
          <div className="space-y-2">
            <Label htmlFor="name">{t("routes.name")}</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>
          
           <div className="space-y-2">
            <Label htmlFor="schoolId">{t("routes.school")}</Label>
            <Select 
                onValueChange={(val) => setValue("schoolId", val)} 
                defaultValue={initialData?.schoolId || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select School" />
              </SelectTrigger>
              <SelectContent>
                {schools.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.schoolId && <p className="text-red-500 text-xs">{errors.schoolId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="driverId">{t("routes.driver")}</Label>
            <Select 
                onValueChange={(val) => setValue("driverId", val)} 
                defaultValue={initialData?.driverId || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map(d => (
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
             {["monday", "tuesday", "wednesday", "thursday", "friday"].map((day) => (
                 <div key={day} className="flex items-center space-x-2">
                    <Checkbox 
                        id={day} 
                        checked={watch(day as keyof RouteFormData) as boolean}
                        onCheckedChange={(checked) => setValue(day as keyof RouteFormData, checked as boolean)}
                    />
                    <Label htmlFor={day} className="capitalize">{day}</Label>
                 </div>
             ))}
         </div>
      </FormSection>

      <div className="flex justify-end gap-4">
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
