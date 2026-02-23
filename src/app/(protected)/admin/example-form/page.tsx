
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { FormGrid, FormSection } from "@/components/ui/form-layout";
import { useTranslation } from "react-i18next";

export default function ExampleFormPage() {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("example_form.title")}
        description={t("example_form.description")}
      >
        <Button variant="outline">{t("example_form.cancel")}</Button>
        <Button>{t("example_form.save")}</Button>
      </PageHeader>

      <FormSection
        title={t("example_form.personal_info")}
        description={t("example_form.description")}
      >
        <FormGrid>
          <div className="space-y-2">
            <Label htmlFor="firstName">{t("example_form.first_name")}</Label>
            <Input id="firstName" placeholder="John" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">{t("example_form.last_name")}</Label>
            <Input id="lastName" placeholder="Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("example_form.email")}</Label>
            <Input id="email" type="email" placeholder="john@example.com" />
          </div>
        </FormGrid>
      </FormSection>

      <FormSection
        title={t("example_form.preferences")}
        description={t("example_form.description")}
      >
        <FormGrid>
          <div className="space-y-2">
            <Label htmlFor="language">{t("example_form.language")}</Label>
            <Input id="language" placeholder="English" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme">{t("example_form.theme")}</Label>
            <Input id="theme" placeholder="Light" />
          </div>
        </FormGrid>
      </FormSection>
    </div>
  );
}
