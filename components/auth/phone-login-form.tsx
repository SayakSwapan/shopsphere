"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function PhoneLoginForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sentChannel, setSentChannel] = useState<"whatsapp" | "sms">("whatsapp");

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
      const res = await fetch("/api/auth/phone/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to send OTP");
        return;
      }

      const label = data.channel === "sms" ? "SMS" : "WhatsApp";
      toast.success(`OTP sent via ${label}!`);
      setSentChannel(data.channel);
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
      const res = await fetch("/api/auth/phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
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
      router.push(data.redirectTo || "/");
      router.refresh();
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
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={14} />
          Change phone number
        </button>

        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle size={16} />
            <span>
              OTP sent via <strong>{sentChannel === "sms" ? "SMS" : "WhatsApp"}</strong> to <strong>+{phone}</strong>
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-white">
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
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white outline-none transition focus:border-amber-500"
          />
        </div>

        <button
          disabled={loading || otp.length !== 6}
          className="flex h-12 w-full items-center justify-center rounded-xl font-bold transition"
          style={{ background: "#F5A623", color: "#0A0F1E" }}
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            "Verify & Login"
          )}
        </button>

        <div className="text-center">
          {cooldown > 0 ? (
            <span className="text-xs text-slate-500">
              Resend OTP in {cooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleRequestOtp}
              className="text-xs font-medium text-amber-400 hover:text-amber-300 transition"
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
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
      >
        <ArrowLeft size={14} />
        Back to email login
      </button>

      <div>
        <label className="mb-2 block text-sm font-semibold text-white">
          Phone Number
        </label>
        <div className="flex gap-2">
          <span className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3 text-white text-sm">
            +91
          </span>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="9876543210"
            maxLength={10}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-500"
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          We&apos;ll send an OTP via WhatsApp or SMS
        </p>
      </div>

      <button
        disabled={loading || phone.length < 10 || cooldown > 0}
        className="flex h-12 w-full items-center justify-center rounded-xl font-bold transition"
        style={{ background: "#F5A623", color: "#0A0F1E" }}
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
