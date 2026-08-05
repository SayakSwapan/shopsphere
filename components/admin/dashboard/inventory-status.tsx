import { prisma } from "@/lib/prisma";

import DashboardWidget from "./dashboard-widget";

export default async function InventoryStatus() {

  const total =
    await prisma.product.count();

  const lowStock =
    await prisma.product.count({

      where: {
        stock: {
          lte: 5,
        },
      },

    });

  const outOfStock =
    await prisma.product.count({

      where: {
        stock: 0,
      },

    });

  return (
    <DashboardWidget title="Inventory">

      <div className="space-y-5">

        <div className="flex justify-between">

          <span className="text-slate-300">
            Total Products
          </span>

          <span className="text-white font-bold">
            {total}
          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-slate-300">
            Low Stock
          </span>

          <span className="text-yellow-400 font-bold">
            {lowStock}
          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-slate-300">
            Out Of Stock
          </span>

          <span className="text-red-400 font-bold">
            {outOfStock}
          </span>

        </div>

      </div>

    </DashboardWidget>
  );
}