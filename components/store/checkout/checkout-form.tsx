"use client";

import { useState } from "react";

export default function CheckoutForm() {
  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setLoading(true);

      const response =
        await fetch(
          "/api/orders/place",
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (data.success) {
        window.location.href =
  "/order-success";
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid lg:grid-cols-2 gap-10"
    >
      <div className="bg-bg-card p-4 sm:p-6 lg:p-8 border border-border-card" style={{ borderRadius: "var(--t-radius-card)" }}>

        <h2 className="text-2xl font-black mb-6 text-text-heading" style={{ fontFamily: "var(--t-font-heading)" }}>
          Shipping Address
        </h2>

        <div className="space-y-4">

          <input
            placeholder="Full Name"
            className="w-full border border-border-card p-4 text-text-heading outline-none focus:border-primary transition-colors"
            style={{ borderRadius: "var(--t-radius-button)", background: "var(--t-bg-card-nested, rgba(0,0,0,0.03))" }}
          />

          <input
            placeholder="Phone Number"
            className="w-full border border-border-card p-4 text-text-heading outline-none focus:border-primary transition-colors"
            style={{ borderRadius: "var(--t-radius-button)", background: "var(--t-bg-card-nested, rgba(0,0,0,0.03))" }}
          />

          <input
            placeholder="Address Line"
            className="w-full border border-border-card p-4 text-text-heading outline-none focus:border-primary transition-colors"
            style={{ borderRadius: "var(--t-radius-button)", background: "var(--t-bg-card-nested, rgba(0,0,0,0.03))" }}
          />

          <input
            placeholder="City"
            className="w-full border border-border-card p-4 text-text-heading outline-none focus:border-primary transition-colors"
            style={{ borderRadius: "var(--t-radius-button)", background: "var(--t-bg-card-nested, rgba(0,0,0,0.03))" }}
          />

          <input
            placeholder="State"
            className="w-full border border-border-card p-4 text-text-heading outline-none focus:border-primary transition-colors"
            style={{ borderRadius: "var(--t-radius-button)", background: "var(--t-bg-card-nested, rgba(0,0,0,0.03))" }}
          />

          <input
            placeholder="Pincode"
            className="w-full border border-border-card p-4 text-text-heading outline-none focus:border-primary transition-colors"
            style={{ borderRadius: "var(--t-radius-button)", background: "var(--t-bg-card-nested, rgba(0,0,0,0.03))" }}
          />

        </div>

      </div>

      <div className="bg-bg-card p-4 sm:p-6 lg:p-8 border border-border-card h-fit" style={{ borderRadius: "var(--t-radius-card)" }}>

        <h2 className="text-2xl font-black mb-6 text-text-heading" style={{ fontFamily: "var(--t-font-heading)" }}>
          Order Summary
        </h2>

        <button
          disabled={loading}
          className="w-full bg-primary text-button-text py-5 font-bold transition hover:opacity-90"
          style={{ borderRadius: "var(--t-radius-card)", fontFamily: "var(--t-font-heading)" }}
        >
          {loading ? "Processing..." : "Place Order"}
        </button>

      </div>

    </form>
  );
}