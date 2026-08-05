import Link from "next/link";
import RegisterForm from "@/components/auth/register-form";
import { getSiteSettings, getSiteName } from "@/lib/site-settings";

export default async function RegisterPage() {
  const settings = await getSiteSettings();
  const siteName = getSiteName(settings);

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center px-6">

      <div
        className="w-full max-w-md rounded-3xl p-8 border"
        style={{
          background: "#111827",
          borderColor: "rgba(255,255,255,.08)",
        }}
      >
        <h1 className="text-4xl font-black text-white mb-2">
          Join {siteName}
        </h1>

        <p className="text-slate-400 mb-8">
          Create your account and start shopping.
        </p>

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