import { prisma } from "@/lib/prisma";

import DashboardWidget from "./dashboard-widget";
import DashboardListItem from "./dashboard-list-item";

export default async function LatestCustomers() {

  const customers =
    await prisma.user.findMany({

      where: {
        role: "CUSTOMER",
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 5,

    });

  return (
    <DashboardWidget title="Latest Customers">

      {customers.length === 0 && (
        <p className="text-slate-400">
          No Customers
        </p>
      )}

      {customers.map((user) => (

        <DashboardListItem
          key={user.id}
          title={user.name || "Unnamed"}
          subtitle={user.email}
        />

      ))}

    </DashboardWidget>
  );
}