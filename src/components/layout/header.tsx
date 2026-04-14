"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
import { UserNav } from "./user-nav";
import { LanguageSwitcher } from "@/components/language-switcher";

export function Header() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 w-full">
      <div
        className="
          flex h-20 items-center justify-between px-4 sm:px-8
          border-b border-white/5
          bg-slate-950/40 backdrop-blur-xl
        "
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="
                  md:hidden
                  border-slate-200 dark:border-slate-800
                  bg-white dark:bg-slate-900
                  hover:bg-slate-50 dark:hover:bg-slate-800
                "
                suppressHydrationWarning
              >
                {mounted ? (
                  <Menu className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                ) : (
                  <div className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="p-0 w-72 border-r border-slate-200 dark:border-slate-800"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <Sidebar className="border-none w-full" />
            </SheetContent>
          </Sheet>

          {/* Mobile title */}
          <div className="md:hidden">
            <div className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
              SchoolBus Admin
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Driver & routes dashboard
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className="
              hidden sm:flex items-center gap-3
              rounded-full border border-slate-200 dark:border-slate-800
              bg-white dark:bg-slate-900
              px-3 py-1.5
            "
          >
            <LanguageSwitcher />
          </div>

          <UserNav />
        </div>
      </div>
    </header>
  );
}