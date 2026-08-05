import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ExternalLink } from "lucide-react";

export default async function LowStock() {
  const products = await prisma.product.findMany({
    where: { stock: { lte: 5 } },
    orderBy: { stock: "asc" },
    take: 5,
  });

  const maxStock = 5;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111827] p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Low Stock Products</h2>
        <Link
          href="/admin/inventory"
          className="flex items-center gap-1 text-xs font-bold text-amber-400 transition hover:text-amber-300"
        >
          Manage <ExternalLink size={12} />
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-emerald-400 font-semibold">All products are well-stocked</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => {
            const pct = Math.max((product.stock / maxStock) * 100, 4);
            const barColor = product.stock === 0 ? "bg-red-500" : product.stock <= 2 ? "bg-orange-500" : "bg-amber-500";

            return (
              <div key={product.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-white truncate pr-4">{product.name}</span>
                  <span className={`text-sm font-bold ${product.stock === 0 ? "text-red-400" : product.stock <= 2 ? "text-orange-400" : "text-amber-400"}`}>
                    {product.stock} left
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
