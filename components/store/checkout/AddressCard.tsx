"use client";

import { Check, MapPin, Pencil, Trash2 } from "lucide-react";

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
  // Full address kept untouched — only the on-page preview is compacted.
  const fullAddress = [
    address.addressLine1,
    address.addressLine2,
    `${address.city}, ${address.state}`,
    `${address.country} - ${address.pincode}`,
  ]
    .filter(Boolean)
    .join(", ");
  const shortAddress =
    fullAddress.length > 20 ? `${fullAddress.slice(0, 20).trimEnd()}…` : fullAddress;

  return (
    <div
      onClick={onSelect}
      className="cursor-pointer border p-4 transition-all"
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <MapPin
            size={16}
            className={`mt-0.5 shrink-0 ${selected ? "text-primary" : "text-text-muted-2"}`}
          />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-text-heading">
              {address.fullName}
            </h3>
            <p className="text-[11px] text-text-muted-2">{address.phone}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {address.isDefault && (
            <span
              className="px-2 py-0.5 text-[9px] font-black uppercase"
              style={{
                borderRadius: "var(--t-radius-badge)",
                background: "var(--t-primary)",
                color: "var(--t-button-text, #fff)",
              }}
            >
              Default
            </span>
          )}
          {onEdit && (
            <button
              type="button"
              aria-label={`Edit address for ${address.fullName}`}
              title="Edit this address"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex h-8 w-8 items-center justify-center border border-border-card bg-bg-card transition hover:bg-bg-card-alt"
              style={{ borderRadius: "var(--t-radius-button)" }}
            >
              <Pencil size={14} className="text-text-heading" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              aria-label={`Delete address for ${address.fullName}`}
              title="Delete this address"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex h-8 w-8 items-center justify-center text-white transition hover:opacity-90"
              style={{ borderRadius: "var(--t-radius-button)", background: "var(--t-danger)" }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <p className="mt-2 truncate text-xs text-text-heading" style={{ opacity: 0.8 }} title={fullAddress}>
        {shortAddress}
      </p>

      {!address.isDefault && onDefault && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDefault();
          }}
          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold transition bg-primary text-button-text hover:opacity-90"
          style={{ borderRadius: "var(--t-radius-button)" }}
        >
          <Check size={12} />
          Set Default
        </button>
      )}
    </div>
  );
}