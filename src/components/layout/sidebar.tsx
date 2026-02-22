
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
    <aside className={cn("w-64 bg-white dark:bg-gray-800 border-r flex flex-col h-full", className)}>
      <div className="p-6 font-bold text-xl border-b h-16 flex items-center">
        {t("login.title", "SchoolBus App")}
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2 space-y-1">
          {NAV_ITEMS.map((item, idx) => (
            <RoleGuard key={`${idx}-${item.href}`} allowedRoles={item.roles}>
              <Link 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === item.href 
                    ? "bg-primary/10 text-primary" 
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title} 
              </Link>
            </RoleGuard>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t">
        <LanguageSwitcher />
        <div className="mt-4 text-xs text-center text-muted-foreground">
            v1.0.0
        </div>
      </div>
    </aside>
  );
}
