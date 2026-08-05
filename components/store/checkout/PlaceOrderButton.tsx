"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
    addressId: string;
}

export default function PlaceOrderButton({
    addressId,
}: Props) {
    const router = useRouter();

    const [loading, setLoading] = useState(false);

    async function placeOrder() {
        try {
            setLoading(true);

            const response = await fetch(
                "/api/orders/place",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        paymentMethod: "COD",
                        addressId,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            toast.success(
                "Order placed successfully!"
            );

            router.push(
                `/order-success?id=${data.orderId}`
            );
        } catch (error) {

            const message =
                error instanceof Error
                    ? error.message
                    : "Something went wrong";

            toast.error(message);

        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={placeOrder}
            disabled={loading}
            className="mt-8 w-full py-4 text-lg font-black uppercase tracking-wider transition-colors bg-primary hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ borderRadius: "var(--t-radius-button)", color: "var(--t-bg-page)", fontFamily: "var(--t-font-heading)" }}
        >
            {loading
                ? "Placing Order..."
                : "Place Orders"}
        </button>
    );
}