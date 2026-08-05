"use client";

import { useState } from "react";
import { Loader2, Save, Mail, Phone, Pencil } from "lucide-react";
import { toast } from "sonner";
import ChangeFieldOtp from "@/components/shared/change-field-otp";

interface Props {
  initialName: string;
  initialPhone: string;
  initialEmail: string;
}

export default function AdminProfileForm({
  initialName,
  initialPhone,
  initialEmail,
}: Props) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<"email" | "phone" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Could not save changes.");
        return;
      }
      toast.success("Profile updated.");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (editingField === "email") {
    return (
      <ChangeFieldOtp
        type="email"
        apiBase="/api/admin/account"
        currentValue={email}
        theme="admin"
        onSuccess={(newEmail) => {
          setEmail(newEmail);
          setEditingField(null);
        }}
        onCancel={() => setEditingField(null)}
      />
    );
  }

  if (editingField === "phone") {
    return (
      <ChangeFieldOtp
        type="phone"
        apiBase="/api/admin/account"
        currentValue={phone}
        theme="admin"
        onSuccess={(newPhone) => {
          setPhone(newPhone);
          setEditingField(null);
        }}
        onCancel={() => setEditingField(null)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
          Full Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#0A0F1E] px-4 py-3 text-white outline-none focus:border-amber-500"
          placeholder="Your name"
        />
      </div>

      <div>
        <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
          <Mail size={14} />
          Email
        </label>
        <div className="flex gap-3">
          <input
            readOnly
            value={email}
            className="flex-1 rounded-xl border border-white/10 bg-[#0A0F1E] px-4 py-3 text-white/60 cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => setEditingField("email")}
            className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
          >
            <Pencil size={14} />
            Change
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
          <Phone size={14} />
          Phone
        </label>
        <div className="flex gap-3">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-[#0A0F1E] px-4 py-3 text-white outline-none focus:border-amber-500"
            placeholder="Phone number"
          />
          <button
            type="button"
            onClick={() => setEditingField("phone")}
            className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
          >
            <Pencil size={14} />
            Change
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Click &quot;Change&quot; to update with OTP verification
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition disabled:opacity-60"
        style={{ background: "#F59E0B", color: "#111827" }}
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
