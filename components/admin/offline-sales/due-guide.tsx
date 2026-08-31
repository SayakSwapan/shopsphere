"use client";

import { Info, Coins, Clock, BellRing, Ban } from "lucide-react";

export default function DueGuide() {
  const points = [
    {
      icon: Coins,
      title: "Part payment",
      body: "When the customer pays only part of the selling price, the sale is recorded with a due balance. Progress from Part Payment to Full Payment is tracked automatically.",
    },
    {
      icon: Clock,
      title: "Automatic due / paid",
      body: "The paid amount and due amount update automatically each time you record a collection. Nothing to calculate manually.",
    },
    {
      icon: BellRing,
      title: "24-hour follow-up reminder",
      body: "Every open due shows how old it is. A reminder banner appears once a balance has been outstanding for 24 hours or more, so you know who to call.",
    },
    {
      icon: Ban,
      title: "No returns on due sales",
      body: "Any sale where the customer did not pay in full at the counter is NOT eligible for returns or exchanges. This is stated on the invoice and enforced by policy.",
    },
  ];

  return (
    <section className="mb-6 rounded-2xl border border-amber-800/50 bg-[#1a1307] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-amber-500/15 p-2 text-amber-300">
          <Info size={20} />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">About Due Sales</h2>
          <p className="mt-1 text-sm leading-relaxed text-amber-200/70">
            A <span className="font-semibold text-white">due sale</span> happens when a customer
            agrees to pay a lower price now and the remaining balance later. The final invoice
            is only generated once the full amount is cleared.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {points.map((p) => (
          <div key={p.title} className="rounded-xl border border-amber-900/40 bg-[#0F172A] p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600/20 text-amber-300">
                <p.icon size={16} />
              </div>
              <div className="text-sm font-bold text-white">{p.title}</div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-300">
        Policy: If the customer paid less than the full amount and carries a balance, no return
        or exchange is accepted. Make this clear to the customer before finalizing any due sale.
      </div>
    </section>
  );
}
