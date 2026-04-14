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
        "bg-slate-950/80 backdrop-blur-xl",
        "border-r border-white/5",
        "shadow-2xl z-20",
        className
      )}
    >
      {/* Logo / Title */}
      <div className="px-6 h-20 flex items-center border-b border-white/5">
        <span className="text-xl font-bold tracking-tighter text-white bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
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
                    "group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold",
                    "transition-all duration-300",
 
                    active
                      ? [
                          "bg-indigo-500/10 border border-indigo-500/20",
                          "text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]",
                        ]
                      : [
                          "text-slate-400",
                          "hover:bg-white/5 hover:text-white hover:translate-x-1",
                        ]
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                      active
                        ? "text-indigo-400"
                        : "text-slate-500 group-hover:text-indigo-300"
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