import { prisma } from "@/lib/prisma";

import DashboardWidget from "./dashboard-widget";
import DashboardListItem from "./dashboard-list-item";

export default async function TopProducts() {

  const products =
    await prisma.product.findMany({

      orderBy: {
        totalSold: "desc",
      },

      take: 5,

    });

  return (
    <DashboardWidget title="Top Selling Products">

      {products.length === 0 && (
        <p className="text-slate-400">
          No Products
        </p>
      )}

      {products.map((product) => (

        <DashboardListItem
          key={product.id}
          title={product.name}
          subtitle={`Stock : ${product.stock}`}
          rightText={`${product.totalSold} Sold`}
        />

      ))}

    </DashboardWidget>
  );
}