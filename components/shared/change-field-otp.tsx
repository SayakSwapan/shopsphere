"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { X, Mail, Phone, Send, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";

interface Props {
  type: "email" | "phone";
  apiBase: string;
  currentValue: string;
  onSuccess: (newValue: string) => void;
  onCancel: () => void;
  theme?: "customer" | "admin";
}

type Step = "input" | "otp";

export default function ChangeFieldOtp({
  type,
  apiBase,
  currentValue,
  onSuccess,
  onCancel,
  theme = "customer",
}: Props) {
  const [step, setStep] = useState<Step>("input");
  const [newValue, setNewValue] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isCustomer = theme === "customer";

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const inputClass = isCustomer
    ? "w-full px-5 py-4 text-text-heading outline-none focus:border-primary transition-colors"
    : "w-full rounded-xl border border-white/10 bg-[#0A0F1E] px-4 py-3 text-white outline-none focus:border-amber-500";

  const inputStyle = isCustomer
    ? {
        borderRadius: "var(--t-radius-button)",
        border: "1px solid var(--t-border-card)",
        background: "var(--t-bg-card-nested, rgba(0,0,0,0.03))",
      }
    : {};

  const btnClass = isCustomer
    ? "flex items-center justify-center gap-3 px-8 py-4 font-black transition bg-primary text-button-text hover:opacity-90 disabled:opacity-60"
    : "flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition disabled:opacity-60";

  const btnStyle = isCustomer
    ? { borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)" }
    : { background: "#F59E0B", color: "#111827" };

  const handleSendOtp = async () => {
    if (!newValue.trim()) {
      toast.error(type === "email" ? "Please enter a valid email" : "Please enter a valid phone number");
      return;
    }

    if (type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newValue.trim())) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    if (type === "phone") {
      const digits = newValue.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) {
        toast.error("Please enter a valid phone number");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/change-${type}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [type]: newValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      toast.success(`OTP sent to your new ${type}`);
      setStep("otp");
      setCountdown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const newOtp = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
      setOtp(newOtp);
      const nextEmpty = newOtp.findIndex((v) => !v);
      otpRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/change-${type}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [type]: newValue.trim(), otp: otpString }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to verify OTP");
      toast.success(`${type === "email" ? "Email" : "Phone number"} updated successfully`);
      onSuccess(data[type] || newValue.trim());
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/change-${type}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [type]: newValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend OTP");
      toast.success("OTP resent");
      setCountdown(30);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const Icon = type === "email" ? Mail : Phone;

  return (
    <div className={isCustomer ? "" : "rounded-2xl border border-white/10 bg-[#0D1526] p-6"}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {step === "otp" && (
            <button
              type="button"
              onClick={() => setStep("input")}
              className={isCustomer ? "text-text-muted-2 hover:text-text-heading" : "text-slate-400 hover:text-white"}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className={`flex items-center gap-2 ${isCustomer ? "" : "text-white"}`}>
            <Icon size={18} className={isCustomer ? "text-primary" : "text-amber-400"} />
            <span className="font-bold text-sm uppercase tracking-wider">
              {step === "input" ? `Change ${type === "email" ? "Email" : "Phone"}` : "Verify OTP"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className={isCustomer ? "text-text-muted-2 hover:text-text-heading" : "text-slate-400 hover:text-white"}
        >
          <X size={18} />
        </button>
      </div>

      {step === "input" ? (
        <div className="space-y-4">
          <div>
            <p className={`text-xs mb-3 ${isCustomer ? "text-text-muted-2" : "text-slate-400"}`}>
              Current {type}: <span className={isCustomer ? "text-text-heading font-semibold" : "text-white font-semibold"}>{currentValue || "Not set"}</span>
            </p>
            <label className={`mb-2 block text-xs font-bold uppercase tracking-[0.15em] ${isCustomer ? "text-text-muted-2" : "text-slate-400"}`}>
              New {type === "email" ? "Email Address" : "Phone Number"}
            </label>
            <input
              type={type === "email" ? "email" : "tel"}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={type === "email" ? "you@example.com" : "9876543210"}
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className={isCustomer
                ? "px-6 py-3 text-sm text-text-muted-2 hover:text-text-heading"
                : "px-4 py-2 text-sm text-slate-400 hover:text-white"
              }
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading || !newValue.trim()}
              className={`${btnClass} flex-1`}
              style={btnStyle}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className={`text-xs ${isCustomer ? "text-text-muted-2" : "text-slate-400"}`}>
            Enter the 6-digit code sent to <span className={isCustomer ? "text-text-heading font-semibold" : "text-white font-semibold"}>{newValue}</span>
          </p>

          <div className="flex gap-2 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onPaste={i === 0 ? handleOtpPaste : undefined}
                className={isCustomer
                  ? "w-12 h-14 text-center text-lg font-bold outline-none focus:border-primary transition-colors"
                  : "w-12 h-14 text-center text-lg font-bold rounded-xl border border-white/10 bg-[#0A0F1E] text-white outline-none focus:border-amber-500 transition-colors"
                }
                style={isCustomer ? {
                  borderRadius: "var(--t-radius-button)",
                  border: "1px solid var(--t-border-card)",
                  background: "var(--t-bg-card-nested, rgba(0,0,0,0.03))",
                  color: "var(--t-text-heading)",
                } : undefined}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("input")}
              className={isCustomer
                ? "px-6 py-3 text-sm text-text-muted-2 hover:text-text-heading"
                : "px-4 py-2 text-sm text-slate-400 hover:text-white"
              }
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading || otp.join("").length !== 6}
              className={`${btnClass} flex-1`}
              style={btnStyle}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              {loading ? "Verifying..." : "Verify & Update"}
            </button>
          </div>

          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0}
            className={`w-full text-center text-xs ${isCustomer ? "text-primary" : "text-amber-400"} ${countdown > 0 ? "opacity-50 cursor-not-allowed" : "hover:underline"}`}
          >
            {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
          </button>
        </div>
      )}
    </div>
  );
}
