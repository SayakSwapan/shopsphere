import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import {
  UserCircle,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  BadgeCheck,
  Lock,
} from "lucide-react";

import AdminProfileForm from "@/components/admin/profile/admin-profile-form";
import AdminPasswordForm from "@/components/admin/profile/password-form";
import { getAdminCookie } from "@/lib/admin-cookie";
import { verifyAdminToken } from "@/lib/admin-jwt";

export default async function AdminProfilePage() {
  const token = await getAdminCookie();

  if (!token) {
    redirect("/admin/login");
  }

  const payload = await verifyAdminToken(token);

  if (!payload?.id) {
    redirect("/admin/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: payload.id as string,
    },
  });

  if (!user) {
    redirect("/admin/login");
  }

  const details = [
    { icon: Mail, label: "Email", value: user.email },
    { icon: Phone, label: "Phone", value: user.phone || "Not set" },
    { icon: ShieldCheck, label: "Role", value: user.role },
    {
      icon: BadgeCheck,
      label: "Status",
      value: user.isActive ? "Active" : "Disabled",
    },
    {
      icon: Calendar,
      label: "Member Since",
      value: format(new Date(user.createdAt), "dd MMM yyyy"),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">My Profile</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage your administrator account details.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-12">
        {/* IDENTITY CARD */}
        <div className="xl:col-span-4">
          <div className="rounded-3xl border border-white/10 bg-[#111827] p-8 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/15">
              <UserCircle size={64} className="text-amber-400" />
            </div>

            <h2 className="mt-4 text-2xl font-bold text-white">
              {user.name || "Administrator"}
            </h2>
            <p className="text-sm text-slate-400">{user.email}</p>

            <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <ShieldCheck size={13} />
              {user.role}
            </span>

            <div className="mt-8 space-y-4 text-left">
              {details.map((d) => {
                const Icon = d.icon;
                return (
                  <div key={d.label} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white/5 text-amber-400">
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">
                        {d.label}
                      </p>
                      <p className="truncate text-sm font-semibold text-white">
                        {d.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* EDIT CARD */}
        <div className="xl:col-span-8 space-y-8">
          <div className="rounded-3xl border border-white/10 bg-[#111827] overflow-hidden">
            <div className="border-b border-white/10 px-8 py-6">
              <h2 className="text-xl font-bold text-white">
                Account Information
              </h2>
              <p className="text-sm text-slate-400">
                Update your name and contact number.
              </p>
            </div>

            <div className="p-8">
              <AdminProfileForm
                initialName={user.name || ""}
                initialPhone={user.phone || ""}
                initialEmail={user.email}
              />
            </div>
          </div>

          {/* PASSWORD CHANGE */}
          <div className="rounded-3xl border border-white/10 bg-[#111827] overflow-hidden">
            <div className="border-b border-white/10 px-8 py-6 flex items-center gap-3">
              <Lock size={20} className="text-amber-400" />
              <div>
                <h2 className="text-xl font-bold text-white">
                  Change Password
                </h2>
                <p className="text-sm text-slate-400">
                  Update your account password for security.
                </p>
              </div>
            </div>

            <div className="p-8">
              <AdminPasswordForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
