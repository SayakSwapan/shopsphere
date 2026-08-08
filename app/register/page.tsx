import Link from "next/link";
import RegisterForm from "@/components/auth/register-form";
import SiteBrand from "@/components/brand/site-brand";
import { getSiteSettings, getSiteName } from "@/lib/site-settings";

export default async function RegisterPage() {
  const settings = await getSiteSettings();
  const siteName = getSiteName(settings);

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-10"
      style={{ background: "var(--t-bg-page)" }}
    >
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full blur-[120px] opacity-20"
        style={{ background: "var(--t-primary)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-[120px] opacity-10"
        style={{ background: "var(--t-accent)" }}
      />

      <div
        className="relative w-full max-w-md rounded-3xl p-6 sm:p-8 border"
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

        <p
          className="text-xs uppercase tracking-[0.3em] mb-3"
          style={{ color: "var(--t-primary)" }}
        >
          Join {siteName}
        </p>

        <h1
          className="text-4xl font-black uppercase mb-8"
          style={{ color: "var(--t-text-heading)" }}
        >
          Create Account
        </h1>

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
