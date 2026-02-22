"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "sv" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <Button onClick={toggleLanguage} className="text-xs h-8 px-2">
      {i18n.language === "en" ? "🇸🇪 SV" : "🇬🇧 EN"}
    </Button>
  );
}
