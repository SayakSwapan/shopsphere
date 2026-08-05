"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import AddressForm from "./address-form";
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
    addresses: Address[];
}

export default function AddressList({
    addresses: initialAddresses,
}: Props) {

    const [addresses, setAddresses] =
        useState(initialAddresses);

    const [editing, setEditing] =
        useState<Address | null>(null);

    const [showForm, setShowForm] =
        useState(false);

    async function refresh() {
        const res = await fetch("/api/account/address");

        const data = await res.json();

        setAddresses(data.addresses);

        setEditing(null);

        setShowForm(false);
    }

    async function deleteAddress(id: string) {
        if (!confirm("Delete this address?")) return;

        await fetch("/api/account/address", {
            method: "DELETE",
            headers: {
                "Content-Type":
                    "application/json",
            },
            body: JSON.stringify({
                id,
            }),
        });

        toast.success("Address deleted");

        refresh();
    }

    async function makeDefault(id: string) {
        await fetch(
            "/api/account/address/default",
            {
                method: "PUT",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify({
                    id,
                }),
            }
        );

        toast.success(
            "Default address updated"
        );

        refresh();
    }

    return (
        <div className="space-y-6">

            <div className="flex justify-between items-center">

                <h2 className="text-2xl font-bold text-text-heading" style={{ fontFamily: "var(--t-font-heading)" }}>
                    Saved Addresses
                </h2>

                <button
                    onClick={() => {
                        setEditing(null);
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 px-5 py-3 font-bold bg-primary text-button-text"
                    style={{ borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)" }}
                >
                    <Plus size={18} />
                    Add Address
                </button>

            </div>

          {showForm && (
    <AddressForm
        address={editing}
        onClose={() => {
            setShowForm(false);
            setEditing(null);
        }}
        onSuccess={refresh}
    />
)}

            <div className="grid gap-5">

                {addresses.map((address) => (
                    <div
                        key={address.id}
                        className="border border-border-card bg-bg-card p-6"
                        style={{ borderRadius: "var(--t-radius-card)" }}
                    >
                        <div className="flex justify-between">

                            <div>

                                <h3 className="text-lg font-bold text-text-heading">
                                    {address.fullName}
                                </h3>

                                <p className="text-text-muted-2">
                                    {address.phone}
                                </p>

                                <p className="mt-4 text-text-heading" style={{ opacity: 0.8 }}>
                                    {address.addressLine1}
                                </p>

                                {address.addressLine2 && (
                                    <p className="text-text-heading" style={{ opacity: 0.8 }}>
                                        {address.addressLine2}
                                    </p>
                                )}

                                <p className="text-text-heading" style={{ opacity: 0.8 }}>
                                    {address.city},{" "}
                                    {address.state}
                                </p>

                                <p className="text-text-heading" style={{ opacity: 0.8 }}>
                                    {address.pincode}
                                </p>

                                <p className="text-text-heading" style={{ opacity: 0.8 }}>
                                    {address.country}
                                </p>

                                {address.isDefault && (
                                    <span
                                        className="mt-4 inline-flex px-4 py-1 text-sm font-bold"
                                        style={{
                                            borderRadius: "var(--t-radius-badge)",
                                            background: "color-mix(in srgb, var(--t-success) 20%, transparent)",
                                            color: "var(--t-success)",
                                        }}
                                    >
                                        Default
                                    </span>
                                )}

                            </div>

                            <div className="flex flex-col gap-2">

                                {!address.isDefault && (
                                    <button
                                        onClick={() =>
                                            makeDefault(address.id)
                                        }
                                        className="p-2.5 text-white"
                                        style={{
                                            borderRadius: "var(--t-radius-button)",
                                            background: "var(--t-success)",
                                        }}
                                    >
                                        <Check size={18} />
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        setEditing(address);
                                        setShowForm(true);
                                    }}
                                    className="p-2.5 text-white"
                                    style={{
                                        borderRadius: "var(--t-radius-button)",
                                        background: "var(--t-accent)",
                                    }}
                                >
                                    <Pencil size={18} />
                                </button>

                                <button
                                    onClick={() =>
                                        deleteAddress(address.id)
                                    }
                                    className="p-2.5 text-white"
                                    style={{
                                        borderRadius: "var(--t-radius-button)",
                                        background: "var(--t-danger)",
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>

                            </div>
                        </div>
                    </div>
                ))}

            </div>

        </div>
    );
}