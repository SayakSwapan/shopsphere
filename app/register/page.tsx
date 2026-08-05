import Link from "next/link";
import RegisterForm from "@/components/auth/register-form";
import { getSiteSettings, getSiteName } from "@/lib/site-settings";

export default async function RegisterPage() {
  const settings = await getSiteSettings();
  const siteName = getSiteName(settings);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(135deg,#0A0F1E 0%,#0D1424 60%,#111827 100%)",
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-6 sm:p-8"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p
          className="text-xs uppercase tracking-[0.3em] mb-3"
          style={{ color: "#F5A623" }}
        >
          Join {siteName}
        </p>

        <h1
          className="text-4xl font-black uppercase mb-8"
          style={{ color: "#fff" }}
        >
          Create Account
        </h1>

        <RegisterForm />

        <div className="mt-8 text-center">
          <span className="text-slate-400">
            Already have an account?
          </span>

          <Link
            href="/login"
            className="ml-2 font-bold text-amber-400 hover:text-amber-300"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}