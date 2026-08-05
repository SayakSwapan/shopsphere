"use client";

import {  useState } from "react";
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

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">

      <div className="w-full max-w-3xl border border-border-card bg-bg-page" style={{ borderRadius: "var(--t-radius-card)" }}>

        <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid var(--t-border-subtle)" }}>

          <h2 className="text-2xl font-bold text-text-heading" style={{ fontFamily: "var(--t-font-heading)" }}>
            {address ? "Edit Address" : "Add Address"}
          </h2>

          <button onClick={onClose} className="p-2">
            <X className="text-text-heading" />
          </button>

        </div>

        <div className="grid md:grid-cols-2 gap-5 p-6">

          <Input
            label="Full Name"
            value={form.fullName}
            onChange={(v) => change("fullName", v)}
          />

          <Input
            label="Phone"
            value={form.phone}
            onChange={(v) => change("phone", v)}
          />

          <Input
            label="Address Line 1"
            value={form.addressLine1}
            onChange={(v) => change("addressLine1", v)}
          />

          <Input
            label="Address Line 2"
            value={form.addressLine2}
            onChange={(v) => change("addressLine2", v)}
          />

          <Input
            label="City"
            value={form.city}
            onChange={(v) => change("city", v)}
          />

          <Input
            label="State"
            value={form.state}
            onChange={(v) => change("state", v)}
          />

          <Input
            label="Pincode"
            value={form.pincode}
            onChange={(v) => change("pincode", v)}
          />

          <Input
            label="Country"
            value={form.country}
            onChange={(v) => change("country", v)}
          />

        </div>

        <div className="px-6">

          <label className="flex items-center gap-3 text-text-heading">

            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => change("isDefault", e.target.checked)}
            />

            Make Default Address

          </label>

        </div>

        <div className="flex justify-end gap-3 p-6">

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
            className="px-6 py-2.5 font-bold bg-primary text-button-text"
            style={{ borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)" }}
          >
            {loading ? "Saving..." : "Save Address"}
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