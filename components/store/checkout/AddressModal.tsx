"use client";

import AddressForm from "./AddressForm";

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
  open: boolean;
  onClose: () =>void;
  onSuccess: () => void;

  address?: Address;
}

export default function AddressModal({
  open,
  onClose,
  onSuccess,
  address,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className="w-full max-w-3xl bg-bg-page border border-border-card"
        style={{ borderRadius: "var(--t-radius-card)" }}
      >
        <div
          className="flex items-center justify-between p-6"
          style={{ borderBottom: "1px solid var(--t-border-subtle)" }}
        >
          <h2 className="text-2xl font-black text-text-heading" style={{ fontFamily: "var(--t-font-heading)" }}>
            {address ? "Edit Address" : "Add New Address"}
          </h2>
          <button
            onClick={onClose}
            className="text-3xl text-text-heading"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          <AddressForm
            address={address}
            onSuccess={() => {
              onSuccess();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}