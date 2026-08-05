"use client";

import { toast } from "sonner";
import {
  MapPin,
  Pencil,
  Trash2,
  CheckCircle,
} from "lucide-react";

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
  onEdit: () => void;
  onRefresh: () => void;
}

export default function AddressCard({
  address,
  onEdit,
  onRefresh,
}: Props) {
  async function deleteAddress() {
    if (!confirm("Delete this address?")) return;

    const res = await fetch(
      "/api/account/address",
      {
        method: "DELETE",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          id: address.id,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {
      toast.success(
        "Address Deleted"
      );
      onRefresh();
    } else {
      toast.error(data.message);
    }
  }

  async function makeDefault() {
    const res = await fetch(
      "/api/account/address/default",
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          id: address.id,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {
      toast.success(
        "Default Address Updated"
      );
      onRefresh();
    } else {
      toast.error(data.message);
    }
  }

  return (
    <div
      className="
      rounded-2xl
      border
      border-slate-700
      bg-[#0F172A]
      p-5
      "
    >
      <div className="flex items-start justify-between">

        <div>

          <div className="flex items-center gap-3">

            <h3 className="font-bold text-white text-lg">
              {address.fullName}
            </h3>

            {address.isDefault && (
              <span
                className="
                rounded-full
                bg-green-500/20
                px-3
                py-1
                text-xs
                font-bold
                text-green-400
                "
              >
                Default
              </span>
            )}

          </div>

          <p className="mt-1 text-slate-400">
            {address.phone}
          </p>

        </div>

        <MapPin
          className="text-amber-400"
          size={24}
        />

      </div>

      <div className="mt-5 space-y-1 text-slate-300">

        <p>{address.addressLine1}</p>

        {address.addressLine2 && (
          <p>{address.addressLine2}</p>
        )}

        <p>
          {address.city},{" "}
          {address.state}
        </p>

        <p>
          {address.pincode},{" "}
          {address.country}
        </p>

      </div>

      <div className="mt-6 flex flex-wrap gap-3">

        <button
          onClick={onEdit}
          className="
          flex
          items-center
          gap-2
          rounded-lg
          border
          border-amber-500
          px-4
          py-2.5
          text-amber-400
          hover:bg-amber-500/10
          "
        >
          <Pencil size={16} />
          Edit
        </button>

        {!address.isDefault && (
          <button
            onClick={makeDefault}
            className="
            flex
            items-center
            gap-2
            rounded-lg
            border
            border-green-500
            px-4
            py-2.5
            text-green-400
            hover:bg-green-500/10
            "
          >
            <CheckCircle size={16} />
            Set Default
          </button>
        )}

        <button
          onClick={deleteAddress}
          className="
          flex
          items-center
          gap-2
          rounded-lg
          border
          border-red-500
          px-4
          py-2.5
          text-red-400
          hover:bg-red-500/10
          "
        >
          <Trash2 size={16} />
          Delete
        </button>

      </div>

    </div>
  );
}