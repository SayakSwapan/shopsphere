"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, Save, Loader2 } from "lucide-react";

interface Props {
  hasPassword: boolean;
}

export default function PasswordForm({ hasPassword }: Props) {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (hasPassword && !form.oldPassword) {
      toast.error("Current password is required");
      return;
    }

    if (!form.newPassword || !form.confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (form.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (hasPassword && form.oldPassword === form.newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: hasPassword ? form.oldPassword : undefined,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to update password");
        return;
      }

      toast.success(
        hasPassword
          ? "Password changed successfully"
          : "Password set successfully"
      );
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    borderRadius: "var(--t-radius-button)",
    border: "1px solid var(--t-border-card)",
    background: "var(--t-bg-card-nested, rgba(0,0,0,0.03))",
    color: "var(--t-text-heading)",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!hasPassword && (
        <div
          className="flex gap-3 px-4 py-3 text-sm"
          style={{
            borderRadius: "var(--t-radius-card)",
            border: "1px solid color-mix(in srgb, var(--t-primary) 30%, transparent)",
            background: "color-mix(in srgb, var(--t-primary) 8%, transparent)",
            color: "var(--t-text-muted-1)",
          }}
        >
          <Lock size={16} className="mt-0.5 shrink-0 text-primary" />
          <p>
            You&apos;re signed in with Google, so this is optional. Setting a
            password lets you also log in with your email and password.
          </p>
        </div>
      )}

      {hasPassword && (
        <div>
          <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-text-muted-2">
            <Lock size={14} className="text-primary" />
            Current Password
          </label>
          <div className="relative">
            <input
              type={showOld ? "text" : "password"}
              value={form.oldPassword}
              onChange={(e) =>
                setForm({ ...form, oldPassword: e.target.value })
              }
              placeholder="Enter current password"
              className="w-full px-4 py-3 pr-12 text-sm outline-none focus:border-primary transition-colors"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowOld(!showOld)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-text-muted-2 hover:text-text-heading transition-colors"
            >
              {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-text-muted-2">
          <Lock size={14} className="text-primary" />
          New Password
        </label>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            value={form.newPassword}
            onChange={(e) =>
              setForm({ ...form, newPassword: e.target.value })
            }
            placeholder="Enter new password"
            className="w-full px-4 py-3 pr-12 text-sm outline-none focus:border-primary transition-colors"
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-text-muted-2 hover:text-text-heading transition-colors"
          >
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-text-muted-2">
          <Lock size={14} className="text-primary" />
          Confirm New Password
        </label>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(e) =>
            setForm({ ...form, confirmPassword: e.target.value })
          }
          placeholder="Confirm new password"
          className="w-full px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
          style={inputStyle}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 text-sm font-bold transition bg-primary text-button-text hover:opacity-90 disabled:opacity-60"
        style={{ borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)" }}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Save size={16} />
        )}
        {loading
          ? "Updating..."
          : hasPassword
            ? "Change Password"
            : "Set Password"}
      </button>
    </form>
  );
}
