
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormGrid, FormSection } from "@/components/ui/form-layout";
import { School } from "@prisma/client";

const schoolSchema = z.object({
  name: z.string().min(1, "Name is required"),
  addressStreet: z.string().min(1, "Street is required"),
  addressCity: z.string().min(1, "City is required"),
  addressPostal: z.string().min(1, "Postal code is required"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

interface SchoolFormProps {
  initialData?: School;
  onSubmit: (data: SchoolFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SchoolForm({ initialData, onSubmit, onCancel, isLoading }: SchoolFormProps) {
  const { t } = useTranslation("common");
  const isEdit = !!initialData?.id;

  const {
      register,
      handleSubmit,
      formState: { errors },
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      addressStreet: initialData?.addressStreet || "",
      addressCity: initialData?.addressCity || "",
      addressPostal: initialData?.addressPostal || "",
      latitude: initialData?.latitude || 0,
      longitude: initialData?.longitude || 0,
      contactEmail: initialData?.contactEmail || "",
      contactPhone: initialData?.contactPhone || "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormSection
        title={t("schools.name")}
        description={t("schools.description")}
      >
        <FormGrid>
          <div className="space-y-2">
            <Label htmlFor="name">{t("schools.name")}</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="contactEmail">{t("schools.contact_email")}</Label>
            <Input id="contactEmail" type="email" {...register("contactEmail")} />
            {errors.contactEmail && <p className="text-red-500 text-xs">{errors.contactEmail.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">{t("schools.contact_phone")}</Label>
            <Input id="contactPhone" {...register("contactPhone")} />
          </div>
        </FormGrid>
      </FormSection>

      <FormSection
        title="Address & Location"
        description="Physical location of the school."
      >
        <FormGrid>
          <div className="space-y-2">
            <Label htmlFor="addressStreet">{t("schools.address_street")}</Label>
            <Input id="addressStreet" {...register("addressStreet")} />
            {errors.addressStreet && <p className="text-red-500 text-xs">{errors.addressStreet.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressCity">{t("schools.address_city")}</Label>
            <Input id="addressCity" {...register("addressCity")} />
            {errors.addressCity && <p className="text-red-500 text-xs">{errors.addressCity.message}</p>}
          </div>
          <div className="space-y-2">
             <Label htmlFor="addressPostal">{t("schools.address_postal")}</Label>
             <Input id="addressPostal" {...register("addressPostal")} />
             {errors.addressPostal && <p className="text-red-500 text-xs">{errors.addressPostal.message}</p>}
          </div>
          <div className="space-y-2">
             <Label htmlFor="latitude">{t("schools.latitude")}</Label>
             <Input id="latitude" type="number" step="any" {...register("latitude")} />
             {errors.latitude && <p className="text-red-500 text-xs">{errors.latitude.message}</p>}
          </div>
          <div className="space-y-2">
             <Label htmlFor="longitude">{t("schools.longitude")}</Label>
             <Input id="longitude" type="number" step="any" {...register("longitude")} />
             {errors.longitude && <p className="text-red-500 text-xs">{errors.longitude.message}</p>}
          </div>
        </FormGrid>
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
