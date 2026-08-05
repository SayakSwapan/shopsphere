"use client";

import { useState } from "react";

interface Props {
   total: number;
  selectedAddressId: string;
  onPlaceOrder: (
    paymentMethod: "COD" | "ONLINE",
    addressId: string
  ) => Promise<void>;
}

export default function PaymentMethod({
  total,
    selectedAddressId,
  onPlaceOrder,
}: Props) {
  const [method, setMethod] =
    useState<"COD" | "ONLINE">("ONLINE");

  const [loading, setLoading] =
    useState(false);

  async function handlePlaceOrder() {
    setLoading(true);

    await onPlaceOrder( method,
  selectedAddressId);

    setLoading(false);
  }

  return (
    <div
      id="payment"
      className="rounded-3xl border border-slate-700 bg-[#111827] p-4 sm:p-6 lg:p-8"
    >
      <p className="text-xs uppercase tracking-[0.25em] text-amber-400">
        Step 3
      </p>

      <h2 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-black text-white">
        Payment Method
      </h2>

      <div className="mt-8 space-y-4">

        <button
          onClick={() =>
            setMethod("ONLINE")
          }
          className={`w-full rounded-2xl border p-5 text-left transition ${
            method === "ONLINE"
              ? "border-amber-500 bg-amber-500/10"
              : "border-slate-700 bg-[#0B1624]"
          }`}
        >
          <div className="flex items-center justify-between">

            <div>

              <p className="font-bold text-white">
                Online Payment
              </p>

              <p className="text-sm text-slate-400">
                Razorpay / UPI / Card /
                Net Banking
              </p>

            </div>

            <div
              className={`h-5 w-5 rounded-full border-2 ${
                method === "ONLINE"
                  ? "border-amber-500 bg-amber-500"
                  : "border-slate-500"
              }`}
            />

          </div>
        </button>

        <button
          onClick={() =>
            setMethod("COD")
          }
          className={`w-full rounded-2xl border p-5 text-left transition ${
            method === "COD"
              ? "border-amber-500 bg-amber-500/10"
              : "border-slate-700 bg-[#0B1624]"
          }`}
        >
          <div className="flex items-center justify-between">

            <div>

              <p className="font-bold text-white">
                Cash On Delivery
              </p>

              <p className="text-sm text-slate-400">
                Pay after receiving the
                order.
              </p>

            </div>

            <div
              className={`h-5 w-5 rounded-full border-2 ${
                method === "COD"
                  ? "border-amber-500 bg-amber-500"
                  : "border-slate-500"
              }`}
            />

          </div>
        </button>

      </div>

      <div className="mt-8 rounded-2xl bg-[#0B1624] p-5">

        <div className="flex justify-between">

          <span className="text-slate-400">
            Payable Amount
          </span>

          <span className="text-2xl sm:text-3xl font-black text-amber-400">
            ₹{total}
          </span>

        </div>

      </div>

      <button
        onClick={handlePlaceOrder}
        disabled={loading}
        className="mt-8 w-full rounded-2xl bg-amber-500 py-4 text-lg sm:text-xl font-black text-black transition hover:bg-amber-400"
      >
        {loading
          ? "Processing..."
          : method === "ONLINE"
          ? "Proceed To Payment"
          : "Place Orders"}
      </button>
    </div>
  );
}