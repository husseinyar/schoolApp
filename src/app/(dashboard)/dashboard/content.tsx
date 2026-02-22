"use client";

import { useTranslation } from "react-i18next";

export function DashboardContent({ userName }: { userName?: string | null }) {
  const { t } = useTranslation("common");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("dashboard")}</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        {t("welcome")}, {userName}!
      </p>
      
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[
            { label: t("active_routes"), value: "12" },
            { label: t("students_onboard"), value: "145" },
            { label: t("pending_requests"), value: "3" }
        ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{stat.value}</dd>
            </div>
        ))}
      </div>
    </div>
  );
}
