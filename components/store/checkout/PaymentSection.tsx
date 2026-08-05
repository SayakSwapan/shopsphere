"use client";

import { CreditCard, Wallet, Landmark, Smartphone } from "lucide-react";
import { useState } from "react";

interface Props {
  onContinue: (method: string) => void;
}

export default function PaymentSection({
  onContinue,
}: Props) {
  const [method, setMethod] =
    useState("ONLINE");

  const payments = [
    {
      id: "ONLINE",
      title: "Credit / Debit Card",
      icon: CreditCard,
      desc: "Visa, Mastercard, Rupay",
    },
    {
      id: "UPI",
      title: "UPI Payment",
      icon: Smartphone,
      desc: "PhonePe • GPay • Paytm",
    },
    {
      id: "NETBANKING",
      title: "Net Banking",
      icon: Landmark,
      desc: "All Major Banks",
    },
    {
      id: "COD",
      title: "Cash On Delivery",
      icon: Wallet,
      desc: "Available on eligible orders",
    },
  ];

  return (
    <div
      id="payment"
      className="rounded-3xl border border-slate-700 bg-[#111827] p-4 sm:p-6 lg:p-8"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-amber-400">
        Step 2
      </p>

      <h2 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-black text-white">
        Payment Method
      </h2>

      <p className="mt-3 text-slate-400">
        Choose your preferred payment option.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {payments.map((payment) => {
          const Icon = payment.icon;

          return (
            <button
              key={payment.id}
              onClick={() =>
                setMethod(payment.id)
              }
              className={`rounded-3xl border p-4 sm:p-6 text-left transition ${
                method === payment.id
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-slate-700 bg-[#0B1624] hover:border-amber-400"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`rounded-2xl p-4 ${
                    method === payment.id
                      ? "bg-amber-500 text-black"
                      : "bg-slate-800 text-white"
                  }`}
                >
                  <Icon size={24} />
                </div>

                <div>
                  <h3 className="font-bold text-white">
                    {payment.title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    {payment.desc}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() =>
          onContinue(method)
        }
        className="mt-10 w-full rounded-2xl bg-amber-500 py-5 text-lg font-black text-black transition hover:bg-amber-400"
      >
        Continue
      </button>
    </div>
  );
}