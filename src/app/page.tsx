import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/** Root page — immediately redirect every user to their role-specific home. */
export default async function RootPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const role = session.user.role;
  if (role === "DRIVER") redirect("/driver");
  if (role === "PARENT") redirect("/parent");
  // ADMIN (or any other role)
  redirect("/dashboard");
}
