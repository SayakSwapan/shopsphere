"use client";

import { useEffect, useState } from "react";
import AddressCard from "./AddressCard";

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
  onSelect?: (id: string) => void;
}

export default function AddressSelector({
  addresses,
  onSelect,
}: Props) {
  const defaultAddress =
    addresses.find((a) => a.isDefault)?.id ??
    addresses[0]?.id ??
    "";

  const [selectedAddressId, setSelectedAddressId] =
    useState(defaultAddress);

  useEffect(() => {
    if (selectedAddressId) {
      onSelect?.(selectedAddressId);
    }
  }, [selectedAddressId, onSelect]);

  return (
    <div className="grid gap-5">

      {addresses.map((address) => (

        <div
          key={address.id}
          onClick={() =>
            setSelectedAddressId(address.id)
          }
          className="cursor-pointer"
        >

          <AddressCard
            address={address}
            selected={
              selectedAddressId === address.id
            }
            onSelect={() => setSelectedAddressId(address.id)}
          />

        </div>

      ))}

    </div>
  );
}