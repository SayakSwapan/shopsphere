"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ForgotPasswordForm from "./forgot-password-form";
import PhoneLoginForm from "./phone-login-form";

export default function LoginForm() {
  const router = useRouter();

  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      setLoading(false);

      if (result?.error) {
        toast.error("Invalid email or password");
        return;
      }

      toast.success("Welcome back!");
      router.push("/");
      router.refresh();
    } catch {
      setLoading(false);
      toast.error("Something went wrong");
    }
  }

  async function handleGoogleLogin() {
    try {
      setGoogleLoading(true);
      await signIn("google", { callbackUrl: "/" });
    } catch {
      toast.error("Google sign-in is not configured yet.");
    } finally {
      setGoogleLoading(false);
    }
  }

  if (showForgotPassword) {
    return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Google Sign-In */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border-card bg-bg-card-nested font-semibold text-text-heading transition hover:bg-bg-card-alt disabled:cursor-not-allowed disabled:opacity-60"
      >
        {googleLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        Continue with Google
      </button>

      <div className="relative flex items-center gap-4">
        <div className="h-px flex-1 bg-border-subtle" />
        <span className="text-xs text-text-muted-2">or</span>
        <div className="h-px flex-1 bg-border-subtle" />
      </div>

      <div className="flex rounded-xl border border-border-card bg-bg-card-nested p-1">
        <button
          type="button"
          onClick={() => setLoginMethod("email")}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
            loginMethod === "email"
              ? "bg-primary text-button-text"
              : "text-text-muted-1 hover:text-text-heading"
          }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setLoginMethod("phone")}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
            loginMethod === "phone"
              ? "bg-primary text-button-text"
              : "text-text-muted-1 hover:text-text-heading"
          }`}
        >
          Phone
        </button>
      </div>

      {loginMethod === "phone" ? (
        <PhoneLoginForm onBack={() => setLoginMethod("email")} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-text-heading">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-xl border border-border-card bg-bg-card-nested px-4 py-3 text-text-heading outline-none transition focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-text-heading">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border border-border-card bg-bg-card-nested px-4 py-3 pr-12 text-text-heading outline-none transition focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted-2"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-xs font-medium transition hover:opacity-80"
              style={{ color: "var(--t-primary)" }}
            >
              Forgot Password?
            </button>
          </div>

          <button
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-xl font-bold transition disabled:opacity-60"
            style={{ background: "var(--t-primary)", color: "var(--t-button-text)" }}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              "Login"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
