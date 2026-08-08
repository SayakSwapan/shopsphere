import Link from "next/link";
import RegisterForm from "@/components/auth/register-form";
import SiteBrand from "@/components/brand/site-brand";
import { getSiteSettings, getSiteName } from "@/lib/site-settings";

export default async function RegisterPage() {
  const settings = await getSiteSettings();
  const siteName = getSiteName(settings);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: "var(--t-bg-page)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-6 sm:p-8 border"
        style={{
          background: "var(--t-bg-card)",
          borderColor: "var(--t-border-card)",
        }}
      >
        <Link
          href="/"
          className="inline-block text-2xl font-black tracking-tight"
          style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text-heading)" }}
        >
          <SiteBrand name={siteName} />
        </Link>

        <h1
          className="mt-4 text-4xl font-black uppercase mb-2"
          style={{ color: "var(--t-text-heading)" }}
        >
          Join {siteName}
        </h1>

        <p className="mb-8 text-sm" style={{ color: "var(--t-text-muted-1)" }}>
          Create your account and start shopping.
        </p>

        <RegisterForm />

        <div className="mt-8 text-center">
          <span className="text-sm" style={{ color: "var(--t-text-muted-1)" }}>
            Already have an account?
          </span>

          <Link
            href="/login"
            className="ml-2 font-bold transition hover:opacity-80"
            style={{ color: "var(--t-primary)" }}
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
