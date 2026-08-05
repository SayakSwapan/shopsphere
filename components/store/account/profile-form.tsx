"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Save,
  Pencil,
} from "lucide-react";
import ChangeFieldOtp from "@/components/shared/change-field-otp";

interface Props {
  user: {
    name: string | null;
    email: string;
    phone: string | null;
  };
}

export default function ProfileForm({ user }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email,
    phone: user.phone || "",
  });
  const [editingField, setEditingField] = useState<"email" | "phone" | null>(null);

  async function saveProfile() {
    try {
      setLoading(true);
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, phone: form.phone }),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile updated");
    } catch {
      toast.error("Unable to update profile");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-5 py-4 text-text-heading outline-none focus:border-primary transition-colors";

  const inputStyle = {
    borderRadius: "var(--t-radius-button)",
    border: "1px solid var(--t-border-card)",
    background: "var(--t-bg-card-nested, rgba(0,0,0,0.03))",
  };

  return (
    <div className="space-y-8">
      {/* Name */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-text-muted-2 uppercase tracking-wider">
          <User size={16} className="text-primary" />
          Full Name
        </label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Email */}
      {editingField === "email" ? (
        <ChangeFieldOtp
          type="email"
          apiBase="/api/account"
          currentValue={form.email}
          theme="customer"
          onSuccess={(newEmail) => {
            setForm((prev) => ({ ...prev, email: newEmail }));
            setEditingField(null);
          }}
          onCancel={() => setEditingField(null)}
        />
      ) : (
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-text-muted-2 uppercase tracking-wider">
            <Mail size={16} className="text-primary" />
            Email
          </label>
          <div className="flex gap-3">
            <input
              disabled
              value={form.email}
              className={inputClass + " cursor-not-allowed flex-1"}
              style={{ ...inputStyle, opacity: 0.6 }}
            />
            <button
              type="button"
              onClick={() => setEditingField("email")}
              className="flex items-center gap-2 px-5 text-sm font-bold transition hover:opacity-80"
              style={{
                borderRadius: "var(--t-radius-button)",
                border: "1px solid var(--t-border-card)",
                color: "var(--t-primary)",
              }}
            >
              <Pencil size={14} />
              Change
            </button>
          </div>
        </div>
      )}

      {/* Phone */}
      {editingField === "phone" ? (
        <ChangeFieldOtp
          type="phone"
          apiBase="/api/account"
          currentValue={form.phone}
          theme="customer"
          onSuccess={(newPhone) => {
            setForm((prev) => ({ ...prev, phone: newPhone }));
            setEditingField(null);
          }}
          onCancel={() => setEditingField(null)}
        />
      ) : (
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-text-muted-2 uppercase tracking-wider">
            <Phone size={16} className="text-primary" />
            Phone Number
          </label>
          <div className="flex gap-3">
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass + " flex-1"}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setEditingField("phone")}
              className="flex items-center gap-2 px-5 text-sm font-bold transition hover:opacity-80"
              style={{
                borderRadius: "var(--t-radius-button)",
                border: "1px solid var(--t-border-card)",
                color: "var(--t-primary)",
              }}
            >
              <Pencil size={14} />
              Change
            </button>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--t-text-muted-2)" }}>
            To change your phone number with OTP verification, click &quot;Change&quot;
          </p>
        </div>
      )}

      {/* Save Name Button */}
      {!editingField && (
        <button
          disabled={loading}
          onClick={saveProfile}
          className="flex items-center justify-center gap-3 px-8 py-4 font-black transition bg-primary text-button-text hover:opacity-90 disabled:opacity-60"
          style={{
            borderRadius: "var(--t-radius-button)",
            fontFamily: "var(--t-font-heading)",
          }}
        >
          <Save size={18} />
          {loading ? "Saving..." : "Save Profile"}
        </button>
      )}
    </div>
  );
}
