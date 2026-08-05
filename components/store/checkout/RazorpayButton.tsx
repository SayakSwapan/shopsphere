"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { handlePayment } from "@/lib/razorpay-checkout";
import { useSiteName } from "@/components/store/site-settings-provider";

interface Props {
    addressId: string;
}

export default function RazorpayButton({
    addressId,
}: Props) {
    const router = useRouter();
    const siteName = useSiteName();

    const [loading, setLoading] =
        useState(false);

    async function payNow() {
        setLoading(true);

        await handlePayment({
            initiateOrderBackendUrl:
                "/api/payment/create-order",
            payload: { addressId },
            siteName,

            onSuccess: async (response) => {
                try {
                    const verify = await fetch(
                        "/api/payment/verify",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                            },
                            body: JSON.stringify({
                                ...response,
                                addressId,
                            }),
                        }
                    );

                    const verifyData =
                        await verify.json();

                    if (!verify.ok) {
                        throw new Error(
                            verifyData.message
                        );
                    }

                    toast.success(
                        "Payment Successful!"
                    );

                    router.push(
                        `/order-success?id=${verifyData.orderId}`
                    );
                } catch (error) {
                    toast.error(
                        error instanceof Error
                            ? error.message
                            : "Payment verification failed"
                    );
                } finally {
                    setLoading(false);
                }
            },

            onDismiss: () => {
                toast.error("Payment cancelled");
                setLoading(false);
            },

            onError: (message) => {
                toast.error(message);
                setLoading(false);
            },
        });
    }

    return (
        <button
            onClick={payNow}
            disabled={loading}
            className="mt-8 w-full py-4 text-lg font-black uppercase tracking-wider transition-colors bg-primary hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ borderRadius: "var(--t-radius-button)", color: "var(--t-bg-page)", fontFamily: "var(--t-font-heading)" }}
        >
            {loading
                ? "Opening Razorpay..."
                : "Pay Online"}
        </button>
    );
}
