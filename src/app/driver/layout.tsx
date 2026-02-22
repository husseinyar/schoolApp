import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout as DashboardShell } from "@/components/layout/dashboard-layout";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");
  if (session.user.role !== "DRIVER") redirect("/dashboard");
  return <DashboardShell>{children}</DashboardShell>;
}
