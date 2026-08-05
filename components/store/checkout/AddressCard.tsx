"use client";

import { MapPin, Pencil, Trash2 } from "lucide-react";

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
  address: Address;

  selected: boolean;

  onSelect: () => void;

  onEdit?: () => void;

  onDelete?: () => void;

  onDefault?: () => void;
}

export default function AddressCard({
  address,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onDefault,
}: Props) {
  return (
    <div
      onClick={onSelect}
      className="cursor-pointer border p-6 transition-all"
      style={{
        borderRadius: "var(--t-radius-card)",
        ...(selected
          ? {
              borderColor: "var(--t-primary)",
              background: "color-mix(in srgb, var(--t-primary) 10%, transparent)",
            }
          : {
              borderColor: "var(--t-border-card)",
              background: "var(--t-bg-card-nested, rgba(0,0,0,0.02))",
            }),
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.borderColor = "var(--t-border-subtle)";
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.borderColor = "var(--t-border-card)";
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <MapPin
            size={22}
            className={selected ? "text-primary" : "text-text-muted-2"}
          />
          <div>
            <h3 className="text-xl font-black text-text-heading">
              {address.fullName}
            </h3>
            <p className="text-text-muted-2">
              {address.phone}
            </p>
          </div>
        </div>

        {address.isDefault && (
          <span
            className="px-4 py-2 text-xs font-black uppercase"
            style={{
              borderRadius: "var(--t-radius-badge)",
              background: "var(--t-primary)",
              color: "var(--t-button-text, #fff)",
            }}
          >
            Default
          </span>
        )}
      </div>

      <div className="mt-5 space-y-1 text-text-heading" style={{ opacity: 0.8 }}>
        <p>{address.addressLine1}</p>
        {address.addressLine2 && (
          <p>{address.addressLine2}</p>
        )}
        <p>
          {address.city}, {address.state}
        </p>
        <p>
          {address.country} - {address.pincode}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {!address.isDefault && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDefault?.();
            }}
            className="px-4 py-2 text-sm font-bold transition bg-primary text-button-text hover:opacity-90"
            style={{ borderRadius: "var(--t-radius-button)" }}
          >
            Set Default
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm text-text-heading transition border border-border-card bg-bg-card hover:bg-bg-card-alt"
          style={{ borderRadius: "var(--t-radius-button)" }}
        >
          <Pencil size={16} />
          Edit
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white transition hover:opacity-90"
          style={{ borderRadius: "var(--t-radius-button)", background: "var(--t-danger)" }}
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
}