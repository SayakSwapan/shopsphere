"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

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
}

export default function AddressSection({
  addresses,
  selectedAddressId,
  onSelectAddress,
}: Props) {
  const router = useRouter();

  const [openModal, setOpenModal] = useState(false);
  const [editingAddress, setEditingAddress] =
    useState<Address | undefined>();
  return (
    <>
      <section
        className="p-4 sm:p-6 lg:p-8 border border-border-card bg-bg-card"
        style={{ borderRadius: "var(--t-radius-card)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary">
              Delivery Address
            </p>
            <h2 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-black text-text-heading" style={{ fontFamily: "var(--t-font-heading)" }}>
              Select Delivery Address
            </h2>
            <p className="mt-2 text-text-muted-2">
              Select your preferred shipping address or add a new one.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingAddress(undefined);
              setOpenModal(true);
            }}
            className="flex items-center gap-2 px-5 py-3 font-bold transition bg-primary text-button-text"
            style={{ borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)" }}
          >
            <Plus size={18} />
            Add Address
          </button>
        </div>

        <div className="mt-8 grid gap-5">

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
              onDefault={async () => {
                await fetch("/api/address/default", {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    id: address.id,
                  }),
                });

                router.refresh();
              }}

              onDelete={async () => {
                const ok = confirm(
                  "Delete this address?"
                );

                if (!ok) return;

                await fetch("/api/address", {
                  method: "DELETE",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify({
                    id: address.id,
                  }),
                });

                router.refresh();
              }}
            />
          ))}

        </div>

      </section>

      <AddressModal
        open={openModal}
        address={editingAddress}
        onClose={() => {
          setEditingAddress(undefined);
          setOpenModal(false);
        }}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </>
  );
}