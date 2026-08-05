"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleSendOtp = useCallback(async () => {
    if (!email) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("OTP sent to your email");
        setCooldown(15);
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch {
      toast.error("Failed to send OTP");
    } finally {
      setResending(false);
    }
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!email || verified) return;
    const timer = setTimeout(() => {
      handleSendOtp();
    }, 0);
    return () => clearTimeout(timer);
  }, [email, verified, handleSendOtp]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter a valid 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (data.success) {
        setVerified(true);
        toast.success("Email verified! You can now login.");
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch {
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg,#0A0F1E 0%,#0D1424 60%,#111827 100%)" }}>
        <div className="w-full max-w-md rounded-3xl p-8 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-slate-400 mb-4">No email provided. Please register first.</p>
          <Link href="/register" className="text-amber-400 font-bold hover:text-amber-300">Go to Register</Link>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg,#0A0F1E 0%,#0D1424 60%,#111827 100%)" }}>
        <div className="w-full max-w-md rounded-3xl p-8 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 mb-6">
            <ShieldCheck size={32} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Email Verified!</h1>
          <p className="text-slate-400 mb-6">Your account is ready. You can now login.</p>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-xl font-bold transition px-8"
            style={{ background: "#F5A623", color: "#0A0F1E" }}
          >
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg,#0A0F1E 0%,#0D1424 60%,#111827 100%)" }}>
      <div className="w-full max-w-md rounded-3xl p-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <Link href="/register" className="flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition mb-6">
          <ArrowLeft size={16} />
          Back to Register
        </Link>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 mb-6">
          <ShieldCheck size={28} className="text-amber-400" />
        </div>

        <h1 className="text-2xl font-black text-white text-center mb-2">Verify Your Email</h1>
        <p className="text-sm text-slate-400 text-center mb-8">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-white">{email}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-white">Verification Code</label>
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
            <p className="mt-2 text-center text-xs text-slate-500">OTP expires in 10 minutes</p>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="flex h-12 w-full items-center justify-center rounded-xl font-bold transition"
            style={{
              background: otp.length === 6 ? "#F5A623" : "rgba(255,255,255,0.06)",
              color: otp.length === 6 ? "#0A0F1E" : "#3A4455",
            }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : "Verify Email"}
          </button>

          <button
            type="button"
            onClick={handleSendOtp}
            disabled={resending || cooldown > 0}
            className="w-full text-center text-xs font-medium text-slate-500 transition hover:text-amber-400 disabled:opacity-50"
          >
            {cooldown > 0 ? `Resend OTP in ${cooldown}s` : resending ? "Sending..." : "Resend OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0A0F1E 0%,#0D1424 60%,#111827 100%)" }}>
        <Loader2 className="animate-spin text-amber-400" size={32} />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
