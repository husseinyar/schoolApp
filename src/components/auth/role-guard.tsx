
"use client";

import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { ReactNode } from "react";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: Role[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null; // Or a loading spinner
  }

  if (!session?.user?.role) {
    return <>{fallback}</>;
  }

  if (allowedRoles.includes(session.user.role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
