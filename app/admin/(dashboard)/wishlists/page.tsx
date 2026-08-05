import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";

export default async function WishlistsPage() {
  const wishlistedProducts = await prisma.wishlistitem.groupBy({
    by: ["productId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  const productIds = wishlistedProducts.map((w) => w.productId);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: {
      productimage: { take: 1 },
      category: { select: { name: true } },
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  const rows = wishlistedProducts.map((w) => {
    const product = productMap.get(w.productId);
    return {
      productId: w.productId,
      count: w._count.id,
      product,
    };
  });

  return (
    <PageContainer>
      <PageHeader
        title="Wishlisted Products"
        subtitle={`${rows.length} unique products in customer wishlists`}
      />

      <div className="rounded-2xl border border-slate-800 bg-[#111827] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="px-6 py-4 font-semibold">Image</th>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Wishlisted By</th>
                <th className="px-6 py-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const product = row.product;
                if (!product) return null;

                return (
                  <tr key={row.productId} className="border-t border-slate-700 hover:bg-[#0F172A]">
                    <td className="px-6 py-4">
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl">
                        <Image
                          src={product.productimage?.[0]?.url || "/placeholder.png"}
                          fill
                          alt={product.name}
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6">
                      <h3 className="font-semibold text-white">{product.name}</h3>
                      <p className="text-xs text-slate-500">{product.slug}</p>
                    </td>
                    <td className="px-6 text-slate-300">{product.category?.name || "—"}</td>
                    <td className="px-6 font-semibold text-white">₹{Number(product.sellingPrice).toFixed(2)}</td>
                    <td className="px-6">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
                        {row.count} customer{row.count !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-6">
                      <Link
                        href={`/admin/wishlists/${row.productId}`}
                        className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400 transition"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No products in any customer wishlist yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
