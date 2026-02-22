"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ConsentModal } from "@/components/consent/consent-modal";
import { NotificationProvider } from "@/components/NotificationProvider";
import "@/lib/i18n"; // Initialize i18n

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <ConsentModal />
        <NotificationProvider />
      </QueryClientProvider>
    </SessionProvider>
  );
}
