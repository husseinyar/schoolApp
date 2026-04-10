
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
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
import { Role } from "@/lib/types"; // Import from your types file, NOT @prisma/client
import { useState } from "react";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.nativeEnum(Role),
  schoolId: z.string().optional(), // In real app, this would be a select from schools
  password: z.string().min(6).optional().or(z.literal("")),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: UserFormData & { id?: string }; // id optional for create
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function UserForm({ initialData, onSubmit, onCancel, isLoading }: UserFormProps) {
  const { t } = useTranslation("common");
  const isEdit = !!initialData?.id;

  const {
      register,
      handleSubmit,
      formState: { errors },
      setValue,
      watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      role: initialData?.role || "PARENT",
      schoolId: initialData?.schoolId || "",
    },
  });

  const role = watch("role");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormSection
        title={isEdit ? t("users.edit_user") : t("users.add_user")}
        description={t("users.description")}
      >
        <FormGrid>
          <div className="space-y-2">
            <Label htmlFor="name">{t("users.name")}</Label>
            <Input id="name" {...register("name")} placeholder="John Doe" />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("users.email")}</Label>
            <Input id="email" type="email" {...register("email")} placeholder="john@example.com" />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">{t("users.role")}</Label>
            <Select 
                onValueChange={(val) => setValue("role", val as Role)} 
                defaultValue={role}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Role).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-red-500 text-xs">{errors.role.message}</p>}
          </div>

          {/* Password field - required for new users, optional for edit */}
          <div className="space-y-2">
             <Label htmlFor="password">{t("login.password_label")}</Label>
             <Input 
                id="password" 
                type="password" 
                {...register("password")} 
                placeholder={isEdit ? "Unchanged" : "******"} 
             />
             {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
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
