import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DashboardLayout as DashboardShell } from "@/components/layout/dashboard-layout";

/**
 * This layout wraps only the /dashboard and /admin pages.
 * It is ADMIN-only — drivers and parents are redirected to their portals.
 */
export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Hard role gate — non-admins should never reach these pages
  if (session.user.role === "DRIVER") redirect("/driver");
  if (session.user.role === "PARENT") redirect("/parent");

  return <DashboardShell>{children}</DashboardShell>;
}
