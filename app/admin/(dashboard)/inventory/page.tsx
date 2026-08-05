import { prisma } from "@/lib/prisma";
import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import InventoryStats from "@/components/admin/inventory/inventory-stats";
import InventoryTable from "@/components/admin/inventory/inventory-table";

export default async function InventoryPage() {
  let products;
  try {
    products = await prisma.product.findMany({
      orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        name: true,
        stock: true,
        lowStockAlert: true,
        status: true,
        updatedAt: true,
      },
    });
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Inventory Management" subtitle="Manage inventory" />
        <p className="text-red-400">Failed to load inventory. Please try again later.</p>
      </PageContainer>
    );
  }

  const totalProducts = products.length;
  const lowStockProducts = products.filter(
    (product) => product.stock <= product.lowStockAlert && product.stock > 0
  ).length;
  const outOfStockProducts = products.filter((product) => product.stock === 0).length;
  const healthyProducts = products.filter((product) => product.stock > product.lowStockAlert).length;

  return (
    <PageContainer>
      <PageHeader
        title="Inventory Management"
        subtitle={`${products.length} products tracked`}
        description="Track stock levels across all product variants. Low-stock alerts help you reorder in time."
      />

      <InventoryStats
        totalProducts={totalProducts}
        lowStockProducts={lowStockProducts}
        outOfStockProducts={outOfStockProducts}
        healthyProducts={healthyProducts}
      />

      <div className="rounded-3xl border border-slate-800 bg-[#0f172a] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.16)] sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Stock overview</h2>
            <p className="mt-1 text-sm text-slate-400">
              Products are sorted by stock availability so critical items appear first.
            </p>
          </div>
        </div>

        <InventoryTable products={products} />
      </div>
    </PageContainer>
  );
}