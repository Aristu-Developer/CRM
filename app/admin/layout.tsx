import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/admin";
import { AdminShell } from "@/components/layout/AdminShell";

export const metadata = { title: "Platform Admin — Nepal CRM" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Defense in depth: middleware already blocks non-admins, but double-check here.
  if (!session) redirect("/login");
  if (!isPlatformAdmin(session)) redirect("/dashboard");

  return <AdminShell>{children}</AdminShell>;
}
