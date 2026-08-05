import LoginForm from "@/components/auth/login-form";
import Link from "next/link";
export default function LoginPage() {
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
          Welcome Back
        </p>

        <h1
          className="text-4xl font-black uppercase mb-8"
          style={{ color: "#fff" }}
        >
          Login
        </h1>

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