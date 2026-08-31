"use client";

import { ArrowDown, Info, Store, ShoppingCart, Receipt } from "lucide-react";

/**
 * Help guide shown on the Offline Sales list page. Explains the offline / POS
 * workflow and the GST-inclusive pricing model so staff understand how sale
 * prices, GST and profit are derived at the counter.
 */
export default function OfflineSalesGuide() {
  const steps = [
    {
      title: "Add products to the sale",
      body: "Search the product grid and tap a card to add it. Each line shows cost, online price, Last Selling Price (min) and GST.",
      icon: ShoppingCart,
    },
    {
      title: "Set the customer price",
      body: "Enter the GST-inclusive price the customer actually pays. The system splits out GST and shows the resulting profit and margin in real time.",
      icon: Receipt,
    },
    {
      title: "Confirm the customer",
      body: "Type the phone number to auto-fill a returning customer (name, contact and last address). If not found, it saves as a new walk-in customer.",
      icon: Store,
    },
    {
      title: "Collect payment & complete",
      body: "Choose the payment method and Complete the Sale. Stock is deducted and stock-movement entries are recorded at completion. Drafts keep stock untouched.",
      icon: ArrowDown,
    },
  ];

  return (
    <section className="mb-6 rounded-2xl border border-slate-700 bg-[#111827] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-300">
          <Info size={20} />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">
            How an Offline (POS) Sale Works
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            Offline sales reuse the same order, inventory and GST systems as
            online orders, but allow walk-in bargaining down to each
            product&apos;s <span className="text-indigo-300">Last Selling Price</span>.
            Prices are entered{" "}
            <span className="text-indigo-300">GST-inclusive</span> — the system
            derives the pre-GST base and profit automatically.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="relative rounded-xl border border-slate-700 bg-[#0F172A] p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <step.icon size={18} />
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-wide text-indigo-300">
                  Step {i + 1}
                </div>
                <div className="text-sm font-bold text-white">{step.title}</div>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              {step.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 rounded-xl bg-[#0F172A] px-4 py-3 text-xs text-slate-400">
        <span>
          <span className="font-semibold text-white">Min price:</span> floor is
          the GST-inclusive Last Selling Price set on each product
        </span>
        <span>
          <span className="font-semibold text-white">Profit:</span> base (price
          minus GST) − cost price
        </span>
        <span>
          <span className="font-semibold text-white">Draft:</span> saved, stock
          untouched
        </span>
        <span>
          <span className="font-semibold text-white">Complete:</span> stock
          deducted, invoice generated
        </span>
      </div>
    </section>
  );
}
