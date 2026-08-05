"use client";

import { ShoppingBag } from "lucide-react";
import {
    useState,
} from "react";

interface Props {
    productId: string;
}

export default function CartButton({
    productId,
}: Props) {
    const [loading, setLoading] =
        useState(false);

    async function addToCart() {
        try {
            setLoading(true);

            const response =
                await fetch(
                    "/api/cart/add",
                    {
                        method:
                            "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify(
                            {
                                productId,
                            }
                        ),
                    }
                );

            if (!response.ok)
                return;

            window.dispatchEvent(
                new Event("cart-updated")
            );
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            disabled={loading}
            onClick={addToCart}
            className="flex items-center justify-center gap-2 py-5 transition-all bg-bg-card text-text-heading border border-border-card hover:bg-bg-card-alt"
            style={{ borderRadius: "var(--t-radius-card)" }}
        >
            <ShoppingBag size={18} />
            <span>Add To Cart</span>
        </button>
    );
}