"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

interface Props {
  address?: Address | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddressForm({
  address,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] =
    useState(false);
const initialForm = address
  ? {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
      isDefault: address.isDefault,
    }
  : {
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      isDefault: false,
    };

const [form, setForm] = useState(initialForm);
//   const [form, setForm] = useState({
//     fullName: "",
//     phone: "",
//     addressLine1: "",
//     addressLine2: "",
//     city: "",
//     state: "",
//     pincode: "",
//     country: "India",
//     isDefault: false,
//   });

 

  function change(
    key: string,
    value: string | boolean
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function saveAddress() {
    if (
      !form.fullName ||
      !form.phone ||
      !form.addressLine1 ||
      !form.city ||
      !form.state ||
      !form.pincode
    ) {
      toast.error(
        "Please fill all required fields."
      );
      return;
    }

    setLoading(true);

    const res = await fetch(
      "/api/account/address",
      {
        method: address
          ? "PUT"
          : "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          id: address?.id,
          ...form,
        }),
      }
    );

    const data =
      await res.json();

    setLoading(false);

    if (data.success) {
      toast.success(
        address
          ? "Address Updated"
          : "Address Added"
      );
      onSuccess?.();
        onClose();
    } else {
      toast.error(data.message);
    }
  }

  // Lock body scroll while modal is open, close on Escape.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={address ? "Edit address" : "Add new address"}
    >
      <div
        className="flex w-full max-w-2xl flex-col overflow-hidden bg-bg-page border border-border-card shadow-2xl"
        style={{ borderRadius: "var(--t-radius-card)", maxHeight: "min(92dvh, 42rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — fixed at top */}
        <div
          className="flex shrink-0 items-center justify-between gap-3 px-4 py-4 sm:px-6"
          style={{ borderBottom: "1px solid var(--t-border-subtle)" }}
        >
          <h2
            className="text-lg sm:text-xl font-black text-text-heading"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            {address ? "Edit Address" : "Add Address"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition hover:bg-bg-card"
            style={{ borderColor: "var(--t-border-card)" }}
          >
            <X size={20} className="text-text-heading" />
          </button>
        </div>

        {/* Scrollable body — flex-1 + min-h-0 lets this fill remaining
            height so overflow-y-auto kicks in for tall forms. */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
          style={{ padding: "clamp(1rem, 4vw, 1.5rem)" }}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Full Name" value={form.fullName} onChange={(v) => change("fullName", v)} />
            <Input label="Phone" value={form.phone} onChange={(v) => change("phone", v)} />
            <Input label="Address Line 1" value={form.addressLine1} onChange={(v) => change("addressLine1", v)} />
            <Input label="Address Line 2" value={form.addressLine2} onChange={(v) => change("addressLine2", v)} />
            <Input label="City" value={form.city} onChange={(v) => change("city", v)} />
            <Input label="State" value={form.state} onChange={(v) => change("state", v)} />
            <Input label="Pincode" value={form.pincode} onChange={(v) => change("pincode", v)} />
            <Input label="Country" value={form.country} onChange={(v) => change("country", v)} />
          </div>

          <label className="mt-5 flex items-center gap-3 text-sm font-medium text-text-heading">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => change("isDefault", e.target.checked)}
              className="h-4 w-4"
            />
            Make Default Address
          </label>
        </div>

        {/* Footer — sticky at bottom so Save is always reachable */}
        <div
          className="flex shrink-0 items-center justify-end gap-3 px-4 py-4 sm:px-6"
          style={{ borderTop: "1px solid var(--t-border-subtle)" }}
        >
          <button
            onClick={onClose}
            className="border border-border-card px-5 py-2.5 text-text-heading"
            style={{ borderRadius: "var(--t-radius-button)" }}
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={saveAddress}
            className="px-6 py-2.5 font-bold bg-primary text-button-text transition disabled:opacity-60"
            style={{ borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)", minHeight: 44 }}
          >
            {loading ? "Saving..." : address ? "Update Address" : "Save Address"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-text-muted-2">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 text-text-heading outline-none focus:border-primary transition-colors"
        style={{
          borderRadius: "var(--t-radius-button)",
          border: "1px solid var(--t-border-card)",
          background: "var(--t-bg-card-nested, rgba(0,0,0,0.03))",
        }}
      />
    </div>
  );
}