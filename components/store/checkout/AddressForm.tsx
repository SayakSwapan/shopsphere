"use client";

import { useState } from "react";
import { toast } from "sonner";

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

  async function submit() {
    setLoading(true);

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

    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      toast.error(data.message);
      return;
    }

    toast.success(
      address ? "Address Updated" : "Address Added"
    );

    onSuccess();
  }

  const inputStyle = {
    borderRadius: "var(--t-radius-button)",
    background: "var(--t-bg-card-nested, rgba(0,0,0,0.03))",
    border: "1px solid var(--t-border-card)",
    color: "var(--t-text-heading)",
  };

  return (
    <div className="grid gap-5">

      <input
        placeholder="Full Name"
        value={form.fullName}
        onChange={(e) =>
          setForm({
            ...form,
            fullName: e.target.value,
          })
        }
        className="p-4 outline-none focus:border-primary transition-colors"
        style={inputStyle}
      />

      <input
        placeholder="Phone"
        value={form.phone}
        onChange={(e) =>
          setForm({
            ...form,
            phone: e.target.value,
          })
        }
        className="p-4 outline-none focus:border-primary transition-colors"
        style={inputStyle}
      />

      <input
        placeholder="Address Line 1"
        value={form.addressLine1}
        onChange={(e) =>
          setForm({
            ...form,
            addressLine1: e.target.value,
          })
        }
        className="p-4 outline-none focus:border-primary transition-colors"
        style={inputStyle}
      />

      <input
        placeholder="Address Line 2"
        value={form.addressLine2}
        onChange={(e) =>
          setForm({
            ...form,
            addressLine2: e.target.value,
          })
        }
        className="p-4 outline-none focus:border-primary transition-colors"
        style={inputStyle}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <input
          placeholder="City"
          value={form.city}
          onChange={(e) =>
            setForm({
              ...form,
              city: e.target.value,
            })
          }
          className="p-4 outline-none focus:border-primary transition-colors"
          style={inputStyle}
        />

        <input
          placeholder="State"
          value={form.state}
          onChange={(e) =>
            setForm({
              ...form,
              state: e.target.value,
            })
          }
          className="p-4 outline-none focus:border-primary transition-colors"
          style={inputStyle}
        />

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <input
          placeholder="Pincode"
          value={form.pincode}
          onChange={(e) =>
            setForm({
              ...form,
              pincode: e.target.value,
            })
          }
          className="p-4 outline-none focus:border-primary transition-colors"
          style={inputStyle}
        />

        <input
          placeholder="Country"
          value={form.country}
          onChange={(e) =>
            setForm({
              ...form,
              country: e.target.value,
            })
          }
          className="p-4 outline-none focus:border-primary transition-colors"
          style={inputStyle}
        />

      </div>

      <label className="flex items-center gap-3 text-text-heading">

        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) =>
            setForm({
              ...form,
              isDefault: e.target.checked,
            })
          }
        />

        Make Default Address

      </label>

      <button
        disabled={loading}
        onClick={submit}
        className="py-4 font-black transition bg-primary text-button-text hover:opacity-90"
        style={{ borderRadius: "var(--t-radius-card)", fontFamily: "var(--t-font-heading)" }}
      >
        {loading
          ? "Saving..."
          : address
          ? "Update Address"
          : "Save Address"}
      </button>

    </div>
  );
}