"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getLoginRedirect } from "@/lib/login-redirect";
import { useOptionalAuthModal } from "./auth-context";

export default function EmailOtpLoginForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const authModal = useOptionalAuthModal();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (cooldown > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to send OTP");
        return;
      }

      toast.success("OTP sent to your email!");
      setOtpSent(true);
      setCooldown(30);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Verification failed");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        phoneOtpToken: data.token,
      });

      setLoading(false);

      if (result?.error) {
        toast.error("Login failed after verification");
        return;
      }

      toast.success("Welcome back!");

      const redirectTo = getLoginRedirect("/");
      const currentUrl = window.location.pathname + window.location.search;

      authModal?.closeAuth();

      if (redirectTo === currentUrl) {
        router.refresh();
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } catch {
      setLoading(false);
      toast.error("Something went wrong");
    }
  }

  if (otpSent) {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-5">
        <button
          type="button"
          onClick={() => {
            setOtpSent(false);
            setOtp("");
          }}
          className="flex items-center gap-2 text-sm text-text-muted-1 hover:text-text-heading transition"
        >
          <ArrowLeft size={14} />
          Change email address
        </button>

        <div className="rounded-xl border border-success/30 bg-success/10 p-3">
          <div className="flex items-center gap-2 text-sm text-success">
            <CheckCircle size={16} />
            <span>
              OTP sent to <strong>{email}</strong>
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-text-heading">
            Enter OTP
          </label>
          <input
            type="text"
            inputMode="numeric"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="6-digit code"
            className="w-full rounded-xl border border-border-card bg-bg-card-nested px-4 py-3 text-center text-2xl tracking-[0.5em] text-text-heading outline-none transition focus:border-primary"
          />
        </div>

        <button
          disabled={loading || otp.length !== 6}
          className="flex h-12 w-full items-center justify-center rounded-xl font-bold transition disabled:opacity-60"
          style={{ background: "var(--t-primary)", color: "var(--t-button-text)" }}
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            "Verify & Login"
          )}
        </button>

        <div className="text-center">
          {cooldown > 0 ? (
            <span className="text-xs text-text-muted-2">
              Resend OTP in {cooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleRequestOtp}
              className="text-xs font-medium transition hover:opacity-80"
              style={{ color: "var(--t-primary)" }}
            >
              Resend OTP
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequestOtp} className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-text-muted-1 hover:text-text-heading transition"
      >
        <ArrowLeft size={14} />
        Back to password login
      </button>

      <div>
        <label className="mb-2 block text-sm font-semibold text-text-heading">
          Email Address
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-border-card bg-bg-card-nested px-4 py-3 text-text-heading outline-none transition focus:border-primary"
        />
        <p className="mt-1 text-xs text-text-muted-2">
          We&apos;ll send a login OTP to this email
        </p>
      </div>

      <button
        disabled={loading || !email || cooldown > 0}
        className="flex h-12 w-full items-center justify-center rounded-xl font-bold transition disabled:opacity-60"
        style={{ background: "var(--t-primary)", color: "var(--t-button-text)" }}
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : cooldown > 0 ? (
          `Resend in ${cooldown}s`
        ) : (
          "Send OTP"
        )}
      </button>
    </form>
  );
}
