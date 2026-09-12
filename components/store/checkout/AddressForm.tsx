"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

interface Props {
  address?: Address;
  onSuccess: () => void;
}

export default function AddressForm({
  address,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: address?.fullName || "",
    phone: address?.phone || "",
    addressLine1: address?.addressLine1 || "",
    addressLine2: address?.addressLine2 || "",
    city: address?.city || "",
    state: address?.state || "",
    pincode: address?.pincode || "",
    country: address?.country || "India",
    isDefault: address?.isDefault || false,
  });

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (loading) return;

    // Client-side validation before hitting the API so customers get instant,
    // readable feedback on mobile instead of a slow server round trip.
    const required: Array<{ key: keyof typeof form; label: string }> = [
      { key: "fullName", label: "Full name" },
      { key: "phone", label: "Phone number" },
      { key: "addressLine1", label: "Address line 1" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "pincode", label: "Pincode" },
    ];
    for (const field of required) {
      if (!String(form[field.key] ?? "").trim()) {
        toast.error(`${field.label} is required`);
        return;
      }
    }

    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(form.pincode.trim())) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }

    setLoading(true);
    try {
      const endpoint = "/api/address";
      const method = address ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          id: address?.id,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(
          data?.message || "Could not save the address. Please try again."
        );
        return;
      }

      toast.success(
        address ? "Address Updated" : "Address Added"
      );

      onSuccess();
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    borderRadius: "var(--t-radius-input)",
    background: "var(--t-bg-card-nested, rgba(0,0,0,0.03))",
    border: "1px solid var(--t-border-card)",
    color: "var(--t-text-heading)",
  };

  const inputClass =
    "w-full p-4 outline-none focus:border-primary transition-colors placeholder:text-text-muted-3";

  return (
    <div className="grid gap-5 px-4 py-4 sm:px-6 sm:py-6">
      <input
        placeholder="Full Name"
        value={form.fullName}
        onChange={(e) => setField("fullName", e.target.value)}
        autoComplete="name"
        className={inputClass}
        style={inputStyle}
      />

      <input
        placeholder="Phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={form.phone}
        onChange={(e) => setField("phone", e.target.value)}
        className={inputClass}
        style={inputStyle}
      />

      <input
        placeholder="Address Line 1"
        value={form.addressLine1}
        onChange={(e) => setField("addressLine1", e.target.value)}
        autoComplete="address-line1"
        className={inputClass}
        style={inputStyle}
      />

      <input
        placeholder="Address Line 2 (optional)"
        value={form.addressLine2}
        onChange={(e) => setField("addressLine2", e.target.value)}
        autoComplete="address-line2"
        className={inputClass}
        style={inputStyle}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          placeholder="City"
          value={form.city}
          onChange={(e) => setField("city", e.target.value)}
          autoComplete="address-level2"
          className={inputClass}
          style={inputStyle}
        />

        <input
          placeholder="State"
          value={form.state}
          onChange={(e) => setField("state", e.target.value)}
          autoComplete="address-level1"
          className={inputClass}
          style={inputStyle}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          placeholder="Pincode"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          value={form.pincode}
          onChange={(e) =>
            setField("pincode", e.target.value.replace(/\D/g, ""))
          }
          className={inputClass}
          style={inputStyle}
        />

        <input
          placeholder="Country"
          value={form.country}
          onChange={(e) => setField("country", e.target.value)}
          autoComplete="country-name"
          className={inputClass}
          style={inputStyle}
        />
      </div>

      <label className="flex items-center gap-3 text-sm font-medium text-text-heading">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setField("isDefault", e.target.checked)}
          className="h-4 w-4"
        />
        Make Default Address
      </label>

      {/* Sticky footer keeps the Save button on screen while scrolling the
          form (and above the on-screen keyboard) on small screens. The
          negative margins counter the padded root so the strip spans the
          full popup width and sits flush against the bottom edge. */}
      <div
        className="sticky bottom-0 -mx-4 -mb-4 bg-bg-page px-4 pb-4 pt-3 sm:-mx-6 sm:-mb-6 sm:px-6 sm:pb-6 sm:pt-4"
        style={{ borderTop: "1px solid var(--t-border-subtle)" }}
      >
        <button
          type="button"
          disabled={loading}
          onClick={submit}
          className="flex w-full items-center justify-center gap-2 py-4 font-black uppercase tracking-wider transition bg-primary text-button-text hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)", minHeight: 52 }}
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading
            ? "Saving..."
            : address
            ? "Update Address"
            : "Save Address"}
        </button>
      </div>
    </div>
  );
}