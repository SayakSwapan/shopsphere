"use client";

import { useState } from "react";
import { Loader2, Eye, EyeOff, ArrowLeft, Mail, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";

type Step = "email" | "otp" | "reset";

interface Props {
  onBack: () => void;
}

export default function ForgotPasswordForm({ onBack }: Props) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.message);
        return;
      }

      toast.success("OTP sent to your email. Check your inbox.");
      setStep("otp");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }
    setStep("reset");
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.message);
        return;
      }

      toast.success("Password reset successful! You can now login.");
      onBack();
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-amber-400"
      >
        <ArrowLeft size={16} />
        Back to Login
      </button>

      {/* Step: Email */}
      {step === "email" && (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
              <Mail size={28} className="text-amber-400" />
            </div>
            <h2 className="mt-4 text-center text-2xl font-black text-white">
              Forgot Password?
            </h2>
            <p className="mt-2 text-center text-sm text-slate-400">
              Enter your email address and we&apos;ll send you a verification code to reset your password.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-xl font-bold transition"
            style={{ background: "#F5A623", color: "#0A0F1E" }}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              "Send Reset OTP"
            )}
          </button>
        </form>
      )}

      {/* Step: OTP Verification */}
      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
              <ShieldCheck size={28} className="text-amber-400" />
            </div>
            <h2 className="mt-4 text-center text-2xl font-black text-white">
              Enter OTP
            </h2>
            <p className="mt-2 text-center text-sm text-slate-400">
              We&apos;ve sent a 6-digit code to{" "}
              <span className="font-medium text-white">{email}</span>
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white">
              Verification Code
            </label>
            <input
              type="text"
              required
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(val);
              }}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center font-mono text-2xl tracking-[0.3em] text-white outline-none transition focus:border-amber-500"
            />
            <p className="mt-2 text-center text-xs text-slate-500">
              OTP expires in 10 minutes
            </p>
          </div>

          <button
            type="submit"
            disabled={otp.length !== 6}
            className="flex h-12 w-full items-center justify-center rounded-xl font-bold transition"
            style={{
              background: otp.length === 6 ? "#F5A623" : "rgba(255,255,255,0.06)",
              color: otp.length === 6 ? "#0A0F1E" : "#3A4455",
            }}
          >
            Verify OTP
          </button>

          <button
            type="button"
            onClick={handleSendOtp}
            disabled={loading}
            className="w-full text-center text-xs font-medium text-slate-500 transition hover:text-amber-400"
          >
            Resend OTP
          </button>
        </form>
      )}

      {/* Step: Reset Password */}
      {step === "reset" && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
              <Lock size={28} className="text-amber-400" />
            </div>
            <h2 className="mt-4 text-center text-2xl font-black text-white">
              Set New Password
            </h2>
            <p className="mt-2 text-center text-sm text-slate-400">
              Create a strong password for your account
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white outline-none transition focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {newPassword.length > 0 && (
              <div className="mt-2 flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-colors"
                    style={{
                      background:
                        newPassword.length >= i * 4
                          ? newPassword.length >= 10
                            ? "#34D399"
                            : newPassword.length >= 6
                            ? "#F5A623"
                            : "#F87171"
                          : "rgba(255,255,255,0.08)",
                    }}
                  />
                ))}
              </div>
            )}
            {newPassword.length > 0 && (
              <p
                className="mt-1 text-xs font-medium"
                style={{
                  color:
                    newPassword.length >= 10
                      ? "#34D399"
                      : newPassword.length >= 6
                      ? "#F5A623"
                      : "#F87171",
                }}
              >
                {newPassword.length >= 10
                  ? "Strong"
                  : newPassword.length >= 6
                  ? "Medium"
                  : "Weak — at least 6 characters"}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-500"
            />
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
            className="flex h-12 w-full items-center justify-center rounded-xl font-bold transition"
            style={{
              background:
                newPassword.length >= 6 && newPassword === confirmPassword
                  ? "#F5A623"
                  : "rgba(255,255,255,0.06)",
              color:
                newPassword.length >= 6 && newPassword === confirmPassword
                  ? "#0A0F1E"
                  : "#3A4455",
            }}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
