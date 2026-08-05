import Link from "next/link";
import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
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
          Welcome Back
        </h1>

        <p className="text-slate-400 mb-8">
          Login to continue shopping.
        </p>

        <LoginForm />

        <div className="mt-8 text-center">

          <span className="text-slate-400">
            Don&apos;t have an account?
          </span>

          <Link
            href="/register"
            className="ml-2 font-bold text-amber-400 hover:text-amber-300"
          >
            Create Account
          </Link>

        </div>

      </div>

    </div>
  );
}