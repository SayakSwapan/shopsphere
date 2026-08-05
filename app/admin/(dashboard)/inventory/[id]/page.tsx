import { prisma } from "@/lib/prisma";
import InventoryManager from "@/components/admin/inventory/inventory-manager";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function InventoryDetailPage({ params }: Props) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      stockmovement: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-[#111827] p-8 text-center text-slate-300">
        Product not found.
      </div>
    );
  }

  return (
    <InventoryManager
      product={{
        id: product.id,
        name: product.name,
        stock: product.stock,
        lowStockAlert: product.lowStockAlert,
        stockmovement: product.stockmovement,
      }}
    />
  );
}