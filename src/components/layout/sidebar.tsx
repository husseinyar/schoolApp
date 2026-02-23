"use client";

import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";
import { RoleGuard } from "@/components/auth/role-guard";
import { NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const { t } = useTranslation("common");
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "w-64 flex flex-col h-full",
        "bg-slate-50 dark:bg-slate-900",
        "border-r border-slate-200 dark:border-slate-800",
        "shadow-sm",
        className
      )}
    >
      {/* Logo / Title */}
      <div className="px-6 h-16 flex items-center border-b border-slate-200 dark:border-slate-800">
        <span className="text-xl font-semibold tracking-tight text-slate-800 dark:text-white">
          {t("login.title", "SchoolBus Admin")}
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1">
          {NAV_ITEMS.map((item, idx) => {
            const active = pathname === item.href;

            return (
              <RoleGuard key={`${idx}-${item.href}`} allowedRoles={item.roles}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                    "transition-all duration-200",

                    active
                      ? [
                          "bg-indigo-50 dark:bg-indigo-500/10",
                          "text-indigo-600 dark:text-indigo-400",
                          "shadow-sm",
                        ]
                      : [
                          "text-slate-600 dark:text-slate-300",
                          "hover:bg-slate-100 dark:hover:bg-slate-800",
                          "hover:text-slate-900 dark:hover:text-white",
                        ]
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      active
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                    )}
                  />

                  {item.title}
                </Link>
              </RoleGuard>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <LanguageSwitcher />

        <div className="mt-4 text-xs text-center text-slate-400">
          SchoolBus Admin v1.0.0
        </div>
      </div>
    </aside>
  );
}