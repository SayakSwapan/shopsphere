import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Boxes, Pencil } from "lucide-react";
import DeleteButton from "@/components/admin/common/delete-button";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = { BOGO: "BOGO", FIXED_PRICE: "Bundle" };
const APPLY_LABEL: Record<string, string> = { BOTH: "Online & Offline", ONLINE: "Online", OFFLINE: "Offline" };

export default async function ComboOffersPage() {
  const offers = await prisma.comboOffer.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      items: { include: { product: { select: { id: true, name: true } } } },
    },
  });

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Combo Offers</h1>
          <p className="text-sm text-slate-400 mt-1">
            Buy-1-Get-1 and bundle deals applied automatically in cart &amp; checkout
          </p>
        </div>
        <Link
          href="/admin/combo-offers/new"
          className="flex items-center gap-2 bg-amber-500 text-[#0A0F1E] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          <Plus size={16} />
          Add Combo Offer
        </Link>
      </div>

      {offers.length === 0 ? (
        <div className="text-center py-20 bg-[#111827] rounded-xl border border-[#1E293B]">
          <Boxes size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No combo offers yet</h3>
          <p className="text-sm text-slate-400 mb-4">
            Create a Buy-1-Get-1 or fixed-price bundle to boost average order value.
          </p>
          <Link href="/admin/combo-offers/new" className="text-sm text-amber-400 hover:text-amber-300 font-semibold">
            Create Combo Offer →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="flex items-center gap-4 bg-[#111827] border border-[#1E293B] rounded-xl p-4 hover:border-slate-600 transition-colors"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#0A0F1E] border border-[#1E293B] flex-shrink-0 flex items-center justify-center">
                {offer.imageUrl ? (
                  <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover" />
                ) : (
                  <Boxes size={24} className="text-slate-700" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-white truncate">{offer.title}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      offer.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"
                    }`}
                  >
                    {offer.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                    {TYPE_LABEL[offer.comboType] || offer.comboType}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
                    {APPLY_LABEL[offer.apply] || offer.apply}
                  </span>
                  {offer.highlightOnHome && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">
                      Home
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {offer.items.length} product(s): {offer.items.map((i) => i.product.name).join(", ")}
                </p>
                <p className="text-xs text-slate-600 mt-0.5 truncate">
                  {offer.comboType === "FIXED_PRICE" && offer.customPrice != null
                    ? `Bundle ₹${Number(offer.customPrice)}`
                    : "Pay priciest, rest free"}
                  {" · "}
                  {offer.badge || "No badge"}
                </p>
              </div>

              <Link
                href={`/admin/combo-offers/${offer.id}/edit`}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Pencil size={16} />
              </Link>

              <DeleteButton id={offer.id} endpoint="/api/admin/combo-offers" label="Delete combo offer?" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
