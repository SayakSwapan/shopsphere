import Link from "next/link";
import LoginForm from "@/components/auth/login-form";
import SiteBrand from "@/components/brand/site-brand";
import { getSiteSettings, getSiteName } from "@/lib/site-settings";

export default async function LoginPage() {
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
          Welcome Back
        </h1>

        <p className="mb-8 text-sm" style={{ color: "var(--t-text-muted-1)" }}>
          Login to continue shopping at {siteName}.
        </p>

        <LoginForm />

        <div className="mt-8 text-center">
          <span className="text-sm" style={{ color: "var(--t-text-muted-1)" }}>
            Don&apos;t have an account?
          </span>

          <Link
            href="/register"
            className="ml-2 font-bold transition hover:opacity-80"
            style={{ color: "var(--t-primary)" }}
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
