import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import ProfileForm from "@/components/store/account/profile-form";
import PasswordForm from "@/components/store/account/password-form";
import AddressList from "@/components/store/account/address-list";
import { User, MapPin, Lock } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      addresses: {
        orderBy: {
          isDefault: "desc",
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const hasPassword = !!user.password;

  return (
    <div className="min-h-screen bg-bg-page">

      <NavbarWrapper />

      {/* Hero */}

      <section
        className="relative overflow-hidden border-b"
        style={{ borderColor: "var(--t-border-subtle)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at top right,color-mix(in srgb,var(--t-primary) 12%,transparent),transparent 35%)`,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <p
                className="uppercase tracking-[0.3em] text-xs font-bold"
                style={{ color: "var(--t-primary)" }}
              >
                My Account
              </p>

              <h1
                className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black"
                style={{ color: "var(--t-text-heading)" }}
              >
                Welcome Back
              </h1>

              <p
                className="mt-3 max-w-xl"
                style={{ color: "var(--t-text-muted-1)" }}
              >
                Manage your profile information, saved delivery
                addresses and account settings.
              </p>
            </div>

            <div
              className="border p-6"
              style={{
                borderRadius: "var(--t-radius-card)",
                borderColor: "var(--t-border-card)",
                background: "var(--t-bg-card)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ background: "var(--t-primary)", color: "var(--t-bg-page)" }}
                >
                  <User size={38} />
                </div>

                <div>
                  <h2
                    className="text-2xl font-bold"
                    style={{ color: "var(--t-text-heading)" }}
                  >
                    {user.name || "Customer"}
                  </h2>

                  <p style={{ color: "var(--t-text-muted-1)" }}>
                    {user.email}
                  </p>

                  <p
                    className="mt-2 inline-flex px-3 py-1 text-xs font-bold"
                    style={{
                      borderRadius: "var(--t-radius-badge)",
                      background: "color-mix(in srgb, var(--t-success) 20%, transparent)",
                      color: "var(--t-success)",
                    }}
                  >
                    Verified Account
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid xl:grid-cols-12 gap-8">
          {/* Profile */}
          <div className="xl:col-span-8">
            <div
              className="overflow-hidden border"
              style={{
                borderRadius: "var(--t-radius-card)",
                borderColor: "var(--t-border-card)",
                background: "var(--t-bg-card)",
              }}
            >
              <div
                className="flex items-center gap-3 px-4 sm:px-8 py-4 sm:py-6 border-b"
                style={{ borderColor: "var(--t-border-subtle)" }}
              >
                <User style={{ color: "var(--t-primary)" }} size={20} />
                <h2
                  className="text-2xl font-bold"
                  style={{ color: "var(--t-text-heading)" }}
                >
                  Personal Information
                </h2>
              </div>
              <div className="p-5 sm:p-8">
                <ProfileForm user={user} />
              </div>
            </div>

            {/* Password Change / Set */}
            <div
              className="mt-8 overflow-hidden border"
              style={{
                borderRadius: "var(--t-radius-card)",
                borderColor: "var(--t-border-card)",
                background: "var(--t-bg-card)",
              }}
            >
              <div
                className="flex items-center gap-3 px-4 sm:px-8 py-4 sm:py-6 border-b"
                style={{ borderColor: "var(--t-border-subtle)" }}
              >
                <Lock style={{ color: "var(--t-primary)" }} size={20} />
                <h2
                  className="text-2xl font-bold"
                  style={{ color: "var(--t-text-heading)" }}
                >
                  {hasPassword ? "Change Password" : "Set Password"}
                </h2>
              </div>
              <div className="p-5 sm:p-8">
                <PasswordForm hasPassword={hasPassword} />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="xl:col-span-4">
            <div
              className="sticky top-28 overflow-hidden border"
              style={{
                borderRadius: "var(--t-radius-card)",
                borderColor: "var(--t-border-card)",
                background: "var(--t-bg-card)",
              }}
            >
              <div
                className="flex items-center gap-3 px-4 sm:px-8 py-4 sm:py-6 border-b"
                style={{ borderColor: "var(--t-border-subtle)" }}
              >
                <MapPin style={{ color: "var(--t-primary)" }} size={20} />
                <h2
                  className="text-2xl font-bold"
                  style={{ color: "var(--t-text-heading)" }}
                >
                  Saved Addresses
                </h2>
              </div>
              <div className="p-6">
                <AddressList addresses={user.addresses} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}