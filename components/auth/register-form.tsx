"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useOptionalAuthModal } from "./auth-context";

export default function RegisterForm() {
  const router = useRouter();
  const authModal = useOptionalAuthModal();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const passwordStrength =
    form.password.length >= 10
      ? "Strong"
      : form.password.length >= 6
      ? "Medium"
      : "Weak";

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message ?? "Registration failed.");
        return;
      }

      toast.success("Account created! Please verify your email.");
      authModal?.closeAuth();
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    await signIn("google", { callbackUrl: "/" });
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border-card bg-bg-card-nested font-semibold text-text-heading transition hover:bg-bg-card-alt"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign up with Google
      </button>

      <div className="relative flex items-center gap-4">
        <div className="h-px flex-1 bg-border-subtle" />
        <span className="text-xs text-text-muted-2">or</span>
        <div className="h-px flex-1 bg-border-subtle" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-text-heading">
            Full Name
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="John Doe"
            className="w-full rounded-xl border border-border-card bg-bg-card-nested px-4 py-3 text-text-heading outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-text-heading">
            Email
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="example@gmail.com"
            className="w-full rounded-xl border border-border-card bg-bg-card-nested px-4 py-3 text-text-heading outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-text-heading">
            Phone
          </label>
          <input
            required
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="9876543210"
            className="w-full rounded-xl border border-border-card bg-bg-card-nested px-4 py-3 text-text-heading outline-none focus:border-primary"
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
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              className="w-full rounded-xl border border-border-card bg-bg-card-nested px-4 py-3 pr-12 text-text-heading outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted-2"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <CheckCircle2
              size={15}
              className={
                passwordStrength === "Strong"
                  ? "text-success"
                  : passwordStrength === "Medium"
                  ? "text-accent"
                  : "text-danger"
              }
            />
            <span
              className={
                passwordStrength === "Strong"
                  ? "text-success"
                  : passwordStrength === "Medium"
                  ? "text-accent"
                  : "text-danger"
              }
            >
              {passwordStrength} Password
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-text-heading">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              value={form.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              className="w-full rounded-xl border border-border-card bg-bg-card-nested px-4 py-3 pr-12 text-text-heading outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted-2"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          disabled={loading}
          className="flex h-12 w-full items-center justify-center rounded-xl font-bold transition disabled:opacity-60"
          style={{ background: "var(--t-primary)", color: "var(--t-button-text)" }}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Create Account"}
        </button>
      </form>
    </div>
  );
}
