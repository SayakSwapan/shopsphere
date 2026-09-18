"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, MapPin } from "lucide-react";

import AddressCard from "./AddressCard";
import AddressModal from "./AddressModal";

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
  addresses: Address[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
  onAddressesChange: (addresses: Address[]) => void;
}

export default function AddressSection({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddressesChange,
}: Props) {
  const [openModal, setOpenModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>();

  // Add or update happens instantly from the modal's saved payload — no full
  // page refresh, so the checkout doesn't stall behind a slow server round
  // trip after every save.
  const addOrUpdate = (saved: Address) => {
    const exists = addresses.some((a) => a.id === saved.id);
    onAddressesChange(
      exists
        ? addresses.map((a) =>
            a.id === saved.id
              ? saved
              : saved.isDefault && a.isDefault
                ? { ...a, isDefault: false }
                : a,
          )
        : [
            ...addresses.map((a) =>
              saved.isDefault && a.isDefault ? { ...a, isDefault: false } : a,
            ),
            saved,
          ],
    );
  };

  const setDefault = async (address: Address) => {
    const previous = addresses;
    onAddressesChange(
      addresses.map((a) => ({ ...a, isDefault: a.id === address.id })),
    );
    try {
      const res = await fetch("/api/address/default", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: address.id }),
      });
      if (!res.ok) {
        onAddressesChange(previous);
        toast.error("Could not set as default. Please try again.");
      } else {
        toast.success("Default address updated");
      }
    } catch {
      onAddressesChange(previous);
      toast.error("Network error. Please try again.");
    }
  };

  const remove = async (address: Address) => {
    if (!confirm("Delete this address?")) return;

    const previous = addresses;
    const next = addresses.filter((a) => a.id !== address.id);
    onAddressesChange(next);

    if (selectedAddressId === address.id && next.length > 0) {
      onSelectAddress(next[0].id);
    }

    try {
      const res = await fetch("/api/address", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: address.id }),
      });
      if (!res.ok) {
        onAddressesChange(previous);
        toast.error("Could not delete the address.");
      } else {
        toast.success("Address deleted");
      }
    } catch {
      onAddressesChange(previous);
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className="text-base sm:text-lg font-black text-text-heading"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            Select Delivery Address
          </h2>
          <p className="mt-1 text-xs text-text-muted-2">
            Pick a saved address or add a new one.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingAddress(undefined);
            setOpenModal(true);
          }}
          className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 font-bold transition bg-primary text-button-text sm:w-auto"
          style={{
            borderRadius: "var(--t-radius-button)",
            fontFamily: "var(--t-font-heading)",
            minHeight: 44,
          }}
        >
          <Plus size={18} />
          Add Address
        </button>
      </div>

      {addresses.length > 0 ? (
        <div className="mt-5 sm:mt-6 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              selected={selectedAddressId === address.id}
              onSelect={() => onSelectAddress(address.id)}
              onEdit={() => {
                setEditingAddress(address);
                setOpenModal(true);
              }}
              onDefault={() => setDefault(address)}
              onDelete={() => remove(address)}
            />
          ))}
        </div>
      ) : (
        <div
          className="mt-5 sm:mt-6 flex flex-col items-center gap-3 px-4 py-10 text-center"
          style={{
            borderRadius: "var(--t-radius-card)",
            border: "1px dashed var(--t-border-card)",
            background: "var(--t-bg-card-nested, rgba(0,0,0,0.02))",
          }}
        >
          <MapPin size={28} className="text-text-muted-3" />
          <p className="text-sm font-semibold text-text-heading">
            No saved addresses yet
          </p>
          <p className="text-xs text-text-muted-2">
            Add a delivery address to continue with checkout.
          </p>
        </div>
      )}

      <AddressModal
        open={openModal}
        address={editingAddress}
        onClose={() => {
          setEditingAddress(undefined);
          setOpenModal(false);
        }}
        onSuccess={addOrUpdate}
      />
    </>
  );
}
