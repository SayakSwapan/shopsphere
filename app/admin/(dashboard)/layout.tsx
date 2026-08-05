import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/layout/admin-shell";
import { getAdminCookie } from "@/lib/admin-cookie";
import { verifyAdminToken } from "@/lib/admin-jwt";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getAdminCookie();

  if (!token) {
    redirect("/admin/login");
  }

  const payload = await verifyAdminToken(token);

  if (!payload || payload.role !== "ADMIN") {
    redirect("/admin/login");
  }

  let admin;
  try {
    admin = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: { name: true, email: true },
    });
  } catch {
    redirect("/admin/login");
  }

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      user={{
        name: admin.name ?? "Admin",
        email: admin.email ?? "",
      }}
    >
      {children}
    </AdminShell>
  );
}