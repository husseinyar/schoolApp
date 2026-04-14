
"use client";

import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex w-64 flex-shrink-0" />
      
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 md:p-8 animate-in fade-in duration-500">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
