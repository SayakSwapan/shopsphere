"use client";

import { ArrowDown, Info, Store, ShoppingCart, Receipt, Save, Coins, Ban } from "lucide-react";

/**
 * Help guide shown on the Offline Sales list page. Explains the offline / POS
 * workflow, the GST-inclusive pricing model, the Draft button, and the due /
 * partial-payment flow so staff understand how sale prices, GST and profit are
 * derived at the counter.
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
      body: "Choose Full Payment (paid now, final invoice) or Part Payment / Due Sale (part now, balance tracked). Stock is deducted at completion.",
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

      {/* Draft explained */}
      <div className="mt-4 rounded-xl border border-slate-700 bg-[#0F172A] p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-slate-200">
            <Save size={16} />
          </div>
          <h3 className="text-sm font-bold text-white">
            What is the &ldquo;Save Draft&rdquo; button for?
          </h3>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-3 text-xs leading-relaxed text-slate-400 md:grid-cols-2">
          <div className="space-y-1.5">
            <p><span className="font-semibold text-white">Use Draft when you are NOT ready to take payment yet.</span> A draft:</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Records the products, prices, customer and totals.</li>
              <li>Does <span className="font-semibold text-white">NOT</span> deduct stock.</li>
              <li>Does <span className="font-semibold text-white">NOT</span> create an invoice or any finance.</li>
              <li>Can be reopened later and <span className="font-semibold text-white">Completed</span> once the customer pays.</li>
            </ul>
          </div>
          <div className="space-y-1.5">
            <p><span className="font-semibold text-white">Best for:</span> a customer has picked items but is still deciding, needs a price confirmation, or will come back later to pay. Complete the draft when payment is finally received — stock is deducted only at that point.</p>
            <p className="text-indigo-300/80">A draft holds the sale for you without touching inventory.</p>
          </div>
        </div>
      </div>

      {/* Due sales explained */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-amber-700 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white">
              <Coins size={16} />
            </div>
            <h3 className="text-sm font-bold text-white">Part Payment / Due Sale</h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            When the customer pays only part of the price (e.g. selling price ₹100, they hand
            ₹50 now), select <span className="font-semibold text-white">Part Payment</span> and
            enter ₹50. The ₹50 due is tracked automatically. Track &amp; collect the remaining
            balance under{" "}
            <span className="font-semibold text-white">Offline Sales → Due Collections</span>.
            The system reminds you every 24 hours. The final invoice is generated only once the
            balance is fully cleared.
          </p>
        </div>
        <div className="rounded-xl border border-rose-800 bg-rose-500/10 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white">
              <Ban size={16} />
            </div>
            <h3 className="text-sm font-bold text-white">No Returns on Due Sales</h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-rose-200">
            Any sale where the customer did not pay the <span className="font-bold">full</span>{" "}
            amount at the counter is a due sale, and <span className="font-bold">no return or
            exchange</span> is accepted. This policy is always shown on the invoice. Make it
            clear to the customer before finalizing the sale.
          </p>
        </div>
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
          deducted, invoice generated (full) or due tracked (partial)
        </span>
      </div>
    </section>
  );
}
